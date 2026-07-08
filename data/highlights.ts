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
import linux from '@/public/highlights/linux.jpeg'
import icvgip from '@/public/highlights/icvgip.jpeg'
import kartik_talwar from '@/public/highlights/kartik_talwar.jpeg'
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
    description: 'ETHGlobal New Delhi, Yashobhoomi Convention Center',
    uploaded_at: '2025-09-26',
  },
  {
    id: 'arch',
    image: linux,
    alt_text: 'Goodbye Windows.. Hello Arch Linux :)',
    description: 'Accidentally deleted all partitions -> New Year, New distro!',
    uploaded_at: '2025-01-01',
  },
  {
    id: 'conf',
    image: icvgip,
    alt_text: 'ICVGIP 2024 Paper Presentation',
    description: 'ICVGIP 2024 Paper Presentation for "ViDAS: Vision-based Danger Assessment and Scoring", IIIT Bangalore',
    uploaded_at: '2024-12-15',
  },
  {
    id: 'kartik_talwar',
    image: kartik_talwar,
    alt_text: 'Met Mr. Kartik Talwar',
    description: 'Met Mr. Kartik Talwar (Co-founder of ETHGlobal)',
    uploaded_at: '2025-09-27'
  }
]
 
const highlights: Photo[] = allHighlights
  .filter((p) => p.is_visible !== false)
  .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
  .slice(0, MAX_VISIBLE)
 
export default highlights
