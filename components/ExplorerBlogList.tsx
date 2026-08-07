'use client'

// Win98 Explorer-style blog list: toolbar with working search, address bar,
// sortable column headers, document rows, and a status bar.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { Note } from '@/lib/notes'
import { TAGS, TAG_STYLES, TAG_DESCRIPTIONS, type Tag } from '@/lib/tags'
import TagBadge from '@/components/TagBadge'
import MarqueeText from '@/components/MarqueeText'

type SortKey = 'date' | 'title'

type ExplorerBlogListProps = {
  notes: Note[]
}

const isNew = (date: string) =>
  new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

// Below this container width, the fixed 130px Date + 110px Time columns
// plus the 120px thumbnail don't leave enough room for a title — switch to
// a stacked single-column layout instead.
const COMPACT_BREAKPOINT = 480

// Its own component (rather than inlined in the .map below) so each row can
// hold its own `hovered` state — MarqueeText needs an explicit boolean
// rather than a CSS `group-hover` pseudo-class so it can use a fast snap-back
// on hover-out instead of mirroring the (often much slower) reveal speed.
function BlogRow({ note, compact }: { note: Note; compact: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <li>
      <Link
        href={`/blogs/${note.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`grid items-start px-2 py-2 no-underline text-black hover:bg-[#000080] hover:text-white group border-b border-[#e5e5e5] ${
          compact ? 'bg-zinc-700 grid-cols-1' : 'bg-zinc-700 grid-cols-[1fr_130px_110px]'
        }`}
      >
        <span className="flex items-start gap-3 min-w-0 pr-6">
          {note.thumbnail ? (
            <Image
              src={note.thumbnail}
              alt=""
              width={120}
              height={68}
              className="w-[120px] h-[68px] object-cover shrink-0 border-2 border-[#808080]"
            />
          ) : (
            <span className="w-[120px] h-[68px] flex items-center justify-center shrink-0 border-2 border-[#808080] bg-[#1f1f1f]">
              <Image
                src="/win98/notes.webp"
                alt=""
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </span>
          )}
          <span className="min-w-0 flex-1">
            {/* Billboard-on-hover: title stays clipped to one line at rest,
                and scrolls left on hover to reveal whatever the ellipsis
                cut off (see MarqueeText), snapping back on hover-out. */}
            <MarqueeText text={note.title} hovered={hovered} className="font-bold text-white" />
            {note.excerpt && (
              <span className="block text-xs text-gray-300 group-hover:text-gray-200 truncate mt-1">
                {note.excerpt}
              </span>
            )}
            <span className="flex items-center flex-wrap gap-2 mt-1">
              <TagBadge tag={note.tag} />
              {isNew(note.date) && (
                <span className="bg-yellow-300 border border-black px-1 text-[10px] font-extrabold rounded text-black shrink-0">
                  NEW
                </span>
              )}
            </span>
            {/* Compact layout: date + read time inline under the title,
                instead of separate grid columns that no longer fit. */}
            {compact && (
              <span className="block text-xs text-gray-400 group-hover:text-gray-200 mt-1">
                {format(new Date(note.date), 'MMM dd, yyyy')} · {note.readingTimeMinutes} min read
              </span>
            )}
          </span>
        </span>
        {!compact && (
          <>
            <span className="text-sm text-gray-300 truncate">
              {format(new Date(note.date), 'MMM dd, yyyy')}
            </span>
            <span className="text-sm text-gray-300 truncate">
              {note.readingTimeMinutes} min
            </span>
          </>
        )}
      </Link>
    </li>
  )
}

export default function ExplorerBlogList({ notes }: ExplorerBlogListProps) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<Tag | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)

  // This list lives inside a resizable Win98Window (see Win98Window.tsx) —
  // its container can be made much narrower than any real mobile viewport
  // while the browser window itself stays wide. A Tailwind `sm:` breakpoint
  // responds to the *viewport*, not this container, so it would never kick
  // in here. Measure the actual rendered width instead and switch layouts
  // off of that.
  const containerRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < COMPACT_BREAKPOINT)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = notes.filter((n) => {
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.excerpt ?? '').toLowerCase().includes(q)
      const matchesTag = !activeTag || n.tag === activeTag
      return matchesQuery && matchesTag
    })
    return [...filtered].sort((a, b) => {
      const cmp =
        sortKey === 'date'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : a.title.localeCompare(b.title)
      return sortAsc ? cmp : -cmp
    })
  }, [notes, query, activeTag, sortKey, sortAsc])

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
    <div ref={containerRef} className="flex flex-col flex-1 min-h-0">
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

      {/* Tag filter chips — one active tag at a time, click again to clear. */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1.5">
        <span className="text-black font-bold text-xs mr-0.5">Tag:</span>
        <button
          onClick={() => setActiveTag(null)}
          className={`border border-black px-1.5 py-0.5 text-[10px] font-extrabold rounded ${
            activeTag === null ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          All
        </button>
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
            className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded ${TAG_STYLES[t]} ${
              activeTag === t ? 'border-2 border-black' : 'border border-black/40'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Description for the selected tag — nothing rendered (not even an
          empty div) when no tag is active, so it doesn't leave a blank bar. */}
      {activeTag && (
        <div className="bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1 text-black font-semibold text-xs">
          {TAG_DESCRIPTIONS[activeTag]}
        </div>
      )}

      {/* Column headers (grid layout only) */}
      {!compact && (
        <div className="grid grid-cols-[1fr_130px_130px] bg-[#c0c0c0]">
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
          <div className="win98-button px-1 py-1 text-left text-black font-bold text-sm pointer-events-none">
            Time to read
          </div>
        </div>
      )}

      {/* Rows: flex-1 so the white file area fills the window height. No
          artificial min-height here — a short window should shrink this
          (it already scrolls internally), not push the status bar below
          the window's own frame. */}
      <div className="bg-[#666666] flex-1 min-h-0 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-white text-sm p-4 italic">
            {notes.length === 0
              ? 'Advith is still writing his first post :P (Dude is lazy af)'
              : query.trim()
                ? `No items match "${query}".`
                : `No posts tagged "${activeTag}".`}
          </p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {visible.map((note) => (
              <BlogRow key={note.slug} note={note} compact={compact} />
            ))}
          </ul>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-[#c0c0c0] border-t-2 border-[#dfdfdf] px-2 py-0.5 text-black text-xs flex-shrink-0">
        <span>
          {visible.length} blog post{visible.length === 1 ? '' : 's'}
          {query.trim() || activeTag ? ` (filtered from ${notes.length})` : ''}
        </span>
      </div>
    </div>
  )
}
