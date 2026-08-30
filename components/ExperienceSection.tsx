// components/ExperienceSection.tsx
//
// Compact work-history timeline for advith.exe's About tab — the same
// nested win98-window pattern ContactView uses for its Internet Shortcuts
// card, so About gets a second self-contained content block instead of
// ending abruptly after the bio (that abrupt ending is what left a big
// empty void once the window was stretched taller than the bio text).
// Data lives in data/experience.ts; the downloadable resume PDF (navbar's
// Resume button) still has the full detail (bullet points per role) —
// this is a scannable summary.
//
// Each entry gets a small square "badge" to its left (see LOGO_SIZE)
// holding that company's logo — sourced from each org's own site/brand
// page, not hand-drawn, so they're real logos rather than approximations.
// Every badge shares the same border/corner treatment (LOGO_BADGE_CLASS)
// regardless of what the underlying logo asset actually looks like — a
// black border, slightly rounded corners, and object-contain padding —
// so a photographic-looking wordmark (Infosys) and a simple pictorial
// mark (NASA's meatball) still read as one consistent row of badges
// instead of a mismatched grab-bag of raw logo files. Background is the
// one exception that varies per entry (see logoDark on ExperienceEntry):
// most logo assets are already legible on a light background, but a
// white-on-transparent asset needs a dark badge fill instead or the mark
// disappears. Entries without a sourced `logo` just render without a
// badge (flex layout below simply gives that row's text its full width).
// logoTight (see ExperienceEntry) trims that inner padding further for a
// logo that still reads small at the standard padding.
import Image from 'next/image'
import experience from '@/data/experience'

const LOGO_SIZE = 36
const LOGO_BADGE_CLASS =
  'relative shrink-0 w-9 h-9 rounded-md border-2 border-black overflow-hidden flex items-center justify-center'

export default function ExperienceSection() {
  return (
    <div className="win98-window flex flex-col mt-4">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Experience</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2">
        <ul className="flex flex-col gap-2">
          {experience.map((e, i) => (
            <li
              key={e.id}
              className={`flex items-start gap-2 ${i < experience.length - 1 ? 'border-b border-white/10 pb-2' : ''}`}
            >
              {e.logo && (
                <div className={`${LOGO_BADGE_CLASS} ${e.logoDark ? 'bg-black' : 'bg-white'}`}>
                  <Image
                    src={e.logo}
                    alt={`${e.company} logo`}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    className={`object-contain ${e.logoTight ? 'p-0.5' : 'p-1'}`}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">{e.role}</span>
                  <span className="text-[11px] text-[#777] font-semibold whitespace-nowrap">{e.dates}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[#aaaaaa] text-xs">{e.company}</span>
                  <span className="text-[11px] text-[#999]">{e.location}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
