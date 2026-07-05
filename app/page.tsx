import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getRecentNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

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

// Server component: reads repo content at build time and passes it down.
// All interactivity lives in HomeClient.
export default async function HomePage() {
  const [notes, featured] = await Promise.all([
    getRecentNotes(5),
    getFeaturedLinks(),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <HomeClient notes={notes} featured={featured} />
    </>
  )
}
