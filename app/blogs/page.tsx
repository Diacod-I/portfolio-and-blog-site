import Image from 'next/image'
import { Metadata } from 'next'
import RecentNotes from '@/components/RecentNotes'
import BlogsWindowControls from '@/components/BlogsWindowControls'
import { getAllNotes } from '@/lib/notes'

// TODO: Work on Search Feature for All Blogs

export const metadata: Metadata = {
  title: 'All Blog Posts | Advith Krishnan',
  description: "Browse all of Advith Krishnan's blog posts in one place.",
  alternates: {
    canonical: 'https://www.advithkrishnan.com/blogs',
  },
}

// Server component: note list is read from the repo at build time.
export default async function BlogsUnifiedPage() {
  const notes = await getAllNotes()

  return (
    <div
      className="h-screen p-4 pb-16 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="win98-window min-h-min max-h-full flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Image src="/win98/notepad.webp" alt="Blogs" width={32} height={32} className="w-4 h-4" />
            <span>All Blog Posts</span>
          </div>
          <BlogsWindowControls />
        </div>
        <div className="win98-window-content bg-[#222222] p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold mb-4 mt-12 text-white text-center tracking-tight drop-shadow">All Blog Posts</h1>
            <p className="mb-6 text-white text-md text-center opacity-80">
              Browse all my recent and older blog posts in one place. Click any post to read more.
            </p>
            <div className="py-0">
              <RecentNotes notes={notes} showAll={true} className="gap-y-3 p-2" />
            </div>
            <hr className="my-8 border-gray-500 opacity-60" />
            <p className="text-center mt-6 text-gray-400 italic">More coming soon....</p>
          </div>
        </div>
      </div>
    </div>
  )
}
