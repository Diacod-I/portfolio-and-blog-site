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
// .win98-window chrome + win98-button rows, same structure as ContactView's
// Internet Shortcuts panel — but with the dark content panel (bg-[#2b2b2b],
// white text) matching GithubContributionGraph right above it, instead of
// ContactView's light one. No nested scroll region here (unlike this
// component's own earlier version) — the list just renders at its full
// height so the tab's own outer scroll (see HomeClient's min-h-full
// scroll-fix pattern and its scroll-linked parallax background) handles
// overflow, the same reasoning ContactView's Internet Shortcuts panel
// already uses. Entries are grouped into a year-by-year timeline, newest
// year on top.
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

// A gap between two consecutive entries (sorted newest-first, so "next" here
// means the OLDER of the pair) wider than this gets a "quiet period" filler
// row instead of just silently skipping straight from one date to the next —
// same idea as POAP's timeline filling in stretches with no collectibles
// instead of leaving the gap unexplained. 60 days (~2 months) is short
// enough to never fire on the normal month-to-month cadence of the internal
// monthly reports (see this file's own header comment), but long enough to
// only flag genuine dry spells rather than every ordinary skipped month.
const QUIET_GAP_THRESHOLD_DAYS = 60

// Unlike every other quiet filler on this page, the stretch before the
// archive's very first entry (LFX Mentorship Midterm, 2025-07-22) can't be
// derived from the gap-detection walk below — that walk only ever looks at
// pairs of consecutive REAL entries, and there's no earlier entry to pair
// the first one against. So this one is manually specified rather than
// computed: Jan–Apr 2025 (before the open-source journey had started at
// all), up through joining LFX Mentorship in May 2025. Deliberately ends at
// May, not at the Midterm write-up's own July date — the ~2.5 months from
// joining to that first report is normal ramp-up time, not "quiet," same
// distinction QUIET_GAP_THRESHOLD_DAYS draws everywhere else on this page.
const PRE_JOURNEY_QUIET = { from: '2025-01-01', to: '2025-05-01' }

// The event that ended PRE_JOURNEY_QUIET — its own standalone row (see
// 'milestone' below) rather than a second line inside the quiet filler's
// own box, so it reads as its own moment on the timeline instead of
// looking like part of the "nothing happened" banner it sits next to.
const JOINED_LFX = { date: '2025-05-01', label: 'Joined LFX Mentorship' }

// One row in the rendered list: a real entry, a filler marking a
// QUIET_GAP_THRESHOLD_DAYS+ stretch between the two entries on either side
// of it, or a milestone — a single dated event worth calling out on its
// own (currently just JOINED_LFX above) without it being a full archive
// entry with a link/tags/etc. `from`/`to` on 'quiet' are ISO date strings
// (the older/newer entry's own `date`), not the exact boundary of
// "activity" — there's no way to know the true start/end of a quiet
// stretch, only that nothing logged here falls between these two dates.
type ArchiveRow =
  | { kind: 'entry'; entry: ArchiveEntry }
  | { kind: 'quiet'; key: string; from: string; to: string }
  | { kind: 'milestone'; key: string; date: string; label: string }

// A year's worth of rows (real entries and/or quiet-period fillers) — kept
// as a first-class grouping distinct from the flat entries list so a gap
// spanning multiple years splits into one filler per year touched (see the
// walk below) instead of a single banner straddling two sections. A year
// with no real entries still gets its own section, with just a filler row,
// if a flagged quiet gap passes through it — an ordinary empty year (never
// part of any flagged gap) still gets no section at all.
type ArchiveSection = { year: number; rows: ArchiveRow[] }

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

  // Grouped by the year each entry's date falls in, newest year first, with
  // quiet-period filler rows spliced in wherever two consecutive entries
  // (in the already newest-first sorted filteredEntries) are more than
  // QUIET_GAP_THRESHOLD_DAYS apart — see that constant's comment. A gap
  // confined to a single year gets one filler row, same as before. A gap
  // that crosses one or more year boundaries (e.g. the newer entry is in
  // 2026, the older one in 2025) gets split into one filler PER YEAR it
  // touches instead of a single banner straddling two sections: a tail
  // segment (Jan 1 → the newer entry's date) appended to the newer year's
  // own section, a head segment (the older entry's date → Dec 31) that
  // becomes the FIRST row of the older year's section, and — for a gap
  // spanning 3+ years — a full Jan-1-to-Dec-31 filler for every year
  // strictly in between, each getting its own section even though it has
  // no real entries at all (an ordinary empty year still gets no section;
  // a year that's empty BECAUSE it's inside a flagged quiet gap does, so
  // the silence there isn't silently skipped over same as an untouched
  // empty year would be).
  //
  // Quiet/milestone fillers are ONLY generated when no tag filter is
  // active (selectedTags.length === 0). They describe gaps in the
  // person's real, full history — "nothing happened here" — which is
  // only a true statement about the unfiltered timeline. Once a tag
  // filter narrows filteredEntries down to a subset (e.g. just "pytorch"
  // reports), the resulting gaps are an artifact of the filter, not
  // actual quiet stretches — plenty may have happened elsewhere in that
  // window under a different tag. Rendering "— Quiet period —" banners
  // there would misrepresent filtered-out activity as literal silence,
  // so filtered views show only the matching entries with no fillers at
  // all.
  const sections: ArchiveSection[] = []
  const pushRow = (year: number, row: ArchiveRow) => {
    let section = sections[sections.length - 1]
    if (!section || section.year !== year) {
      section = { year, rows: [] }
      sections.push(section)
    }
    section.rows.push(row)
  }
  const showQuietFillers = selectedTags.length === 0
  filteredEntries.forEach((entry, i) => {
    const entryYear = new Date(entry.date).getFullYear()
    pushRow(entryYear, { kind: 'entry', entry })

    if (!showQuietFillers) return
    const olderEntry = filteredEntries[i + 1]
    if (!olderEntry) return
    const olderYear = new Date(olderEntry.date).getFullYear()
    const gapDays =
      (new Date(entry.date).getTime() - new Date(olderEntry.date).getTime()) / 86_400_000
    if (gapDays <= QUIET_GAP_THRESHOLD_DAYS) return

    if (entryYear === olderYear) {
      pushRow(entryYear, {
        kind: 'quiet',
        key: `quiet-${olderEntry.date}-${entry.date}`,
        from: olderEntry.date,
        to: entry.date,
      })
      return
    }

    // Tail of the newer year: silence from that year's start up to entry
    // itself (entry is necessarily the OLDEST entry of entryYear here,
    // since the very next entry belongs to an earlier year).
    pushRow(entryYear, {
      kind: 'quiet',
      key: `quiet-${entryYear}-start-${entry.date}`,
      from: `${entryYear}-01-01`,
      to: entry.date,
    })
    // Any year fully inside the gap, touched by neither entry directly.
    for (let y = entryYear - 1; y > olderYear; y--) {
      pushRow(y, { kind: 'quiet', key: `quiet-${y}-full`, from: `${y}-01-01`, to: `${y}-12-31` })
    }
    // Head of the older year: silence from olderEntry to that year's end.
    // Pushed now, before the forEach even reaches olderEntry's own index —
    // pushRow creates olderYear's section here, and olderEntry's row (next
    // iteration) lands right after it in that same section, so this reads
    // as "the quiet stretch, then the entry that ended it," oldest-first
    // within the section same as everywhere else.
    pushRow(olderYear, {
      kind: 'quiet',
      key: `quiet-${olderEntry.date}-${olderYear}-end`,
      from: olderEntry.date,
      to: `${olderYear}-12-31`,
    })
  })

  // JOINED_LFX + PRE_JOURNEY_QUIET, appended after (i.e. below/older than)
  // every real entry and every derived gap filler above — together they're
  // the true start of the timeline, so they belong at the very bottom, in
  // that order: the milestone first (pushRow appends, so whatever's pushed
  // first renders above whatever's pushed after it), then the quiet
  // stretch that preceded it. Only added when no tag filter is active
  // (same reasoning as showQuietFillers above) AND when the oldest entry
  // actually visible right now is on or after PRE_JOURNEY_QUIET.to (May
  // 2025): if a tag filter's own oldest match is already earlier than
  // that (shouldn't currently happen — nothing in the data predates July
  // 2025 — but this keeps it from ever rendering a nonsensical "quiet
  // until May 2025" banner beneath an entry that's actually from, say,
  // March 2025) or if the filter matches nothing at all, both are skipped
  // together.
  const oldestVisible = filteredEntries[filteredEntries.length - 1]
  if (
    showQuietFillers &&
    oldestVisible &&
    new Date(oldestVisible.date) >= new Date(PRE_JOURNEY_QUIET.to)
  ) {
    const year = new Date(PRE_JOURNEY_QUIET.from).getFullYear()
    pushRow(year, { kind: 'milestone', key: 'milestone-joined-lfx', date: JOINED_LFX.date, label: JOINED_LFX.label })
    pushRow(year, {
      kind: 'quiet',
      key: 'quiet-pre-journey',
      from: PRE_JOURNEY_QUIET.from,
      to: PRE_JOURNEY_QUIET.to,
    })
  }

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
          {filteredEntries.length === 0 ? (
            <p className="text-xs italic p-2 text-white">
              {entries.length === 0 ? 'Nothing to report yet.' : 'No reports match the selected tags.'}
            </p>
          ) : (
            <div className="flex flex-col gap-3 p-1">
              {sections.map((section) => (
                <div key={section.year}>
                  <p className="text-xs font-bold text-white mb-1 px-1">Year {section.year}</p>
                  <div className="grid">
                    {section.rows.map((row) => {
                      if (row.kind === 'milestone') {
                        // Same dashed-card treatment as the 'quiet' filler
                        // below (unclickable, select-none, one card in the
                        // grid) so it reads as the same family of "not a
                        // real archive entry" row. my-1 gives both filler
                        // kinds their own breathing room from the flush,
                        // touching win98-button rows around them — those
                        // are deliberately kept tight against each other
                        // (see the header comment on why), so the margin
                        // lives on the filler cards themselves rather than
                        // as a gap on the shared grid, which would space
                        // out every row uniformly. Plain white, same as
                        // the quiet card, rather than an accent color — the
                        // ✦ glyph plus the different border/label text
                        // already distinguish "a specific milestone" from
                        // "an absence of activity" without needing its own
                        // color on top of that.
                        return (
                          <div
                            key={row.key}
                            className="my-1 p-2 flex flex-col items-center justify-center gap-0.5 text-center border border-dashed border-white/40 select-none"
                          >
                            <span className="text-[10px] font-bold text-white">✦ {row.label}</span>
                            <span className="text-[10px] text-white/70">{format(new Date(row.date), 'MMM yyyy')}</span>
                          </div>
                        )
                      }
                      if (row.kind === 'quiet') {
                        // Deliberately not a <button>/<Link> — nothing to
                        // click, nothing to navigate to. Dashed border +
                        // muted color distinguish it at a glance from the
                        // solid win98-button entry rows around it, same as
                        // how POAP's own timeline gap-filler reads as
                        // "placeholder," not "content." select-none since a
                        // stray "— Quiet period —" text selection reads odd
                        // for what's essentially a spacer with a caption.
                        // my-1 for the same reason as the milestone card
                        // above — its own breathing room from the flush
                        // entry rows around it.
                        return (
                          <div
                            key={row.key}
                            className="my-1 p-2 flex flex-col items-center justify-center gap-0.5 text-center border border-dashed border-[#555] select-none"
                          >
                            <span className="text-[10px] italic text-[#888]">— Quiet period —</span>
                            <span className="text-[10px] text-[#666]">
                              {format(new Date(row.from), 'MMM yyyy')} – {format(new Date(row.to), 'MMM yyyy')}
                            </span>
                          </div>
                        )
                      }
                      const entry = row.entry
                      return entry.kind === 'internal' ? (
                        <Link
                          key={entry.key}
                          href={`/reports/${entry.note.slug}`}
                          className="win98-button p-2 flex flex-col min-w-0 no-underline"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <img src="/win98/notes.webp" alt="" className="w-3.5 h-3.5 shrink-0" />
                            <span className="block text-sm font-bold truncate min-w-0">{entry.note.title}</span>
                          </span>
                          {/* min-h-5 reserves the same vertical space a
                              TagChip would take even when this entry has no
                              repos/tags at all — without it, a tagless row
                              (nothing rendered on the right) came out visibly
                              shorter than every row next to it that did have
                              a chip. */}
                          <span className="flex items-start justify-between gap-2 min-w-0 flex-wrap min-h-5">
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
                        // data/externalReports.ts). Internal report rows
                        // above use a notes icon; this one uses the same
                        // internet icon as ContactView's Internet Shortcuts
                        // titlebar — that icon swap is the only visual cue
                        // distinguishing an external row from an internal
                        // one, since both otherwise share the exact same
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
                          {/* Same min-h-5 as the internal-report branch
                              above, for the same reason — kept here too so
                              this row stays consistent even if an external
                              writeup is ever added with an empty tags
                              array. */}
                          <span className="flex items-start justify-between gap-2 min-w-0 flex-wrap min-h-5">
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
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
