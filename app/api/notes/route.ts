import { NextResponse } from 'next/server'
import { getRecentNotes } from '@/app/actions/getRecentNotes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const notes = await getRecentNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error in notes API:', error)
    return NextResponse.json([], { status: 500 })
  }
}
