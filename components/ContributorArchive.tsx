'use client'

// "Contributor Archive" — every monthly OSS-contribution report (see
// lib/tags.ts's 'Reports' tag and scripts/generate-report.mjs), listed on
// advith.exe's Home tab. Deliberately reports-only: raw GitHub activity
// (PRs, reviews, issues, comments) is not shown here as a separate live
// feed — that detail already lives inside each report's own "Focus areas"
// section. This widget is the one place reports show up on the site.
//
// Report rows link to /blogs/[slug] to actually read the full report —
// that route forces the separate "Advith's Blogs" window open (see that
// route's forceOpenApp="blogs"), which is the same way every other blog
// reference on the site works (ExplorerBlogList, etc.).
//
// Styled to match ContactView's Internet Shortcuts panel: .win98-window
// chrome, bg-[#f0f0f0] content panel, ScrollPanel + win98-button rows.

import Link from 'next/link'
import { format } from 'date-fns'
import ScrollPanel from '@/components/ScrollPanel'
import type { Note } from '@/lib/notes'

type ContributorArchiveProps = {
  notes: Note[]
}

export default function ContributorArchive({ notes }: ContributorArchiveProps) {
  const reports = [...notes]
    .filter((n) => n.tag === 'Reports')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="win98-window flex flex-col">
      <div className="win98-titlebar">
        <span className="font-bold">Contribution Archive</span>
      </div>
      <div className="bg-[#f0f0f0] border-2 p-2">
        <ScrollPanel maxHeight={256} className="border-2" nudgeId="contributor-archive">
          {reports.length === 0 ? (
            <p className="text-xs italic p-2 text-black">Nothing to report yet.</p>
          ) : (
            <div className="grid">
              {reports.map((note) => (
                <Link
                  key={note.slug}
                  href={`/blogs/${note.slug}`}
                  className="win98-button p-2 flex flex-col min-w-0 no-underline"
                >
                  <span className="block text-sm font-bold truncate min-w-0">{note.title}</span>
                  <span className="block text-[10px] text-[#444] font-bold truncate min-w-0">
                    {format(new Date(note.date), 'MMM dd, yyyy')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ScrollPanel>
      </div>
    </div>
  )
}
