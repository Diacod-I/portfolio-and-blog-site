// lib/notes.ts
// Single source of truth for blog content. Server-side only (uses fs) —
// import from server components, generateStaticParams, sitemap, RSS.
// Do NOT add 'use server': these are build-time helpers, not server actions.

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'
import { DEFAULT_TAG, isTag, type Tag } from './tags'

export type Note = {
  slug: string
  title: string
  date: string
  author: string
  excerpt?: string
  status: 'Published' | 'Draft'
  readingTimeMinutes: number
  /** Public path to the post's thumbnail (1280x720 recommended), or null */
  thumbnail: string | null
  /** One tag per post — see lib/tags.ts. Falls back to 'Misc' like `status`
   *  fails closed, so an old post without a `tag` field doesn't error. */
  tag: Tag
  /** "org/repo" strings a Reports post touched (see scripts/generate-report.mjs),
   *  rendered as "#repo" hashtags in ContributorArchive. Empty for non-report
   *  posts, or older reports scaffolded before this field existed. */
  repos: string[]
  /** Raw `song` frontmatter value: either a public path to a self-hosted
   *  mp3 ("/music/lofi.mp3", played in-page) or a YouTube/YouTube Music
   *  URL (metadata shown in-page via `songMeta`, playback links out —
   *  see MusicPlayer.tsx). Null when the post sets no `song`. */
  song: string | null
  /** Track name shown in the player. Falls back to the post title (mp3) or
   *  the fetched YouTube title (songMeta) if `songTitle` isn't set. */
  songTitle: string | null
  /** Populated at build time (see fetchYouTubeMeta) when `song` is a
   *  YouTube URL — title/author/thumbnail via YouTube's public oEmbed
   *  endpoint, no API key needed. Null for mp3 songs, no song, or if the
   *  oEmbed lookup failed (bad/private URL). */
  songMeta: YouTubeSongMeta | null
}

export type YouTubeSongMeta = {
  id: string
  url: string
  title: string
  author: string
  thumbnail: string
}

export type NoteWithContent = Note & { content: string }

const NOTES_DIR = path.join(process.cwd(), 'content', 'notes')
const THUMBS_DIR = path.join(process.cwd(), 'public', 'thumbnails')
const THUMB_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg']

// Convention: public/thumbnails/<slug>.webp (or png/jpg). A `thumbnail`
// frontmatter field overrides the convention. Checked at build time.
async function findThumbnail(slug: string, frontmatterValue?: string): Promise<string | null> {
  if (frontmatterValue) return frontmatterValue
  for (const ext of THUMB_EXTENSIONS) {
    try {
      await fs.access(path.join(THUMBS_DIR, `${slug}.${ext}`))
      return `/thumbnails/${slug}.${ext}`
    } catch {
      // keep trying extensions
    }
  }
  return null
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// Recognizes youtube.com/watch, youtu.be short links, YouTube Music (same
// URL shape as regular YouTube — it's the same catalog), and /shorts/.
// Returns null for anything else, which parseNote treats as a self-hosted
// mp3 path instead.
function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1) || null
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts) return shorts[1]
    }
    return null
  } catch {
    return null
  }
}

// YouTube's oEmbed endpoint is public — no API key, no OAuth, just a GET.
// Runs at build time (this project is fully statically generated, see
// dynamicParams = false in app/blogs/[slug]/page.tsx), so a slow or failed
// lookup here can't affect a real visitor — worst case a post's song just
// silently doesn't render (see the catch below), never a broken page.
async function fetchYouTubeMeta(url: string, id: string): Promise<YouTubeSongMeta | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { next: { revalidate: false } } // a video's title/author/art don't change; cache indefinitely
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      id,
      url,
      title: typeof data.title === 'string' ? data.title : 'Untitled',
      author: typeof data.author_name === 'string' ? data.author_name : '',
      thumbnail: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : '',
    }
  } catch {
    return null
  }
}

async function parseNote(slug: string, fileContent: string): Promise<NoteWithContent> {
  const { data, content } = matter(fileContent)
  const song = typeof data.song === 'string' && data.song.trim() ? data.song.trim() : null
  const youtubeId = song ? parseYouTubeId(song) : null
  const songMeta = song && youtubeId ? await fetchYouTubeMeta(song, youtubeId) : null

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    author: data.author || 'Advith Krishnan',
    excerpt: data.excerpt || data.description,
    // Anything not explicitly "Published" is a draft. Fail closed.
    status: data.status === 'Published' ? 'Published' : 'Draft',
    readingTimeMinutes: estimateReadingTime(content),
    thumbnail: await findThumbnail(slug, data.thumbnail),
    tag: isTag(data.tag) ? data.tag : DEFAULT_TAG,
    repos: Array.isArray(data.repos) ? data.repos.filter((r): r is string => typeof r === 'string') : [],
    song,
    songTitle: typeof data.songTitle === 'string' && data.songTitle.trim() ? data.songTitle : null,
    songMeta,
    content,
  }
}

/** All PUBLISHED notes, newest first. */
export const getAllNotes = cache(async (): Promise<Note[]> => {
  let files: string[]
  try {
    files = await fs.readdir(NOTES_DIR)
  } catch {
    return []
  }

  const notes = await Promise.all(
    files
      .filter((file) => file.endsWith('.mdx'))
      .map(async (file) => {
        try {
          const fileContent = await fs.readFile(path.join(NOTES_DIR, file), 'utf8')
          const { content: _content, ...note } = await parseNote(
            file.replace(/\.mdx$/, ''),
            fileContent
          )
          return note
        } catch {
          return null
        }
      })
  )

  return notes
    .filter((n): n is Note => n !== null && n.status === 'Published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

/** Newest N published notes (homepage widget). */
export async function getRecentNotes(limit = 3): Promise<Note[]> {
  const notes = await getAllNotes()
  return notes.slice(0, limit)
}

/**
 * A single PUBLISHED note including its MDX body.
 * Returns null for drafts and unknown slugs — callers should notFound().
 */
export const getNote = cache(async (slug: string): Promise<NoteWithContent | null> => {
  // Guard against path traversal (e.g. slug = "../../.env.local")
  if (!/^[a-z0-9-]+$/i.test(slug)) return null

  try {
    const fileContent = await fs.readFile(path.join(NOTES_DIR, `${slug}.mdx`), 'utf8')
    const note = await parseNote(slug, fileContent)
    return note.status === 'Published' ? note : null
  } catch {
    return null
  }
})
