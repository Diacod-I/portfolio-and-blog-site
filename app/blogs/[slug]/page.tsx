import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { compile } from '@mdx-js/mdx'
import { run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import NoteWindow from '@/components/NoteWindow'
import { Metadata } from 'next'

interface NotePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { slug } = await params

  const filePath = path.join(process.cwd(), 'content', 'notes', `${slug}.mdx`)
  const fileContent = await fs.readFile(filePath, 'utf8')
  const { data } = matter(fileContent)

  return {
    title: `${data.title} | Advith Krishnan`,
    description: data.description || data.excerpt,
    alternates: {
      canonical: `https://adviths-blogfolio.vercel.app/blogs/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.description || data.excerpt,
      url: `https://adviths-blogfolio.vercel.app/blogs/${slug}`,
      type: 'article',
    },
  }
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params

  try {
    const filePath = path.join(process.cwd(), 'content', 'notes', `${slug}.mdx`)
    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContent)

    const compiled = await compile(content, {
      outputFormat: 'function-body',
    })

    const { default: MDXContent } = await run(compiled, runtime)

    return (
      <NoteWindow title={data.title}>
        <article>
          <h1 className="text-3xl font-bold mb-2 text-white">
            {data.title}
          </h1>

          <div className="text-sm text-gray-400 mb-8">
            Author: Advith Krishnan <br />
            Date: {new Date(data.date).toLocaleDateString()}
          </div>

          <div className="prose prose-invert max-w-none">
            <MDXContent />
          </div>
        </article>
      </NoteWindow>
    )
  } catch {
    notFound()
  }
}
