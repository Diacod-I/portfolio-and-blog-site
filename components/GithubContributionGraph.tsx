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

// Minimum number of week-columns required between two month labels. Each
// column is 13px (10px cell + 3px gap — see the `gap-[3px]` flex below), a
// 3-letter label at this font size renders wider than that single column,
// so two labels landing on adjacent columns visually collide/merge into
// one unreadable run of text (e.g. "SepOct"). Real month boundaries are
// naturally ~4+ weeks apart and never trigger this; the one case that does
// is the very first column of the whole 365-day window, which is almost
// always a partial week (the fetched range starts "today minus a year",
// essentially never a Sunday) — so it can carry just 1-2 real days from
// the tail end of one month, immediately followed by a full week firmly in
// the next month one column over.
const MIN_LABEL_GAP_WEEKS = 2

// Label the first week that crosses into a new month, GitHub-style, so the
// row of labels above the grid doesn't repeat "Aug Aug Aug Aug...". Also
// enforces MIN_LABEL_GAP_WEEKS above so a label never renders close enough
// to the previous one to visually merge — see that constant's comment for
// why this specifically bites the very first column.
//
// When a collision happens against the very first column specifically, the
// earlier version of this function dropped the SECOND (colliding) label
// and kept the first — which meant the tiny 1-2 day fragment in column 0
// (e.g. the tail end of Sep) won out over the very next column's full,
// real month (Oct), leaving Oct completely unlabeled even though it's the
// one with an actual full week on the grid. That's backwards: the fragment
// carries less real information than the full month right next to it. So
// this case is flipped — when the previous label sitting at index 0 is
// what's causing the collision, that one is un-rendered instead, and the
// new (real, fuller) month takes the label spot. Every other collision
// (which the MIN_LABEL_GAP_WEEKS comment notes shouldn't normally occur
// past index 0) still falls back to the original "skip the new one"
// behavior.
function monthLabels(weeks: (ContributionDay | null)[][]): (string | null)[] {
  const labels: (string | null)[] = new Array(weeks.length).fill(null)
  let prevMonth = -1
  let lastLabeledIndex = -Infinity
  weeks.forEach((week, i) => {
    const firstRealDay = week.find((d): d is ContributionDay => d !== null)
    if (!firstRealDay) return
    const month = new Date(`${firstRealDay.date}T00:00:00Z`).getUTCMonth()
    if (month === prevMonth) return
    prevMonth = month
    if (i - lastLabeledIndex < MIN_LABEL_GAP_WEEKS) {
      if (lastLabeledIndex === 0) {
        labels[0] = null
      } else {
        return
      }
    }
    labels[i] = MONTH_LABELS[month]
    lastLabeledIndex = i
  })
  return labels
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
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <p className="text-xs font-bold text-white">
                {data.totalContributions.toLocaleString()} contributions in the last year
              </p>
              <div className="flex items-center gap-1 text-[10px] text-white shrink-0">
                <span>Less</span>
                {LEVEL_COLORS.map((color) => (
                  <div
                    key={color}
                    className="w-[10px] h-[10px] border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
            {/* justify-center on the scrollable wrapper, not the grid
                itself: when the grid (53 columns × 13px) is narrower than
                the panel — the usual case, since the panel's width tracks
                the dossier column, not the grid — this centers it instead
                of leaving all the unused space stacked on the right from
                plain left alignment. If the panel is ever narrower than
                the grid (e.g. a very cramped mobile width), overflow-x-auto
                still takes over and scrolls normally; centering a
                scrollable flex container has no effect once its content
                actually overflows. */}
            <div className="overflow-x-auto flex justify-center">
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
