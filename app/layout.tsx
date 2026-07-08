import './globals.css'
import { Inter, JetBrains_Mono, VT323 } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Metadata, Viewport } from 'next'
import SoundEffects from '@/components/SoundEffects'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/win98/windows_error_sound.mp3" as="audio" type="audio/mpeg" />
        <link rel="preload" href="/win98/click.mp3" as="audio" type="audio/mpeg" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${vt323.variable}`}>
        <div className="min-h-screen">
          {children}
          <SoundEffects />
          <Analytics />
        </div>
      </body>
    </html>
  )
}
