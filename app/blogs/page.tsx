import { Metadata } from 'next'
import BlogsExplorerShell from '@/components/BlogsExplorerShell'
import { getAllNotes } from '@/lib/notes'

export const metadata: Metadata = {
  title: 'All Blog Posts | Advith Krishnan',
  description: "Browse all of Advith Krishnan's blog posts in one place.",
  alternates: {
    canonical: 'https://www.advithkrishnan.com/blogs',
  },
}

// Server component: note list is read from the repo at build time.
// Window chrome + toast interplay live in BlogsExplorerShell (client).
export default async function BlogsUnifiedPage() {
  const notes = await getAllNotes()

  return <BlogsExplorerShell notes={notes} />
}
