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
  title: "Advith's Blogfolio",
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
