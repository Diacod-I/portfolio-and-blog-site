// components/ExperienceSection.tsx
//
// Compact work-history timeline for advith.exe's About tab — the same
// nested win98-window pattern ContactView uses for its Internet Shortcuts
// card, so About gets a second self-contained content block instead of
// ending abruptly after the bio (that abrupt ending is what left a big
// empty void once the window was stretched taller than the bio text).
// Data lives in data/experience.ts; the Resume tab's PDF still has the
// full detail (bullet points per role) — this is a scannable summary.

import experience from '@/data/experience'

export default function ExperienceSection() {
  return (
    <div className="win98-window flex flex-col mt-8">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <img src="/win98/folder-full.png" alt="" className="w-4 h-4" />
          <span>Experience</span>
        </div>
      </div>
      <div className="bg-[#f0f0f0] border-2 p-2">
        <ul className="flex flex-col gap-2">
          {experience.map((e, i) => (
            <li key={e.id} className={i < experience.length - 1 ? 'border-b border-black/10 pb-2' : ''}>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="font-bold text-black text-sm">{e.role}</span>
                <span className="text-[11px] text-[#555] font-semibold whitespace-nowrap">{e.dates}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-black text-xs">{e.company}</span>
                <span className="text-[11px] text-[#777]">{e.location}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
