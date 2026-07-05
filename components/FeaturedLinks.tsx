'use client'

// Still a client component (SubscribeModal state), but data now arrives as
// props from the server — no fetching, no loading/error states.

import { useState } from 'react'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'
import SubscribeModal from './SubscribeModal'
import Image from 'next/image'

type FeaturedLinksProps = {
  links: FeaturedLink[]
}

export default function FeaturedLinks({ links }: FeaturedLinksProps) {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false)

  function handleLinkClick(e: React.MouseEvent, link: FeaturedLink) {
    if (link.url === '/subscribe') {
      e.preventDefault()
      setIsSubscribeModalOpen(true)
    }
  }

  return (
    <>
      <div className="grid">
        {links.map((link) => {
          const isSubscribeLink = link.url === '/subscribe'
          const isInternal = link.url.startsWith('/')

          return (
            <a
              key={link.url}
              href={link.url}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
              onClick={(e) => handleLinkClick(e, link)}
              className="win98-button p-2 flex items-center gap-2 no-underline text-black"
            >
              <Image
                src={!link.icon_path || link.icon_path === "/" ? "/win98/internet.webp" : link.icon_path}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 mr-2"
              />
              <div>
                <div className="font-bold">{link.title}</div>
                {link.description && (
                  <div className="text-xs text-[#444] font-bold">{link.description}</div>
                )}
              </div>
            </a>
          )
        })}
      </div>

      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
      />
    </>
  )
}
