import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const metadata: Metadata = {
  title: 'All Blog Posts | Advith Krishnan',
  description: "Browse all of Advith Krishnan's blog posts in one place.",
  alternates: {
    canonical: 'https://www.advithkrishnan.com/blogs',
  },
}

// Renders the same desktop as "/" (icons, taskbar, other windows persist via
// the zustand store) with the Blogs window forced open on the list view —
// so following a link straight to /blogs feels like the real app, not a
// separate isolated page.
export default async function BlogsUnifiedPage() {
  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

  return <HomeClient notes={notes} featured={featured} forceOpenApp="blogs" />
}
