import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logs — Advith Krishnan',
  alternates: {
    canonical: '/about',
  },
}

// "About" is a tab within advith.exe (see HomeClient's homeTab state), not
// a standalone page — it shows the GitHub contributor activity feed +
// report archive (labeled "Logs" in the navbar, see Navbar.tsx — the
// 'about' id itself is unchanged, only its content and visible label). The
// actual desktop UI now lives in the persistent shell — see
// components/AppShellHost.tsx, mounted once from app/layout.tsx — which
// derives forceOpenApp="advith"/initialHomeTab="about" for this route
// itself from the URL, so this page has nothing left to render. See
// app/contact/page.tsx for the identical pattern.
export default function AboutPage() {
  return null
}
