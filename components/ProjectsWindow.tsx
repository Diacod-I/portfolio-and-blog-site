'use client'

// Win98-Explorer-flavored project gallery: a searchable grid of cards, one
// per project, each with a thumbnail (or a fallback folder icon), tags, and
// Live/Code links. Data lives in data/projects.ts — see that file for how to
// add a new project.
//
// The grid uses CSS `auto-fill`/`minmax` instead of a ResizeObserver +
// breakpoint state (like ExplorerBlogList's `compact` mode) — auto-fill
// already responds to the actual container width, which is exactly what's
// needed here since this window can be resized independently of the
// viewport, and a plain CSS solution is one less thing that can regress.

import { useMemo, useState } from 'react'
import Image from 'next/image'
import projects from '@/data/projects'

export default function ProjectsWindow() {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#c0c0c0] border-b-2 border-[#808080] px-2 py-1 flex-shrink-0">
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

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#666666] p-3">
        {projects.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white text-sm italic p-4 text-center">
              Advith hasn&apos;t published any projects here yet — check back soon :)
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-white text-sm p-4 italic">No projects match &quot;{query}&quot;.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {visible.map((p) => (
              <div
                key={p.id}
                className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex flex-col overflow-hidden"
              >
                <div className="relative w-full aspect-[16/9] shrink-0 bg-[#222222] border-b-2 border-[#808080]">
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt=""
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image src="/win98/folder.webp" alt="" width={40} height={40} className="w-10 h-10" />
                    </div>
                  )}
                  {p.featured && (
                    <span className="absolute top-1.5 right-1.5 bg-yellow-300 border border-black px-1 text-[10px] font-extrabold rounded text-black">
                      FEATURED
                    </span>
                  )}
                  {p.wip && (
                    <span className="absolute top-1.5 left-1.5 bg-orange-400 border border-black px-1 text-[10px] font-extrabold rounded text-black">
                      WIP
                    </span>
                  )}
                </div>

                <div className="p-2 flex flex-col gap-1.5 flex-1 min-h-0">
                  <span className="font-bold text-black text-sm break-words">{p.title}</span>
                  <span className="text-xs text-[#333333] line-clamp-3">{p.description}</span>

                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="bg-white border border-black/40 px-1 py-0.5 text-[10px] font-bold rounded text-black"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {(p.liveUrl || p.repoUrl) && (
                    <div className="flex gap-1.5 mt-auto pt-1.5">
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Live site"
                          title="Live site"
                          className="win98-button w-8 h-8 flex items-center justify-center"
                        >
                          <Image src="/win98/internet.webp" width={16} height={16} alt="" className="w-4 h-4" />
                        </a>
                      )}
                      {p.repoUrl && (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Source code"
                          title="Source code"
                          className="win98-button w-8 h-8 flex items-center justify-center"
                        >
                          <Image src="/internet_shortcuts/github.webp" width={16} height={16} alt="" className="w-4 h-4" />
                        </a>
                      )}
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
          {query.trim() ? ` (filtered from ${projects.length})` : ''}
        </span>
      </div>
    </div>
  )
}
