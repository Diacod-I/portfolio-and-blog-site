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
// This file now only holds the one thing still worth sharing: the accent
// color India renders filled with, kept as its own named export so
// WorldMap.tsx and GithubContributionGraph.tsx's heatmap (LEVEL_COLORS[3])
// can't quietly drift apart if that palette ever changes.
export const INDIA_FILL = '#0ea5e9'
