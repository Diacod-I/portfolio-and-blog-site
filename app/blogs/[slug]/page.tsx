import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import NoteWindow from '@/components/NoteWindow'
import Head from 'next/head'

interface NotePageProps {
  params: {
    slug: string
  }
}

export default async function NotePage({ params }: NotePageProps) {
  try {
    const notesDirectory = path.join(process.cwd(), 'content', 'notes')
    const filePath = path.join(notesDirectory, `${params.slug}.mdx`)
    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContent)

    return (
      <>
        <Head>
          <title>{data.title} | Advith Krishnan</title>
          <meta name="description" content={data.description || data.excerpt || "Advith Krishnan's Blogfolio"} />
          <meta name="keywords" content={`Advith, Krishnan, Blog, Portfolio, ${data.title}`} />
          <link rel="canonical" href={`https://adviths-blogfolio.vercel.app/blogs/${params.slug}`} />
          <meta property="og:title" content={data.title} />
          <meta property="og:description" content={data.description || data.excerpt || "Advith Krishnan's Blogfolio"} />
          <meta property="og:url" content={`https://adviths-blogfolio.vercel.app/blogs/${params.slug}`} />
          <meta property="og:type" content="article" />
        </Head>
        <NoteWindow title={data.title}>
          <article>
            <h1 className="text-3xl font-bold mb-2 text-white">{data.title}</h1>
            <div className="text-sm text-gray-400 mb-8">
              Author: Advith Krishnan <br/>
              Date: {new Date(data.date).toLocaleDateString()}
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-white prose-ul:text-white prose-ol:text-white">
              <MDXRemote source={content} />
            </div>
          </article>
        </NoteWindow>
      </>
    )
  } catch (error) {
    notFound()
  }
}
