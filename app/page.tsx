import { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Advith Krishnan',
  url: 'https://www.advithkrishnan.com',
  email: 'mailto:advithkrishnan@gmail.com',
  jobTitle: 'AI Engineer',
  sameAs: [
    'https://www.linkedin.com/in/advithkrishnan/',
    'https://github.com/Diacod-I',
    'https://x.com/advith_krishnan',
    'https://orcid.org/0009-0009-6207-5271',
    'https://substack.com/@advithkrishnan',
  ],
}

// The actual desktop (icons, taskbar, all app windows) now lives in the
// persistent shell — see components/AppShellHost.tsx, mounted once from
// app/layout.tsx — which renders a single, never-remounting <HomeClient>
// shared across this route, /about, /contact, /blogs, and /credits.
// AppShellHost derives forceOpenApp/initialHomeTab for "/" itself from the
// URL (nothing force-opens here — same as before), so this page only has
// one thing left that's specific to it and needs to exist in the actual
// HTML for SEO: the Person JSON-LD block below. AppShellHost renders this
// alongside (not instead of) the shared HomeClient instance.
export default function HomePage() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
    />
  )
}
