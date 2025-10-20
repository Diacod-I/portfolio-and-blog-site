'use client'

import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'
import { useEffect, useState } from 'react'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

export default function FeaturedLinks() {
  const [links, setLinks] = useState<FeaturedLink[]>([])

  useEffect(() => {
    getFeaturedLinks().then(setLinks)
  }, [])

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
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/win98/internet.webp";
            }}
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
