import { notFound } from 'next/navigation'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes, getNote } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

const SITE_URL = 'https://www.advithkrishnan.com'

interface NotePageProps {
  params: Promise<{
    slug: string
  }>
}

// Pre-render every published post at build time → static HTML on the CDN,
// no MDX compilation per request, no serverless cold start.
export async function generateStaticParams() {
  const notes = await getAllNotes()
  return notes.map((note) => ({ slug: note.slug }))
}

// Any slug not returned above (drafts, typos) → 404 instead of
// falling back to on-demand server rendering.
export const dynamicParams = false

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params
  const note = await getNote(slug)
  if (!note) return {}

  return {
    title: `${note.title} | Advith Krishnan`,
    description: note.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blogs/${slug}`,
    },
    openGraph: {
      title: note.title,
      description: note.excerpt,
      url: `${SITE_URL}/blogs/${slug}`,
      type: 'article',
      publishedTime: note.date,
      authors: [note.author],
      // Real thumbnail wins over the generated win98 card when present
      ...(note.thumbnail && { images: [{ url: note.thumbnail, width: 1280, height: 720 }] }),
    },
  }
}

// Renders the same desktop as "/" (icons, taskbar, other windows persist via
// the zustand store), with the Blogs window forced open and showing this
// post — so a direct hit on /blogs/[slug] (search result, shared link) looks
// like the real app, not an isolated reader page. The MDX is still compiled
// server-side here (for indexing, opengraph-image, JSON-LD — all unchanged);
// only the rendered <MDXContent/> element is handed down to the window.
export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params

  const note = await getNote(slug)
  if (!note) notFound()

  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])
  const seeAlso = notes.filter((n) => n.slug !== slug).slice(0, 2)

  const compiled = await compile(note.content, {
    outputFormat: 'function-body',
  })
  const { default: MDXContent } = await run(compiled, runtime)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: note.title,
    description: note.excerpt,
    datePublished: note.date,
    author: {
      '@type': 'Person',
      name: note.author,
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blogs/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        notes={notes}
        featured={featured}
        forceOpenApp="blogs"
        blogsView={{
          mode: 'post',
          note,
          seeAlso,
          content: <MDXContent />,
        }}
      />
    </>
  )
}
