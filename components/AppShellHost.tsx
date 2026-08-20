'use client'

// Persistent "desktop shell" host for the routes that don't need any
// server-fetched, per-page content injected into the desktop — see
// SHELL_ROUTES below: '/', '/about', '/contact', '/blogs' (list), and
// '/credits'. Rendered once, from the root layout (app/layout.tsx), so it
// never unmounts while navigating between those routes: there's only ONE
// <HomeClient> instance for all of them (icons, taskbar, every app window
// stay mounted, no repaint), and this component just feeds it new
// forceOpenApp/initialHomeTab values (derived from the current pathname)
// as the user moves between them — see HomeClient.tsx's own
// reactive-to-prop-changes effects (the initialHomeTab/forceOpenApp
// useEffects) for how it applies those without needing a fresh mount.
//
// Everything else (/blogs/[slug], /reports/[slug], 404, or any route not
// explicitly listed below) renders `children` unchanged instead — those
// pages still compile/fetch their own content server-side and render
// their own full, self-contained <HomeClient> exactly as before this
// component existed. That's a deliberate, narrower scope: a blog post or
// report's content is server-compiled MDX that needs to exist in the
// static HTML for SEO, and folding that into this same persistent-instance
// model would need a DOM-portal (or equivalent) approach — a bigger,
// separate change. So navigating to/from a blog post or report still
// remounts the desktop today, same as before this component existed —
// only navigation among the 5 routes below is actually flicker-free.
//
// notes/featured are fetched once in app/layout.tsx and handed down here
// so this doesn't need its own data-fetching, and so the 5 "shell" pages
// no longer need to fetch them either (see those page.tsx files — they
// return null/an invisible script now, nothing that needs notes/featured).
import { usePathname } from 'next/navigation'
import HomeClient from '@/components/HomeClient'
import type { AppId } from '@/lib/store/windowStore'
import type { HomeTab } from '@/components/Navbar'
import type { Note } from '@/lib/notes'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

const SHELL_ROUTES = new Set(['/', '/about', '/contact', '/blogs', '/credits'])

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

  if (!SHELL_ROUTES.has(pathname)) {
    // Standalone route (a blog post, a report, a 404, ...) — its own
    // page.tsx renders a complete, self-contained <HomeClient> as
    // `children`. Nothing else to add here.
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
