import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Advith Krishnan',
  alternates: {
    canonical: '/contact',
  },
}

// Contact is a tab within advith.exe (see HomeClient's homeTab state), not
// a standalone page. The actual desktop UI now lives in the persistent
// shell — see components/AppShellHost.tsx, mounted once from
// app/layout.tsx — which derives forceOpenApp="advith"/
// initialHomeTab="contact" for this route itself from the URL, so this
// page has nothing left to render.
export default function ContactPage() {
  return null
}
