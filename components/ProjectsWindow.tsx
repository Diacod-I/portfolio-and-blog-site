'use client'

// Win98-Explorer-flavored project gallery: a searchable grid of cards, one
// per project, each with a thumbnail (or a fallback folder icon) and tags.
// GitHub/live links live behind a ⋮ menu button on the thumbnail's top-right
// corner rather than a row of icon buttons — see the menu below for why
// "live" is labeled "View Online" (has to cover a live site, a crates.io
// page, or a PyPI listing equally well). Data lives in data/projects.ts —
// see that file for how to add a new project.
//
// The grid uses CSS `auto-fill`/`minmax` instead of a ResizeObserver +
// breakpoint state (like ExplorerBlogList's `compact` mode) — auto-fill
// already responds to the actual container width, which is exactly what's
// needed here since this window can be resized independently of the
// viewport, and a plain CSS solution is one less thing that can regress.

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import projects from '@/data/projects'
import TagChip from '@/components/TagChip'
import { getTagColor } from '@/lib/tagColors'

// Blogs has a fixed, hand-authored tag set (see lib/tags.ts) small enough to
// show every tag at once. Project tags aren't curated like that — they're
// freeform per-project strings (see data/projects.ts), so the filter list
// grows on its own as projects are added. Past this many, collapse the rest
// behind a "More…" toggle instead of letting the row grow unbounded.
const TAG_PREVIEW_COUNT = 14

export default function ProjectsWindow() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showAllTags, setShowAllTags] = useState(false)
  // Which card's link menu (the ⋮ button on the thumbnail) is open, by
  // project id — at most one at a time. Closed by clicking anywhere outside
  // any menu, same as a real Win98 context menu.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.project-card-menu')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  // Derived from whatever's actually in data/projects.ts right now — same
  // normalization TagChip uses (trim, lowercase, drop a leading "#") so a
  // project's "Rust" and another's "#rust" collapse into one filter chip.
  const allTags = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t.trim().replace(/^#/, '').toLowerCase())))
    return Array.from(set).sort()
  }, [])

  const visibleTagList = showAllTags ? allTags : allTags.slice(0, TAG_PREVIEW_COUNT)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      const tags = (p.tags ?? []).map((t) => t.trim().replace(/^#/, '').toLowerCase())
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        tags.some((t) => t.includes(q))
      const matchesTag = !activeTag || tags.includes(activeTag)
      return matchesQuery && matchesTag
    })
  }, [query, activeTag])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar — same classes as ExplorerBlogList's search bar (blogs)
          so the two windows read as one consistent search control. */}
      <div className="flex flex-wrap items-center gap-2 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1">
        <label htmlFor="project-search" className="text-black font-bold text-sm">
          🔍 Search:
        </label>
        <input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a project..."
          className="win98-inset bg-white text-black px-2 py-1 text-sm flex-1 min-w-[140px] max-w-xs"
        />
      </div>

      {/* Tag filter chips — same "Tag:" row pattern as ExplorerBlogList,
          colored via the shared tagColors table (see TagChip) instead of
          blogs' fixed per-tag palette, since these tags aren't a hand-picked
          set. Collapses behind "More…" once there are more than
          TAG_PREVIEW_COUNT of them. */}
      {allTags.length > 0 && (
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
          {visibleTagList.map((t) => {
            const { bg, text } = getTagColor(t)
            return (
              <button
                key={t}
                onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
                style={{ backgroundColor: bg, color: text }}
                className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded ${
                  activeTag === t ? 'border-2 border-black' : 'border border-black/40'
                }`}
              >
                #{t}
              </button>
            )
          })}
          {allTags.length > TAG_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllTags((prev) => !prev)}
              className="border border-dashed border-black/60 px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-white text-black"
            >
              {showAllTags ? 'Less...' : `More... (${allTags.length - TAG_PREVIEW_COUNT})`}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#222222] p-3">
        {projects.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white text-sm italic p-4 text-center">
              Advith hasn&apos;t published any projects here yet — check back soon :)
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-white text-sm p-4 italic">
            {query.trim() && activeTag
              ? `No projects match "${query}" tagged #${activeTag}.`
              : query.trim()
                ? `No projects match "${query}".`
                : `No projects tagged #${activeTag}.`}
          </p>
        ) : (
          // Fixed 280px tracks, not minmax(220px,1fr) — `1fr` stretches to
          // fill leftover space in its track, which with only one or two
          // cards meant a card's size kept changing as the window resized
          // (capping it with max-width still let it shrink/grow between the
          // min and the cap). A constant track size means every card is
          // always exactly 280px, full stop — extra row width just becomes
          // empty space, same as icons in a real Explorer window.
          <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-3">
            {visible.map((p) => (
              <div
                key={p.id}
                className="w-[280px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex flex-col overflow-hidden"
              >
                <div
                  className={`relative w-full aspect-[16/9] shrink-0 border-b-2 border-[#808080] ${
                    p.thumbnail ? 'bg-[#222222]' : 'bg-[#008080]'
                  }`}
                >
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt=""
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  ) : (
                    // Classic Windows 98 desktop teal (#008080) behind the
                    // fallback folder icon, instead of plain dark gray — a
                    // project with no thumbnail now reads as "an icon sitting
                    // on the desktop" rather than an empty black box.
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image src="/win98/folder.webp" alt="" width={64} height={64} className="w-16 h-16" />
                    </div>
                  )}
                  {p.wip && (
                    <span className="absolute top-1.5 left-1.5 bg-orange-400 border border-black px-1 text-[10px] font-extrabold rounded text-black">
                      WIP
                    </span>
                  )}
                  {/* Featured moves to the bottom-left corner (instead of
                      stacking with the link menu, which always claims the
                      top-right — see below) so the two never collide. */}
                  {p.featured && (
                    <span className="absolute bottom-1.5 left-1.5 bg-yellow-300 border border-black px-1 text-[10px] font-extrabold rounded text-black">
                      FEATURED
                    </span>
                  )}

                  {/* Link menu: GitHub / live link, tucked behind a ⋮ button
                      on the thumbnail instead of a row of icon buttons in
                      the card body (see below for why — same links, just
                      relocated and labeled). */}
                  {(p.liveUrl || p.repoUrl) && (
                    <div className="project-card-menu absolute top-1.5 right-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId((cur) => (cur === p.id ? null : p.id))
                        }}
                        aria-label="Project links"
                        aria-expanded={openMenuId === p.id}
                        className="win98-button w-6 h-6 flex items-center justify-center text-black"
                      >
                        {/* Three explicit pixel-square dots instead of a
                            Unicode "●●●" glyph — the bullet character
                            renders as a fairly large, font/browser-dependent
                            blob even at a tiny font size, which is what made
                            this button look oversized and "broken". Fixed
                            2px squares give a crisp, consistent win98-style
                            indicator regardless of font metrics. */}
                        <span className="flex items-center gap-[3px]">
                          <span className="w-[3px] h-[3px] bg-black" />
                          <span className="w-[3px] h-[3px] bg-black" />
                          <span className="w-[3px] h-[3px] bg-black" />
                        </span>
                      </button>
                      {openMenuId === p.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[170px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] py-0.5">
                          {p.liveUrl && (
                            <a
                              href={p.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-black no-underline hover:bg-[#000080] hover:text-white"
                            >
                              <Image src="/win98/internet.webp" width={14} height={14} alt="" className="w-3.5 h-3.5 shrink-0" />
                              View Online
                            </a>
                          )}
                          {p.repoUrl && (
                            <a
                              href={p.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-black no-underline hover:bg-[#000080] hover:text-white"
                            >
                              <Image src="/internet_shortcuts/github.webp" width={14} height={14} alt="" className="w-3.5 h-3.5 shrink-0" />
                              GitHub
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2 flex flex-col gap-1.5 flex-1 min-h-0">
                  <span className="font-bold text-black text-sm break-words">{p.title}</span>
                  <span className="text-[10px] text-[#555555] font-semibold">
                    {format(new Date(p.date), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-xs text-[#333333] line-clamp-3">{p.description}</span>

                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1 mt-1">
                      {p.tags.map((t) => (
                        <TagChip key={t} tag={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-[#c0c0c0] border-t-2 border-[#dfdfdf] px-2 py-0.5 text-black text-xs flex-shrink-0">
        <span>
          {visible.length} project{visible.length === 1 ? '' : 's'}
          {query.trim() || activeTag ? ` (filtered from ${projects.length})` : ''}
        </span>
      </div>
    </div>
  )
}
