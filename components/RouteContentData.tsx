'use client'

// Data-carrier "marker" components for /blogs/[slug] and /reports/[slug] —
// see components/AppShellHost.tsx and lib/store/routeContentStore.ts for
// the full story, but in short: those two page.tsx files still compile MDX
// server-side exactly as before (that part always worked fine — this
// isn't a client-side MDX re-implementation like the reverted attempt that
// broke production). What changed is WHO renders <HomeClient>: it used to
// be each page's own page.tsx, which meant navigating to/from a blog post
// or report mounted a brand new <HomeClient> (new desktop, new icons,
// everything repainting) instead of reusing the one persistent instance
// AppShellHost already keeps mounted for '/', '/about', etc.
//
// These two components render nothing themselves visibly (return null) —
// on mount (and whenever their props change), they write their
// note/seeAlso/content straight into useRouteContentStore, which
// AppShellHost reads back out to feed the shared <HomeClient>. On unmount
// (navigating away), they clear their own slot back to null so a later
// route doesn't render with stale content left over from a previous visit.
//
// An earlier version of this file had these do nothing but return null,
// relying on AppShellHost reading their props straight off the `children`
// element tree instead of through a store — that assumed `children` was a
// plain, directly walkable element tree by the time it reached
// AppShellHost. It wasn't: the App Router wraps a page's real output in
// its own internal boundary component(s) first, which don't expose their
// content via a plain `.props.children` the way a hand-written component
// would, so there was nothing reliable to find there. See
// routeContentStore.ts for the trade-off that comes with going through a
// store instead (a brief flash of fallback content on a cold permalink
// load, before hydration's first effect pass fills the store in).
import { useEffect } from 'react'
import type { Note } from '@/lib/notes'
import { useRouteContentStore } from '@/lib/store/routeContentStore'

export type BlogPostRouteDataProps = {
  note: Note
  seeAlso: Note[]
  content: React.ReactNode
}

export function BlogPostRouteData({ note, seeAlso, content }: BlogPostRouteDataProps) {
  const setBlogPost = useRouteContentStore((s) => s.setBlogPost)
  useEffect(() => {
    setBlogPost({ note, seeAlso, content })
    return () => setBlogPost(null)
  }, [note, seeAlso, content, setBlogPost])
  return null
}

export type ReportRouteDataProps = {
  note: Note
  content: React.ReactNode
}

export function ReportRouteData({ note, content }: ReportRouteDataProps) {
  const setReport = useRouteContentStore((s) => s.setReport)
  useEffect(() => {
    setReport({ note, content })
    return () => setReport(null)
  }, [note, content, setReport])
  return null
}
