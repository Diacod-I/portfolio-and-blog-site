'use client'

// Renders a single blog post inside the Blogs window (replaces the old
// standalone NoteWindow full-page treatment for /blogs/[slug]). The MDX is
// still compiled server-side in app/blogs/[slug]/page.tsx — the already
// -rendered <MDXContent /> element is just handed to us as `content`.

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Note } from '@/lib/notes'
import TagBadge from '@/components/TagBadge'

type BlogPostViewProps = {
  note: Note
  seeAlso: Note[]
  content: React.ReactNode
}

export default function BlogPostView({ note, seeAlso, content }: BlogPostViewProps) {
  const router = useRouter()

  const postedDate = new Date(note.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#222222]">
      <div className="flex-shrink-0 flex items-center gap-2 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1.5">
        <button
          onClick={() => router.push('/blogs')}
          className="win98-button px-3 py-1 font-bold text-black text-sm flex items-center gap-1"
        >
          ← Back to Blogs
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 text-white select-text">
        {/* Single capped, centered column for everything — title, meta,
            thumbnail, body, and see-also all share the same margin, a bit
            narrower than the window itself for a Medium-style layout. */}
        <div className="max-w-2xl mx-auto w-full">

          {/* Medium-style header: full-width title (free to wrap onto as many
              lines as it needs — it's no longer sharing a flex row with the
              tag badge, which was squeezing it into a narrower column and
              fighting its wrap), with tag/date/read-time/author as a single
              meta line underneath instead of split off into the window's
              bottom status bar. */}
          <h1 className="text-3xl font-bold mb-3">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold text-gray-300 mb-6">
            <TagBadge tag={note.tag} />
            <span>·</span>
            <span>{postedDate}</span>
            <span>·</span>
            <span>{note.readingTimeMinutes} min read</span>
            <span>·</span>
            <span>{note.author}</span>
          </div>

          {note.thumbnail && (
            <Image
              src={note.thumbnail}
              alt=""
              width={1280}
              height={720}
              className="w-full h-auto max-h-96 object-cover border-2 border-[#808080] mb-6"
            />
          )}

          <div className="prose prose-invert max-w-none text-justify">{content}</div>

          {seeAlso.length > 0 && (
            <div className="mt-10 pt-4 border-t-2 border-[#808080]">
              <p className="font-bold text-white mb-2">See also:</p>
              <div className="flex flex-wrap gap-4">
                {seeAlso.map((n) => (
                  <Link
                    key={n.slug}
                    href={`/blogs/${n.slug}`}
                    className="win98-button px-3 py-1.5 flex items-center gap-2 no-underline text-black w-72"
                  >
                    <Image src="/win98/notes.webp" alt="" width={16} height={16} className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-xs line-clamp-2">{n.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
