// app/api/contributions/route.ts
//
// Serves a GitHub-style contribution calendar (last 365 days) for the Home
// tab of advith.exe (see components/GithubContributionGraph.tsx). GitHub's
// REST API doesn't expose per-day contribution counts — only the GraphQL API
// does, via `user.contributionsCollection.contributionCalendar` — so this
// route proxies that GraphQL query server-side (keeping the token off the
// client) and caches the result for an hour.
//
// Requires a GITHUB_TOKEN env var (a plain personal access token — no
// special scopes needed to read someone's public contribution calendar).
// Set it in Vercel's project settings. Without it, this fails soft: returns
// an `error` field and an empty day list instead of throwing, so the widget
// can show a "couldn't load" state instead of crashing the page.

import { NextResponse } from 'next/server'

const USERNAME = 'Diacod-I'
const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'

export const revalidate = 3600 // 1 hour — contribution counts don't need to be second-fresh

type ContributionDay = { date: string; count: number }

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

export async function GET() {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured', totalContributions: 0, days: [] })
  }

  // Exactly one year back from right now — GitHub's contributionsCollection
  // caps the `from`..`to` range at one year anyway, so this is also the
  // widest window a single query can ask for.
  const to = new Date()
  const from = new Date(to)
  from.setUTCFullYear(from.getUTCFullYear() - 1)

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'advithkrishnan.com-contribution-graph',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { login: USERNAME, from: from.toISOString(), to: to.toISOString() },
      }),
      next: { revalidate },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API responded ${res.status}`, totalContributions: 0, days: [] })
    }

    const json = await res.json()
    if (json.errors?.length) {
      return NextResponse.json({ error: json.errors[0].message, totalContributions: 0, days: [] })
    }

    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar
    if (!calendar) {
      return NextResponse.json({ error: 'No contribution data in response', totalContributions: 0, days: [] })
    }

    const days: ContributionDay[] = calendar.weeks.flatMap(
      (week: { contributionDays: { date: string; contributionCount: number }[] }) =>
        week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
    )

    return NextResponse.json({ totalContributions: calendar.totalContributions, days })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, totalContributions: 0, days: [] })
  }
}
