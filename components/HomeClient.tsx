'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Navbar, { type HomeTab } from '@/components/Navbar'
import ContactView from '@/components/ContactView'
import ResumeView from '@/components/ResumeView'
import CreditsWindow from '@/components/CreditsWindow'
import WindowsLoader from '@/components/WindowsLoader'
import FooterConsole from '@/components/FooterConsole'
import ExplorerBlogList from '@/components/ExplorerBlogList'
import BlogPostView from '@/components/BlogPostView'
import GalleryWindow from '@/components/GalleryWindow'
import PrinceOfPersiaWindow from '@/components/PrinceOfPersiaWindow'
import PrinceOfPersiaReadmeWindow from '@/components/PrinceOfPersiaReadmeWindow'
import MinesweeperWindow from '@/components/MinesweeperWindow'
import SolitaireWindow from '@/components/SolitaireWindow'
import DesktopIcon, { GridCell, cellToPx } from '@/components/DesktopIcon'
import Win98Window from '@/components/Win98Window'
import { useWindowStore, type AppId, type WinState } from '@/lib/store/windowStore'
import highlights from '@/data/highlights'
import type { Note } from '@/lib/notes'
import type { FeaturedLink } from '@/app/actions/getFeaturedLinks'

// What the Blogs window shows: the Explorer-style list (default), or a
// single post (used when landing on /blogs/[slug] — see that route, which
// compiles the MDX server-side and hands the rendered element down here).
export type BlogsView =
  | { mode: 'list' }
  | { mode: 'post'; note: Note; seeAlso: Note[]; content: React.ReactNode }

type HomeClientProps = {
  notes: Note[]
  featured: FeaturedLink[]
  forceOpenApp?: AppId
  blogsView?: BlogsView
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
  initialHomeTab = 'home',
}: HomeClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  // advith.exe's Home/Contact/Resume tabs — local state, no navigation
  // involved (see Navbar). Seeded once from whichever route we landed on.
  const [homeTab, setHomeTab] = useState<HomeTab>(initialHomeTab)

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
    if (id === 'advith' && wins.advith.status === 'closed') {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsLoading(false)
    }
    focusApp(id)
  }, [wins.advith.status, focusApp, registerApp])

  const minimizeApp = storeMinimizeApp
  const closeApp = storeCloseApp

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
  const hasNewBlog = notes.some(
    note => new Date(note.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  const hasNewHighlight = highlights.some(
    photo => new Date(photo.uploaded_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )

  // Mobile check (≤640px): Prince of Persia is keyboard-only, so on phones
  // its icon is disabled — tapping shows a tooltip instead of opening.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const [popMobileTooltip, setPopMobileTooltip] = useState(false)
  const popTooltipTimer = useRef<NodeJS.Timeout | null>(null)
  const handlePopOpen = () => {
    if (!isMobile) {
      openApp('pop')
      return
    }
    setPopMobileTooltip(true)
    if (popTooltipTimer.current) clearTimeout(popTooltipTimer.current)
    popTooltipTimer.current = setTimeout(() => setPopMobileTooltip(false), 3500)
  }
  useEffect(() => () => {
    if (popTooltipTimer.current) clearTimeout(popTooltipTimer.current)
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
    wins.solitaire.status !== 'closed'
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
  // clicking an icon. (Contact/Resume/Credits route in via forceOpenApp +
  // initialHomeTab instead — see app/contact, app/resume, app/credits.)
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
  // the deep link above, so this doesn't touch the URL at all.
  useEffect(() => {
    if (forceOpenApp) focusApp(forceOpenApp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Morphing animation for roles with cryptic letters
  const roles = [
    "An AI Engineer",
    "An AI Researcher",
    "A Software Developer",
    "A Full Stack Engineer"
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
        isActive={wins.advith.status !== 'closed'}
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
        onOpen={handlePopOpen}
        onMove={moveIcon}
      />

      {/* Mobile-only: PoP is keyboard-only, tapping its (disabled) icon
          explains why instead of opening the app */}
      {popMobileTooltip && (
        <div
          role="status"
          className="absolute z-[60] px-2 py-1 text-xs text-black pointer-events-none max-w-[230px]"
          style={{
            left: cellToPx(iconCells.pop).left,
            top: cellToPx(iconCells.pop).top + 100,
            backgroundColor: '#ffffe1',
            border: '1px solid #000000',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
          }}
        >
          🖥️ Prince of Persia needs a keyboard — play it on a desktop or laptop!
        </div>
      )}
      <DesktopIcon
        id="minesweeper"
        label="Minesweeper"
        icon={APPS.minesweeper.icon}
        cell={iconCells.minesweeper}
        isActive={wins.minesweeper.status !== 'closed'}
        onOpen={() => openApp('minesweeper')}
        onMove={moveIcon}
      />
      <DesktopIcon
        id="solitaire"
        label="Solitaire"
        icon={APPS.solitaire.icon}
        cell={iconCells.solitaire}
        isActive={wins.solitaire.status !== 'closed'}
        onOpen={() => openApp('solitaire')}
        onMove={moveIcon}
      />

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
          cardOffset={{ x: 0, y: -10 }}
          rect={wins.advith.rect}
          onRectChange={(r) => setRect('advith', r)}
          onFocus={() => focusApp('advith')}
          onMinimize={() => minimizeApp('advith')}
          onToggleMaximize={() => toggleMaximize('advith')}
          onClose={() => closeApp('advith')}
        >
            <Navbar activeTab={homeTab} onTabChange={setHomeTab} />
          <div className="flex-1 win98-window-content flex flex-col bg-[#222222] overflow-hidden">
            {homeTab === 'contact' ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <ContactView featured={featured} />
              </div>
            ) : homeTab === 'resume' ? (
              <ResumeView />
            ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {/* About/bio */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <h1 className="text-white text-3xl font-bold">
                    👋 Hi, I&apos;m Advith Krishnan!
                  </h1>
                  <span className="text-white text-md min-h-[28px]">
                    &gt; {" "} <span
                      className="inline-block transition-opacity duration-300"
                      style={{ fontFamily: 'monospace, monospace', letterSpacing: '0.5px' }}
                    >
                      {displayText.trim()}
                    </span>
                    &nbsp;who works on cool stuff!
                  </span>

                  {/* TODO: replace with real bio copy */}
                  {/* Plain block (not flex) so the floated photo lets the
                      justified paragraphs wrap around it, old-homepage style. */}
                  <div className="text-white text-sm leading-relaxed mt-1">
                    <div className="float-right relative ml-4 mb-3 w-40 sm:w-56 aspect-square border-2 border-[#808080] overflow-hidden">
                      <Image
                        src="/Advith_Krishnan.webp"
                        alt="Advith Krishnan"
                        fill
                        sizes="(max-width: 640px) 160px, 224px"
                        className="object-cover"
                      />
                    </div>
                    <p className="text-justify mb-3">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                      commodo consequat.
                    </p>
                    <p className="text-justify mb-3">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                      dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                      proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p className="text-justify mb-3">
                      Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                      accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab
                      illo inventore veritatis et quasi architecto beatae vitae dicta sunt
                      explicabo.
                    </p>
                    <p className="text-justify">
                      Take a look through my{' '}
                      <button onClick={() => openApp('gallery')} className="text-sky-300 underline hover:text-sky-200 font-bold">
                        Gallery
                      </button>{' '}
                      for photos from my life, or read my latest thoughts over on{' '}
                      <button onClick={() => openApp('blogs')} className="text-sky-300 underline hover:text-sky-200 font-bold">
                        Blogs
                      </button>.
                    </p>
                    <div className="clear-both" />
                  </div>
                </div>
            </div>
            )}
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
          onClose={() => closeApp('blogs')}
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
          title="Credits and License"
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

      {isLoading && <WindowsLoader />}
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
