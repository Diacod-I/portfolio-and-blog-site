// Contact tab content for the advith.exe window (see HomeClient's homeTab
// state). No outer window chrome — that comes from Win98Window/Navbar.
// Mostly presentational (mailto link + social links); the Internet
// Shortcuts card needs `featured`, passed down from HomeClient (moved here
// from the Home tab, which was getting cluttered).

import FeaturedLinks from '@/components/FeaturedLinks'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

const CONTACT_EMAIL = 'advithkrishnan@gmail.com'

type ContactViewProps = {
  featured: FeaturedLink[]
}

export default function ContactView({ featured }: ContactViewProps) {
  return (
    <div className="max-w-3xl mx-auto text-white select-text">
      <h1 className="text-3xl font-bold">Get in Touch with me!</h1>
      <p className="mt-2 text-[#ccc]">
        Have a question or want to work together?<br/>
        Kindly email me at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
          {CONTACT_EMAIL}
        </a>
        . I&apos;ll respond as soon as possible.
      </p>
      {/* Internet Shortcuts — moved here from the Home tab, which was
          getting cluttered with the photo, bio copy, and this all at once. */}
      <div className="win98-window flex flex-col mt-4">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/internet.webp" alt="Internet" className="w-4 h-4" />
            <span>Internet Shortcuts</span>
          </div>
        </div>
        {/* Dark panel (bg-[#2b2b2b], white label) matching
            ContributorArchive's Contribution Archive panel — same content-
            panel treatment site-wide instead of this one being the lone
            light-colored holdout. FeaturedLinks' own win98-button chips
            stay their normal light win98 gray on top of it, same as
            ContributorArchive's report rows on its dark panel. */}
        <div className="bg-[#2b2b2b] border-2 p-2">
          <p className="mb-2 text-sm text-white">
            &gt; My online presence! (Still not famous tho)
          </p>
          {/* No ScrollPanel here (unlike ContributorArchive's own list) —
              a nested scroll region inside an already-scrollable Contact
              tab reads as confusing ("which one am I scrolling?"). The
              full shortcut list just renders in place; the outer tab
              wrapper (see HomeClient's min-h-full scroll-fix pattern)
              handles overflow if the window is short. */}
          <div className="border-2 gap-2">
            <FeaturedLinks links={featured} />
          </div>
        </div>
      </div>
    </div>
  )
}
