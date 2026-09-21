// components/TestimonialsSection.tsx
//
// LinkedIn testimonials/endorsements for advith.exe's About tab —
// mirrors ExperienceSection.tsx/EducationSection.tsx's own nested
// win98-window card (same titlebar + dark body treatment) rather than a
// new style, since it's the same "scannable list inside a dossier
// sub-window" pattern, just quotes instead of dated entries. Rendered in
// HomeClient.tsx's new Testimonials row (text column on the left, a
// second sticky photo on the right — see that file's own comment on
// why this row is ordered opposite the bio/Experience row above it).
// Data lives in data/testimonials.ts — see that file for how to actually
// get real LinkedIn recommendation text (and recommender avatars) in
// here.
import Image from 'next/image'
import testimonials from '@/data/testimonials'

// Same badge treatment ExperienceSection/EducationSection use for
// company/institution logos (square, rounded-md, black border) — reused
// here for recommender avatars instead of introducing a separate circular
// "person photo" convention just for this one section. Every entry gets a
// badge, real photo or not — see the dashed-border fallback below, same
// "always show where a photo will go" idea as the big sticky placeholder
// photo in HomeClient.tsx, rather than silently omitting the badge until
// a real avatar exists.
const AVATAR_SIZE = 32
const AVATAR_BADGE_CLASS =
  'relative shrink-0 w-8 h-8 rounded-md border-2 border-black overflow-hidden bg-white'

export default function TestimonialsSection() {
  return (
    <div className="win98-window flex flex-col mt-4">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Testimonials &amp; Endorsements</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2">
        <ul className="flex flex-col gap-3">
          {testimonials.map((t, i) => (
            <li
              key={t.id}
              className={`flex flex-col gap-1 ${i < testimonials.length - 1 ? 'border-b border-white/10 pb-3' : ''}`}
            >
              {/* <figure>/<figcaption> is the semantically correct wrapper
                  for a quotation + its attribution (rather than a bare
                  <figcaption> outside any <figure>). The oversized quote
                  mark is purely decorative — same "decorative but not
                  load-bearing" role as PixelHeart elsewhere — so it's
                  aria-hidden and the actual quote text below carries the
                  full content for screen readers on its own. */}
              <figure className="flex flex-col gap-1 m-0">
                <span className="text-[#555] text-3xl leading-none font-serif select-none" aria-hidden="true">
                  &ldquo;
                </span>
                {/* whitespace-pre-line turns any '\n' in the pasted
                    recommendation text into an actual line break (React
                    renders a string's newlines as literal characters, and
                    the default `white-space: normal` collapses them) —
                    without it, a multi-paragraph LinkedIn recommendation
                    would render as one run-on paragraph. */}
                <blockquote className="text-[#ccc] text-sm leading-relaxed text-justify -mt-3 mb-1 m-0 whitespace-pre-line">
                  {t.quote}
                </blockquote>
                <figcaption className="flex items-center gap-2 text-xs">
                  {t.avatar ? (
                    <div className={AVATAR_BADGE_CLASS}>
                      {/* w-full h-full is the actual fix for the white
                          sliver at the bottom of these badges — Tailwind's
                          preflight sets a global `img { height: auto }`,
                          which overrides the height={32} HTML attribute
                          below and lets the browser size the <img> itself
                          to whatever height matches the photo's own aspect
                          ratio (e.g. ~29px for a 196x180 source), rather
                          than the full 32px badge. That left a few px of
                          this div's own bg-white showing under a
                          short image — nothing to do with cropping.
                          w-full/h-full (utilities layer) beat the preflight
                          rule and force the <img> to actually fill the
                          badge; object-cover + object-top then crop *within*
                          that correctly-sized box, anchored to the top so a
                          headshot's face stays in frame instead of a center
                          crop clipping it. */}
                      <Image
                        src={t.avatar}
                        alt={`${t.author}'s LinkedIn photo`}
                        width={AVATAR_SIZE}
                        height={AVATAR_SIZE}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    // Same "always show where a photo will go" placeholder
                    // treatment as the big sticky photo box in HomeClient.tsx
                    // (dashed border, no img) — rather than omitting the
                    // badge entirely until a real avatar exists.
                    <div
                      className={`${AVATAR_BADGE_CLASS} border-dashed !border-[#808080] !bg-[#c0c0c0]`}
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    <span className="font-bold text-white">
                      {t.linkedinUrl ? (
                        <a href={t.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {t.author}
                        </a>
                      ) : (
                        t.author
                      )}
                    </span>
                    <br/>
                    <span className="text-[#888]">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
