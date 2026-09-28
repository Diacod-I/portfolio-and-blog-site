// data/highlights.ts
// Photo manifest for the Recent Highlights widget.
//
// Add a photo:
//   1. Drop the file (original resolution is fine) in /public/highlights/
//   2. Add its path to the FOLDERS list in scripts/migrate-to-r2.mjs (it's
//      already there for the 'highlights' folder — just run the script)
//      and run `pnpm run migrate:r2` to upload it and refresh the manifest.
//   3. Add an entry to the array below via remoteImage('/highlights/<file>')
//      — order doesn't matter, the newest MAX_VISIBLE by uploaded_at are
//      shown automatically.
//
// Images live on R2, not in this repo — see lib/media.ts for how their
// width/height/blurDataURL (computed once at upload time, since a remote
// URL string can't carry that the way a static import used to) get pulled
// back in here.

import { remoteImage, type RemoteImage } from '@/lib/media'

export interface Photo {
  id: string
  image: RemoteImage
  alt_text: string
  description: string
  uploaded_at: string // ISO date: 'YYYY-MM-DD'
  is_visible?: boolean
}

const MAX_VISIBLE = 10

const allHighlights: Photo[] = [
  {
    id: 'eth',
    image: remoteImage('/highlights/ethglobal.jpg'),
    alt_text: 'ETHGlobal New Delhi Group Photo at Convention Centre',
    description: 'ETHGlobal New Delhi, Yashobhoomi Convention Center',
    uploaded_at: '2025-09-26',
  },
  {
    id: 'arch',
    image: remoteImage('/highlights/linux.jpeg'),
    alt_text: 'Goodbye Windows.. Hello Arch Linux :)',
    description: 'Accidentally deleted all partitions -> New Year, New distro!',
    uploaded_at: '2025-01-01',
  },
  {
    id: 'conf',
    image: remoteImage('/highlights/icvgip.jpeg'),
    alt_text: 'ICVGIP 2024 Paper Presentation',
    description: 'ICVGIP 2024 Paper Presentation for "ViDAS: Vision-based Danger Assessment and Scoring", IIIT Bangalore',
    uploaded_at: '2024-12-15',
  },
  {
    id: 'kartik_talwar',
    image: remoteImage('/highlights/kartik_talwar.jpeg'),
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
