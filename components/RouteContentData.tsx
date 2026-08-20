'use client'

// Data-carrier "marker" components for /blogs/[slug] and /reports/[slug] —
// see components/AppShellHost.tsx for the full story, but in short: those
// two page.tsx files still compile MDX server-side exactly as before (that
// part always worked fine — this isn't a client-side MDX re-implementation
// like the reverted attempt that broke production). What changed is WHO
// renders <HomeClient>: it used to be each page's own page.tsx, which meant
// navigating to/from a blog post or report mounted a brand new <HomeClient>
// (new desktop, new icons, everything repainting) instead of reusing the
// one persistent instance AppShellHost already keeps mounted for '/',
// '/about', etc.
//
// These two components render nothing themselves (return null) — they
// exist purely so a page.tsx can hand its server-fetched note/content data
// to AppShellHost, which reads it straight off the element's `.props`
// (children is just a plain React element at that point — no hooks, no
// refs, no timing/effect involved, so this works identically during SSR
// and every later client-side navigation, same as any other prop). See
// AppShellHost.tsx's isBlogPostRoute/isReportRoute branches for where
// that read happens.
//
// 'use client' above is load-bearing, not a copy-paste leftover: if these
// stayed plain Server Components, Next would resolve/execute them (down to
// their `return null`) on the server before the element ever reaches
// AppShellHost, so by the time it got there `child.type` wouldn't be
// `BlogPostRouteData`/`ReportRouteData` anymore — the props (and the type
// identity AppShellHost matches against) would already be gone. Marking
// these as client components makes React keep the element opaque (type +
// props, unresolved) across the server→client boundary instead, the same
// mechanism that already lets `<HomeClient blogsView={...}>` receive
// server-rendered MDX as a prop today.
import type { Note } from '@/lib/notes'

export type BlogPostRouteDataProps = {
  note: Note
  seeAlso: Note[]
  content: React.ReactNode
}

export function BlogPostRouteData(_props: BlogPostRouteDataProps) {
  return null
}

export type ReportRouteDataProps = {
  note: Note
  content: React.ReactNode
}

export function ReportRouteData(_props: ReportRouteDataProps) {
  return null
}
