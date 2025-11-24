'use server'

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'

export type Note = {
  title: string
  slug: string
  date: string
  excerpt?: string
}

export const getRecentNotes = cache(async (): Promise<Note[]> => {
  try {
    const notesDirectory = path.join(process.cwd(), 'content', 'notes')
    const files = await fs.readdir(notesDirectory)
    const mdxFiles = files.filter(file => file.endsWith('.mdx'))

    if (mdxFiles.length === 0) return []

    const notes = await Promise.all(
      mdxFiles.map(async file => {
        try {
          const filePath = path.join(notesDirectory, file)
          const fileContent = await fs.readFile(filePath, 'utf8')
          const { data } = matter(fileContent)

          return {
            slug: file.replace('.mdx', ''),
            title: data.title || 'Untitled',
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt
          } as Note
        } catch {
          return null
        }
      })
    )

    const validNotes = notes.filter((note): note is Note => note !== null)

    // Sort descending by date
    const sorted = validNotes.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Return only the top 3
    return sorted.slice(0, 3)

  } catch {
    return []
  }
})