import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'Logs — Advith Krishnan',
  alternates: {
    canonical: '/about',
  },
}

// "About" is a tab within advith.exe now (see HomeClient's homeTab state),
// not a standalone page — this route just lands on the real desktop with
// advith.exe open and its Logs tab selected (labeled "Logs" in the navbar,
// see Navbar.tsx — the 'about' id itself is unchanged, only its content and
// visible label). It shows the GitHub contributor activity feed + report
// archive; the profile/bio now lives on Home instead. See
// app/contact/page.tsx for the identical routing pattern.
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
