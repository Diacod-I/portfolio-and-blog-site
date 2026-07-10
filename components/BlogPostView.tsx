'use client'

// Renders a single blog post inside the Blogs window (replaces the old
// standalone NoteWindow full-page treatment for /blogs/[slug]). The MDX is
// still compiled server-side in app/blogs/[slug]/page.tsx — the already
// -rendered <MDXContent /> element is just handed to us as `content`.

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Note } from '@/lib/notes'

type BlogPostViewProps = {
  note: Note
  seeAlso: Note[]
  content: React.ReactNode
}

export default function BlogPostView({ note, seeAlso, content }: BlogPostViewProps) {
  const router = useRouter()

  const statusParts = [
    new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    `${note.readingTimeMinutes} min read`,
    note.author,
  ].filter(Boolean)

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

      <div className="flex-1 min-h-0 overflow-y-auto p-4 text-white">
        <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
        <div className="prose prose-invert max-w-none text-justify">{content}</div>

        {seeAlso.length > 0 && (
          <div className="mt-10 pt-4 border-t-2 border-[#808080]">
            <p className="font-bold text-white mb-2">See also:</p>
            <div className="flex flex-wrap gap-4">
              {seeAlso.map((n) => (
                <Link
                  key={n.slug}
                  href={`/blogs/${n.slug}`}
                  className="win98-button p-2 flex items-center gap-2 no-underline text-black max-w-xs"
                >
                  <Image src="/win98/notes.webp" alt="" width={20} height={20} className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-sm truncate">{n.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-wrap items-center justify-between bg-[#c0c0c0] border-t-2 border-[#dfdfdf] px-2 py-0.5 text-black text-xs gap-x-4">
        <span>{statusParts.join(' · ') || 'Ready'}</span>
      </div>
    </div>
  )
}
