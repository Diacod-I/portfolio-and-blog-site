#!/usr/bin/env node
// scripts/generate-report.mjs
//
// Scaffolds a monthly OSS-contribution report as an MDX post in
// content/notes/, prefilled with stats pulled from GitHub's Search API for
// Diacod-I, grouped by repo, with a per-repo narrative paragraph drafted by
// GitHub Models (free, hosted by GitHub, authenticates with the same
// GITHUB_TOKEN already used for the Search API — no extra secret needed).
// This is the Next.js/MDX equivalent of what 2k36.org does with Astro
// content files + a GitHub Actions workflow (see
// .github/workflows/monthly-report.yml).
//
// The review gate is the PR itself, not a separate draft/publish flag: the
// file is written with `status: "Published"` already, every AI-drafted
// paragraph is flagged in the MDX source for a human read, and nothing
// actually reaches the live site until that PR is reviewed and merged
// (the branch it's opened from is never deployed on its own). Merging IS
// publishing — there's no second "flip a flag" step after that.
//
// Usage:
//   node scripts/generate-report.mjs            # previous calendar month
//   node scripts/generate-report.mjs 2026-07     # explicit YYYY-MM
//
// Requires:
//   GITHUB_TOKEN env var — used for both the Search API (raises the rate
//   limit) and GitHub Models (drafts the narrative). Inside the GitHub
//   Action this is the automatic `secrets.GITHUB_TOKEN` (workflow needs
//   `permissions: models: read`). Running locally, use a personal access
//   token with the `models` scope (https://github.com/settings/tokens) —
//   without it, stats still get scaffolded, just without a drafted narrative.

import { promises as fs } from 'fs'
import path from 'path'

const USERNAME = 'Diacod-I'
const NOTES_DIR = path.join(process.cwd(), 'content', 'notes')
const MODELS_ENDPOINT = 'https://models.github.ai/inference/chat/completions'
const MODEL = 'openai/gpt-4o-mini'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseTargetMonth(arg) {
  if (arg) {
    const match = /^(\d{4})-(\d{2})$/.exec(arg)
    if (!match) throw new Error(`Expected YYYY-MM, got "${arg}"`)
    return { year: Number(match[1]), month: Number(match[2]) } // month: 1-12
  }
  // Default: the previous full calendar month, relative to today (UTC).
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1 // 1-12, current month
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 }
}

function isoDate(year, month, day) {
  // month is 1-12
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthRange(year, month) {
  const since = isoDate(year, month, 1)
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
  const until = isoDate(nextMonth.y, nextMonth.m, 1)
  return { since, until }
}

async function searchIssues(query) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'advithkrishnan.com-report-scaffold',
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    })
    if (!res.ok) {
      console.warn(`  ⚠ search failed (${res.status}) for query: ${query}`)
      return { total_count: 0, items: [] }
    }
    return await res.json()
  } catch (err) {
    // Network error (offline, DNS failure, etc.) — fail soft so the script
    // still scaffolds a draft file the human can fill in stats for by hand,
    // rather than crashing the whole run.
    console.warn(`  ⚠ request failed for query "${query}": ${err.message}`)
    return { total_count: 0, items: [] }
  }
}

// Commits aren't issues/PRs, so they need GitHub's separate Search Commits
// API. Only the count is used (see "By the numbers"), not the commit list,
// so per_page=1 keeps this cheap — total_count comes back regardless of
// page size.
async function searchCommitCount(query) {
  const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=1`
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'advithkrishnan.com-report-scaffold',
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    })
    if (!res.ok) {
      console.warn(`  ⚠ commit search failed (${res.status}) for query: ${query}`)
      return { total_count: 0 }
    }
    return await res.json()
  } catch (err) {
    console.warn(`  ⚠ commit search request failed for "${query}": ${err.message}`)
    return { total_count: 0 }
  }
}

// Merges the four search buckets into one item list per repo, deduped by
// URL (a PR can legitimately show up in both "opened" and "merged" if both
// happened in the same month — keep the more specific "merged" label for
// it rather than double-counting it in the narrative).
function groupByRepo(prsOpened, prsMerged, issuesOpened, reviewsGiven) {
  const groups = new Map() // repo -> Map(url -> item)
  const addAll = (items, kind) => {
    for (const it of items) {
      const repo = it.repository_url.split('/repos/')[1]
      if (!groups.has(repo)) groups.set(repo, new Map())
      const bucket = groups.get(repo)
      const existing = bucket.get(it.html_url)
      if (!existing || kind === 'merged') {
        bucket.set(it.html_url, { title: it.title, body: it.body ?? '', url: it.html_url, kind })
      }
    }
  }
  addAll(prsOpened.items, 'opened a PR')
  addAll(prsMerged.items, 'merged a PR')
  addAll(issuesOpened.items, 'opened an issue')
  addAll(reviewsGiven.items, 'reviewed a PR')
  return groups
}

// Titles and AI-drafted text come from GitHub or GitHub Models, not from
// us — MDX treats `<` as the start of a JSX tag and `{` as the start of a
// JS expression, so either one appearing in plain prose (outside a code
// span) breaks the build entirely. Escaping is the safe default for any
// text we didn't author ourselves. `<`/`>` become HTML entities (which
// CommonMark decodes back to literal characters when rendering — this
// isn't a display hack, it's the standard way to write a literal `<` in
// Markdown/MDX text); `{`/`}` are backslash-escaped, MDX's own escape
// syntax for its special characters.
function escapeMdxText(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
}

const NARRATIVE_SYSTEM_PROMPT = `You are ghostwriting one paragraph of a monthly open-source contribution report for a developer named Advith Krishnan. Write in first person, 2-3 sentences, matter-of-fact and technical. Explain what was worked on and why it mattered, not just a restated list of PR titles. No hype, no marketing language, no emoji, no headers. Only use facts present in the provided activity list — never invent details, motivations, or outcomes that aren't stated.`

// Drafts a short narrative paragraph for one repo's worth of activity via
// GitHub Models. Returns null (not a thrown error) on any failure — missing
// token, rate limit, network issue — so the caller can fall back to a TODO
// placeholder instead of the whole script dying over one bad request.
async function draftNarrative(repo, items) {
  if (!process.env.GITHUB_TOKEN) return null

  const activityList = items
    .slice(0, 15)
    .map((it) => `- (${it.kind}) "${it.title}"${it.body ? `: ${it.body.slice(0, 300).replace(/\s+/g, ' ')}` : ''}`)
    .join('\n')

  try {
    const res = await fetch(MODELS_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        messages: [
          { role: 'system', content: NARRATIVE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Repository: ${repo}\n\nActivity this month:\n${activityList}\n\nWrite the paragraph now.`,
          },
        ],
      }),
    })
    if (!res.ok) {
      console.warn(`  ⚠ GitHub Models request failed (${res.status}) for ${repo} — leaving a TODO instead.`)
      return null
    }
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() || null
  } catch (err) {
    console.warn(`  ⚠ GitHub Models request errored for ${repo}: ${err.message} — leaving a TODO instead.`)
    return null
  }
}

// Repo index shown right under the "Focus areas" heading, before the
// per-repo breakdowns — a quick-scan list of every repo touched this month,
// each linked straight to its GitHub page.
function buildRepoIndex(repos) {
  const links = repos.map((repo) => `[${repo}](https://github.com/${repo})`).join(', ')
  return `{/* TODO: 1-2 sentence overview tying this month's repos together */}\n\n**Repository list:** ${links}`
}

async function buildFocusAreas(groups) {
  const repos = [...groups.keys()].sort()
  if (repos.length === 0) {
    return '_No public activity found for this month — fill this in by hand if anything is missing._'
  }

  const sections = [buildRepoIndex(repos)]
  for (const repo of repos) {
    const items = [...groups.get(repo).values()]
    console.log(`  Drafting narrative for ${repo} (${items.length} item${items.length === 1 ? '' : 's'})...`)
    const narrative = await draftNarrative(repo, items)
    const bulletList = items
      .map((it) => `- [${escapeMdxText(it.title)}](${it.url}) (${it.kind})`)
      .join('\n')
    const narrativeBlock = narrative
      ? `{/* AI-drafted via GitHub Models — review before publishing */}\n${escapeMdxText(narrative)}`
      : `{/* TODO: write 2-3 sentences on why this work mattered */}`
    sections.push(`### ${repo}\n\n${narrativeBlock}\n\n${bulletList}`)
  }
  return sections.join('\n\n')
}

async function main() {
  const { year, month } = parseTargetMonth(process.argv[2])
  const { since, until } = monthRange(year, month)
  const monthName = MONTH_NAMES[month - 1]

  console.log(`Generating report for ${monthName} ${year} (${since} .. ${until})...`)
  if (!process.env.GITHUB_TOKEN) {
    console.warn('  ⚠ GITHUB_TOKEN not set — unauthenticated Search API requests, and no AI-drafted narrative.')
  }

  const [prsOpened, prsMerged, issuesOpened, reviewsGiven, commitsAuthored] = await Promise.all([
    searchIssues(`author:${USERNAME} type:pr created:${since}..${until}`),
    searchIssues(`author:${USERNAME} type:pr is:merged merged:${since}..${until}`),
    searchIssues(`author:${USERNAME} type:issue created:${since}..${until}`),
    searchIssues(`reviewed-by:${USERNAME} type:pr -author:${USERNAME} updated:${since}..${until}`),
    searchCommitCount(`author:${USERNAME} author-date:${since}..${until}`),
  ])

  const title = `${monthName} ${year} Contributor Report`
  const slug = `${year}-${monthName.toLowerCase()}-report`
  const filePath = path.join(NOTES_DIR, `${slug}.mdx`)

  try {
    await fs.access(filePath)
    console.error(`✗ ${filePath} already exists — refusing to overwrite. Delete it first if you want to regenerate.`)
    process.exit(1)
  } catch {
    // doesn't exist yet, good — continue
  }

  const overviewUrl = `https://github.com/${USERNAME}?tab=overview&from=${since}&to=${until}`
  const groups = groupByRepo(prsOpened, prsMerged, issuesOpened, reviewsGiven)
  const focusAreas = await buildFocusAreas(groups)

  // `date` is the upload/publish date (first of the month *after* the one
  // being reported on — this runs at the start of the month covering last
  // month's activity), not the first day of the reported period itself.
  // `until` from monthRange() is already exactly that.
  const frontmatter = `---
title: "${title}"
date: "${until}"
author: "Advith Krishnan"
status: "Published"
tag: "Reports"
thumbnail: "/internet_shortcuts/github.webp"
---`

  const body = `
## ${monthName} ${year} in review

{/* This file is marked Published, but reviewing the PR IS the publish
     gate — nothing here reaches the live site until this PR is merged.
     Any paragraph below marked "AI-drafted" was written by GitHub Models
     from that repo's PR/issue titles and descriptions — read it, fix
     anything that misses the actual reason the work mattered, and delete
     this comment once you're happy with it. Sections marked TODO got no
     draft (no token, or the request failed) and need writing from scratch. */}

### By the numbers

- **Commits authored:** ${commitsAuthored.total_count}
- **Pull requests opened:** ${prsOpened.total_count}
- **Pull requests merged:** ${prsMerged.total_count}
- **Issues opened:** ${issuesOpened.total_count}
- **Reviews given:** ${reviewsGiven.total_count}

Full contribution graph: [github.com/${USERNAME}](${overviewUrl})

## Focus areas

${focusAreas}
`

  await fs.mkdir(NOTES_DIR, { recursive: true })
  await fs.writeFile(filePath, `${frontmatter}\n${body}`, 'utf8')
  console.log(`✓ Wrote draft report to ${path.relative(process.cwd(), filePath)}`)

  // Hand the title to the GitHub Actions step outputs so the workflow can
  // name the PR after it (see .github/workflows/monthly-report.yml's
  // "Open PR" step) instead of a static "Monthly OSS report draft" title.
  // No-op outside Actions — GITHUB_OUTPUT is only set there.
  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `title=${title}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
