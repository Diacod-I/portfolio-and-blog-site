'use client'

// "Contributor Archive" — every monthly OSS-contribution report (see
// lib/tags.ts's 'Reports' tag and scripts/generate-report.mjs), listed on
// advith.exe's Home tab, plus a small set of external writeups that live on
// someone else's site (data/externalReports.ts — currently the two LFX
// Mentorship blog posts). Deliberately reports-only otherwise: raw GitHub
// activity (PRs, reviews, issues, comments) is not shown here as a separate
// live feed — that detail already lives inside each report's own "Focus
// areas" section. This widget is the one place reports (and now these
// external writeups) show up on the site.
//
// Two kinds of row, both rendered from a single merged/sorted `entries`
// list below:
//  - 'internal' (a Note tagged 'Reports') links to /reports/[slug] to read
//    the full report — that route forces open advith.exe on its Report tab
//    (see that route's forceOpenApp="advith"/initialHomeTab="report" and
//    components/ReportViewer.tsx), decoupled from the Blogs window that
//    every other blog reference on the site opens (ExplorerBlogList, etc.).
//    Reports are still stored/compiled as ordinary Notes (lib/notes.ts) —
//    only the presentation is separate.
//  - 'external' (data/externalReports.ts) just opens `url` in a new tab —
//    no report page, no ReportViewer, nothing added to the MDX pipeline
//    (see that file's header comment for why).
//
// .win98-window chrome + ScrollPanel + win98-button rows, same structure as
// ContactView's Internet Shortcuts panel — but with the dark content panel
// (bg-[#2b2b2b], white text) matching GithubContributionGraph right above
// it, instead of ContactView's light one. Entries are grouped into a
// year-by-year timeline, newest year on top.
//
// Filtering is tag-only (see the chip row below) — no free-text search box.
// For internal reports the "tags" are each report's `repos` frontmatter
// (the same "#repo" hashtags already rendered per row, see
// lib/notes.ts/TagChip) — the only real taxonomy reports have: an
// unambiguous, closed set of values a text box couldn't match as cleanly
// (e.g. "torch" vs "pytorch"). External entries carry their own pre-
// normalized `tags` array (e.g. "linux foundation") in the same shape.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import ScrollPanel from '@/components/ScrollPanel'
import TagChip from '@/components/TagChip'
import { getTagColor } from '@/lib/tagColors'
import type { Note } from '@/lib/notes'
import { EXTERNAL_REPORTS, type ExternalReport } from '@/data/externalReports'

type ContributorArchiveProps = {
  notes: Note[]
}

// Same "#repo" derivation TagChip renders per row: the repo's own name,
// stripped of its "org/" prefix, lowercased.
const repoTag = (repo: string) => (repo.split('/')[1] ?? repo).toLowerCase()

// Unified shape the filter/group/render logic below operates on, so an
// internal report and an external writeup can sit in the same sorted list
// without every downstream step needing its own kind-check.
type ArchiveEntry =
  | { kind: 'internal'; key: string; date: string; tags: string[]; note: Note }
  | { kind: 'external'; key: string; date: string; tags: string[]; report: ExternalReport }

export default function ContributorArchive({ notes }: ContributorArchiveProps) {
  const entries = useMemo<ArchiveEntry[]>(() => {
    const internal: ArchiveEntry[] = notes
      .filter((n) => n.tag === 'Reports')
      .map((note) => ({
        kind: 'internal' as const,
        key: note.slug,
        date: note.date,
        tags: note.repos.map(repoTag),
        note,
      }))
    const external: ArchiveEntry[] = EXTERNAL_REPORTS.map((report) => ({
      kind: 'external' as const,
      key: report.slug,
      date: report.date,
      tags: report.tags.map((t) => t.toLowerCase()),
      report,
    }))
    return [...internal, ...external].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [notes])

  // Every distinct tag across all entries (internal + external), for the
  // filter row below.
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const entry of entries) {
      for (const tag of entry.tags) set.add(tag)
    }
    return [...set].sort()
  }, [entries])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Multi-select reads as OR (any selected tag matches) — the more
  // intuitive default for a small, exploratory filter list like this one.
  const filteredEntries = useMemo(
    () =>
      selectedTags.length === 0
        ? entries
        : entries.filter((entry) => entry.tags.some((t) => selectedTags.includes(t))),
    [entries, selectedTags]
  )

  // Grouped by the year each entry's date falls in, newest year first —
  // entries within a year stay in the newest-first order from the sort
  // above since Map preserves insertion order per key.
  const entriesByYear = new Map<number, ArchiveEntry[]>()
  for (const entry of filteredEntries) {
    const year = new Date(entry.date).getFullYear()
    const bucket = entriesByYear.get(year)
    if (bucket) bucket.push(entry)
    else entriesByYear.set(year, [entry])
  }
  const years = [...entriesByYear.keys()].sort((a, b) => b - a)

  return (
    <div className="win98-window flex flex-col">
      <div className="win98-titlebar">
        <span className="font-bold">Contribution Archive</span>
      </div>
      <div className="bg-[#2b2b2b] border-2 p-2">
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-[#444]">
            <span className="text-[10px] font-bold text-white mr-1">Filter by tag:</span>
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag)
              const { bg, text } = getTagColor(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className="inline-block border px-1 py-0.5 text-[10px] font-bold rounded"
                  style={
                    active
                      ? { backgroundColor: bg, color: text, borderColor: 'rgba(0,0,0,0.4)' }
                      : { backgroundColor: 'transparent', color: '#aaa', borderColor: '#555' }
                  }
                >
                  #{tag}
                </button>
              )
            })}
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-[10px] font-bold text-white underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        )}
        <ScrollPanel maxHeight={256} nudgeId="contributor-archive">
          {filteredEntries.length === 0 ? (
            <p className="text-xs italic p-2 text-white">
              {entries.length === 0 ? 'Nothing to report yet.' : 'No reports match the selected tags.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3 p-1">
              {years.map((year) => (
                <div key={year}>
                  <p className="text-xs font-bold text-white mb-1 px-1">Year {year}</p>
                  <div className="grid">
                    {entriesByYear.get(year)!.map((entry) =>
                      entry.kind === 'internal' ? (
                        <Link
                          key={entry.key}
                          href={`/reports/${entry.note.slug}`}
                          className="win98-button p-2 flex flex-col min-w-0 no-underline"
                        >
                          <span className="block text-sm font-bold truncate min-w-0">{entry.note.title}</span>
                          <span className="flex items-start justify-between gap-2 min-w-0 flex-wrap">
                            <span className="text-[10px] text-[#444] font-bold truncate">
                              {format(new Date(entry.note.date), 'MMM dd, yyyy')}
                            </span>
                            {entry.note.repos.length > 0 && (
                              <span className="flex flex-wrap gap-1 justify-end">
                                {entry.note.repos.map((r) => (
                                  <TagChip key={r} tag={r.split('/')[1] ?? r} />
                                ))}
                              </span>
                            )}
                          </span>
                        </Link>
                      ) : (
                        // External writeup — opens `url` in a new tab
                        // instead of routing anywhere on this site (see
                        // data/externalReports.ts). The small internet
                        // icon (same asset ContactView's Internet
                        // Shortcuts titlebar uses) is the only visual cue
                        // distinguishing this row from an internal report,
                        // since both otherwise share the exact same
                        // win98-button row styling.
                        <a
                          key={entry.key}
                          href={entry.report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="win98-button p-2 flex flex-col min-w-0 no-underline"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <img src="/win98/internet.webp" alt="" className="w-3.5 h-3.5 shrink-0" />
                            <span className="block text-sm font-bold truncate min-w-0">{entry.report.title}</span>
                          </span>
                          <span className="flex items-start justify-between gap-2 min-w-0 flex-wrap">
                            <span className="text-[10px] text-[#444] font-bold truncate">
                              {format(new Date(entry.report.date), 'MMM dd, yyyy')}
                            </span>
                            <span className="flex flex-wrap gap-1 justify-end">
                              {entry.report.tags.map((t) => (
                                <TagChip key={t} tag={t} />
                              ))}
                            </span>
                          </span>
                        </a>
                      )
                    )}
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
