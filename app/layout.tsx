import './globals.css'
import { Inter, JetBrains_Mono, VT323 } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Metadata, Viewport } from 'next'
import SoundEffects from '@/components/SoundEffects'
import AppShellHost from '@/components/AppShellHost'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config as fontAwesomeConfig } from '@fortawesome/fontawesome-svg-core'

// Font Awesome's React component injects its own <style> tag on the fly
// by default, which in an SSR framework like Next.js causes a flash of
// giant unstyled icons before that JS runs. Importing the CSS file
// directly above and disabling the auto-injection avoids it.
fontAwesomeConfig.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-vt323',
})

export const metadata: Metadata = {
  // Every relative URL below (and in per-page metadata) resolves against this.
  metadataBase: new URL('https://www.advithkrishnan.com'),
  title: {
    default: "Advith Krishnan's Blogfolio",
    template: "%s | Advith Krishnan",
  },
  description: "Advith Krishnan's retro Windows themed portfolio and blog",
  keywords: ['Advith', 'Blog', 'Portfolio', 'Windows 98', 'Artificial Intelligence', 'Engineering', 'Software Engineering', 'Developer', 'Krishnan', 'Projects', 'Research', 'AI', 'Blogfolio'],
  authors: [{ name: 'Advith Krishnan' }],
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/favicon.png', sizes: '180x180' }],
  },
  verification: {
    google: 'RrTfilKn-WFFA0PXcEwo9hea2TKx3epPIYedJuv9OBA',
  },
  openGraph: {
    siteName: "Advith Krishnan's Blogfolio",
    title: "Advith Krishnan's Blogfolio",
    description: "Advith Krishnan's retro Windows themed portfolio and blog",
    url: '/',
    type: 'website',
    images: [{ url: '/Advith_Krishnan.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Advith Krishnan's Blogfolio",
    description: "Advith Krishnan's retro Windows themed portfolio and blog",
    images: ['/Advith_Krishnan.webp'],
  },
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: "Advith Krishnan's Blog" }],
    },
  },
  // NOTE: no site-wide canonical here — each page declares its own via
  // its metadata export. A root canonical pointing at "/" would tell
  // Google every page is a duplicate of the homepage.
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetched once here (React's cache() in lib/notes.ts dedupes this
  // against app/blogs/[slug] and app/reports/[slug], which still fetch
  // their own copy for their own standalone <HomeClient> — see those
  // files — so this doesn't double the real work per request) and handed
  // down to AppShellHost, which renders the persistent desktop shell for
  // '/', '/about', '/contact', '/blogs', and '/credits' — see that
  // component for why those specifically, and not every route.
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/win98/windows_error_sound.mp3" as="audio" type="audio/mpeg" />
        <link rel="preload" href="/win98/click.mp3" as="audio" type="audio/mpeg" />
        {/* No preload link for the Home tab's typed "$ >" query keystroke
            sound (see HomeClient.tsx's playTypeSound) — it used to be a
            sample here (type_key.wav) but is now synthesized on the fly
            with the Web Audio API, same as Minesweeper's explosion and
            Solitaire's win chime, so there's no file left to preload. */}
        {/* "Data confirmed" chime for the instant the dossier appears once
            the boot log clears (see HomeClient.tsx's dossierBeepRef) —
            same preload reasoning as the two audio links above. */}
        <link rel="preload" href="/win98/dossier_beep.wav" as="audio" type="audio/wav" />
        {/* Desktop wallpaper — PowerOnGate.tsx only mounts the element that
            actually shows this image once the boot chime plays (its
            'booting' phase), so without this preload the browser wouldn't
            start fetching it until that exact moment, causing a visible
            stutter/pop-in partway through the fade. Preloading here means
            the fetch has already completed (or is well underway) long
            before the user even clicks the boot menu entry, so by the time
            PowerOnGate's div appears it's just an instant decode-from-cache
            + paint, not a network round trip. */}
        <link rel="preload" href="/win98/windows_98_wallpaper.webp" as="image" type="image/webp" />
        {/* World-atlas topojson the Home tab's Location panel fetches at
            runtime (see components/WorldMap.tsx's GEO_URL constant — keep
            this in sync if that ever changes). react-simple-maps only
            starts this fetch once WorldMap itself actually mounts, which
            per WorldMap's own comment in HomeClient.tsx is gated behind
            the boot-log sequence finishing — by then this preload (kicked
            off at page load, long before that point) has likely already
            finished, so the fetch WorldMap makes just resolves from cache
            instead of starting cold. crossOrigin is required for a
            cross-origin preload to actually get reused by the later fetch
            (otherwise the browser treats them as two separate requests). */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
          as="fetch"
          crossOrigin="anonymous"
        />
        {/* Edu NSW/ACT Cursive (hidden gallery's polaroid captions, see
            components/ImageExhibition.tsx) — loaded straight from Google
            Fonts' CDN rather than next/font/google like the other four
            fonts here, same as the Cedarville Cursive this replaced:
            next/font/google self-hosts by downloading the font file at
            build time and serving it from this domain, which should work
            identically, but Cedarville Cursive wasn't actually rendering
            that way for some reason, so the plain <link> approach stuck
            around across the font swap instead of revisiting that.
            ImageExhibition.tsx references the family by its literal name
            (not a CSS variable), matching this. The wght@400..700 range
            below is the full variable-font weight range Google Fonts
            offers for this family — ImageExhibition.tsx doesn't request a
            specific weight, so this just makes the whole range available
            if a weight ever gets set explicitly. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Edu+NSW+ACT+Cursive:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${vt323.variable}`}>
        <div className="min-h-screen">
          <AppShellHost notes={notes} featured={featured}>
            {children}
          </AppShellHost>
          <SoundEffects />
          <Analytics />
        </div>
      </body>
    </html>
  )
}
