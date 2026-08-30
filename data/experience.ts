// data/experience.ts
// Professional experience, shown as a compact timeline on advith.exe's
// About tab (see components/ExperienceSection.tsx). Mirrors the
// "Professional Experience" section of Advith's resume/LinkedIn (see
// public/Advith_Krishnan_Resume.pdf, downloadable from the navbar's Resume
// button, for the full detail including bullet points — this is a
// scannable summary, not a duplicate) — newest first, same order as the
// resume.

export interface ExperienceEntry {
  id: string
  role: string
  company: string
  location: string
  dates: string
  /** Path under /public/logos — see ExperienceSection.tsx for how this is
   *  rendered (bordered, rounded badge). Omitted → no badge for that entry
   *  (used for companies without a sourced logo yet, e.g. small/private
   *  ones with no freely-licensed asset found). */
  logo?: string
  /** True for a logo asset that's white-on-transparent (meant to sit on a
   *  dark background) — gives that entry's badge a black fill instead of
   *  the default light one, so the white wordmark/mark is actually
   *  visible. Infosys specifically: its usual logo is blue-on-white, but
   *  the dark/reversed variant reads better as a self-contained "chip"
   *  against this section's own dark background. */
  logoDark?: boolean
}

const experience: ExperienceEntry[] = [
  {
    id: 'infosys',
    role: 'Systems Engineer',
    company: 'Infosys',
    location: 'Chennai, India · Onsite',
    dates: 'Dec 2025 – Present',
    logo: '/logos/infosys.svg',
    logoDark: true,
  },
  {
    id: 'stejassys',
    role: 'Software Engineer',
    company: 'StejasSYS',
    location: 'Atlanta, USA · Remote',
    dates: 'Apr 2025 – Sept 2025',
    logo: '/logos/stejassys.png',
  },
  {
    id: 'eth-zurich',
    role: 'Research Intern',
    company: 'ETH Zurich',
    location: 'Zurich, Switzerland · Remote',
    dates: 'Aug 2024 – Mar 2025',
    logo: '/logos/eth-zurich.svg',
  },
  {
    id: 'miot',
    role: 'AI Engineer Intern',
    company: 'MIOT International',
    location: 'Chennai, India · Onsite',
    dates: 'Dec 2023 – Jul 2024',
    logo: '/logos/miot.png',
  },
  {
    id: 'nasa',
    role: 'Research Intern',
    company: 'NASA',
    location: 'Washington, D.C., USA · Remote',
    dates: 'Sep 2022 – Oct 2023',
    logo: '/logos/nasa.svg',
  },
]

export default experience
