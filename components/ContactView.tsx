// Contact tab content for the advith.exe window (see HomeClient's homeTab
// state). No outer window chrome — that comes from Win98Window/Navbar.
// Mostly presentational (mailto link + social links); the Internet
// Shortcuts card needs `featured`, passed down from HomeClient (moved here
// from the Home tab, which was getting cluttered).

import FeaturedLinks from '@/components/FeaturedLinks'
import ScrollPanel from '@/components/ScrollPanel'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

const CONTACT_EMAIL = 'advithkrishnan@gmail.com'

type ContactViewProps = {
  featured: FeaturedLink[]
}

export default function ContactView({ featured }: ContactViewProps) {
  return (
    <div className="max-w-3xl mx-auto text-white select-text">
      <h1 className="text-2xl font-bold mb-6 text-center">Get in Touch with me!</h1>
      <p>
        Have a question or want to work together?
        <br />
        <br />
        Kindly email me and check out my Internet Shortcuts below. I&apos;ll respond as soon as possible.
      </p>

      <div className="mt-8 space-y-2">
        <p className="flex items-center gap-2">
          <strong>Email:</strong>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>

      {/* Internet Shortcuts — moved here from the Home tab, which was
          getting cluttered with the photo, bio copy, and this all at once. */}
      <div className="win98-window flex flex-col mt-8">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/internet.webp" alt="Internet" className="w-4 h-4" />
            <span>Internet Shortcuts</span>
          </div>
        </div>
        <div className="bg-[#f0f0f0] border-2 p-2">
          <p className="font-bold mb-1 text-sm text-black">
            &gt; My online presence! (Still not famous tho)
          </p>
          <ScrollPanel maxHeight={280} className="border-2" nudgeId="featured-links">
            <FeaturedLinks links={featured} />
          </ScrollPanel>
        </div>
      </div>
    </div>
  )
}
