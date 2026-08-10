'use client'

// Renders a single contributor report inside its own "report" window — a
// standalone app, not the Blogs window. Reports are still stored and
// compiled as ordinary Notes (see lib/notes.ts, note.tag === 'Reports'),
// same MDX pipeline as blog posts — only the *presentation* is decoupled,
// so opening a report from advith.exe/ContributorArchive no longer borrows
// "Advith's Blogs" (see app/reports/[slug]/page.tsx for the route that
// compiles the MDX server-side and hands the rendered element down here).

import Image from 'next/image'
import type { Note } from '@/lib/notes'
import TagChip from '@/components/TagChip'

type ReportViewerProps = {
  note: Note
  content: React.ReactNode
}

export default function ReportViewer({ note, content }: ReportViewerProps) {
  const postedDate = new Date(note.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#222222]">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 text-white select-text">
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-3">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold text-gray-300 mb-2">
            <span>{postedDate}</span>
            <span>·</span>
            <span>{note.readingTimeMinutes} min read</span>
            <span>·</span>
            <span>{note.author}</span>
          </div>

          {note.repos.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {note.repos.map((r) => (
                <TagChip key={r} tag={r.split('/')[1] ?? r} />
              ))}
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}
