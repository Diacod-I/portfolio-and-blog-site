import { notFound } from 'next/navigation'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { getAllNotes, getNote } from '@/lib/notes'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

const SITE_URL = 'https://www.advithkrishnan.com'

interface ReportPageProps {
  params: Promise<{
    slug: string
  }>
}

// Only 'Reports'-tagged notes get a /reports/[slug] page — everything else
// 404s here (it still exists at /blogs/[slug]). Keeps the two routes from
// ever both claiming the same slug.
export async function generateStaticParams() {
  const notes = await getAllNotes()
  return notes.filter((n) => n.tag === 'Reports').map((note) => ({ slug: note.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { slug } = await params
  const note = await getNote(slug)
  if (!note || note.tag !== 'Reports') return {}

  return {
    title: `${note.title} | Advith Krishnan`,
    description: note.excerpt,
    alternates: {
      canonical: `${SITE_URL}/reports/${slug}`,
    },
    openGraph: {
      title: note.title,
      description: note.excerpt,
      url: `${SITE_URL}/reports/${slug}`,
      type: 'article',
      publishedTime: note.date,
      authors: [note.author],
      ...(note.thumbnail && { images: [{ url: note.thumbnail, width: 1280, height: 720 }] }),
    },
  }
}

// Renders the same desktop as "/" (icons, taskbar, other windows persist via
// the zustand store), with advith.exe forced open on its Report tab (see
// ContributorArchive.tsx and components/ReportViewer.tsx — reports render
// inside advith.exe itself, not a separate window/app). The MDX is still
// compiled server-side here, same as app/blogs/[slug]/page.tsx.
export default async function ReportPage({ params }: ReportPageProps) {
  const { slug } = await params

  const note = await getNote(slug)
  if (!note || note.tag !== 'Reports') notFound()

  const [notes, featured] = await Promise.all([getAllNotes(), getFeaturedLinks()])

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
    mainEntityOfPage: `${SITE_URL}/reports/${slug}`,
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
        forceOpenApp="advith"
        initialHomeTab="report"
        reportView={{
          note,
          content: <MDXContent />,
        }}
      />
    </>
  )
}
