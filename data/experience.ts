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
  /** Gives that entry's badge a black fill instead of the default light
   *  one. Originally added for white-on-transparent logos (meant to sit on
   *  a dark background) — Infosys's usual logo is blue-on-white, but the
   *  dark/reversed variant reads better as a self-contained "chip" against
   *  this section's own dark background. Also used for logos that are full
   *  color but just look better as a dark chip (NASA's meatball, at the
   *  user's request). */
  logoDark?: boolean
  /** Shrinks the badge's inner padding (see ExperienceSection.tsx) so the
   *  logo fills more of the fixed-size badge. Default padding works fine
   *  for wordmarks with their own built-in breathing room (Infosys,
   *  StejasSYS's flame), but a tightly-cropped pictorial mark like NASA's
   *  meatball still looked small at the standard padding, at the user's
   *  request to make it bigger. */
  logoTight?: boolean
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
    logo: '/logos/eth-zurich.png',
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
    logoDark: true,
    logoTight: true,
  },
]

export default experience
