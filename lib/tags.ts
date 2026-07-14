// lib/tags.ts
// Single source of truth for blog post tags. Each post gets exactly one tag
// (see the `tag` frontmatter field, parsed in lib/notes.ts) so it's clear at
// a glance what a post is broadly about. To add a new tag: add it to the
// `Tag` union, `TAGS` list, and `TAG_STYLES` below, then use it in a post's
// frontmatter.

export type Tag = 'MLSys' | 'Research' | 'Low Level' | 'Cooking' | 'Life' | 'Misc'

export const TAGS: Tag[] = ['MLSys', 'Research', 'Low Level', 'Cooking', 'Life', 'Misc']

export const DEFAULT_TAG: Tag = 'Misc'

// Tailwind classes per tag — same visual recipe as the "NEW" badge already
// used in ExplorerBlogList (border border-black, small rounded rect, bold
// text), just with a distinct background/text color per tag.
export const TAG_STYLES: Record<Tag, string> = {
  MLSys: 'bg-sky-300 text-sky-950',
  Research: 'bg-purple-300 text-purple-950',
  'Low Level': 'bg-emerald-300 text-emerald-950',
  Cooking: 'bg-orange-300 text-orange-950',
  Life: 'bg-pink-300 text-pink-950',
  Misc: 'bg-gray-300 text-gray-900',
}

export function isTag(value: unknown): value is Tag {
  return typeof value === 'string' && (TAGS as string[]).includes(value)
}

// One-line blurb shown under the tag filter chips when a tag is selected,
// so a visitor knows what they're about to filter into.
export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  MLSys: 'AI models, parallel processing, training infra, ML Compilers. Basically AI in production.',
  Research: 'My readings and implementations of cool research papers.',
  'Low Level': 'Kernels, Compilers, LLVM etc. The whole shebang!',
  Cooking: 'Recipes and kitchen experiments I tried and documented.',
  Life: 'Reflections on life.',
  Misc: 'Random blog posts.',
}
