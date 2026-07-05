import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'
import Image from 'next/image'

// Pure presentational component: links arrive as props from the server,
// subscription is handled by Substack (external link), no client state needed.

type FeaturedLinksProps = {
  links: FeaturedLink[]
}

export default function FeaturedLinks({ links }: FeaturedLinksProps) {
  return (
    <div className="grid">
      {links.map((link) => {
        const isInternal = link.url.startsWith('/')

        return (
          <a
            key={link.url}
            href={link.url}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
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
  )
}
