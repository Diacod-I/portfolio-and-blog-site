'use client'

// Relay for /blogs/[slug] and /reports/[slug]'s server-fetched content
// (note/seeAlso/MDX content) over to the persistent <HomeClient> instance
// AppShellHost.tsx keeps mounted for every route — see that file's header
// for the full picture, but in short: those two page.tsx files render a
// no-op marker component (<BlogPostRouteData>/<ReportRouteData>, see
// components/RouteContentData.tsx) instead of their own <HomeClient>, and
// that marker writes its props in here on mount so AppShellHost can read
// them back out and feed them to the one shared <HomeClient>.
//
// This replaced an earlier approach where AppShellHost tried to read the
// marker's props straight off the `children` element tree (Children.toArray
// + a type match), reasoning that a Server Component handing a Client
// Component element down as a prop/child keeps that element "opaque"
// (type + props intact) across the server→client boundary — true as far
// as it goes, but it turned out `children` as AppShellHost actually
// receives it isn't a plain, directly-inspectable element tree at all: the
// App Router wraps a page's real output in its own internal boundary
// component(s) first (confirmed by literally logging the tree — it showed
// a single opaque wrapper object with no `.props.children` to recurse
// into), so there was no reliable prop path to walk to find the marker.
// Going through a shared store sidesteps needing to understand or rely on
// that internal wrapping at all.
//
// Trade-off worth knowing: the marker writes into this store from a
// `useEffect` (see RouteContentData.tsx), which only runs client-side,
// never during the server render that produces a cold permalink hit's
// initial HTML. So a fresh, non-hydrated load of /blogs/[slug] or
// /reports/[slug] briefly renders with this store still empty (Blogs
// falls back to its list view, Reports shows "No report loaded.") before
// flipping to the real content an instant later, once React hydrates and
// that effect fires. Every other route's SEO metadata (title/description/
// OG tags, via generateMetadata) is unaffected — those come from the
// static HTML Next generates regardless of any of this, not from
// anything rendered here.
import { create } from 'zustand'
import type { BlogPostRouteDataProps, ReportRouteDataProps } from '@/components/RouteContentData'

type RouteContentState = {
  blogPost: BlogPostRouteDataProps | null
  report: ReportRouteDataProps | null
  setBlogPost: (value: BlogPostRouteDataProps | null) => void
  setReport: (value: ReportRouteDataProps | null) => void
}

export const useRouteContentStore = create<RouteContentState>((set) => ({
  blogPost: null,
  report: null,
  setBlogPost: (value) => set({ blogPost: value }),
  setReport: (value) => set({ report: value }),
}))
