import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Backs the About tab's little "I know your IP" easter egg (see
// components/HomeClient.tsx, fetched client-side on mount). A dedicated
// route handler instead of reading headers() directly in each page.tsx
// that renders HomeClient: headers() forces whichever route calls it off
// static generation onto per-request rendering, and this site's pages
// (Home, About, Contact, Credits, Blogs list) are otherwise fully static.
// Keeping the dynamic part contained to this one tiny endpoint means the
// actual pages stay static — only this fetch is per-request.
//
// This is purely a client-visible echo of what any HTTP request already
// carries — nothing is logged, stored, or sent anywhere else.
export async function GET() {
  const hdrs = await headers()

  // x-forwarded-for can be a comma-separated chain (client, proxy1, proxy2,
  // ...) — the first entry is the original client.
  const forwardedFor = hdrs.get('x-forwarded-for')
  const first = forwardedFor?.split(',')[0]?.trim()
  const ip = first || hdrs.get('x-real-ip') || null

  return NextResponse.json(
    { ip },
    // Never cache this at any layer — it's per-visitor.
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
