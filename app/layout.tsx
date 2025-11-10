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
  description: "Advith Krishnan's Windows 98 themed Portfolio and Blog website",
  // metadata icons (keeps Next aware of icons too)
  icons: {
    icon: 'https://www.advithkrishnan.com/favicon.ico',
    shortcut: 'https://www.advithkrishnan.com/favicon.ico',
    apple: 'https://www.advithkrishnan.com/favicon.png'
  },
  openGraph: {
    title: "Advith Krishnan's Blogfolio",
    description: "Advith Krishnan's Windows 98 themed Portfolio and Blog website",
    url: "https://www.advithkrishnan.com",
    images: [
      {
        url: "https://www.advithkrishnan.com/Advith_Krishnan.webp",
        width: 1200,
        height: 630
      }
    ],
    type: 'website'
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
        {/* Use absolute URLs that point to the canonical host */}
        <link rel="icon" href="https://www.advithkrishnan.com/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="https://www.advithkrishnan.com/favicon.png" sizes="48x48" type="image/png" />
        <link rel="apple-touch-icon" href="https://www.advithkrishnan.com/favicon.png" sizes="180x180" />
        <meta name="theme-color" content="#0a0a0a" />

        <link rel="preload" href="/win98/windows_error_sound.mp3" as="audio" type="audio/mpeg" />
        <meta name="keywords" content="Advith, Blog, Portfolio, Windows 98, Artificial Intelligence, Engineering, Software Engineering, Developer, Krishnan, Projects, Research, AI, Blogfolio" />
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${vt323.variable}`}>
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