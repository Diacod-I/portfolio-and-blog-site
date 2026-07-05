import { MetadataRoute } from 'next'
import { getAllNotes } from '@/lib/notes'

const SITE_URL = 'https://www.advithkrishnan.com'

// Generated at build time — replaces scripts/generate-sitemap.js.
// Served at /sitemap.xml with the correct content type automatically.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notes = await getAllNotes()

  return [
    {
      url: `${SITE_URL}/`,
      priority: 1.0,
      changeFrequency: 'monthly',
    },
    {
      url: `${SITE_URL}/blogs`,
      priority: 0.8,
      changeFrequency: 'weekly',
    },
    {
      url: `${SITE_URL}/contact`,
      priority: 0.5,
      changeFrequency: 'yearly',
    },
    {
      url: `${SITE_URL}/resume`,
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    ...notes.map((note) => ({
      url: `${SITE_URL}/blogs/${note.slug}`,
      lastModified: new Date(note.date),
      priority: 0.7,
      changeFrequency: 'yearly' as const,
    })),
  ]
}
