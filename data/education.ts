// data/education.ts
// Education history, shown as a compact timeline on advith.exe's About tab
// (see components/EducationSection.tsx) — mirrors ExperienceSection.tsx's
// own look and the same fields shape as data/experience.ts, just for
// degrees instead of jobs. Sourced from the EDUCATION section of
// public/Advith_Krishnan_Resume.pdf (downloadable from the navbar's Resume
// button), which also has the full detail (CGPA, relevant coursework) this
// scannable summary leaves out — same "summary, not a duplicate" reasoning
// as the experience data.

export interface EducationEntry {
  id: string
  degree: string
  institution: string
  location: string
  dates: string
  /** Path under /public/logos — see EducationSection.tsx/ExperienceSection.tsx
   *  for how this is rendered. Omitted → no badge for that entry. */
  logo?: string
  /** See ExperienceEntry's own doc on this — same reasoning, just no
   *  education entry needs it yet (kept for parity with ExperienceEntry
   *  should a future institution's logo asset need it). */
  logoDark?: boolean
}

const education: EducationEntry[] = [
  {
    id: 'srm',
    degree: 'B.Tech in Artificial Intelligence',
    institution: 'SRM Institute of Science and Technology',
    location: 'Kattankulathur, Chennai, India',
    dates: 'Aug 2021 – Aug 2025',
    logo: '/logos/srm.png',
  },
]

export default education
