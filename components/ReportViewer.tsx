'use client'

// Renders a single contributor report inside advith.exe's Report tab (see
// HomeClient's homeTab state) — not a separate window. Reports are still
// stored and compiled as ordinary Notes (see lib/notes.ts, note.tag ===
// 'Reports'), same MDX pipeline as blog posts — only the *presentation* is
// decoupled from the Blogs window (see app/reports/[slug]/page.tsx for the
// route that compiles the MDX server-side and hands the rendered element
// down here, and ContributorArchive.tsx for the report list that links here).

import Image from 'next/image'
import type { Note } from '@/lib/notes'
import TagChip from '@/components/TagChip'

type ReportViewerProps = {
  note: Note
  content: React.ReactNode
  /** Switches advith.exe back to the Logs tab — the ('about' id, relabeled
   *  "Logs") that ContributorArchive/the report link itself live on — and
   *  resets the URL if we arrived via a real /reports/[slug] link. See
   *  backToLogsFromReport in HomeClient.tsx. */
  onBackToLogs: () => void
}

export default function ReportViewer({ note, content, onBackToLogs }: ReportViewerProps) {
  const postedDate = new Date(note.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#222222]">
      <div className="flex-shrink-0 flex items-center gap-2 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1.5">
        <button
          onClick={onBackToLogs}
          className="win98-button px-3 py-1 font-bold text-black text-sm flex items-center gap-1"
        >
          ← Back to Logs
        </button>
      </div>
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
