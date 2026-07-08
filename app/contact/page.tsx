import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'Contact — Advith Krishnan',
  alternates: {
    canonical: '/contact',
  },
}

// Contact is a tab within advith.exe now (see HomeClient's homeTab state),
// not a standalone page — this route just lands on the real desktop with
// advith.exe open and its Contact tab selected.
export default async function ContactPage() {
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return (
    <HomeClient
      notes={notes}
      featured={featured}
      forceOpenApp="advith"
      initialHomeTab="contact"
    />
  )
}
