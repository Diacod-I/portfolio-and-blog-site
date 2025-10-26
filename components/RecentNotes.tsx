'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import useSWR from 'swr'

type Note = {
  title: string
  slug: string
  date: string
  excerpt?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RecentNotes({ showAll = false }: { showAll?: boolean }) {
  const { data: notes, error } = useSWR<Note[]>('/api/notes', fetcher)

  if (error) {
    return <div className="text-sm">Error loading blogs. Please try again later.</div>
  }

  if (!notes) {
    return <div className="win98-window items-center flex gap-4 p-2">
      <div className="animate-spin border-4 border-[#000080] border-t-transparent rounded-full w-8 h-8"></div>
      <span>Loading blogs...</span>
    </div>
  }

  if (notes.length === 0) {
    return <div className="text-sm">No recent blogs to show. Advith is writing them :)</div>
  }

  const notesToShow = showAll ? notes : notes.slice(0, 5)

  return (
    <div className="grid">
      {notesToShow.map((note) => (
        <Link
        key={note.slug}
        href={`/blogs/${note.slug}`}
        className="win98-button p-2 flex flex-col gap-1 no-underline text-black font-bold"
        >
          <div className="flex items-center gap-2">
            {new Date(note.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
              <span
                className="text-[#000] text-[10px] font-extrabold px-2 py-0.5 rounded animate-gradient-pulse"
                style={{
                  background: 'repeating-linear-gradient(90deg, #ffb6ec 0px, #ffecb6 40px, #b6ffec 80px, #b6ecff 120px, #ecb6ff 160px, #ffb6ec 200px)',
                  backgroundSize: '200px 100%',
                  backgroundPosition: '0 0'
                }}
              >New</span>
            ) : (
              <img src="/win98/notes.webp" alt="" className="w-5 h-5" />
            )}
            <div className="text-md flex items-center gap-1">
              {note.title}
            </div>
          </div>
          {note.excerpt && (
            <div className="text-xs text-[#444]">{note.excerpt}</div>
          )}
          <div className="text-sm text-[#232323] flex items-center gap-2">
            {format(new Date(note.date), 'MMM dd, yyyy')} 
          </div>
        </Link>
      ))}
    </div>
  )
}
