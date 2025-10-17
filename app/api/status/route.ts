import { NextResponse } from 'next/server'

let start = Date.now()

export async function GET() {

  return NextResponse.json(
    {
      system: "advith_krishnan_rox's System",
      time_iso: new Date().toISOString(),
      monster_drinks_chugged: 21,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=10, stale-while-revalidate=59',
      },
    }
  )
}
