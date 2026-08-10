// components/TagChip.tsx
//
// Shared "#tag" chip used by ProjectsWindow (project tags) and
// ContributorArchive (repo hashtags) — same box, same color table (see
// lib/tagColors.ts), so a tag reads the same wherever it shows up on the
// site. Always renders lowercase with a leading "#", regardless of how the
// tag is cased in its source data.

import { getTagColor } from '@/lib/tagColors'

type TagChipProps = {
  tag: string
  className?: string
}

export default function TagChip({ tag, className = '' }: TagChipProps) {
  const clean = tag.trim().replace(/^#/, '')
  const { bg, text } = getTagColor(clean)

  return (
    <span
      className={`inline-block border border-black/40 px-1 py-0.5 text-[10px] font-bold rounded ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      #{clean.toLowerCase()}
    </span>
  )
}
