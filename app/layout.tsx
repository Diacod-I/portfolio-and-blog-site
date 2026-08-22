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
        {/* Cedarville Cursive (hidden gallery's polaroid captions, see
            components/ImageExhibition.tsx) — loaded straight from Google
            Fonts' CDN rather than next/font/google like the other four
            fonts here. next/font/google self-hosts by downloading the
            font file at build time and serving it from this domain, which
            should work identically, but it wasn't actually rendering as
            Cedarville Cursive for some reason — switched to the plain
            <link> approach instead of chasing why. ImageExhibition.tsx
            references the family by its literal name now (not a CSS
            variable), matching this. Only the Cedarville Cursive family is
            requested below, not Roboto — Google Fonts' site tends to
            tack on a default Roboto import unless removed, but this
            project already has Inter as its sans font and doesn't need a
            second one. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap" rel="stylesheet" />
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
