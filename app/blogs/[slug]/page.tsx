import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import NoteWindow from '@/components/NoteWindow'
import SubstackCTA from '@/components/SubstackCTA'
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
      // Real thumbnail wins over the generated win98 card when present
      ...(note.thumbnail && { images: [{ url: note.thumbnail, width: 1280, height: 720 }] }),
    },
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params

  const note = await getNote(slug)
  if (!note) notFound()

  // Up to 2 other published posts for "See also"
  const seeAlso = (await getAllNotes())
    .filter((n) => n.slug !== slug)
    .slice(0, 2)

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
    <NoteWindow
      title={note.title}
      date={note.date}
      readingTimeMinutes={note.readingTimeMinutes}
      author={note.author}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>

        {/* {note.thumbnail && (
          <Image
            src={note.thumbnail}
            alt=""
            width={1280}
            height={720}
            priority
            className="w-full max-w-3xl h-auto mb-8 border-2 border-[#808080]"
          />
        )} */}
        <h1 className="text-3xl font-bold mb-8 text-white">
          {note.title}
        </h1>

        <div className="prose prose-invert max-w-none">
          <MDXContent />
        </div>
      </article>

      {/* See also: other published posts as shortcut icons */}
      {seeAlso.length > 0 && (
        <div className="mt-10 pt-4 border-t-2 border-[#808080]">
          <p className="font-bold text-white mb-2">See also:</p>
          <div className="flex flex-wrap gap-4">
            {seeAlso.map((n) => (
              <Link
                key={n.slug}
                href={`/blogs/${n.slug}`}
                className="win98-button p-2 flex items-center gap-2 no-underline text-black max-w-xs"
              >
                <Image src="/win98/notes.webp" alt="" width={20} height={20} className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm truncate">{n.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </NoteWindow>
  )
}
