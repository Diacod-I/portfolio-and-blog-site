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
    
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

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

    // Filter notes from last 2 weeks and sort by date
    return notes
      .filter(note => new Date(note.date) >= twoWeeksAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error reading notes:', error)
    return []
  }
})
