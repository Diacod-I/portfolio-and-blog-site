'use client'

// "Contributor Archive" — every monthly OSS-contribution report (see
// lib/tags.ts's 'Reports' tag and scripts/generate-report.mjs), listed on
// advith.exe's Home tab. Deliberately reports-only: raw GitHub activity
// (PRs, reviews, issues, comments) is not shown here as a separate live
// feed — that detail already lives inside each report's own "Focus areas"
// section. This widget is the one place reports show up on the site.
//
// Report rows link to /reports/[slug] to actually read the full report —
// that route forces open a standalone Report window (see that route's
// forceOpenApp="report" and components/ReportViewer.tsx), decoupled from
// the Blogs window that every other blog reference on the site opens
// (ExplorerBlogList, etc.). Reports are still stored/compiled as ordinary
// Notes (lib/notes.ts) — only the window/app identity is separate.
//
// .win98-window chrome + ScrollPanel + win98-button rows, same structure as
// ContactView's Internet Shortcuts panel — but with the dark content panel
// (bg-[#2b2b2b], white text) matching GithubContributionGraph right above
// it, instead of ContactView's light one. Reports are grouped into a
// year-by-year timeline, newest year on top.

import Link from 'next/link'
import { format } from 'date-fns'
import ScrollPanel from '@/components/ScrollPanel'
import TagChip from '@/components/TagChip'
import type { Note } from '@/lib/notes'

type ContributorArchiveProps = {
  notes: Note[]
}

export default function ContributorArchive({ notes }: ContributorArchiveProps) {
  const reports = [...notes]
    .filter((n) => n.tag === 'Reports')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Grouped by the year each report's date falls in, newest year first —
  // reports within a year stay in the newest-first order from the sort
  // above since Map preserves insertion order per key.
  const reportsByYear = new Map<number, Note[]>()
  for (const note of reports) {
    const year = new Date(note.date).getFullYear()
    const bucket = reportsByYear.get(year)
    if (bucket) bucket.push(note)
    else reportsByYear.set(year, [note])
  }
  const years = [...reportsByYear.keys()].sort((a, b) => b - a)

  return (
    <div className="win98-window flex flex-col">
      <div className="win98-titlebar">
        <span className="font-bold">Contribution Archive</span>
      </div>
      <div className="bg-[#2b2b2b] border-2 p-2">
        <ScrollPanel maxHeight={256} nudgeId="contributor-archive">
          {reports.length === 0 ? (
            <p className="text-xs italic p-2 text-white">Nothing to report yet.</p>
          ) : (
            <div className="flex flex-col gap-3 p-1">
              {years.map((year) => (
                <div key={year}>
                  <p className="text-xs font-bold text-white mb-1 px-1">Year {year}</p>
                  <div className="grid gap-1">
                    {reportsByYear.get(year)!.map((note) => (
                      <Link
                        key={note.slug}
                        href={`/reports/${note.slug}`}
                        className="win98-button p-2 flex flex-col min-w-0 no-underline"
                      >
                        <span className="block text-sm font-bold truncate min-w-0">{note.title}</span>
                        <span className="flex items-start justify-between gap-2 min-w-0 flex-wrap">
                          <span className="text-[10px] text-[#444] font-bold truncate">
                            {format(new Date(note.date), 'MMM dd, yyyy')}
                          </span>
                          {note.repos.length > 0 && (
                            <span className="flex flex-wrap gap-1 justify-end">
                              {note.repos.map((r) => (
                                <TagChip key={r} tag={r.split('/')[1] ?? r} />
                              ))}
                            </span>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollPanel>
      </div>
    </div>
  )
}
