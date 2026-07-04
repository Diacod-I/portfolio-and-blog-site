// data/highlights.ts
// Photo manifest for the Recent Highlights widget.
//
// Add a photo:
//   1. Drop the file (original resolution is fine) in /public/highlights/
//   2. Import it below and add an entry to the array — order doesn't matter,
//      the newest MAX_VISIBLE by uploaded_at are shown automatically.
//
// Static imports give next/image the intrinsic width/height for free,
// enable blur placeholders, and let Next resize/compress on demand —
// visitors never download the full-resolution original.
 
import type { StaticImageData } from 'next/image'
 
import ethglobal from '@/public/highlights/ethglobal.jpg'
import linux from '@/public/highlights/linux.jpg'
import icvgip from '@/public/highlights/icvgip.jpg'
// ...import new photos here
 
export interface Photo {
  id: string
  image: StaticImageData
  alt_text: string
  description: string
  uploaded_at: string // ISO date: 'YYYY-MM-DD'
  is_visible?: boolean
}
 
const MAX_VISIBLE = 10
 
const allHighlights: Photo[] = [
  {
    id: 'eth',
    image: ethglobal,
    alt_text: 'ETHGlobal New Delhi Group Photo at Convention Centre',
    description: 'Sep 26, 2025: ETHGlobal New Delhi, Yashobhoomi Convention Center',
    uploaded_at: '2026-01-01',
  },
  {
    id: 'arch',
    image: linux,
    alt_text: 'Goodbye Windows.. Hello Arch Linux :)',
    description: 'Jan 1, 2025: Accidentally deleted all partitions -> New Year, New distro!',
    uploaded_at: '2026-01-01',
  },
  {
    id: 'conf',
    image: icvgip,
    alt_text: 'ICVGIP 2024 Paper Presentation',
    description: 'Dec 15, 2024: ICVGIP 2024 Paper Presentation for "ViDAS: Vision-based Danger Assessment and Scoring", IIIT Bangalore',
    uploaded_at: '2026-01-01',
  },
]
 
const highlights: Photo[] = allHighlights
  .filter((p) => p.is_visible !== false)
  .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
  .slice(0, MAX_VISIBLE)
 
export default highlights
