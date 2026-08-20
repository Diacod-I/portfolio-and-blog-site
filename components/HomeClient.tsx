'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Navbar, { type HomeTab } from '@/components/Navbar'
import ContactView from '@/components/ContactView'
import FaultyTerminalBackground, { type FaultyTerminalBackgroundHandle } from '@/components/FaultyTerminalBackground'
import CreditsWindow from '@/components/CreditsWindow'
import WindowsLoader from '@/components/WindowsLoader'
import FooterConsole from '@/components/FooterConsole'
import ExplorerBlogList from '@/components/ExplorerBlogList'
import ImageExhibition from '@/components/ImageExhibition'
import BlogPostView from '@/components/BlogPostView'
import ReportViewer from '@/components/ReportViewer'
import GalleryWindow from '@/components/GalleryWindow'
import PrinceOfPersiaWindow from '@/components/PrinceOfPersiaWindow'
import PrinceOfPersiaReadmeWindow from '@/components/PrinceOfPersiaReadmeWindow'
import MinesweeperWindow from '@/components/MinesweeperWindow'
import SolitaireWindow from '@/components/SolitaireWindow'
import ProjectsWindow from '@/components/ProjectsWindow'
import ContributorArchive from '@/components/ContributorArchive'
import ExperienceSection from '@/components/ExperienceSection'
import GithubContributionGraph from '@/components/GithubContributionGraph'
import DesktopIcon, { GridCell, cellToPx } from '@/components/DesktopIcon'
import Win98Window from '@/components/Win98Window'
import { useWindowStore, type AppId, type WinState } from '@/lib/store/windowStore'
import highlights from '@/data/highlights'
import projects from '@/data/projects'
import { STORY_CHAPTERS } from '@/data/storyChapters'
import type { Note } from '@/lib/notes'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

// What the Blogs window shows: the Explorer-style list (default), or a
// single post (used when landing on /blogs/[slug] — see that route, which
// compiles the MDX server-side and hands the rendered element down here).
export type BlogsView =
  | { mode: 'list' }
  | { mode: 'post'; note: Note; seeAlso: Note[]; content: React.ReactNode }

// What advith.exe's Report tab shows — only populated when landing on
// /reports/[slug] (see that route). Unlike BlogsView there's no 'list' mode:
// the report list itself lives in ContributorArchive on advith.exe's Home
// tab, not here — this only ever shows a single report at a time.
export type ReportView = { note: Note; content: React.ReactNode }

type HomeClientProps = {
  notes: Note[]
  featured: FeaturedLink[]
  forceOpenApp?: AppId
  blogsView?: BlogsView
  reportView?: ReportView
  /** Which advith.exe tab to land on. Defaults to 'home'. */
  initialHomeTab?: HomeTab
}

// ---- App registry -----------------------------------------------------------
const APPS: Record<AppId, { name: string; icon: string }> = {
  advith: { name: 'advith.exe', icon: '/win98/advith_krishnan_exe.webp' },
  blogs: { name: 'Blogs', icon: '/win98/notepad.webp' },
  gallery: { name: 'Gallery', icon: '/win98/photos.webp' },
  credits: { name: 'Credits', icon: '/win98/info.webp' },
  pop: { name: 'Prince of Persia', icon: '/win98/pop.ico' },
  popReadme: { name: 'POP.TXT - Notepad', icon: '/win98/notepad.webp' },
  minesweeper: { name: 'Minesweeper', icon: '/win98/minesweeper.svg' },
  solitaire: { name: 'Solitaire', icon: '/win98/solitaire.png' },
  projects: { name: 'Projects', icon: '/win98/folder.webp' },
}

// Flavor text for each app's splash (see WindowsLoader) — shown only the
// first time an app opens in a session (see openApp below), same as the
// window-maximize-on-first-open behavior. Kept short: it's a beat of
// personality on the way in, not something anyone should have to read.
const LOADING_MESSAGES: Record<AppId, string> = {
  advith: 'Booting up advith.exe...',
  blogs: 'Indexing blog posts...',
  gallery: 'Loading photo gallery...',
  credits: 'Rolling the credits...',
  pop: 'Building environment...',
  popReadme: 'Opening the manual...',
  minesweeper: 'Planting mines...',
  solitaire: 'Shuffling the deck...',
  projects: 'Unpacking project files...',
}

// How long each splash stays up. Every app besides advith.exe just uses
// this default — advith.exe doesn't go through this path at all anymore,
// see GLITCH_SPAWN_COUNT/GLITCH_SPAWN_DURATION below and the 'advith'
// branch in openApp.
const LOADING_DURATIONS: Partial<Record<AppId, number>> = {}
const DEFAULT_LOADING_DURATION = 650

// advith.exe's "hacker disruption" open sequence (see openApp below): not
// just the glitch spawns on their own — the whole thing now reads as a
// normal app launch that goes wrong partway through.
//  1. The same calm, single, centered splash every other app gets first
//     (NORMAL_PHASE_RUN_MS of it actually running)...
//  2. ...which then visibly hangs — WindowsLoader's `paused` prop freezes
//     its marquee mid-sweep for NORMAL_PHASE_PAUSE_MS, a beat of
//     something stalling before it's clear this isn't a normal open.
//  3. Then GLITCH_SPAWN_COUNT error splashes spawn across the screen one
//     at a time (GLITCH_SPAWN_DURATION apart) — but unlike before,
//     accumulating (glitchSpawns is an array now, appended to, not a
//     single value each new spawn replaced) so they all stay on screen
//     together instead of each one vanishing as the next appears.
//  4. Once all of them are up, they freeze together too (glitchPaused) —
//     GLITCH_HOLD_MS of every card just sitting there, motionless.
//  5. Only then do they all clear at once, in the same beat the real
//     window actually opens (see openApp below) — nothing disappears
//     one-by-one, it all resolves in a single moment.
const GLITCH_SPAWN_COUNT = 4
const GLITCH_SPAWN_DURATION = 350
const NORMAL_PHASE_RUN_MS = 400
const NORMAL_PHASE_PAUSE_MS = 350
const GLITCH_HOLD_MS = 550
// Kept away from the edges (the loader card is ~288px wide) so it never
// clips off the visible desktop, and out of the very bottom to clear the
// taskbar.
const randomGlitchSpawnPos = () => ({
  left: 12 + Math.random() * 66,
  top: 12 + Math.random() * 56,
})

// Each of advith.exe's three content tabs (Home/Logs/Contact) opens with
// its own "$ >" terminal query, typed out character by character the first
// time advith.exe's window opens (see useTypedQuery below — all three type
// concurrently in the background the moment the window opens, not gated on
// which tab happens to be selected; see that function's comment for why),
// after which that tab's content pops in line by line (see the
// win98-terminal-pop class in globals.css and the .done-gated blocks in
// the JSX). The "$ >" prompt itself is always shown, static — only the
// query text after it types.
const HOME_QUERY_TEXT = 'select about from devs where name=\'Advith Krishnan\';'
const LOGS_QUERY_TEXT = 'select gh_logs from devs where name=\'Advith Krishnan\';'
const CONTACT_QUERY_TEXT = 'select contact_info from devs where name=\'Advith Krishnan\';'
const TYPED_QUERY_CHAR_MS = 40

// See the scroll-linked-parallax comment above bgScrollTop's declaration
// (further down this file) for the full reasoning — this converts pixels
// scrolled into the shader's own world-space units.
const FAULTY_TERMINAL_PARALLAX_SCALE = 0.0006

// "Already finished typing this session" is tracked in two layers, neither
// of them component state:
//  1. completedTypedQueries — an in-memory Set, module-scope. Survives a
//     HomeClient remount within the same page load (e.g. clicking into a
//     blog post navigates to /blogs/[slug], a different page.tsx, which
//     remounts HomeClient and resets all of its plain useState/useRef —
//     see the big comment atop lib/store/windowStore.ts for the same
//     reasoning re: window position/size).
//  2. sessionStorage (COMPLETED_QUERIES_STORAGE_KEY below) — a fallback
//     for whatever this in-memory Set alone didn't actually cover in
//     practice (a first attempt at just the Set above didn't fully fix the
//     "stuck on the cursor" report — sessionStorage is the same mechanism
//     the window-position store already relies on for surviving harder
//     resets, so mirroring it here closes that remaining gap regardless of
//     the exact mechanism).
// Without either, a query that had already finished typing once would
// reset to blank on the next remount and could end up stuck showing just
// the "$ >" prompt and a cursor, never catching back up.
const completedTypedQueries = new Set<string>()
const COMPLETED_QUERIES_STORAGE_KEY = 'win98-typed-queries-done-v1'

function readPersistedCompletedQueries(): string[] {
  try {
    const raw = sessionStorage.getItem(COMPLETED_QUERIES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function persistCompletedQuery(text: string) {
  completedTypedQueries.add(text)
  try {
    const current = new Set(readPersistedCompletedQueries())
    current.add(text)
    sessionStorage.setItem(COMPLETED_QUERIES_STORAGE_KEY, JSON.stringify([...current]))
  } catch { /* private browsing etc. — animation just replays, not worth surfacing an error for */ }
}

// Types `text` out character by character once `active` becomes true, then
// never again this session (see the two-layer "already done" tracking
// above). `active` is just "advith.exe's window is open" (see the call
// sites in HomeClient below) — deliberately NOT also gated on "this is the
// currently selected tab": all three tabs' queries start typing together,
// in the background, the moment the window opens, regardless of which tab
// is actually showing. That keeps this hook's trigger condition simple
// (one dependency, not a tab-match races against local tab-switch state)
// and means switching to a tab you haven't looked at yet still shows its
// intro finishing naturally rather than depending on exactly when you
// happened to switch to it.
function useTypedQuery(text: string, active: boolean) {
  const alreadyDone = completedTypedQueries.has(text)
  const [typed, setTyped] = useState(alreadyDone ? text : '')
  const [done, setDone] = useState(alreadyDone)
  const startedRef = useRef(alreadyDone)

  // Client-only fallback check (sessionStorage isn't touched during the
  // very first render/SSR pass — see the FaultyTerminalBackground.tsx
  // header comment for why touching window-only APIs outside an effect
  // crashes there) for whatever the in-memory Set above didn't already
  // catch on this particular remount.
  useEffect(() => {
    if (startedRef.current) return
    if (readPersistedCompletedQueries().includes(text)) {
      startedRef.current = true
      completedTypedQueries.add(text)
      setTyped(text)
      setDone(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    let i = 0
    const interval = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        persistCompletedQuery(text)
      }
    }, TYPED_QUERY_CHAR_MS)
    return () => clearInterval(interval)
  }, [active, text])

  return { typed, done }
}

// Every AppId needs a reserved grid cell (Record<AppId, ...> requires it),
// but 'credits' never gets a <DesktopIcon /> rendered — see the JSX below.
// It's launched from the taskbar's "Credits" link, not pinned to the desktop.
const DEFAULT_ICON_CELLS: Record<AppId, GridCell> = {
  advith: { col: 0, row: 1 },
  blogs: { col: 0, row: 0 },
  gallery: { col: 0, row: 2 },
  credits: { col: 0, row: 4},
  pop: { col: 0, row: 3 },
  popReadme: { col: 0, row: 5 },
  // Second column, not further down column 0 — each row is 108px
  // (see DesktopIcon's GRID) starting at y=16, so row 6/7 in a single
  // column landed around y=664-772px, which is past the visible desktop
  // on a phone-height screen and got covered by the fixed taskbar.
  minesweeper: { col: 1, row: 0 },
  solitaire: { col: 1, row: 1 },
  projects: { col: 1, row: 2 },
}

// Bumped to v2: moved minesweeper/solitaire from column 0 rows 6-7 to
// column 1 rows 0-1 (row 6-7 rendered behind the taskbar on short/phone
// screens). The sanitize step below only drops keys for AppIds that no
// longer exist — it doesn't reset a *still-valid* id's saved position back
// to a new default, so anyone with an old cached position for these two
// apps would keep seeing them in the broken spot. Bumping the key clears
// all cached positions and starts fresh from the new defaults.
const ICON_POS_KEY = 'desktop-icon-cells-v2'

// Apps that never render a <DesktopIcon /> (see the JSX below) — 'credits'
// and 'popReadme' still need a reserved DEFAULT_ICON_CELLS entry
// (Record<AppId, ...> requires one), but since no icon is ever drawn there,
// that cell must not count as "occupied" in moveIcon's collision check
// below. Otherwise it's an invisible dead cell nothing can ever be dropped
// on or swapped with — which is exactly the "glitched cell" bug this fixes.
const NO_DESKTOP_ICON: AppId[] = ['credits', 'popReadme']

export default function HomeClient({
  notes,
  featured,
  forceOpenApp,
  blogsView = { mode: 'list' },
  reportView,
  initialHomeTab = 'home',
}: HomeClientProps) {
  // Which app (if any) is showing its loading splash right now — see
  // WindowsLoader and the LOADING_MESSAGES/LOADING_DURATIONS registry above.
  const [loadingApp, setLoadingApp] = useState<AppId | null>(null)
  // advith.exe's multi-spawn glitch splash (see GLITCH_SPAWN_COUNT above) —
  // separate from loadingApp/single-splash path above since several of
  // these accumulate on screen together rather than one dialog sitting
  // centered. An array (not a single nullable spawn) specifically so each
  // new one appends instead of replacing the last — see the openApp
  // comment for why that matters now. glitchPaused freezes all of them in
  // place for a beat once every spawn is up, before they clear together.
  const [glitchSpawns, setGlitchSpawns] = useState<{ left: number; top: number }[]>([])
  const [glitchPaused, setGlitchPaused] = useState(false)
  // Freezes the normal single splash's marquee mid-sweep partway through
  // advith.exe's open sequence (see openApp) — never set true for any
  // other app, so this piggybacking on the shared `loadingApp` splash
  // below is safe.
  const [loadingPaused, setLoadingPaused] = useState(false)
  // Small rotating pool of the same error chime ErrorWindow's 404 dialog
  // uses (see components/ErrorWindow.tsx) — one per glitch spawn, so
  // overlapping plays (a new spawn firing before the previous chime
  // finishes) don't cut each other off. Created once on mount, same
  // pattern as SoundEffects.tsx's click-sound pool.
  const glitchAudioPoolRef = useRef<HTMLAudioElement[]>([])
  const glitchAudioIndexRef = useRef(0)
  useEffect(() => {
    glitchAudioPoolRef.current = Array.from(
      { length: GLITCH_SPAWN_COUNT },
      () => new Audio('/win98/windows_error_sound.mp3')
    )
  }, [])
  const playGlitchSound = useCallback(() => {
    const pool = glitchAudioPoolRef.current
    if (pool.length === 0) return
    const audio = pool[glitchAudioIndexRef.current]
    glitchAudioIndexRef.current = (glitchAudioIndexRef.current + 1) % pool.length
    audio.currentTime = 0
    audio.play().catch(() => { /* blocked until a real gesture — opening an app already is one */ })
  }, [])
  // Best-effort visitor IP for the About tab's little "I know your IP"
  // easter egg — fetched client-side from /api/ip (see that route) rather
  // than read server-side in every page.tsx that renders this component,
  // which would force all of them off static generation just for this one
  // decorative line. Stays null (line doesn't render) until/unless this
  // resolves — never blocks anything else on the page.
  const [visitorIp, setVisitorIp] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data: { ip: string | null }) => {
        if (!cancelled) setVisitorIp(data.ip)
      })
      .catch(() => { /* easter egg, not worth surfacing an error for */ })
    return () => {
      cancelled = true
    }
  }, [])
  // advith.exe's Home/About/Contact/Report tabs — local state, no navigation
  // involved for switching tabs directly (see Navbar). Seeded from whichever
  // route we landed on.
  const [homeTab, setHomeTab] = useState<HomeTab>(initialHomeTab)
  // Re-seeds homeTab whenever the initialHomeTab PROP actually changes —
  // matters for the persistent shell instance (see components/
  // AppShellHost.tsx, mounted once from app/layout.tsx for '/', '/about',
  // '/contact', '/blogs', '/credits'): navigating between those routes no
  // longer remounts HomeClient, so without this the tab would just stay
  // wherever it was left instead of landing on the new route's tab. Keyed
  // on the prop value (not a plain mount-only effect) so it only re-fires
  // on an actual route change, never when the user just clicks a different
  // tab locally without navigating — that would otherwise get stomped back
  // to initialHomeTab on every unrelated re-render. For the other routes
  // (/blogs/[slug], /reports/[slug], which still mount their own fresh
  // HomeClient per navigation — see AppShellHost.tsx), this just fires
  // once on mount with the same value the useState above already seeded,
  // a harmless no-op extra render.
  useEffect(() => {
    setHomeTab(initialHomeTab)
  }, [initialHomeTab])
  const router = useRouter()
  const pathname = usePathname()

  // ---- Window manager state ---------------------------------------------------
  // Lives in a zustand store (not useState) so window position/size,
  // open/minimized/z-order and taskbar order survive navigating away from
  // "/" (which unmounts this component) and back.
  const wins = useWindowStore(s => s.wins)
  const taskOrder = useWindowStore(s => s.taskOrder)
  const registerApp = useWindowStore(s => s.registerApp)
  const focusApp = useWindowStore(s => s.focusApp)
  const storeMinimizeApp = useWindowStore(s => s.minimizeApp)
  const storeCloseApp = useWindowStore(s => s.closeApp)
  const setRect = useWindowStore(s => s.setRect)
  const toggleMaximize = useWindowStore(s => s.toggleMaximize)
  const setTaskOrder = useWindowStore(s => s.setTaskOrder)

  // Each tab's typed "$ >" query + the content reveal it gates — see
  // useTypedQuery above. Kept at this top level (not scoped inside each
  // tab's own JSX branch, which unmounts/remounts on every tab switch) so
  // each intro plays exactly once per session. Deliberately gated on just
  // advithOpen — NOT also `homeTab === '...'` — so all three tabs' queries
  // start typing together in the background the instant advith.exe's
  // window is open, regardless of which tab happens to be selected at
  // that moment. Whichever tab you're looking at (or switch to) just shows
  // whatever that query's progress already is.
  const advithOpen = wins.advith.status !== 'closed'
  const { typed: homeQueryTyped, done: homeQueryDone } = useTypedQuery(HOME_QUERY_TEXT, advithOpen)
  const { typed: logsQueryTyped, done: logsQueryDone } = useTypedQuery(LOGS_QUERY_TEXT, advithOpen)
  const { typed: contactQueryTyped, done: contactQueryDone } = useTypedQuery(CONTACT_QUERY_TEXT, advithOpen)

  // Scroll-linked parallax for the faulty-terminal backdrop (see the
  // background layer in the JSX below): each tab's own overflow-y-auto
  // scroll container reports its scrollTop here via onScroll, converted
  // into a world-space offset the shader itself samples at (see
  // FaultyTerminalBackground's uScrollOffset uniform) — NOT a CSS
  // transform on an oversized DOM element like this used to be. That
  // approach was bounded by however much extra canvas got pre-rendered
  // above/below the viewport (a fixed overscan), so it broke — a bare
  // edge showing through — once a tab's content scrolled deeper than that
  // budget, which is exactly what started happening once the Home tab
  // grew past a single dossier (see the story chapters below). Feeding
  // the offset into the shader instead is unbounded by construction: the
  // pattern is a continuous procedural function of world-space position,
  // not a finite pre-rendered image, so it keeps working identically no
  // matter how much taller a tab's content gets in the future — nothing
  // here needs to change again as more sections get added.
  //
  // This used to be React state (setBgScrollTop on every scroll event),
  // which re-rendered this entire component — every open window, the
  // whole story-chapters section, all of it — on every single scroll
  // tick, just to push one number into a shader uniform. That's what was
  // behind the site feeling sluggish while scrolling. It's a ref + the
  // shader's own imperative handle instead now (see
  // FaultyTerminalBackgroundHandle): the value still updates every scroll
  // event, but it writes straight into the shader's RAF loop with zero
  // React re-renders anywhere.
  //
  // FAULTY_TERMINAL_PARALLAX_SCALE converts "pixels scrolled" into "shader
  // world-space units" — picked to feel similar in speed to the old
  // 0.12px-of-DOM-translation-per-1px-scrolled version, but tuned by eye
  // against the shader's own coordinate space (uScale/uGridMul in
  // FaultyTerminalBackground.tsx) rather than screen pixels, so it isn't
  // a direct conversion. Adjust this one constant if the parallax ever
  // needs to feel faster/slower — nothing else needs to change.
  const faultyTerminalRef = useRef<FaultyTerminalBackgroundHandle>(null)

  // Hidden "easter egg" zone above the Home tab's normal starting position
  // (see the JSX below, and the layout effect further down that scrolls
  // past it on every Home-tab mount so the tab still *looks* like it did
  // before this existed) — scrolling up past what looks like the top
  // reveals it: a gallery of placeholder frames (see
  // components/ImageExhibition.tsx) that the faulty-terminal backdrop
  // gradually washes from black toward white/pink as you go, imperatively
  // (easterEggWashRef's opacity, set directly in handleTabScroll below) —
  // same reasoning as faultyTerminalRef just above: this updates on every
  // scroll event, so it goes through a ref instead of React state to avoid
  // re-rendering this whole component on every tick.
  //   homeScrollRef       — the Home tab's own scroll container.
  //   homeContentStartRef — the div holding everything the tab shows
  //                         today (dossier + chapters) — its top edge,
  //                         once scrolled flush against homeScrollRef's
  //                         own top, IS "the starting position".
  //   easterEggWashRef    — the white/pink overlay inside the hidden zone;
  //                         opacity 0 at the starting position, 1 at the
  //                         very top of the scrollable range.
  //   startingScrollTopRef — the exact scrollTop that lines up with
  //                          homeContentStartRef's top edge, computed once
  //                          per Home-tab mount (see the layout effect) and
  //                          reused every scroll tick to turn raw scrollTop
  //                          into a 0–1 reveal progress without re-doing
  //                          any DOM measurement per scroll event.
  const homeScrollRef = useRef<HTMLDivElement>(null)
  const homeContentStartRef = useRef<HTMLDivElement>(null)
  const easterEggWashRef = useRef<HTMLDivElement>(null)
  const startingScrollTopRef = useRef(0)

  const handleTabScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    faultyTerminalRef.current?.setScrollOffset(scrollTop * FAULTY_TERMINAL_PARALLAX_SCALE)

    // No-ops on every tab besides Home (easterEggWashRef only exists while
    // the Home tab's hidden zone is mounted) — safe to leave unguarded by
    // homeTab for the same reason faultyTerminalRef's call above is.
    const washEl = easterEggWashRef.current
    const resting = startingScrollTopRef.current
    if (washEl && resting > 0) {
      const progress = Math.max(0, Math.min(1, 1 - scrollTop / resting))
      washEl.style.opacity = String(progress)
    }
  }, [])
  useEffect(() => {
    faultyTerminalRef.current?.setScrollOffset(0)
  }, [homeTab])

  // Establishes "the starting position" every time the Home tab mounts —
  // scrolls homeContentStartRef flush to the top of homeScrollRef (exactly
  // where it would sit if the hidden zone above it didn't exist) and
  // records that scrollTop for handleTabScroll's progress math above.
  // useLayoutEffect (not useEffect) specifically so this happens before
  // the browser paints — a plain useEffect would let the hidden zone flash
  // into view for a frame first, on every single tab switch to Home.
  //
  // Also keyed on advithOpen, not just homeTab: homeTab already defaults
  // to 'home' from the very first render (useState(initialHomeTab)), so
  // on a normal desktop-icon open there's no actual *change* to homeTab
  // for this effect to react to — advith.exe's window (and everything
  // inside it, including homeScrollRef/homeContentStartRef) doesn't even
  // exist in the DOM yet at that point, since Win98Window only mounts its
  // content once wins.advith.status !== 'closed'. Without advithOpen
  // here, this effect's one and only run (on mount) would hit the early
  // `!scrollEl || !startEl` return below and never fire again once the
  // window actually opens and those refs populate — which is exactly
  // what left the tab sitting at the hidden zone (scrollTop 0) instead of
  // the real starting position, and, as a side effect, kept
  // startingScrollTopRef stuck at its initial 0 forever — handleTabScroll
  // only updates the wash's opacity when `resting > 0`, so the wash never
  // got a chance to work either. Advith.exe's own open sequence delays
  // the window actually appearing anyway (see openApp/GLITCH_SPAWN_COUNT
  // above), so this firing a beat after mount is invisible in practice.
  useLayoutEffect(() => {
    if (homeTab !== 'home') return
    const scrollEl = homeScrollRef.current
    const startEl = homeContentStartRef.current
    if (!scrollEl || !startEl) return
    const scrollRect = scrollEl.getBoundingClientRect()
    const startRect = startEl.getBoundingClientRect()
    scrollEl.scrollTop += startRect.top - scrollRect.top
    startingScrollTopRef.current = scrollEl.scrollTop
    if (easterEggWashRef.current) easterEggWashRef.current.style.opacity = '0'
  }, [homeTab, advithOpen])

  // Minesweeper isn't resizable at all (see resizable={false} below) — like
  // the real game, its window always fits the current difficulty's board
  // exactly. This tracks that exact size and, once the window has an
  // explicit rect (i.e. the user has dragged it at least once), keeps the
  // rect's w/h in lockstep with every difficulty change while leaving its
  // x/y (position) alone. Before the first drag, defaultSize below drives
  // the size directly, so this state is what actually resizes the window
  // when you switch difficulty.
  const [minesweeperMinSize, setMinesweeperMinSize] = useState({ w: 360, h: 240 })
  const handleMinesweeperMinSize = (size: { w: number; h: number }) => {
    setMinesweeperMinSize(size)
    const current = wins.minesweeper.rect
    if (current && (current.w !== size.w || current.h !== size.h)) {
      const maxW = window.innerWidth
      const maxH = window.innerHeight - 43 // Win98Window's TASKBAR_H
      setRect('minesweeper', {
        ...current,
        w: Math.min(size.w, maxW),
        h: Math.min(size.h, maxH),
      })
    }
  }

  // Pull persisted window state back in from sessionStorage after mount
  // (skipped automatically during SSR/first paint to avoid a hydration
  // mismatch — see skipHydration in lib/store/windowStore.ts).
  useEffect(() => {
    useWindowStore.persist.rehydrate()
  }, [])

  const focusedId = (Object.entries(wins) as [AppId, WinState][])
    .filter(([, w]) => w.status === 'open')
    .sort((a, b) => b[1].z - a[1].z)[0]?.[0]

  const openApp = useCallback(async (id: AppId) => {
    registerApp(id)
    // Splash only on a genuinely fresh open (closed -> open), same rule as
    // the window-maximize-on-first-open behavior — reading getState()
    // directly instead of a reactive `wins` dependency keeps this callback's
    // identity stable across the frequent window-store updates (drag/resize)
    // that don't actually need to retrigger it.
    if (useWindowStore.getState().wins[id].status === 'closed') {
      if (id === 'advith') {
        // advith.exe's open sequence — see the big comment above
        // GLITCH_SPAWN_COUNT for the full five-step shape of this. Only
        // once it's all played out does the real window open (focusApp
        // below).
        setLoadingApp('advith')
        await new Promise(resolve => setTimeout(resolve, NORMAL_PHASE_RUN_MS))
        setLoadingPaused(true)
        await new Promise(resolve => setTimeout(resolve, NORMAL_PHASE_PAUSE_MS))
        setLoadingApp(null)
        setLoadingPaused(false)

        for (let i = 0; i < GLITCH_SPAWN_COUNT; i++) {
          setGlitchSpawns(prev => [...prev, randomGlitchSpawnPos()])
          playGlitchSound()
          await new Promise(resolve => setTimeout(resolve, GLITCH_SPAWN_DURATION))
        }
        setGlitchPaused(true)
        await new Promise(resolve => setTimeout(resolve, GLITCH_HOLD_MS))
        setGlitchSpawns([])
        setGlitchPaused(false)
      } else {
        setLoadingApp(id)
        await new Promise(resolve => setTimeout(resolve, LOADING_DURATIONS[id] ?? DEFAULT_LOADING_DURATION))
        setLoadingApp(null)
      }
    }
    focusApp(id)
  }, [focusApp, registerApp, playGlitchSound])

  const minimizeApp = storeMinimizeApp
  const closeApp = storeCloseApp

  // Closing the Blogs window while sitting on a /blogs or /blogs/[slug] route
  // needs to also reset the URL back to "/". Otherwise the URL stays put,
  // and clicking a link back to that same /blogs/[slug] post (e.g. a report
  // row in ContributorArchive) is a no-op — Next.js only re-triggers
  // navigation (and the forceOpenApp effect that opens the window) when the
  // URL actually changes. Plain desktop-icon opens go through focusApp
  // directly and never touch the URL, so they're unaffected.
  const closeBlogsApp = useCallback(() => {
    closeApp('blogs')
    if (pathname?.startsWith('/blogs')) {
      router.push('/')
    }
  }, [closeApp, pathname, router])

  // Report tab's "Back to Logs" button (see ReportViewer.tsx) — reports
  // aren't their own window/app anymore (see homeTab === 'report' below),
  // so there's no window to close, just the tab to switch back to. Goes to
  // 'about' (relabeled "Logs" in the navbar — see Navbar.tsx), not 'home':
  // that's where ContributorArchive and the report link itself live, so
  // that's the natural place to land back on. If we arrived via a real
  // /reports/[slug] URL, also needs the same URL-reset closeBlogsApp above
  // does: otherwise the URL stays put and clicking the same report link
  // again from ContributorArchive would be a no-op.
  const backToLogsFromReport = useCallback(() => {
    setHomeTab('about')
    // Push to '/about' specifically, not '/' — navigating between two
    // different page.tsx routes remounts HomeClient (App Router doesn't
    // preserve client state across a page-segment swap the way it does
    // within a single page), which would blow away the setHomeTab('about')
    // above and reseed from initialHomeTab instead. '/' seeds 'home';
    // '/about' seeds 'about' (see app/about/page.tsx) — matching where
    // this button is actually supposed to land, whether or not a remount
    // happens.
    if (pathname?.startsWith('/reports')) {
      router.push('/about')
    }
  }, [pathname, router])

  // Taskbar click: minimize when focused, restore + focus otherwise (win98 rule)
  const handleTaskbarClick = (id: string) => {
    const appId = id as AppId
    if (wins[appId].status === 'open' && focusedId === appId) {
      minimizeApp(appId)
    } else {
      focusApp(appId)
    }
  }

  // ---- Desktop icon grid ------------------------------------------------------
  const [iconCells, setIconCells] = useState<Record<AppId, GridCell>>(DEFAULT_ICON_CELLS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ICON_POS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only keep keys that are still valid AppIds. Renaming an AppId
        // (e.g. the old 'doom'/'doomReadme' → 'pop'/'popReadme') leaves the
        // stale key sitting in this saved blob forever — blindly spreading
        // it back in re-introduces an invisible phantom occupant in the
        // collision map below. That's what caused the "credits cell
        // glitch" to resurface: the NO_DESKTOP_ICON fix itself was fine,
        // it just doesn't know about IDs that no longer exist.
        const sanitized = Object.fromEntries(
          Object.entries(parsed).filter(([id]) => id in DEFAULT_ICON_CELLS)
        )
        setIconCells({ ...DEFAULT_ICON_CELLS, ...sanitized })
      }
    } catch { /* corrupted storage: keep defaults */ }
  }, [])

  const moveIcon = (id: string, cell: GridCell) => {
    const appId = id as AppId
    setIconCells(prev => {
      // Win98 collision rule: occupied cell → take nearest free cell below
      const occupied = (c: GridCell) =>
        (Object.entries(prev) as [AppId, GridCell][]).some(
          ([other, oc]) =>
            other !== appId &&
            !NO_DESKTOP_ICON.includes(other) &&
            oc.col === c.col &&
            oc.row === c.row
        )
      let target = cell
      while (occupied(target)) target = { col: target.col, row: target.row + 1 }
      const next = { ...prev, [appId]: target }
      try { localStorage.setItem(ICON_POS_KEY, JSON.stringify(next)) } catch { /* private mode */ }
      return next
    })
  }

  // ---- Misc desktop behavior --------------------------------------------------
  // Reports now show up in both the Blogs app and the Contributor Archive
  // (see ExplorerBlogList/ContributorArchive), so a new one red-dots both
  // icons — hasNewBlog covers everything published in the last 7 days,
  // hasNewReport is the Reports-only subset for advith.exe's icon.
  const hasNewBlog = notes.some(
    note => new Date(note.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  const hasNewReport = notes.some(
    note => note.tag === 'Reports' && new Date(note.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  const hasNewHighlight = highlights.some(
    photo => new Date(photo.uploaded_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  // Swap the desktop icon to a folder full of pages once there's actually
  // something in it — an empty folder icon for a folder with projects in it
  // would be a little misleading.
  const hasProjects = projects.length > 0

  // Mobile check (≤640px): the games (Prince of Persia, Minesweeper,
  // Solitaire) all break down badly on a phone-sized touch screen, so on
  // mobile their icons are disabled — tapping shows a tooltip instead of
  // opening. Kept generic (not "needs a keyboard") since Minesweeper/
  // Solitaire are touch-capable in principle, just not at this window size.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const GAME_MOBILE_MESSAGE: Partial<Record<AppId, string>> = {
    pop: '🖥️ Prince of Persia is best played on a desktop.',
    minesweeper: '🖥️ Minesweeper is best played on a desktop.',
    solitaire: '🖥️ Solitaire is best played on a desktop.',
  }
  const [gameMobileTooltip, setGameMobileTooltip] = useState<AppId | null>(null)
  const gameTooltipTimer = useRef<NodeJS.Timeout | null>(null)
  const handleGameOpen = (id: AppId) => {
    if (!isMobile) {
      openApp(id)
      return
    }
    setGameMobileTooltip(id)
    if (gameTooltipTimer.current) clearTimeout(gameTooltipTimer.current)
    gameTooltipTimer.current = setTimeout(() => setGameMobileTooltip(null), 3500)
  }
  useEffect(() => () => {
    if (gameTooltipTimer.current) clearTimeout(gameTooltipTimer.current)
  }, [])

  // First-visit hint (once per session)
  const [showHint, setShowHint] = useState(false)
  const anyOpen =
    wins.advith.status !== 'closed' ||
    wins.blogs.status !== 'closed' ||
    wins.gallery.status !== 'closed' ||
    wins.credits.status !== 'closed' ||
    wins.pop.status !== 'closed' ||
    wins.popReadme.status !== 'closed' ||
    wins.minesweeper.status !== 'closed' ||
    wins.solitaire.status !== 'closed' ||
    wins.projects.status !== 'closed'
  useEffect(() => {
    if (anyOpen || sessionStorage.getItem('desktop-hint-shown')) return
    const timer = setTimeout(() => {
      setShowHint(true)
      sessionStorage.setItem('desktop-hint-shown', '1')
    }, 3000)
    const dismiss = () => {
      clearTimeout(timer)
      setShowHint(false)
    }
    window.addEventListener('pointerdown', dismiss)
    window.addEventListener('keydown', dismiss)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [anyOpen])

  // Deep links: /?app=open (or /?app=advith) → advith window, /?app=blogs →
  // blogs window. Any other page (e.g. ErrorWindow, or old bookmarked links)
  // that still routes in with these query strings keeps working — but once
  // consumed, drop the query so the URL settles back to plain "/", same as
  // clicking an icon. (Contact/Credits/Reports route in via forceOpenApp +
  // initialHomeTab instead — see app/contact, app/credits, app/reports.)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const app = searchParams.get('app')
    if (app === 'open' || app === 'advith') {
      // focusApp registers the window on the taskbar as well as opening it
      focusApp('advith')
    } else if (app === 'blogs') {
      focusApp('blogs')
    }
    if (app) {
      window.history.replaceState({}, '', '/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // /blogs and /blogs/[slug] pass forceOpenApp="blogs" so those routes land
  // with the Blogs window already open — no query string involved, unlike
  // the deep link above, so this doesn't touch the URL at all. Keyed on
  // forceOpenApp itself (not mount-only) for the same reason as the
  // initialHomeTab effect above: the persistent shell instance (see
  // components/AppShellHost.tsx) needs this to re-fire when navigating to
  // a different shell route passes a new forceOpenApp value, not just
  // once ever. Only ever OPENS/focuses — never closes — so navigating to a
  // route with no forceOpenApp (e.g. '/') doesn't auto-close whatever's
  // already open, consistent with the window store's own "stuff you
  // opened stays open" persistence. focusApp is a zustand action selector,
  // stable across renders, so this doesn't re-fire on unrelated updates.
  useEffect(() => {
    if (forceOpenApp) focusApp(forceOpenApp)
  }, [forceOpenApp, focusApp])

  // Morphing animation for roles with cryptic letters
  const roles = [
    "AI engineer",
    "AI researcher",
    "Software dev",
    "Full stack dev"
  ];
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState(roles[0]);
  const morphing = useRef(false);

  const randomChar = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  useEffect(() => {
    let morphTimeout: NodeJS.Timeout;
    let revealTimeout: NodeJS.Timeout;
    let holdTimeout: NodeJS.Timeout;

    const morphTo = roles[(roleIndex + 1) % roles.length];
    morphing.current = true;

    let morphFrame = 0;
    const morphFrames = 500 / 40;
    const morph = () => {
      setDisplayText(() => {
        let cryptic = '';
        for (let i = 0; i < morphTo.length; i++) {
          cryptic += randomChar();
        }
        return cryptic;
      });
      morphFrame++;
      if (morphFrame < morphFrames) {
        morphTimeout = setTimeout(morph, 40);
      } else {
        let revealFrame = 0;
        const reveal = () => {
          setDisplayText(() => {
            let revealed = '';
            for (let i = 0; i < morphTo.length; i++) {
              if (i <= revealFrame) {
                revealed += morphTo[i];
              } else {
                revealed += randomChar();
              }
            }
            return revealed;
          });
          if (revealFrame < morphTo.length - 1) {
            revealFrame++;
            revealTimeout = setTimeout(reveal, 40);
          } else {
            setDisplayText(morphTo);
            holdTimeout = setTimeout(() => {
              setRoleIndex((prev) => (prev + 1) % roles.length);
              morphing.current = false;
            }, 2000);
          }
        };
        reveal();
      }
    };
    morph();

    return () => {
      clearTimeout(morphTimeout);
      clearTimeout(revealTimeout);
      clearTimeout(holdTimeout);
    };
    // eslint-disable-next-line
  }, [roleIndex]);

  const taskbarApps = taskOrder
    .filter(id => wins[id].status !== 'closed')
    .map(id => ({
      id,
      name: APPS[id].name,
      icon: APPS[id].icon,
      isActive: wins[id].status === 'open' && focusedId === id,
    }))

  return (
    <>
      <div
        className="h-screen p-4 pb-16 overflow-hidden relative"
        style={{
          backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
      {/* Desktop icons: draggable, snap to invisible grid, order persisted */}
      <DesktopIcon
        id="blogs"
        label="Blogs"
        icon={APPS.blogs.icon}
        cell={iconCells.blogs}
        showBadge={hasNewBlog}
        isActive={wins.blogs.status !== 'closed'}
        onOpen={() => openApp('blogs')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="gallery"
        label="Gallery"
        icon={APPS.gallery.icon}
        cell={iconCells.gallery}
        showBadge={hasNewHighlight}
        isActive={wins.gallery.status !== 'closed'}
        onOpen={() => openApp('gallery')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="advith"
        label="advith.exe"
        icon={APPS.advith.icon}
        cell={iconCells.advith}
        showBadge={hasNewReport}
        isActive={wins.advith.status !== 'closed'}
        priority
        onOpen={() => openApp('advith')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="pop"
        label="Prince of Persia"
        icon={APPS.pop.icon}
        cell={iconCells.pop}
        isActive={wins.pop.status !== 'closed'}
        disabled={isMobile}
        onOpen={() => handleGameOpen('pop')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="minesweeper"
        label="Minesweeper"
        icon={APPS.minesweeper.icon}
        cell={iconCells.minesweeper}
        isActive={wins.minesweeper.status !== 'closed'}
        disabled={isMobile}
        priority
        onOpen={() => handleGameOpen('minesweeper')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="solitaire"
        label="Solitaire"
        icon={APPS.solitaire.icon}
        cell={iconCells.solitaire}
        isActive={wins.solitaire.status !== 'closed'}
        disabled={isMobile}
        onOpen={() => handleGameOpen('solitaire')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="projects"
        label="Projects"
        icon={hasProjects ? '/win98/folder-full.png' : APPS.projects.icon}
        cell={iconCells.projects}
        isActive={wins.projects.status !== 'closed'}
        onOpen={() => openApp('projects')}
        onMove={moveIcon}
      />

      {/* Mobile-only: tapping a disabled game icon explains why instead of
          silently doing nothing. */}
      {gameMobileTooltip && (
        <div
          role="status"
          className="absolute z-[60] px-2 py-1 text-xs text-black pointer-events-none max-w-[230px]"
          style={{
            left: cellToPx(iconCells[gameMobileTooltip]).left,
            top: cellToPx(iconCells[gameMobileTooltip]).top + 100,
            backgroundColor: '#ffffe1',
            border: '1px solid #000000',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
          }}
        >
          {GAME_MOBILE_MESSAGE[gameMobileTooltip]}
        </div>
      )}

      {/* Win98 tooltip hint for first-time visitors */}
      {showHint && !anyOpen && (
        <div
          role="status"
          className="absolute left-32 top-8 z-30 px-2 py-1 text-sm text-black pointer-events-none"
          style={{
            backgroundColor: '#ffffe1',
            border: '1px solid #000000',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
          }}
        >
          💡 You can drag the apps around and click to open them!
        </div>
      )}

      {/* ---- advith.exe window ---- */}
      {wins.advith.status !== 'closed' && (
        <Win98Window
          title="advith.exe"
          icon={APPS.advith.icon}
          zIndex={40 + wins.advith.z}
          minimized={wins.advith.status === 'minimized'}
          isFocused={focusedId === 'advith'}
          maximized={wins.advith.maximized}
          defaultInset={{ top: 5, right: 5, bottom: 43, left: 5 }}
          defaultSize={{ w: 860, h: 580 }}
          // The About tab's bio+photo block is short and centers itself
          // (see homeTab === 'about' below) rather than stretching to fill
          // the window, so a very large window just means more faulty-
          // terminal backdrop showing around it — still, this caps how
          // large that gets.
          maxSize={{ w: 1100, h: 760 }}
          // advith.exe now auto-maximizes on first open like every other
          // app (see SKIP_AUTO_MAXIMIZE in windowStore.ts) — cardOffset
          // below only matters for wherever it restores to after the user
          // manually un-maximizes it, not the very first open anymore.
          cardOffset={{ x: 220, y: -10 }}
          rect={wins.advith.rect}
          onRectChange={(r) => setRect('advith', r)}
          onFocus={() => focusApp('advith')}
          onMinimize={() => minimizeApp('advith')}
          onToggleMaximize={() => toggleMaximize('advith')}
          onClose={() => closeApp('advith')}
        >
            <Navbar activeTab={homeTab} onTabChange={setHomeTab} />
          <div className="relative flex-1 win98-window-content flex flex-col bg-[#222222] overflow-hidden">
            {/* Faulty-terminal shader backdrop (see FaultyTerminalBackground.tsx)
                — Home/About/Contact only, not the Report tab: a report is
                meant to be read cleanly, same reasoning as blog posts never
                getting a decorative backdrop either. Dimmed well below the
                component's own default brightness (0.6) so it stays a quiet
                backdrop instead of competing with the foreground text.
                Exactly viewport-sized (inset-0), no CSS transform — the
                scroll-linked parallax is a shader uniform now, driven
                imperatively through faultyTerminalRef (see the comment
                above handleTabScroll), which is what makes it keep working
                no matter how far the user scrolls or how much taller a
                tab's content gets, with no re-render cost. */}
            {homeTab !== 'report' && (
              <div className="absolute inset-0 bg-black">
                <FaultyTerminalBackground ref={faultyTerminalRef} brightness={0.3} />
              </div>
            )}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
            {homeTab === 'contact' ? (
              // overflow-y-auto on the OUTER div only — no flex/centering
              // there. Centering instead lives on an INNER div sized
              // min-h-full: that only pulls content to the middle when it's
              // shorter than the viewport. When it's taller (small/restored
              // window), min-h-full is just a floor, not a cap, so the box
              // grows past it and renders top-anchored with normal scrolling
              // instead of clipping its top edge unreachably. (Centering
              // directly on a scrollable flex container clips/hides
              // whatever's taller than the container and offset above the
              // fold — that's not reachable by scrolling in any browser.)
              <div className="flex-1 min-h-0 overflow-y-auto pt-4 px-4 pb-16" onScroll={handleTabScroll}>
                <div className="min-h-full flex flex-col items-center justify-center">
                  {/* Same typed "$ >" terminal-query intro as Home/Logs (see
                      useTypedQuery above) — CONTACT_QUERY_TEXT here. Shares
                      ContactView's own max-w-3xl mx-auto width via its own
                      identical wrapper below, so their left edges line up.
                      ContactView itself gates and staggers its own content
                      on the `revealed` prop — see ContactView.tsx. */}
                  <div className="max-w-3xl w-full mx-auto mb-4">
                    <h1 className="text-white text-lg font-bold text-left font-mono">
                        $ &gt; {contactQueryTyped}
                        {!contactQueryDone && (
                          <span
                            className="inline-block w-2 h-5 bg-[#00FF00] ml-0.5 align-middle animate-pulse"
                            aria-hidden="true"
                          />
                        )}
                    </h1>
                  </div>
                  <ContactView featured={featured} revealed={contactQueryDone} />
                </div>
              </div>
            ) : homeTab === 'report' ? (
              reportView ? (
                <ReportViewer
                  note={reportView.note}
                  content={reportView.content}
                  onBackToLogs={backToLogsFromReport}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <p className="text-white text-sm italic">No report loaded.</p>
                </div>
              )
            ) : homeTab === 'about' ? (
            // 'about' tab id kept as-is internally (see Navbar's HomeTab
            // type) but relabeled "Logs" there — this now holds what used to
            // be the Home tab's content: live GitHub activity feed + report
            // archive. The profile/bio dossier moved to Home (see the
            // default branch below) so a first-time visitor lands on
            // Advith, not a commit graph. Same min-h-full scroll-fix pattern
            // as Contact above.
            <div className="flex-1 min-h-0 overflow-y-auto pt-4 px-4 pb-16" onScroll={handleTabScroll}>
                <div className="min-h-full flex flex-col items-center justify-center">
                  <div className="max-w-3xl w-full">
                  {/* Same typed "$ >" terminal-query intro as Home (see
                      useTypedQuery above) — the query text is LOGS_QUERY_TEXT
                      here. The section below only mounts once logsQueryDone,
                      each piece popping in on its own stagger, same
                      win98-terminal-pop pattern as Home's profile row. */}
                  <h1 className="text-white text-lg font-bold text-left font-mono mb-4">
                      $ &gt; {logsQueryTyped}
                      {!logsQueryDone && (
                        <span
                          className="inline-block w-2 h-5 bg-[#00FF00] ml-0.5 align-middle animate-pulse"
                          aria-hidden="true"
                        />
                      )}
                  </h1>
                  {logsQueryDone && (
                  <>
                  <h2 className="text-white text-2xl font-bold mb-2 win98-terminal-pop" style={{ animationDelay: '0ms' }}>
                      Contributor Activity <span className="text-sky-200"><a href="https://github.com/Diacod-I">@Diacod-I</a></span>
                  </h2>
                  <div className="text-gray-300 mb-4 win98-terminal-pop" style={{ animationDelay: '70ms' }}>
                      "Look at that subtle graph optimization pass. The tasteful vectorized register reuse of it. Oh my God, it even has statically scheduled memory-safe kernel fusion."<p className="text-end mb-2">— American Psycho prolly</p>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="win98-terminal-pop" style={{ animationDelay: '140ms' }}>
                      <GithubContributionGraph />
                    </div>
                    <div className="win98-terminal-pop" style={{ animationDelay: '210ms' }}>
                      <ContributorArchive notes={notes} />
                    </div>
                  </div>
                  </>
                  )}
                  </div>
                </div>
            </div>
            ) : (
            // Home (default): the profile/bio dossier, laid out "suspect
            // file" style — photo alone in the left column, title + tagline
            // + bio stacked together in the right column (sm:flex-row;
            // stacks photo-above-text on narrow/mobile widths where there's
            // no room for two columns). Same min-h-full scroll-fix pattern
            // as Contact/Logs above, except the top padding is much taller
            // here — pt-[max(1rem,15vh)] instead of the plain pt-4 the
            // other tabs use — so the very first thing you see lands around
            // the upper-middle of the window instead of flush against its
            // top edge (this tab is tall enough now, with the story
            // chapters below, that min-h-full's own centering never
            // actually kicks in — it's a floor, not a cap, so without this
            // the content would otherwise start right at the top). The
            // max(...) is a floor for short/restored windows where 15vh
            // would be cramped.
            <div
              ref={homeScrollRef}
              className="flex-1 min-h-0 overflow-y-auto pt-[max(1rem,8vh)] px-4 pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onScroll={handleTabScroll}
            >
                {/* Hidden "easter egg" zone — see the refs/comments above
                    handleTabScroll (further up this file) for the full
                    mechanics. The layout effect there scrolls straight
                    past this on every Home-tab mount, so by default the
                    tab still looks exactly like it did before this
                    existed; only scrolling up past what looks like the
                    top reveals it. Full window width (outside the
                    max-w-2xl reading column below) for the "gallery wall"
                    feel — see components/ImageExhibition.tsx for the
                    scattered placeholder frames. The scrollbar itself is
                    hidden on this whole container (see the
                    [scrollbar-width...]/[&::-webkit-scrollbar] classes
                    above) — a normal scrollbar's thumb would visibly show
                    there's more content above the "top", giving the whole
                    thing away before anyone actually scrolls up. */}
                <div className="relative w-full min-h-[110vh] overflow-hidden">
                  <div
                    ref={easterEggWashRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: 0,
                      background: 'linear-gradient(to bottom, #ffffff 0%, #ffd6e6 100%)',
                    }}
                    aria-hidden
                  />
                  <ImageExhibition />
                </div>
                <div ref={homeContentStartRef} className="min-h-full flex flex-col items-center justify-center">
                  {/* Both the heading and the photo+bio row share this same
                      max-w-2xl w-full column so "Database Query" lines up
                      flush with the left edge of the dossier block below it,
                      instead of being centered against the whole pane
                      (items-center above only centers this shared column as
                      a unit, not each child inside it individually). No gap
                      here (unlike a plain "gap-4") — see the mt-4 on the
                      dossier row just below for why: flexbox `gap` sits
                      *outside* a flex item's own box, so it can't become
                      part of a sticky child's containing block the way
                      padding can. That distinction matters a lot more
                      further down (see the story-chapters section's own
                      comment) than it does here, but staying consistent
                      keeps the whole column's spacing built the same way
                      end to end. */}
                  <div className="max-w-2xl w-full flex flex-col">
                    {/* "$ >" prompt is always there, static — only the query
                        after it types out (see homeQueryTyped/homeQueryDone
                        above), with a blinking block cursor while it's still
                        typing. The result row below only mounts once it's
                        done (see the homeQueryDone && below), each line
                        popping in on its own stagger — see the
                        win98-terminal-pop class in globals.css — like a
                        shell printing a command's output line by line,
                        rather than the whole block fading in as one. */}
                    <h1 className="text-white text-lg font-bold text-left font-mono">
                        $ &gt; {homeQueryTyped}
                        {!homeQueryDone && (
                          <span
                            className="inline-block w-2 h-5 bg-[#00FF00] align-middle animate-pulse"
                            aria-hidden="true"
                          />
                        )}
                    </h1>
                    {homeQueryDone && (
                    // mt-4 (spacing after the "$ >" heading above) + pb-3
                    // (spacing before chapter 1 below) — pb-3 is padding,
                    // not a gap/margin: it's what lets this row's sticky
                    // photo keep pinning to the last possible pixel of the
                    // row's own box. mb-32 below it *is* real margin,
                    // deliberately — same tradeoff as the story chapters'
                    // own gap-y-16 (see that section's comment): it opens a
                    // real, doubled-vs-chapters breathing gap before
                    // chapter 1 starts, during which this photo has already
                    // released and chapter 1's image hasn't engaged yet.
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-left mt-4 pb-3 mb-16">
                      {/* sm:sticky so the photo travels with the scroll up to
                          this offset, then stays pinned near the top of the
                          scroll container while the much taller text column
                          (bio + Experience section) keeps scrolling past it
                          — same "sticky sidebar" pattern as a long-form
                          article's author photo. Sticky's containing block
                          is the row below (bounded by items-start, not
                          stretched to the row's full height), so it can
                          never travel past this column's own bottom edge.
                          Mobile stays plain in-flow (stacked layout, sticky
                          would just pin it awkwardly above a full-width
                          column) — only enabled at sm: and up, matching the
                          row/column breakpoint above. */}
                      <div
                        className="shrink-0 w-40 sm:w-48 sm:sticky sm:top-2 win98-terminal-pop"
                        style={{ animationDelay: '0ms' }}
                      >
                        <div className="relative aspect-square border-2 border-[#000000] overflow-hidden">
                          <Image
                            src="/Advith_Krishnan.webp"
                            alt="Advith Krishnan"
                            fill
                            priority
                            sizes="(max-width: 640px) 190px, 222px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <p className="text-white text-2xl font-bold win98-terminal-pop" style={{ animationDelay: '70ms' }}>
                          (#ID_6392) Advith Krishnan
                        </p>
                        {/* Bio copy: deliberately not a resume rehash — the goal is
                            personality and curiosity, since the credentials/timeline
                            already live on LinkedIn and the downloadable resume
                            (navbar's Resume button). An actual <ul>/<li> list now
                            (was a <p> with manual "•" characters + <br/><br/>
                            between them) — semantically correct, and the ::marker
                            bullet is themed to match the green accent used
                            throughout this dossier. text-justify for even edges,
                            matching the blog/report reading columns elsewhere. */}
                        <ul className="text-[#ccc] text-md leading-relaxed text-justify list-disc list-outside pl-4 marker:text-white flex flex-col gap-3">
                          <li className="win98-terminal-pop" style={{ animationDelay: '140ms' }}>
                            <span
                            className="inline-block text-[#00FF00] bg-black font-bold transition-opacity duration-300"
                            style={{ letterSpacing: '0.5px' }}
                          >
                            &nbsp;{displayText.trim()}&nbsp;
                          </span>
                          &nbsp;who works on cool stuff.
                          </li>
                          <li className="win98-terminal-pop" style={{ animationDelay: '210ms' }}> Delves into kernels, compilers, ML backends, i.e. the <span
                                  className="text-[#00FF00] bg-black px-2 font-bold"
                                  style={{ letterSpacing: '0.5px' }}
                                >software beneath the software.</span>
                          </li>
                          {visitorIp && (
                            <li className="win98-terminal-pop" style={{ animationDelay: '350ms' }}>
                              Knows your IP address is{' '}
                              <span
                                className="inline-block text-[#00FF00] bg-black px-2 font-bold"
                                style={{ letterSpacing: '0.5px' }}
                              >
                                {visitorIp}
                              </span>
                            </li>
                          )}
                        </ul>
                        {/* Compact work-history timeline, below the bio list
                            per this content column — see
                            components/ExperienceSection.tsx and
                            data/experience.ts for the actual entries. Last
                            in the stagger sequence, delayed a bit further
                            when the IP line is also showing so it doesn't
                            overlap that line's own pop-in. */}
                        <div className="win98-terminal-pop" style={{ animationDelay: visitorIp ? '420ms' : '350ms' }}>
                        <ExperienceSection />
                        </div>
                      </div>
                    </div>
                    )}
                    {/* "Story" section — a handful of scrollytelling chapters
                        continuing straight on from the dossier row above,
                        same max-w-2xl column so everything stays lined up.
                        See data/storyChapters.ts for the (currently
                        placeholder/lorem-ipsum) content and the reasoning
                        behind each chapter's own sticky image. Gated on
                        homeQueryDone same as the row above — nothing below
                        the "$ >" prompt shows until that's finished typing.

                        Each chapter's own pb-3 (inside its row's box) is
                        what lets its sticky image stay pinned right up to
                        that row's own end — see the per-chapter comment
                        below for why that has to be padding rather than
                        margin/gap. gap-y-16 here, between rows, is a
                        deliberate exception to that rule: it's real
                        breathing room the user asked for between chapters,
                        which does mean each chapter's image releases and
                        then sits in a brief plain-scroll gap before the
                        next chapter's image scrolls up far enough to
                        engage — unlike the zero-gap dossier→chapter-1
                        handoff right above, which still has none. */}
                    {homeQueryDone && (
                      <div className="flex flex-col gap-y-16">
                        {STORY_CHAPTERS.map((chapter) => (
                          <div
                            key={chapter.id}
                            className={`flex flex-col items-center gap-6 text-left sm:items-start pb-3 ${
                              chapter.side === 'right' ? 'sm:flex-row-reverse' : 'sm:flex-row'
                            }`}
                          >
                            {/* Chapters use sm:top-1/4 rather than the
                                profile photo's sm:top-4 above: a sticky
                                element's percentage `top` resolves against
                                the nearest scrolling ancestor's height —
                                here, the Home tab's own overflow-y-auto
                                wrapper, i.e. the inner window itself — so
                                top-1/2 pins this image's top edge at that
                                container's vertical midpoint once stuck,
                                instead of near its top edge. That also
                                moves the release point: sticky release
                                happens once holding the image at its `top`
                                offset would push it past its row's own
                                bottom edge, so with the offset now at the
                                middle instead of near the top, the image
                                releases as soon as scrolling would carry it
                                to the middle of the inner window, rather
                                than holding it pinned near the top for the
                                entire row. */}
                            <div className="shrink-0 w-full sm:w-56 sm:sticky sm:top-1/4 win98-terminal-pop">
                              {chapter.image ? (
                                <div className="relative aspect-[4/3] border-2 border-white overflow-hidden">
                                  <Image
                                    src={chapter.image}
                                    alt=""
                                    fill
                                    sizes="(max-width: 640px) 100vw, 224px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                // Placeholder until a real image is dropped
                                // in — see StoryChapter['image'] in
                                // data/storyChapters.ts.
                                <div className="aspect-[4/3] border-2 border-white flex items-center justify-center">
                                  <span className="text-white/40 text-[10px] font-mono text-center px-2">
                                    Image placeholder
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                              <h2 className="text-white text-2xl font-bold win98-terminal-pop" style={{ animationDelay: '70ms' }}>
                                {chapter.title}
                              </h2>
                              {chapter.paragraphs.map((paragraph, i) => (
                                <p
                                  key={i}
                                  className="text-[#ccc] text-md leading-relaxed text-justify win98-terminal-pop"
                                  style={{ animationDelay: `${140 + i * 70}ms` }}
                                >
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
            </div>
            )}
            </div>
          </div>
        </Win98Window>
      )}

      {/* ---- Gallery window (FastStone-style photo viewer) ---- */}
      {wins.gallery.status !== 'closed' && (
        <Win98Window
          title="Gallery"
          icon={APPS.gallery.icon}
          zIndex={40 + wins.gallery.z}
          minimized={wins.gallery.status === 'minimized'}
          isFocused={focusedId === 'gallery'}
          maximized={wins.gallery.maximized}
          defaultInset={{ top: 40, right: 16, bottom: 43, left: 60 }}
          defaultSize={{ w: 720, h: 520 }}
          cardOffset={{ x: -70, y: 30 }}
          rect={wins.gallery.rect}
          onRectChange={(r) => setRect('gallery', r)}
          onFocus={() => focusApp('gallery')}
          onMinimize={() => minimizeApp('gallery')}
          onToggleMaximize={() => toggleMaximize('gallery')}
          onClose={() => closeApp('gallery')}
        >
          <div className="win98-window-content bg-[#A6A6A6] flex-1 min-h-0 flex flex-col overflow-hidden">
            <GalleryWindow />
          </div>
        </Win98Window>
      )}

      {/* ---- Projects window: a searchable card gallery of Advith's
           projects (see components/ProjectsWindow.tsx and data/projects.ts) ---- */}
      {wins.projects.status !== 'closed' && (
        <Win98Window
          title="Projects"
          icon={hasProjects ? '/win98/folder-full.png' : APPS.projects.icon}
          zIndex={40 + wins.projects.z}
          minimized={wins.projects.status === 'minimized'}
          isFocused={focusedId === 'projects'}
          maximized={wins.projects.maximized}
          defaultInset={{ top: 40, right: 16, bottom: 43, left: 60 }}
          defaultSize={{ w: 760, h: 540 }}
          cardOffset={{ x: -30, y: -20 }}
          rect={wins.projects.rect}
          onRectChange={(r) => setRect('projects', r)}
          onFocus={() => focusApp('projects')}
          onMinimize={() => minimizeApp('projects')}
          onToggleMaximize={() => toggleMaximize('projects')}
          onClose={() => closeApp('projects')}
        >
          <div className="win98-window-content bg-[#A6A6A6] flex-1 min-h-0 flex flex-col overflow-hidden">
            <ProjectsWindow />
          </div>
        </Win98Window>
      )}

      {/* ---- Blogs window: list view, or a single post when blogsView.mode
           is 'post' (landed here via /blogs/[slug] — see that route) ---- */}
      {wins.blogs.status !== 'closed' && (
        <Win98Window
          title="Advith's Blogs"
          icon={APPS.blogs.icon}
          zIndex={40 + wins.blogs.z}
          minimized={wins.blogs.status === 'minimized'}
          isFocused={focusedId === 'blogs'}
          maximized={wins.blogs.maximized}
          defaultInset={{ top: 24, right: 24, bottom: 43, left: 24 }}
          defaultSize={{ w: 680, h: 500 }}
          cardOffset={{ x: 70, y: -30 }}
          rect={wins.blogs.rect}
          onRectChange={(r) => setRect('blogs', r)}
          onFocus={() => focusApp('blogs')}
          onMinimize={() => minimizeApp('blogs')}
          onToggleMaximize={() => toggleMaximize('blogs')}
          onClose={closeBlogsApp}
        >
          <div className="win98-window-content bg-[#A6A6A6] flex-1 min-h-0 flex flex-col overflow-hidden">
            {blogsView.mode === 'post' ? (
              <BlogPostView note={blogsView.note} seeAlso={blogsView.seeAlso} content={blogsView.content} />
            ) : (
              <ExplorerBlogList notes={notes} />
            )}
          </div>
        </Win98Window>
      )}

      {/* ---- Credits window: launched from the taskbar's "Credits &
           attributions" link — not pinned to the desktop, see APPS/DEFAULT_ICON_CELLS ---- */}
      {wins.credits.status !== 'closed' && (
        <Win98Window
          title="Credits and Licenses"
          icon={APPS.credits.icon}
          zIndex={40 + wins.credits.z}
          minimized={wins.credits.status === 'minimized'}
          isFocused={focusedId === 'credits'}
          maximized={wins.credits.maximized}
          /* left/right kept modest (unlike the old 100px left) — on a phone
             this defaultInset is the *only* frame (drag/resize are disabled
             there), so a wide left margin just wastes width and wraps text
             hard. Desktop uses defaultSize/cardOffset below instead. */
          defaultInset={{ top: 24, right: 16, bottom: 43, left: 16 }}
          defaultSize={{ w: 600, h: 520 }}
          cardOffset={{ x: 20, y: 60 }}
          rect={wins.credits.rect}
          onRectChange={(r) => setRect('credits', r)}
          onFocus={() => focusApp('credits')}
          onMinimize={() => minimizeApp('credits')}
          onToggleMaximize={() => toggleMaximize('credits')}
          onClose={() => closeApp('credits')}
        >
          <div className="win98-window-content flex-1 min-h-0 flex flex-col overflow-hidden">
            <CreditsWindow />
          </div>
        </Win98Window>
      )}

      {/* ---- Prince of Persia window: the real 1990 game, emulated
           in-browser (see PrinceOfPersiaWindow.tsx) — replaced the earlier
           Doom app entirely after Doom's Fire key turned out unreliable
           in Mac browsers across every free embed available ---- */}
      {wins.pop.status !== 'closed' && (
        <Win98Window
          title="Prince of Persia"
          icon={APPS.pop.icon}
          zIndex={40 + wins.pop.z}
          minimized={wins.pop.status === 'minimized'}
          isFocused={focusedId === 'pop'}
          maximized={wins.pop.maximized}
          defaultInset={{ top: 32, right: 16, bottom: 43, left: 40 }}
          defaultSize={{ w: 640, h: 520 }}
          cardOffset={{ x: -40, y: -50 }}
          rect={wins.pop.rect}
          onRectChange={(r) => setRect('pop', r)}
          onFocus={() => focusApp('pop')}
          onMinimize={() => minimizeApp('pop')}
          onToggleMaximize={() => toggleMaximize('pop')}
          onClose={() => closeApp('pop')}
        >
          <div className="win98-window-content bg-black flex-1 min-h-0 flex flex-col overflow-hidden">
            <PrinceOfPersiaWindow onOpenControls={() => openApp('popReadme')} />
          </div>
        </Win98Window>
      )}

      {/* ---- POP.TXT - Notepad: controls reference, opened from a button
           inside the Prince of Persia window (see PrinceOfPersiaWindow.tsx) ---- */}
      {wins.popReadme.status !== 'closed' && (
        <Win98Window
          title="POP.TXT - Notepad"
          icon={APPS.popReadme.icon}
          zIndex={40 + wins.popReadme.z}
          minimized={wins.popReadme.status === 'minimized'}
          isFocused={focusedId === 'popReadme'}
          maximized={wins.popReadme.maximized}
          defaultInset={{ top: 24, right: 16, bottom: 43, left: 16 }}
          defaultSize={{ w: 440, h: 380 }}
          cardOffset={{ x: 60, y: 40 }}
          rect={wins.popReadme.rect}
          onRectChange={(r) => setRect('popReadme', r)}
          onFocus={() => focusApp('popReadme')}
          onMinimize={() => minimizeApp('popReadme')}
          onToggleMaximize={() => toggleMaximize('popReadme')}
          onClose={() => closeApp('popReadme')}
        >
          <PrinceOfPersiaReadmeWindow />
        </Win98Window>
      )}

      {/* ---- Minesweeper: built natively (see MinesweeperWindow.tsx),
           not embedded — no third-party sizing/licensing quirks to work
           around, unlike Prince of Persia. ---- */}
      {wins.minesweeper.status !== 'closed' && (
        <Win98Window
          title="Minesweeper"
          icon={APPS.minesweeper.icon}
          zIndex={40 + wins.minesweeper.z}
          minimized={wins.minesweeper.status === 'minimized'}
          isFocused={focusedId === 'minesweeper'}
          maximized={wins.minesweeper.maximized}
          defaultInset={{ top: 60, right: 16, bottom: 43, left: 16 }}
          defaultSize={minesweeperMinSize}
          cardOffset={{ x: 30, y: -70 }}
          resizable={false}
          maximizable={false}
          rect={wins.minesweeper.rect}
          onRectChange={(r) => setRect('minesweeper', r)}
          onFocus={() => focusApp('minesweeper')}
          onMinimize={() => minimizeApp('minesweeper')}
          onToggleMaximize={() => toggleMaximize('minesweeper')}
          onClose={() => closeApp('minesweeper')}
        >
          <div className="win98-window-content flex-1 min-h-0 flex flex-col overflow-hidden">
            <MinesweeperWindow onMinSizeChange={handleMinesweeperMinSize} />
          </div>
        </Win98Window>
      )}

      {/* ---- Solitaire (Klondike): built natively (see SolitaireWindow.tsx),
           click-to-move so it works the same with mouse and touch. ---- */}
      {wins.solitaire.status !== 'closed' && (
        <Win98Window
          title="Solitaire"
          icon={APPS.solitaire.icon}
          zIndex={40 + wins.solitaire.z}
          minimized={wins.solitaire.status === 'minimized'}
          isFocused={focusedId === 'solitaire'}
          maximized={wins.solitaire.maximized}
          defaultInset={{ top: 24, right: 16, bottom: 43, left: 16 }}
          defaultSize={{ w: 880, h: 640 }}
          cardOffset={{ x: -30, y: 40 }}
          rect={wins.solitaire.rect}
          onRectChange={(r) => setRect('solitaire', r)}
          onFocus={() => focusApp('solitaire')}
          onMinimize={() => minimizeApp('solitaire')}
          onToggleMaximize={() => toggleMaximize('solitaire')}
          onClose={() => closeApp('solitaire')}
        >
          <div className="win98-window-content flex-1 min-h-0 flex flex-col overflow-hidden">
            <SolitaireWindow windowVisible={wins.solitaire.status === 'open'} />
          </div>
        </Win98Window>
      )}

      {loadingApp && (
        <WindowsLoader
          title={`Loading ${APPS[loadingApp].name}...`}
          icon={APPS[loadingApp].icon}
          message={LOADING_MESSAGES[loadingApp]}
          paused={loadingPaused}
        />
      )}
      {/* Each accumulated glitch spawn gets its own card (see glitchSpawns'
          comment above) — array index is a safe key here since spawns are
          only ever appended or cleared all at once, never reordered or
          individually removed. */}
      {glitchSpawns.map((spawn, i) => (
        <WindowsLoader
          key={i}
          title={`Loading ${APPS.advith.name}...`}
          icon={APPS.advith.icon}
          message={LOADING_MESSAGES.advith}
          glitch
          left={spawn.left}
          top={spawn.top}
          paused={glitchPaused}
        />
      ))}
    </div>
    <FooterConsole
      activeApps={taskbarApps}
      onAppClick={handleTaskbarClick}
      onReorder={(ids) => setTaskOrder(ids as AppId[])}
      onCreditsClick={() => openApp('credits')}
    />
    </>
  )
}
