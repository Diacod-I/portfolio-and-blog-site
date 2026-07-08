'use client'

// Win98 Explorer-style blog list: toolbar with working search, address bar,
// sortable column headers, document rows, and a status bar.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { Note } from '@/lib/notes'

type SortKey = 'date' | 'title'

type ExplorerBlogListProps = {
  notes: Note[]
}

const isNew = (date: string) =>
  new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

export default function ExplorerBlogList({ notes }: ExplorerBlogListProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            (n.excerpt ?? '').toLowerCase().includes(q)
        )
      : notes
    return [...filtered].sort((a, b) => {
      const cmp =
        sortKey === 'date'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : a.title.localeCompare(b.title)
      return sortAsc ? cmp : -cmp
    })
  }, [notes, query, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(key === 'title') // titles default A→Z, dates default newest first
    }
  }

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1">
        <label htmlFor="blog-search" className="text-black font-bold text-sm">
          🔍 Search:
        </label>
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a post..."
          className="win98-inset bg-white text-black px-2 py-1 text-sm flex-1 min-w-[140px] max-w-xs"
        />
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[1fr_130px_130px] bg-[#c0c0c0]">
        <button
          onClick={() => toggleSort('title')}
          className="win98-button px-2 py-1 text-left text-black font-bold text-sm"
        >
          Name{sortArrow('title')}
        </button>
        <button
          onClick={() => toggleSort('date')}
          className="win98-button px-2 py-1 text-left text-black font-bold text-sm"
        >
          Date{sortArrow('date')}
        </button>
        <div className="win98-button px-2 py-1 text-left text-black font-bold text-sm pointer-events-none">
          Time to read
        </div>
      </div>

      {/* Rows: flex-1 so the white file area fills the window height */}
      <div className="bg-[#666666] flex-1 min-h-[200px] overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-white text-sm p-4 italic">
            {notes.length === 0
              ? 'Advith is still writing his first post :P (Dude is lazy af)'
              : `No items match "${query}".`}
          </p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {visible.map((note) => (
              <li key={note.slug}>
                <Link
                  href={`/blogs/${note.slug}`}
                  className="grid bg-zinc-700 sm:grid-cols-[1fr_130px_110px] items-center px-2 py-2 no-underline text-black hover:bg-[#000080] hover:text-white group border-b border-[#e5e5e5]"
                >
                  <span className="flex items-center gap-3 min-w-0 pr-6">
                    {note.thumbnail ? (
                      <Image
                        src={note.thumbnail}
                        alt=""
                        width={120}
                        height={68}
                        className="w-[120px] h-[68px] object-cover shrink-0 border-2 border-[#808080]"
                      />
                    ) : (
                      <Image
                        src="/win98/notes.webp"
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 shrink-0"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="font-bold flex items-center gap-2">
                        <span className="truncate text-white">{note.title}</span>
                        {isNew(note.date) && (
                          <span className="bg-yellow-300 border border-black px-1 text-[10px] font-extrabold rounded text-black shrink-0">
                            NEW
                          </span>
                        )}
                      </span>
                      {note.excerpt && (
                        <span className="block text-xs text-gray-300 group-hover:text-gray-200 truncate">
                          {note.excerpt}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="hidden sm:block text-sm text-gray-300">
                    {format(new Date(note.date), 'MMM dd, yyyy')}
                  </span>
                  <span className="hidden sm:block text-sm text-gray-300">
                    {note.readingTimeMinutes} min
                  </span>
                  {/* Mobile: date + read time inline under the title */}
                  <span className="sm:hidden text-xs text-gray-600 group-hover:text-gray-200 mt-1">
                    {format(new Date(note.date), 'MMM dd, yyyy')} · {note.readingTimeMinutes} min read
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-[#c0c0c0] border-t-2 border-[#dfdfdf] px-2 py-0.5 text-black text-xs">
        <span>
          {visible.length} blog post{visible.length === 1 ? '' : 's'}
          {query.trim() ? ` (filtered from ${notes.length})` : ''}
        </span>
      </div>
    </div>
  )
}
