'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { cache } from 'react'

export type FeaturedLink = {
  title: string
  url: string
  icon_path: string
  description?: string
}

const fallbackLinks: FeaturedLink[] = [
  {
    title: "Blog at Open Mainframe",
    url: "https://example.com/talk",
    description: "Blog about my work during my mentorship at the Open Mainframe Project",
    icon_path: "/win98/internet.png"
  }
]

async function validateIconPath(iconPath: string): Promise<string> {
  try {
    const publicPath = path.join(process.cwd(), 'public', iconPath)
    await fs.access(publicPath)
    return iconPath
  } catch {
    return '/win98/internet.png'
  }
}

// Cache the result to avoid reading the file multiple times
export const getFeaturedLinks = cache(async (): Promise<FeaturedLink[]> => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'featured.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const links = JSON.parse(fileContent) as FeaturedLink[]
    
    // Validate each icon path
    const validatedLinks = await Promise.all(
      links.map(async (link) => ({
        ...link,
        icon_path: await validateIconPath(link.icon_path || '/win98/internet.png')
      }))
    )
    
    return validatedLinks
  } catch (error) {
    console.error('Error reading featured links:', error)
    return fallbackLinks
  }
})
