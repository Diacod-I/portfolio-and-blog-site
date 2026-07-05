import { notFound } from 'next/navigation'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import NoteWindow from '@/components/NoteWindow'
import { Metadata } from 'next'
import { getAllNotes, getNote } from '@/lib/notes'

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
    },
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params

  const note = await getNote(slug)
  if (!note) notFound()

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
    <NoteWindow title={note.title}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <h1 className="text-3xl font-bold mb-2 text-white">
          {note.title}
        </h1>

        <div className="text-sm text-gray-400 mb-8">
          Author: {note.author} <br />
          Date: {new Date(note.date).toLocaleDateString()} ·{' '}
          {note.readingTimeMinutes} min read
        </div>

        <div className="prose prose-invert max-w-none">
          <MDXContent />
        </div>
      </article>
    </NoteWindow>
  )
}
