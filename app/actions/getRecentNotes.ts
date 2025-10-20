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

// Cache the result to avoid reading the files multiple times
export const getRecentNotes = cache(async (): Promise<Note[]> => {
  try {
    const notesDirectory = path.join(process.cwd(), 'content', 'notes')
    const files = await fs.readdir(notesDirectory)

    const notes = await Promise.all(
      files
        .filter(file => file.endsWith('.mdx'))
        .map(async file => {
          const filePath = path.join(notesDirectory, file)
          const fileContent = await fs.readFile(filePath, 'utf8')
          const { data } = matter(fileContent)
          
          return {
            slug: file.replace('.mdx', ''),
            title: data.title || 'Untitled',
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt
          }
        })
    )

    // Sort by date (most recent first) and return all notes
    return notes
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error reading notes:', error)
    return []
  }
})
