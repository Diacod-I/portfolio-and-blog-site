import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const debug: any = {
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
  }

  // Check content directory
  try {
    const contentPath = path.join(process.cwd(), 'content', 'notes')
    debug.contentPath = contentPath
    const files = await fs.readdir(contentPath)
    debug.contentFiles = files
  } catch (error) {
    debug.contentError = error instanceof Error ? error.message : String(error)
  }

  // Check data directory
  try {
    const dataPath = path.join(process.cwd(), 'data')
    debug.dataPath = dataPath
    const files = await fs.readdir(dataPath)
    debug.dataFiles = files
    
    // Try to read featured.json
    const featuredPath = path.join(dataPath, 'featured.json')
    const content = await fs.readFile(featuredPath, 'utf8')
    debug.featuredJsonExists = true
    debug.featuredJsonLength = content.length
  } catch (error) {
    debug.dataError = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(debug, { status: 200 })
}
