// Small colored tag chip for blog posts — one per post. Reused in the blog
// list, the tag filter toolbar, and the single-post view, so the same tag
// always looks the same everywhere.

import { TAG_STYLES, type Tag } from '@/lib/tags'

type TagBadgeProps = {
  tag: Tag
  className?: string
}

export default function TagBadge({ tag, className = '' }: TagBadgeProps) {
  return (
    <span
      className={`border border-black px-1.5 py-0.5 text-[10px] font-extrabold rounded shrink-0 whitespace-nowrap ${TAG_STYLES[tag]} ${className}`}
    >
      {tag}
    </span>
  )
}
