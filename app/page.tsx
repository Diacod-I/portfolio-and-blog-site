import HomeClient from '@/components/HomeClient'
import { getRecentNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

// Server component: reads repo content at build time and passes it down.
// All interactivity lives in HomeClient.
export default async function HomePage() {
  const [notes, featured] = await Promise.all([
    getRecentNotes(5),
    getFeaturedLinks(),
  ])

  return <HomeClient notes={notes} featured={featured} />
}
