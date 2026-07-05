// lib/notes.ts
// Single source of truth for blog content. Server-side only (uses fs) —
// import from server components, generateStaticParams, sitemap, RSS.
// Do NOT add 'use server': these are build-time helpers, not server actions.

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'

export type Note = {
  slug: string
  title: string
  date: string
  author: string
  excerpt?: string
  status: 'Published' | 'Draft'
  readingTimeMinutes: number
}

export type NoteWithContent = Note & { content: string }

const NOTES_DIR = path.join(process.cwd(), 'content', 'notes')

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function parseNote(slug: string, fileContent: string): NoteWithContent {
  const { data, content } = matter(fileContent)
  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    author: data.author || 'Advith Krishnan',
    excerpt: data.excerpt || data.description,
    // Anything not explicitly "Published" is a draft. Fail closed.
    status: data.status === 'Published' ? 'Published' : 'Draft',
    readingTimeMinutes: estimateReadingTime(content),
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
          const { content: _content, ...note } = parseNote(
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
    const note = parseNote(slug, fileContent)
    return note.status === 'Published' ? note : null
  } catch {
    return null
  }
})
