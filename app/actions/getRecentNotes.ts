'use server'

// Thin wrapper kept for existing consumers (/api/notes, homepage widget).
// All logic — including the Published-only filter — lives in lib/notes.ts.
// Phase B of the revamp replaces this with direct lib/notes imports from
// server components, at which point this file and /api/notes can be deleted.

import { getRecentNotes as getRecentNotesFromLib, type Note as LibNote } from '@/lib/notes'

export type Note = {
  title: string
  slug: string
  date: string
  excerpt?: string
}

export async function getRecentNotes(): Promise<Note[]> {
  const notes = await getRecentNotesFromLib(3)
  return notes.map(({ slug, title, date, excerpt }: LibNote) => ({
    slug,
    title,
    date,
    excerpt,
  }))
}
