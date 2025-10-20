'use client'

import useSWR from 'swr'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function FeaturedLinks() {
  const { data: links, error } = useSWR<FeaturedLink[]>('/api/featured', fetcher)

  if (error) {
    return <div className="text-sm">Error loading links. Please try again later.</div>
  }

  if (!links) {
    return <div className="win98-window items-center flex gap-4 p-2">
      <div className="animate-spin border-4 border-[#000080] border-t-transparent rounded-full w-8 h-8"></div>
      <span>Loading shortcuts...</span>
    </div>
  }

  return (
    <div className="grid">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="win98-button p-2 flex items-center gap-2 no-underline text-black"
        >
          <img 
            src={!link.icon_path || link.icon_path === "/" ? "/win98/internet.webp" : link.icon_path}
            alt="" 
            className="w-8 h-8 mr-2"
          />
          <div>
            <div className="font-bold">{link.title}</div>
            {link.description && (
              <div className="text-xs text-[#444] font-bold">{link.description}</div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
