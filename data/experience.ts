// data/experience.ts
// Professional experience, shown as a compact timeline on advith.exe's
// About tab (see components/ExperienceSection.tsx). Mirrors the
// "Professional Experience" section of Advith's resume/LinkedIn (see
// public/Advith_Krishnan_Resume.pdf for the full detail, including bullet
// points — that stays on the Resume tab; this is a scannable summary, not
// a duplicate) — newest first, same order as the resume.

export interface ExperienceEntry {
  id: string
  role: string
  company: string
  location: string
  dates: string
}

const experience: ExperienceEntry[] = [
  {
    id: 'infosys',
    role: 'Systems Engineer',
    company: 'Infosys',
    location: 'Chennai, India · Onsite',
    dates: 'Dec 2025 – Present',
  },
  {
    id: 'stejassys',
    role: 'Software Engineer',
    company: 'StejasSYS',
    location: 'Atlanta, USA · Remote',
    dates: 'Apr 2025 – Sept 2025',
  },
  {
    id: 'eth-zurich',
    role: 'Research Intern',
    company: 'ETH Zurich',
    location: 'Zurich, Switzerland · Remote',
    dates: 'Aug 2024 – Mar 2025',
  },
  {
    id: 'miot',
    role: 'AI Engineer Intern',
    company: 'MIOT International',
    location: 'Chennai, India · Onsite',
    dates: 'Dec 2023 – Jul 2024',
  },
  {
    id: 'nasa',
    role: 'Research Intern',
    company: 'NASA',
    location: 'Washington, D.C., USA · Remote',
    dates: 'Sep 2022 – Oct 2023',
  },
]

export default experience
