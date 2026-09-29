// data/worldMap.ts
// Backing constant for components/WorldMap.tsx. The map's actual geometry
// used to live here too — first as a hand-projected SVG path per country,
// then as a hand-merged GeoJSON FeatureCollection (data/countries.geo.json,
// since removed) — but both were geometry I assembled myself from
// independently-fetched per-country data, and both read as visibly broken.
// The map now points react-simple-maps at world-atlas's countries-110m.json,
// a pre-built TopoJSON dataset fetched directly by the library at runtime
// (see the comment atop WorldMap.tsx for why plain merged GeoJSON breaks
// where proper TopoJSON doesn't), so there's no geometry file living in this
// repo at all anymore.
//
// This file now only holds the two things still worth sharing: the accent
// color India renders filled with, kept as its own named export so
// WorldMap.tsx and GithubContributionGraph.tsx's heatmap (LEVEL_COLORS[3])
// can't quietly drift apart if that palette ever changes — and the color
// plus country list for REMOTE_COUNTRIES below.
//
// Important: every one of these is a country worked WITH remotely — teams,
// collaborators, or mentorship (e.g. LFX) based there — NOT a place
// physically lived or worked from. India (INDIA_FILL, above) is the one
// and only physical base throughout. WorldMap.tsx's legend/aria-label
// wording reflects this distinction on purpose; don't relabel this back to
// something implying relocation.
export const INDIA_FILL = '#0ea5e9'
export const REMOTE_FILL = '#22c55e'

// Matched against world-atlas's countries-110m.json in WorldMap.tsx by
// BOTH `geo.properties.name` and `geo.id` (numeric ISO 3166-1) — name
// strings in Natural-Earth-derived datasets are usually the common English
// name, but matching id too is a safety net in case a future world-atlas
// version renames a feature. `centroid` ([lon, lat], approximate geographic
// center) positions that country's label callout the same way
// INDIA_CENTROID does in WorldMap.tsx.
// `labelDy` (optional, defaults to 26 in WorldMap.tsx) is how far above the
// centroid that country's leader line + tag box floats — plain per-country
// tuning knob for when a label needs to sit further from its dot than the
// default (e.g. to clear a crowded spot on the map), independent of every
// other country's own label.
//
// `dotRadius` (optional, defaults to 2 in WorldMap.tsx) is the radius of
// the small filled circle WorldMap.tsx already draws at every remote
// country's centroid as part of its label callout. For a country whose
// actual landmass renders large enough at this map's scale (USA,
// Switzerland), that dot is just a location pointer — the real "fill" is
// the country's own filled polygon. Singapore has no polygon at all in the
// 110m dataset this map deliberately uses (see WorldMap.tsx's own comment
// on 110m vs. 50m) and would be a sub-pixel sliver even if it did — so its
// dotRadius is bumped up to actually read as a visible filled green mark,
// standing in for the country-shape fill the other two get for free.
export const REMOTE_COUNTRIES = [
  { name: 'United States of America', id: '840', label: 'USA', centroid: [-98.5795, 39.8283] as [number, number], labelDy: 40 },
  { name: 'Switzerland', id: '756', label: 'SWITZERLAND', centroid: [8.2275, 46.8182] as [number, number] },
  { name: 'Singapore', id: '702', label: 'SINGAPORE', centroid: [103.8198, 1.3521] as [number, number], dotRadius: 5 },
  { name: 'United Kingdom', id: '826', label: 'UK', centroid: [-2.0, 54.0] as [number, number], labelDy: 34 },
]
