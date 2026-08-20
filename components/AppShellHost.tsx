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
// Three route shapes handled here:
//  - SHELL_ROUTES ('/', '/about', '/contact', '/blogs', '/credits') — no
//    per-page content needed, just forceOpenApp/initialHomeTab derived
//    purely from the pathname (deriveShellView below).
//  - /blogs/[slug] and /reports/[slug] — these DO need per-page content
//    (the server-compiled MDX for that specific post/report), which this
//    component doesn't have access to directly (it's generic across every
//    route, rendered from the root layout). That content travels here via
//    `children`: those two page.tsx files render a small no-op marker
//    component (<BlogPostRouteData>/<ReportRouteData> — see
//    RouteContentData.tsx) instead of their own <HomeClient>, carrying
//    note/seeAlso/content as props. Since `children` is just a plain,
//    already-resolved React element at this point (no hooks, no refs, no
//    client-side effect/timing involved), reading `.props` straight off
//    it here works identically during the very first SSR pass (so a
//    direct hit on a permalink still gets the real content in the initial
//    HTML — crawlers see it fine) and every later client-side navigation.
//    This is deliberately NOT the same approach as the reverted
//    client-side-MDX-recompilation attempt from earlier — the MDX itself
//    is still compiled exactly once, server-side, in the page.tsx, same
//    as it always was; only *which* <HomeClient> instance ends up
//    rendering the result changed.
//  - Anything else (404, or a route that doesn't carry the expected
//    marker for some reason — e.g. a not-found boundary) — renders
//    `children` unchanged, same fallback as before this file existed.
//
// notes/featured are fetched once in app/layout.tsx and handed down here
// so this doesn't need its own data-fetching, and so none of these pages
// need to fetch them just to pass along to a <HomeClient> they no longer
// render themselves.
import { Children, isValidElement } from 'react'
import { usePathname } from 'next/navigation'
import HomeClient, { type BlogsView, type ReportView } from '@/components/HomeClient'
import { BlogPostRouteData, ReportRouteData, type BlogPostRouteDataProps, type ReportRouteDataProps } from '@/components/RouteContentData'
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

// Finds the first `children` element of the given type and returns its
// props, typed. Used to pull note/seeAlso/content back out of
// <BlogPostRouteData>/<ReportRouteData> (see the file header) — undefined
// if it's not there (e.g. a not-found boundary rendered instead of the
// real page), which callers treat as "fall back to plain `children`"
// rather than guessing at content that doesn't exist.
function findRouteData<P>(children: React.ReactNode, type: unknown): P | undefined {
  const match = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === type
  )
  return match && isValidElement(match) ? (match.props as P) : undefined
}

type AppShellHostProps = {
  notes: Note[]
  featured: FeaturedLink[]
  children: React.ReactNode
}

export default function AppShellHost({ notes, featured, children }: AppShellHostProps) {
  const pathname = usePathname() ?? '/'

  if (isBlogPostRoute(pathname)) {
    const data = findRouteData<BlogPostRouteDataProps>(children, BlogPostRouteData)
    if (!data) {
      // No marker found (e.g. a not-found boundary rendered here instead
      // of NotePage) — render whatever `children` actually is, unchanged,
      // rather than force-opening a Blogs window with content that
      // doesn't exist.
      return <>{children}</>
    }
    const blogsView: BlogsView = { mode: 'post', note: data.note, seeAlso: data.seeAlso, content: data.content }
    return (
      <>
        {children}
        <HomeClient notes={notes} featured={featured} forceOpenApp="blogs" blogsView={blogsView} />
      </>
    )
  }

  if (isReportRoute(pathname)) {
    const data = findRouteData<ReportRouteDataProps>(children, ReportRouteData)
    if (!data) {
      return <>{children}</>
    }
    const reportView: ReportView = { note: data.note, content: data.content }
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
