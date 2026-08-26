// data/worldMap.ts
// Backing constant for components/WorldMap.tsx. The map's actual geometry
// used to live here too (a hand-projected SVG path per country), but per
// explicit feedback that looked broken and the user asked to stop hand-
// rolling coordinates and use a real library instead — so rendering moved
// to react-simple-maps (see WorldMap.tsx), which does its own projection
// and path generation from real GeoJSON. The geometry itself now lives in
// data/countries.geo.json (a genuine FeatureCollection, same underlying
// per-country data this file used to derive its paths from — sourced from
// github.com/johan/world.geo.json, fetched one country at a time since this
// environment's fetch tool caps how much the full ~200-country file can
// return in one request, but individual country files come back complete).
//
// This file now only holds the one thing still worth sharing: the accent
// color India renders filled with, kept as its own named export so
// WorldMap.tsx and GithubContributionGraph.tsx's heatmap (LEVEL_COLORS[3])
// can't quietly drift apart if that palette ever changes.
export const INDIA_FILL = '#0ea5e9'
