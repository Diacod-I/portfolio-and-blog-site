'use client'

// Small decorative world map for advith.exe's Home tab, sitting right after
// the Experience section in the dossier column (see HomeClient.tsx) —
// continents as thin outline-only shapes against the dark background, India
// alone filled solid in the same blue GithubContributionGraph.tsx's heatmap
// uses. See data/worldMap.ts's file header for what this data actually is
// (a hand-drawn stylized approximation, not real GIS boundary data — that
// was the plan, but every fetch attempt beyond one partial/truncated one
// either came back incomplete or timed out outright).
import { CONTINENT_PATHS, INDIA_FILL, INDIA_PATH, WORLD_MAP_VIEWBOX } from '@/data/worldMap'

export default function WorldMap() {
  return (
    // Same nested win98-window pattern ExperienceSection.tsx and
    // ContactView's Internet Shortcuts card use — titlebar + a dark content
    // panel — rather than a bare bordered box, so this reads as another
    // self-contained block in the same dossier column instead of a
    // one-off styling choice.
    <div className="win98-window flex flex-col mt-8">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Location</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2">
        <svg
          viewBox={WORLD_MAP_VIEWBOX}
          // Not aria-hidden — decorative, but the actual information ("based
          // in India") is redundant with this label, so it's fine as a
          // straightforward img role rather than needing to be hidden.
          role="img"
          aria-label="A stylized world map with India highlighted"
          className="w-full h-auto"
        >
          {CONTINENT_PATHS.map((c) => (
            <path key={c.id} d={c.d} fill="none" stroke="#6b7280" strokeWidth={1.2} strokeLinejoin="round" />
          ))}
          <path d={INDIA_PATH} fill={INDIA_FILL} stroke={INDIA_FILL} strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}
