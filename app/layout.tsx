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
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/win98/windows_error_sound.mp3" as="audio" type="audio/mpeg" />
        <meta name="keywords" content="Advith, Blog, Portfolio, Windows 98, Developer, Krishnan, Projects, Research, AI" />
        <meta name="author" content="Advith Krishnan" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Advith Krishnan's Blogfolio" />
        <meta property="og:description" content="Advith's Windows 98 themed Portfolio and Blog website" />
        <meta property="og:url" content="https://adviths-blogfolio.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://adviths-blogfolio.vercel.app/Advith_Krishnan.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Advith's Blogfolio" />
        <meta name="twitter:description" content="Advith's Windows 98 themed Portfolio and Blog website" />
        <meta name="twitter:image" content="https://adviths-blogfolio.vercel.app/Advith_Krishnan.webp" />
        <link rel="canonical" href="https://adviths-blogfolio.vercel.app/" />
        <meta name="google-site-verification" content="rwrUPTvLOeZKftnqY-8eFHQRbeLzHS5MfAdocp7rRos" />
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
