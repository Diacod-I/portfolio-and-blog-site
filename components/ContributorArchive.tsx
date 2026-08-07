'use client'

// "Contributor Archive" — one unified, chronological feed inside advith.exe
// combining live GitHub activity (PRs, reviews, issues, comments, releases)
// and monthly OSS-contribution reports (see lib/tags.ts's 'Reports' tag and
// scripts/generate-report.mjs) into a single list, sorted newest-first.
//
// Report rows are deliberately NOT links to /blogs/[slug] — that route
// forces the separate "Advith's Blogs" window open (see that route's
// forceOpenApp="blogs"), which would pull the visitor out of advith.exe.
// This widget is meant to stay fully self-contained inside advith.exe, so
// report rows are informational only (title + date), not clickable.
//
// Styled to match ContactView's Internet Shortcuts panel: .win98-window
// chrome, bg-[#f0f0f0] content panel, ScrollPanel + win98-button rows.

import { useEffect, useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import ScrollPanel from '@/components/ScrollPanel'
import type { ActivityItem, ActivityResponse } from '@/app/api/github-activity/route'
import type { Note } from '@/lib/notes'

const TYPE_LABEL: Record<ActivityItem['type'], string> = {
  pr: 'Pull Request',
  pr_review: 'Review',
  issue: 'Issue',
  issue_comment: 'Comment',
  release: 'Release',
}

type ContributorArchiveProps = {
  notes: Note[]
}

// A shared row shape so GitHub events and monthly reports can sort into one
// chronological list together.
type ArchiveRow =
  | {
      kind: 'activity'
      id: string
      type: ActivityItem['type']
      title: string
      url: string
      repo: string
      date: string
    }
  | { kind: 'report'; id: string; title: string; date: string }

export default function ContributorArchive({ notes }: ContributorArchiveProps) {
  const [data, setData] = useState<ActivityResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/github-activity')
      .then((res) => res.json())
      .then((json: ActivityResponse) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reportRows: ArchiveRow[] = notes
    .filter((n) => n.tag === 'Reports')
    .map((n) => ({ kind: 'report', id: n.slug, title: n.title, date: n.date }))

  const activityRows: ArchiveRow[] = (data?.items ?? []).map((item) => ({
    kind: 'activity',
    id: item.id,
    type: item.type,
    title: item.title || item.repo,
    url: item.url,
    repo: item.repo,
    date: item.createdAt,
  }))

  const rows = [...reportRows, ...activityRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const loading = !data && !error
  const showEmpty = !loading && rows.length === 0

  return (
    <div className="win98-window flex flex-col">
      <div className="win98-titlebar">
        <span className="font-bold">Contributor Archive</span>
        <a
          href={`https://github.com/${data?.username ?? 'Diacod-I'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-200"
        >
          github.com/{data?.username ?? 'Diacod-I'}
        </a>
      </div>
      <div className="bg-[#f0f0f0] border-2 p-2">
        <ScrollPanel maxHeight={256} className="border-2" nudgeId="contributor-archive">
          {loading && rows.length === 0 ? (
            <p className="text-xs italic p-2 text-black">Loading recent activity…</p>
          ) : error && rows.length === 0 ? (
            <p className="text-xs italic p-2 text-black">
              Couldn&apos;t load GitHub activity right now — try again later.
            </p>
          ) : showEmpty ? (
            <p className="text-xs italic p-2 text-black">No recent activity or reports yet.</p>
          ) : (
            <div className="grid">
              {rows.map((row) =>
                row.kind === 'report' ? (
                  <div
                    key={`report-${row.id}`}
                    className="win98-button p-2 flex flex-col min-w-0"
                  >
                    <span className="block text-sm font-bold truncate min-w-0">
                      📈 {row.title}
                    </span>
                    <span className="block text-[10px] text-[#444] font-bold truncate min-w-0">
                      Monthly Report · {format(new Date(row.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                ) : (
                  <a
                    key={`activity-${row.id}`}
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="win98-button p-2 flex flex-col min-w-0 no-underline"
                  >
                    <span className="block text-sm font-bold truncate min-w-0">{row.title}</span>
                    <span className="block text-[10px] text-[#444] font-bold truncate min-w-0">
                      {TYPE_LABEL[row.type]} · {row.repo} ·{' '}
                      {formatDistanceToNow(new Date(row.date), { addSuffix: true })}
                    </span>
                  </a>
                )
              )}
            </div>
          )}
        </ScrollPanel>
      </div>
    </div>
  )
}
