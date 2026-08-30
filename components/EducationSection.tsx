// components/EducationSection.tsx
//
// Compact education timeline for advith.exe's About tab — deliberately
// mirrors ExperienceSection.tsx's look exactly (same nested win98-window
// card, same badge/border/rounded-corner treatment for logos, same
// two-line-per-entry layout) rather than inventing a new style, since
// this is the same kind of content (a dated affiliation with a place) just
// for degrees instead of jobs. Rendered directly below ExperienceSection
// in HomeClient.tsx's dossier column. Data lives in data/education.ts; the
// downloadable resume PDF (navbar's Resume button) has the full detail
// (CGPA, relevant coursework) this scannable summary leaves out.
import Image from 'next/image'
import education from '@/data/education'

const LOGO_SIZE = 36
const LOGO_BADGE_CLASS =
  'relative shrink-0 w-9 h-9 rounded-md border-2 border-black overflow-hidden flex items-center justify-center'

export default function EducationSection() {
  return (
    <div className="win98-window flex flex-col mt-4">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Education</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2">
        <ul className="flex flex-col gap-2">
          {education.map((e, i) => (
            <li
              key={e.id}
              className={`flex items-start gap-2 ${i < education.length - 1 ? 'border-b border-white/10 pb-2' : ''}`}
            >
              {e.logo && (
                <div className={`${LOGO_BADGE_CLASS} ${e.logoDark ? 'bg-black' : 'bg-white'}`}>
                  <Image
                    src={e.logo}
                    alt={`${e.institution} logo`}
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    className="object-contain p-1"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between flex-wrap">
                  <span className="font-bold text-white text-sm">{e.degree}</span>
                  <span className="text-[11px] text-[#777] font-semibold whitespace-nowrap">{e.dates}</span>
                </div>
                <div className="flex items-baseline justify-between flex-wrap">
                  <span className="text-[#aaaaaa] text-xs">{e.institution}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
