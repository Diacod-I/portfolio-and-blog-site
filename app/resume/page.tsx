import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'Resume — Advith Krishnan',
  alternates: {
    canonical: '/resume',
  },
}

// Resume is a tab within advith.exe now (see HomeClient's homeTab state),
// not a standalone page — this route just lands on the real desktop with
// advith.exe open and its Resume tab selected.
export default async function ResumePage() {
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return (
    <HomeClient
      notes={notes}
      featured={featured}
      forceOpenApp="advith"
      initialHomeTab="resume"
    />
  )
}
