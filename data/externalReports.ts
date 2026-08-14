// data/externalReports.ts
//
// External-only entries for ContributorArchive: writeups that live on
// someone else's site (not this project's own MDX pipeline in
// content/notes/), so they deliberately do NOT go through getAllNotes()/
// lib/notes.ts. That keeps them out of the Blogs window, sitemap, feed.xml,
// and credits page (see ContactView.tsx's LFX Mentorship removal from
// Internet Shortcuts — same reasoning, this is the one remaining place they
// should show up). Clicking a row here just opens `url` in a new tab
// instead of routing to /reports/[slug] — see ContributorArchive.tsx's
// `kind: 'external'` branch.
//
// `tags` are already the exact "#tag" text to render/filter on (unlike a
// Note's `repos`, which ContributorArchive derives a "#repo" tag from via
// repoTag()) — no "org/repo" stripping needed since these aren't repos.

export type ExternalReport = {
  slug: string
  title: string
  /** ISO date string, same convention as Note['date']. */
  date: string
  url: string
  tags: string[]
}

export const EXTERNAL_REPORTS: ExternalReport[] = [
  {
    slug: 'lfx-mentorship-midterm-2025',
    title: 'LFX Mentorship (Midterm) — RAG to Riches: Using Your Legacy Data',
    date: '2025-07-22',
    url: 'https://openmainframeproject.org/blog/mentorship-series-rag-to-riches-using-your-legacy-data-by-advith-krishnan/',
    tags: ['linux foundation'],
  },
  {
    slug: 'lfx-mentorship-final-2025',
    title: 'LFX Mentorship (Final) — Summer 2025',
    date: '2025-09-09',
    url: 'https://openmainframeproject.org/blog/summer-mentorship-2025-advith-krishnan/',
    tags: ['linux foundation'],
  },
]
