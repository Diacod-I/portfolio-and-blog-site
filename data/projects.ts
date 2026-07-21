// data/projects.ts
// Manifest for the Projects gallery (see components/ProjectsWindow.tsx).
//
// Add a project:
//   1. (Optional) drop a thumbnail image in /public/projects/ and import it
//      below for a static-imported, blur-placeholder'd, auto-optimized image
//      — same trick data/highlights.ts uses for Gallery photos.
//   2. Add an entry to the array below — order doesn't matter, entries are
//      sorted by `date` (newest first) automatically.
//   3. `tags` are freeform strings (not the blog's fixed Tag union) since
//      projects can span far more categories than blog posts do.

import type { StaticImageData } from 'next/image'

// ...import project thumbnails here, e.g.:
// import myProjectThumb from '@/public/projects/my-project.png'

export interface Project {
  id: string
  title: string
  description: string
  tags?: string[]
  thumbnail?: StaticImageData | string
  liveUrl?: string
  repoUrl?: string
  date: string // ISO date: 'YYYY-MM-DD' — shown on the card as "uploaded" date, and drives sorting (newest first)
  featured?: boolean
  /** Shows a "WIP" badge on the card — for projects still being built. */
  wip?: boolean
  is_visible?: boolean
}

const allProjects: Project[] = [
  // Add real entries here as projects are ready to show, e.g.:
  // {
  //   id: 'my-project',
  //   title: 'My Project',
  //   description: 'A short, punchy description of what it does and why it exists.',
  //   tags: ['Next.js', 'TypeScript'],
  //   thumbnail: 'myProjectThumb',
  //   liveUrl: 'https://example.com',
  //   repoUrl: 'https://github.com/Diacod-I/my-project',
  //   date: '2026-07-01',
  //   featured: true,
  // },
  {
    id: 'metal-autograd',
    title: 'Metal Autograd (MAG)',
    description: 'An Autograd framework for Apple Metal',
    tags: ['Metal Shader', 'Python'],
    thumbnail: '/project-thumbnails/metal-autograd.png',
    liveUrl: '',
    repoUrl: 'https://github.com/Diacod-I/metal-autograd',
    date: '2026-07-01',
    wip: true
  },

]

const projects: Project[] = allProjects
  .filter((p) => p.is_visible !== false)
  .sort((a, b) => {
    // Featured projects pin to the top as a group; everything else (and each
    // group internally) sorts newest-first by date.
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

export default projects
