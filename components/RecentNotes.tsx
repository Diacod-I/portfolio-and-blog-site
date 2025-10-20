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

export default function RecentNotes() {
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

  return (
    <div className="grid border-2 overflow-y-auto max-h-[235px]">
      {notes.map((note) => (
        <Link
          key={note.slug}
          href={`/blogs/${note.slug}`}
          className="win98-button p-2 flex flex-col gap-1 no-underline text-black font-bold"
        >
          <div className="flex items-center gap-2">
            <img src="/win98/notes.webp" alt="" className="w-5 h-5" />
            <div className="text-md">{note.title}</div>
          </div>
          {note.excerpt && (
            <div className="text-xs text-[#444]">{note.excerpt}</div>
          )}
          <div className="text-sm text-[#232323]">
            {format(new Date(note.date), 'MMM dd, yyyy')}
          </div>
        </Link>
      ))}
    </div>
  )
}
