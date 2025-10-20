import { NextResponse } from 'next/server'
import { getFeaturedLinks } from '@/app/actions/getFeaturedLinks'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const links = await getFeaturedLinks()
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error in featured API:', error)
    return NextResponse.json([], { status: 500 })
  }
}
