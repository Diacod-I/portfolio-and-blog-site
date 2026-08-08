'use client'

// GitHub-style contribution heatmap for the Home tab of advith.exe, sitting
// right above the Contribution Archive. Fetches the last 365 days of
// contribution counts from /api/contributions (a server-side proxy over
// GitHub's GraphQL API — see that route for why REST alone can't do this),
// then lays them out into GitHub's familiar Sun-Sat grid of weeks.

import { useEffect, useState } from 'react'

type ContributionDay = { date: string; count: number }
type ContributionsResponse = {
  totalContributions: number
  days: ContributionDay[]
  error?: string
}

// Same bucket thresholds GitHub itself uses, just recolored to the site's
// sky-blue accent (see the "@Diacod-I" link above this component) instead
// of GitHub's green. Level 0 sits a touch lighter than the panel background
// below (#2b2b2b) so empty cells still read as a grid instead of vanishing.
const LEVEL_COLORS = ['#3a3a3a', '#0c4a6e', '#0369a1', '#0ea5e9', '#7dd3fc']

function levelFor(count: number): number {
  if (count <= 0) return 0
  if (count <= 3) return 1
  if (count <= 6) return 2
  if (count <= 9) return 3
  return 4
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// GitHub's own weeks (as returned by the API) can start with a partial week
// if `from` doesn't land on a Sunday — which it won't, since `from` is just
// "today minus a year". Re-deriving the grid from each day's actual weekday
// (rather than trusting array position) keeps every row aligned to the
// correct day of the week regardless of where the 365-day window starts.
function buildGrid(days: ContributionDay[]): (ContributionDay | null)[][] {
  if (days.length === 0) return []
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const firstWeekday = new Date(`${sorted[0].date}T00:00:00Z`).getUTCDay() // 0 = Sunday

  const cells: (ContributionDay | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...sorted,
  ]

  const weeks: (ContributionDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// Label the first week that crosses into a new month, GitHub-style, so the
// row of labels above the grid doesn't repeat "Aug Aug Aug Aug...".
function monthLabels(weeks: (ContributionDay | null)[][]): (string | null)[] {
  let prevMonth = -1
  return weeks.map((week) => {
    const firstRealDay = week.find((d): d is ContributionDay => d !== null)
    if (!firstRealDay) return null
    const month = new Date(`${firstRealDay.date}T00:00:00Z`).getUTCMonth()
    if (month === prevMonth) return null
    prevMonth = month
    return MONTH_LABELS[month]
  })
}

export default function GithubContributionGraph() {
  const [data, setData] = useState<ContributionsResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/contributions')
      .then((res) => res.json())
      .then((json: ContributionsResponse) => {
        if (cancelled) return
        if (json.error || json.days.length === 0) {
          setFailed(true)
        } else {
          setData(json)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const weeks = data ? buildGrid(data.days) : []
  const labels = data ? monthLabels(weeks) : []

  return (
    <div className="win98-window flex flex-col">
      <div className="win98-titlebar">
        <span className="font-bold">Contribution Graph</span>
      </div>
      <div className="bg-[#2b2b2b] border-2 p-2">
        {failed ? (
          <p className="text-xs italic p-2 text-white">Couldn&apos;t load contribution data right now.</p>
        ) : !data ? (
          <p className="text-xs italic p-2 text-white">Loading...</p>
        ) : (
          <>
            <p className="text-xs font-bold text-white mb-2 px-1">
              {data.totalContributions.toLocaleString()} contributions in the last year
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-[3px] w-max px-1 pt-4 pb-1">
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-[3px] relative">
                    {labels[i] && (
                      <span className="absolute -top-4 left-0 text-[9px] text-white font-bold whitespace-nowrap">
                        {labels[i]}
                      </span>
                    )}
                    {week.map((day, r) =>
                      day ? (
                        <div
                          key={day.date}
                          title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                          className="w-[10px] h-[10px] border border-white/10"
                          style={{ backgroundColor: LEVEL_COLORS[levelFor(day.count)] }}
                        />
                      ) : (
                        <div key={r} className="w-[10px] h-[10px]" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
