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
    console.log('Looking for notes in:', notesDirectory)
    console.log('Current working directory:', process.cwd())
    
    const files = await fs.readdir(notesDirectory)
    console.log('Files found:', files)

    const mdxFiles = files.filter(file => file.endsWith('.mdx'))
    console.log('MDX files:', mdxFiles)
    
    if (mdxFiles.length === 0) {
      console.log('No .mdx files found in:', notesDirectory)
      return []
    }

    const notes = await Promise.all(
      mdxFiles.map(async file => {
        try {
          const filePath = path.join(notesDirectory, file)
          const fileContent = await fs.readFile(filePath, 'utf8')
          const { data } = matter(fileContent)
          
          console.log('Processing file:', file, 'with data:', data)
          
          return {
            slug: file.replace('.mdx', ''),
            title: data.title || 'Untitled',
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt
          } as Note
        } catch (err) {
          console.error('Error processing file:', file, err)
          return null
        }
      })
    )

    // Filter out any null values and sort by date (most recent first)
    const validNotes = notes.filter((note) => note !== null) as Note[]
    console.log('Valid notes found:', validNotes.length)

    // Only include notes from the last 30 days
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentNotes = validNotes.filter(note => new Date(note.date) >= oneMonthAgo)

    return recentNotes
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error reading notes directory:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return []
  }
})
