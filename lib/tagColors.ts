// lib/tagColors.ts
//
// Color lookup shared by every "#tag" chip on the site — project tags in
// ProjectsWindow, and repo hashtags in ContributorArchive. One table so
// both surfaces stay visually consistent (a "rust" chip looks the same
// whether it came from a project's tags array or a report's repos list),
// and reused colors rather than colors invented for this app: these are
// each language/project's own real-world brand color (mostly matching
// GitHub's linguist language colors), the same association most people
// already carry — Python is blue, Rust is tan, etc.
//
// Lookup is case-insensitive and ignores a leading "#" so it works
// regardless of how a tag happens to be authored in data/projects.ts, or
// how a repo hashtag is derived from "org/repo" in ContributorArchive.

export type TagColor = { bg: string; text: string }

// Fallback for anything not in the table below — same neutral look every
// tag had before colors existed, so an unrecognized tag never looks broken.
const DEFAULT_COLOR: TagColor = { bg: '#ffffff', text: '#000000' }

const TAG_COLORS: Record<string, TagColor> = {
  // Languages (GitHub linguist colors)
  python: { bg: '#3572A5', text: '#ffffff' },
  rust: { bg: '#dea584', text: '#000000' },
  typescript: { bg: '#3178c6', text: '#ffffff' },
  javascript: { bg: '#f1e05a', text: '#000000' },
  go: { bg: '#00ADD8', text: '#000000' },
  golang: { bg: '#00ADD8', text: '#000000' },
  'c++': { bg: '#f34b7d', text: '#ffffff' },
  cpp: { bg: '#f34b7d', text: '#ffffff' },
  c: { bg: '#555555', text: '#ffffff' },
  java: { bg: '#b07219', text: '#ffffff' },
  ruby: { bg: '#701516', text: '#ffffff' },
  php: { bg: '#4F5D95', text: '#ffffff' },
  swift: { bg: '#ffac45', text: '#000000' },
  kotlin: { bg: '#A97BFF', text: '#ffffff' },
  html: { bg: '#e34c26', text: '#ffffff' },
  css: { bg: '#563d7c', text: '#ffffff' },
  shell: { bg: '#89e051', text: '#000000' },
  bash: { bg: '#89e051', text: '#000000' },
  cuda: { bg: '#3A4E3A', text: '#ffffff' },
  'metal shader': { bg: '#8E44AD', text: '#ffffff' },
  metal: { bg: '#8E44AD', text: '#ffffff' },

  // Frameworks / tools / notable repos — brand colors where one exists,
  // a reasonable pick otherwise.
  react: { bg: '#61dafb', text: '#000000' },
  'next.js': { bg: '#000000', text: '#ffffff' },
  nextjs: { bg: '#000000', text: '#ffffff' },
  node: { bg: '#339933', text: '#ffffff' },
  nodejs: { bg: '#339933', text: '#ffffff' },
  pytorch: { bg: '#EE4C2C', text: '#ffffff' },
  tensorflow: { bg: '#FF6F00', text: '#ffffff' },
  numpy: { bg: '#4dabcf', text: '#000000' },
  'llvm-project': { bg: '#4B6F91', text: '#ffffff' },
  llvm: { bg: '#4B6F91', text: '#ffffff' },
  linux: { bg: '#333333', text: '#FFC800' },
  'linux foundation': { bg: '#003778', text: '#ffffff' },
}

export function getTagColor(rawTag: string): TagColor {
  const key = rawTag.trim().replace(/^#/, '').toLowerCase()
  return TAG_COLORS[key] ?? DEFAULT_COLOR
}
