import './globals.css'
import { Inter, JetBrains_Mono, VT323 } from 'next/font/google'
import { Providers } from './providers'
import { Analytics } from "@vercel/analytics/next"
import { Metadata } from 'next'

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
  title: "Advith Krishnan's Blogfolio",
  description: "Advith's Windows 98 themed Portfolio and Blog website",
  icons: {
    icon: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Explicit absolute URLs to avoid crawler/different-host confusion */}
        <link rel="icon" href="https://www.advithkrishnan.com/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="https://www.advithkrishnan.com/favicon.ico" />
        {/* A PNG variant that Google sometimes prefers for search snippets */}
        <link rel="icon" href="https://www.advithkrishnan.com/favicon-48.png" sizes="48x48" type="image/png" />
        {/* Apple/Android touch icon for mobile/home-screen */}
        <link rel="apple-touch-icon" href="https://www.advithkrishnan.com/apple-touch-icon.png" sizes="180x180" />
        {/* Theme color (helps Chrome on Android show a matching color) */}
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="preload" href="/win98/windows_error_sound.mp3" as="audio" type="audio/mpeg" />
        <meta name="keywords" content="Advith, Blog, Portfolio, Windows 98, Artificial, Intelligence, Artificial Intelligence, Engineering, Software Engineering, Developer, Krishnan, Projects, Research, AI, Blogfolio, Software, Engineering, Engineer, Hire, Hiring, Developer, Advith Krishnan" />
        <meta name="author" content="Advith Krishnan" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Advith Krishnan's Blogfolio" />
        <meta property="og:description" content="Advith Krishnan's Windows 98 themed Portfolio and Blog website" />
        <meta property="og:url" content="https://www.advithkrishnan.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.advithkrishnan.com/Advith_Krishnan.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Advith Krishnan's Blogfolio" />
        <meta name="twitter:description" content="Advith Krishnan's Windows 98 themed Portfolio and Blog website" />
        <meta name="twitter:image" content="https://www.advithkrishnan.com/Advith_Krishnan.webp" />
        <link rel="canonical" href="https://www.advithkrishnan.com/" />
        <meta name="google-site-verification" content="RrTfilKn-WFFA0PXcEwo9hea2TKx3epPIYedJuv9OBA" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${vt323.variable}`}
      >
        <Providers>
          <div className="min-h-screen">
            {children}
            <Analytics />
          </div>
        </Providers>
      </body>
    </html>
  )
}
