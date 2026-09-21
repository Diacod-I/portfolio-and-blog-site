// data/testimonials.ts
// Testimonials & Endorsements, shown on advith.exe's About tab between
// Education and the Location map (see HomeClient.tsx) — same
// data-file-per-section convention as experience.ts/education.ts, just
// for LinkedIn recommendations instead of a dated affiliation.
//
// LinkedIn doesn't expose recommendations through any public API (and
// there's no LinkedIn connector wired up here), so there's no automated
// way to pull these in — the actual fix for the 3 placeholder entries
// below is to open your LinkedIn profile's Recommendations section
// yourself, copy each recommendation's full text plus the recommender's
// name and title, and paste them into chat (or straight into this file)
// so the placeholder copy below can be replaced with the real thing.
// linkedinUrl is optional — link to the recommender's own profile if you
// want the name to be clickable, omit it otherwise.
//
// avatar is also optional, same reasoning: LinkedIn doesn't expose a
// recommender's profile photo through any API either, so getting one
// here means opening their profile, saving their photo by hand (open it
// in a new tab for the full-res version, not the tiny inline thumbnail),
// and dropping it in /public/testimonials/ — see scripts/migrate-to-r2.mjs's
// FOLDERS list, which already knows to sweep that folder up to R2
// alongside everything else once the migration actually runs (see
// lib/r2.ts / next.config.js's own comments on that). Until a photo
// exists for an entry, TestimonialsSection renders a dashed-border
// placeholder badge in its place instead (see that component).

export interface Testimonial {
  id: string
  quote: string
  author: string
  /** Role/title + company, e.g. "Senior Engineer at Foo Corp" — shown
   *  under the author's name, same two-line pattern as
   *  ExperienceSection/EducationSection use for role + company. */
  role: string
  linkedinUrl?: string
  /** Path under /public/testimonials — see the file header above for how
   *  to actually get one. Omitted → dashed-border placeholder badge
   *  instead (see TestimonialsSection.tsx). */
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    id: 'karan-pargal',
    quote: 'Advith is one of the most hardworking people I know. His knowledge about various technical aspects is really worth listening to. Along with that he’s good with helping people learn and grow themselves.',
    author: 'Karan Pargal',
    role: 'Software Engineer @ Covalent',
    avatar: '/testimonials/karan_pargal.jpeg',
  },
  {
    id: 'kunal-keshan',
    quote: `Working with Advith has been fun because he's a guy with whom you can bounce ideas off and get even deeper insights into what you're working on together. His dedication to research and development shows not only in his work but also in him as an individual, as he can think deeply about how things work, and how they can be improved, and provide various perspectives to solve problems. He helps phrase problems the right way while offering solutions for better outcomes.

Advith and I met when we participated in a hackathon; we were connected to a mutual junior. During the time we spent together, I noticed how dedicated he was to his work and how selfless he is with his juniors and seniors alike. He sees the best in others and provides feedback where required with honesty and kindness. I wish nothing but luck and success to Advith in his future endeavours, and those who are working with him will be lucky to have him as an asset.`,
    author: 'Kunal Keshan',
    role: 'Software Engineer @ StejasSYS',
    avatar: '/testimonials/kunal_keshan.png',
  },
  {
    id: 'aryan-raj',
    quote: 'Advith stands out as an exceptional researcher. His expertise in machine learning and deep learning is truly impressive. Collaborating with him is not only enjoyable, but also a valuable learning experience thanks to his extensive knowledge and willingness to share it.',
    author: 'Aryan Raj',
    role: 'Software Engineer (AI) @ Value Labs',
    avatar: '/testimonials/aryan_raj.jpeg',
  },
]

export default testimonials
