# Blog post thumbnails

Convention: `<slug>.webp` (or `.png` / `.jpg`), matching the MDX filename in
`content/notes/`. Example: `content/notes/why-hate-ai.mdx` → `why-hate-ai.webp`.

- **Size: 1280×720 (16:9).** Shown at ~120px in the Explorer list, ~full-width
  on the post page, and used as the Open Graph share image (LinkedIn/X cards).
- Prefer webp, keep under ~200KB.
- No thumbnail = graceful fallback to the notepad icon + generated win98 OG card.
- To override the convention, set `thumbnail: /some/other/path.webp` in the
  post's frontmatter.
