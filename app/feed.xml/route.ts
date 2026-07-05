import { getAllNotes } from '@/lib/notes'

const SITE_URL = 'https://www.advithkrishnan.com'

// RSS 2.0 feed, generated statically at build time.
export const dynamic = 'force-static'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const notes = await getAllNotes()

  const items = notes
    .map(
      (note) => `    <item>
      <title>${escapeXml(note.title)}</title>
      <link>${SITE_URL}/blogs/${note.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blogs/${note.slug}</guid>
      <pubDate>${new Date(note.date).toUTCString()}</pubDate>
      ${note.excerpt ? `<description>${escapeXml(note.excerpt)}</description>` : ''}
      <author>advithkrishnan@gmail.com (${escapeXml(note.author)})</author>
    </item>`
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Advith Krishnan's Blog</title>
    <link>${SITE_URL}/blogs</link>
    <description>Advith Krishnan's retro Windows themed blog</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
