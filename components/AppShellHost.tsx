'use client'

// Persistent "desktop shell" host — rendered once, from the root layout
// (app/layout.tsx), so it never unmounts while navigating between any of
// the routes below: there's only ONE <HomeClient> instance for all of them
// (icons, taskbar, every app window stay mounted, no repaint), and this
// component just feeds it new forceOpenApp/initialHomeTab/blogsView/
// reportView values (derived from the current pathname, plus per-route
// content where relevant) as the user moves between them — see
// HomeClient.tsx's own reactive-to-prop-changes effects (the
// initialHomeTab/forceOpenApp useEffects) and its direct-from-props
// rendering of blogsView/reportView for how it applies those without
// needing a fresh mount.
//
// One exception to "HomeClient always mounts immediately": a cold landing
// on '/' specifically renders <PowerOnGate> instead, first — see that
// component for the full reasoning (short version: browsers block
// autoplaying audio until a real user gesture, and '/' is the one route
// where HomeClient's Home tab can start its auto-playing typing/boot-log/
// chime sequence with zero gesture yet this page load). Every other
// route here still mounts HomeClient immediately, unchanged.
//
// Three route shapes handled here:
//  - SHELL_ROUTES ('/', '/about', '/contact', '/blogs', '/credits') — no
//    per-page content needed, just forceOpenApp/initialHomeTab derived
//    purely from the pathname (deriveShellView below).
//  - /blogs/[slug] and /reports/[slug] — these DO need per-page content
//    (the server-compiled MDX for that specific post/report), which this
//    component doesn't have access to directly (it's generic across every
//    route, rendered from the root layout). That content travels here via
//    useRouteContentStore: those two page.tsx files render a small no-op
//    marker component (<BlogPostRouteData>/<ReportRouteData> — see
//    RouteContentData.tsx) instead of their own <HomeClient>, and that
//    marker writes note/seeAlso/content into the store on mount — see
//    lib/store/routeContentStore.ts for the read/write side of that and,
//    importantly, the trade-off it comes with (a brief flash of fallback
//    content on a cold permalink load, before the store's first client-side
//    update lands).
//
//    An earlier version of this read note/seeAlso/content straight off the
//    `children` element tree instead (Children.toArray + a type match),
//    reasoning that a Server Component handing a Client Component element
//    down as a prop/child keeps that element "opaque" (type + props
//    intact) across the server→client boundary. True as far as it goes,
//    but `children` as this component actually receives it isn't a plain,
//    directly-inspectable element tree: the App Router wraps a page's real
//    output in its own internal boundary component(s) first, and (per an
//    actual runtime trace — logging the tree showed a single opaque
//    wrapper object with no `.props.children` to recurse into) that
//    wrapper doesn't expose its content via a normal `children` prop the
//    way a hand-written component would. There was nothing reliable left
//    to walk to find the marker, hence the store instead.
//  - Anything else (404, or a route with no matching store content, e.g.
//    a not-found boundary) — HomeClient's own props already default
//    sensibly (blogsView falls back to list mode, reportView to undefined
//    → "No report loaded."), so there's no special-cased fallback needed
//    here beyond just not populating those props.
//
// notes/featured are fetched once in app/layout.tsx and handed down here
// so this doesn't need its own data-fetching, and so none of these pages
// need to fetch them just to pass along to a <HomeClient> they no longer
// render themselves.
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import HomeClient, { type BlogsView, type ReportView } from '@/components/HomeClient'
import PowerOnGate from '@/components/PowerOnGate'
import { useRouteContentStore } from '@/lib/store/routeContentStore'
import type { AppId } from '@/lib/store/windowStore'
import type { HomeTab } from '@/components/Navbar'
import type { Note } from '@/lib/notes'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

const SHELL_ROUTES = new Set(['/', '/about', '/contact', '/blogs', '/credits'])

const isBlogPostRoute = (pathname: string) => /^\/blogs\/[^/]+$/.test(pathname)
const isReportRoute = (pathname: string) => /^\/reports\/[^/]+$/.test(pathname)

// Pure function of pathname — the same forceOpenApp/initialHomeTab values
// each of the 5 routes' own page.tsx used to pass as props directly to
// HomeClient before that responsibility moved here.
function deriveShellView(pathname: string): { forceOpenApp?: AppId; initialHomeTab?: HomeTab } {
  switch (pathname) {
    case '/about':
      return { forceOpenApp: 'advith', initialHomeTab: 'about' }
    case '/contact':
      return { forceOpenApp: 'advith', initialHomeTab: 'contact' }
    case '/blogs':
      return { forceOpenApp: 'blogs' }
    case '/credits':
      return { forceOpenApp: 'credits' }
    default:
      // '/' — nothing force-opens, same as app/page.tsx's original
      // behavior (the user opens advith.exe themselves via its icon).
      return {}
  }
}

type AppShellHostProps = {
  notes: Note[]
  featured: FeaturedLink[]
  children: React.ReactNode
}

export default function AppShellHost({ notes, featured, children }: AppShellHostProps) {
  const pathname = usePathname() ?? '/'
  // Always subscribed (not just inside the branches that use them) so
  // this component re-renders the instant either marker writes to the
  // store, rather than only picking up the new value on some later,
  // unrelated re-render.
  const blogPost = useRouteContentStore((s) => s.blogPost)
  const report = useRouteContentStore((s) => s.report)

  // See PowerOnGate.tsx for the full reasoning — short version: '/' is the
  // only route nothing auto-opens on (every other shell route force-opens
  // straight into content — see deriveShellView below), so it's the only
  // place a cold load can end up replaying HomeClient's auto-playing Home
  // tab sequence (typing sound, boot log, dossier chime) with zero user
  // gesture yet this page load, which browsers silently block. Lazy
  // useState initializer: only evaluated once, on this component's actual
  // mount (which only happens on a real navigation/reload — AppShellHost
  // itself persists across client-side nav within the root layout), so
  // this captures "was '/' the very first route this session actually
  // loaded" and nothing later (like clicking Home from another tab, which
  // is itself already a real gesture) re-triggers it.
  const [showPowerOnGate, setShowPowerOnGate] = useState(() => pathname === '/')
  if (showPowerOnGate) {
    return (
      <>
        {/* Invisible per-page content (e.g. '/'s Person JSON-LD script —
            see app/page.tsx) still renders even behind the gate: it's not
            part of the visible UI the gate is blocking, and search-engine
            crawlers generally don't perform the click needed to get past
            it, so this shouldn't be hidden behind that interaction. */}
        {children}
        <PowerOnGate onStart={() => setShowPowerOnGate(false)} />
      </>
    )
  }

  if (isBlogPostRoute(pathname)) {
    const blogsView: BlogsView = blogPost
      ? { mode: 'post', note: blogPost.note, seeAlso: blogPost.seeAlso, content: blogPost.content }
      : { mode: 'list' }
    return (
      <>
        {/* Mounts <BlogPostRouteData>, which feeds blogPost above — plus
            any other invisible per-page content (e.g. the post's JSON-LD
            script), still rendered even though the page no longer renders
            its own <HomeClient>. */}
        {children}
        <HomeClient notes={notes} featured={featured} forceOpenApp="blogs" blogsView={blogsView} />
      </>
    )
  }

  if (isReportRoute(pathname)) {
    const reportView: ReportView | undefined = report ? { note: report.note, content: report.content } : undefined
    return (
      <>
        {children}
        <HomeClient
          notes={notes}
          featured={featured}
          forceOpenApp="advith"
          initialHomeTab="report"
          reportView={reportView}
        />
      </>
    )
  }

  if (!SHELL_ROUTES.has(pathname)) {
    // Any other route (404, ...) — nothing to add here.
    return <>{children}</>
  }

  const { forceOpenApp, initialHomeTab } = deriveShellView(pathname)

  return (
    <>
      {/* Any invisible per-page content (e.g. "/"'s Person JSON-LD script
          — see app/page.tsx) still needs to render even though those
          pages no longer render their own <HomeClient> — this renders it
          alongside, not instead of, the shared instance below. */}
      {children}
      <HomeClient
        notes={notes}
        featured={featured}
        forceOpenApp={forceOpenApp}
        initialHomeTab={initialHomeTab}
      />
    </>
  )
}
