import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'Credits & attributions — Advith Krishnan',
  alternates: {
    canonical: '/credits',
  },
}

// Credits opens as its own app window on the real desktop (see HomeClient) —
// launched, not pinned: there's no desktop icon for it, only this route and
// the taskbar's "Credits & attributions" link.
export default async function CreditsPage() {
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return (
    <HomeClient
      notes={notes}
      featured={featured}
      forceOpenApp="credits"
    />
  )
}
