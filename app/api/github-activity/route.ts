// GET /api/github-activity
//
// Server-side proxy over GitHub's public Events API for Advith's account,
// normalized down to the handful of event types that actually say something
// about OSS work (PRs, reviews, issues, issue comments, releases) — push
// events and forks are deliberately dropped, same call the JohnTitor
// (2k36.org) activity feed this was inspired by makes: a stream of raw
// commits is noise, a stream of "opened a PR reviewing X" is a feed.
//
// Kept as a Route Handler (rather than fetching straight from the client)
// so an optional GITHUB_TOKEN can be used server-side to raise the rate
// limit without ever shipping it to the browser, and so the response can be
// cached/revalidated instead of hitting GitHub on every page load.

import { NextResponse } from 'next/server'

const GITHUB_USERNAME = 'Diacod-I'
const MAX_ITEMS = 20

// Next's route segment config requires `revalidate` to be a literal (not a
// reference to another const) for its static build-time analysis — so this
// can't be pulled from a shared constant. Keep REVALIDATE_SECONDS below in
// sync with this number; it's used in the actual fetch() call further down.
export const revalidate = 3600 // 1 hour — activity doesn't need to be live-live
const REVALIDATE_SECONDS = revalidate

type ActivityType = 'pr' | 'pr_review' | 'issue' | 'issue_comment' | 'release'

export interface ActivityItem {
  id: string
  type: ActivityType
  action: string
  title: string
  url: string
  repo: string
  createdAt: string
}

export interface ActivityResponse {
  username: string
  generatedAt: string
  items: ActivityItem[]
}

// Minimal shape of the fields we actually read off GitHub's public Events
// API (https://docs.github.com/en/rest/activity/events) — the real payload
// carries far more per event type; we only type what we use.
interface GithubEvent {
  id: string
  type: string
  created_at: string
  repo?: { name: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}

function normalize(event: GithubEvent): ActivityItem | null {
  const repo = event.repo?.name ?? ''

  switch (event.type) {
    case 'PullRequestEvent': {
      const pr = event.payload?.pull_request
      const action = event.payload?.action
      if (!pr || !['opened', 'closed', 'reopened'].includes(action)) return null
      return {
        id: event.id,
        type: 'pr',
        action: action === 'closed' && pr.merged ? 'merged' : action,
        title: pr.title,
        url: pr.html_url,
        repo,
        createdAt: event.created_at,
      }
    }
    case 'PullRequestReviewEvent': {
      const review = event.payload?.review
      const pr = event.payload?.pull_request
      if (!review || !pr) return null
      return {
        id: event.id,
        type: 'pr_review',
        action: review.state || 'reviewed',
        title: pr.title,
        url: review.html_url ?? pr.html_url,
        repo,
        createdAt: event.created_at,
      }
    }
    case 'IssuesEvent': {
      const issue = event.payload?.issue
      const action = event.payload?.action
      if (!issue || !['opened', 'closed', 'reopened'].includes(action)) return null
      return {
        id: event.id,
        type: 'issue',
        action,
        title: issue.title,
        url: issue.html_url,
        repo,
        createdAt: event.created_at,
      }
    }
    case 'IssueCommentEvent': {
      const issue = event.payload?.issue
      if (!issue || event.payload?.action !== 'created') return null
      return {
        id: event.id,
        type: 'issue_comment',
        action: 'commented',
        title: issue.title,
        url: event.payload?.comment?.html_url ?? issue.html_url,
        repo,
        createdAt: event.created_at,
      }
    }
    case 'ReleaseEvent': {
      const release = event.payload?.release
      if (!release || event.payload?.action !== 'published') return null
      return {
        id: event.id,
        type: 'release',
        action: 'published',
        title: release.name || release.tag_name,
        url: release.html_url,
        repo,
        createdAt: event.created_at,
      }
    }
    default:
      // Ignores PushEvent, ForkEvent, WatchEvent, CreateEvent, DeleteEvent,
      // etc. — deliberate, see file header.
      return null
  }
}

export async function GET() {
  const empty: ActivityResponse = {
    username: GITHUB_USERNAME,
    generatedAt: new Date().toISOString(),
    items: [],
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'advithkrishnan.com',
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    )

    if (!res.ok) {
      return NextResponse.json(empty)
    }

    const events = (await res.json()) as GithubEvent[]
    const items = events
      .map(normalize)
      .filter((item): item is ActivityItem => item !== null)
      .slice(0, MAX_ITEMS)

    return NextResponse.json({
      username: GITHUB_USERNAME,
      generatedAt: new Date().toISOString(),
      items,
    } satisfies ActivityResponse)
  } catch {
    return NextResponse.json(empty)
  }
}
