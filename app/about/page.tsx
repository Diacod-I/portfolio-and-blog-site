import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'About — Advith Krishnan',
  alternates: {
    canonical: '/about',
  },
}

// About is a tab within advith.exe now (see HomeClient's homeTab state),
// not a standalone page — this route just lands on the real desktop with
// advith.exe open and its About tab selected. See app/contact/page.tsx for
// the identical pattern.
export default async function AboutPage() {
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return (
    <HomeClient
      notes={notes}
      featured={featured}
      forceOpenApp="advith"
      initialHomeTab="about"
    />
  )
}
