'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import FeaturedLinks from '@/components/FeaturedLinks'
import Navbar, { type HomeTab } from '@/components/Navbar'
import ContactView from '@/components/ContactView'
import ResumeView from '@/components/ResumeView'
import CreditsWindow from '@/components/CreditsWindow'
import WindowsLoader from '@/components/WindowsLoader'
import FooterConsole from '@/components/FooterConsole'
import ScrollPanel from '@/components/ScrollPanel'
import ExplorerBlogList from '@/components/ExplorerBlogList'
import BlogPostView from '@/components/BlogPostView'
import SubstackToast from '@/components/SubstackToast'
import GalleryWindow from '@/components/GalleryWindow'
import DesktopIcon, { GridCell } from '@/components/DesktopIcon'
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
}

// Every AppId needs a reserved grid cell (Record<AppId, ...> requires it),
// but 'credits' never gets a <DesktopIcon /> rendered — see the JSX below.
// It's launched from the taskbar's "Credits" link, not pinned to the desktop.
const DEFAULT_ICON_CELLS: Record<AppId, GridCell> = {
  advith: { col: 0, row: 1 },
  blogs: { col: 0, row: 0 },
  gallery: { col: 0, row: 2 },
  credits: { col: 0, row: 3 },
}

const ICON_POS_KEY = 'desktop-icon-cells-v1'

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
      if (saved) setIconCells({ ...DEFAULT_ICON_CELLS, ...JSON.parse(saved) })
    } catch { /* corrupted storage: keep defaults */ }
  }, [])

  const moveIcon = (id: string, cell: GridCell) => {
    const appId = id as AppId
    setIconCells(prev => {
      // Win98 collision rule: occupied cell → take nearest free cell below
      const occupied = (c: GridCell) =>
        (Object.entries(prev) as [AppId, GridCell][]).some(
          ([other, oc]) => other !== appId && oc.col === c.col && oc.row === c.row
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

  // First-visit hint (once per session)
  const [showHint, setShowHint] = useState(false)
  const anyOpen =
    wins.advith.status !== 'closed' ||
    wins.blogs.status !== 'closed' ||
    wins.gallery.status !== 'closed' ||
    wins.credits.status !== 'closed'
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

  // Substack subscribe toast: shown once per session whenever the Blogs
  // window is open on the list view (ported from the old standalone
  // /blogs page, now that /blogs renders through this same shell).
  const [toastVisible, setToastVisible] = useState(false)
  useEffect(() => {
    if (!sessionStorage.getItem('substack-toast-dismissed')) {
      setToastVisible(true)
    }
  }, [])
  const dismissToast = () => {
    setToastVisible(false)
    sessionStorage.setItem('substack-toast-dismissed', '1')
  }

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
                <ContactView />
              </div>
            ) : homeTab === 'resume' ? (
              <ResumeView />
            ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Internet Shortcuts — a card at the top right (stacks on top on mobile) */}
                {/* <div className="order-1 md:order-2 w-full md:w-72 flex-shrink-0">
                  <div className="win98-window flex flex-col">
                    <div className="win98-titlebar">
                      <div className="flex items-center gap-2">
                        <img src="/win98/internet.webp" alt="Internet" className="w-4 h-4" />
                        <span>Internet Shortcuts</span>
                      </div>
                    </div>
                    <div className="bg-[#f0f0f0] border-2 p-2">
                      <p className="font-bold mb-1 text-sm">
                        &gt; My online presence! (Still not famous tho)
                      </p>
                      <ScrollPanel maxHeight={320} className="border-2" nudgeId="featured-links">
                        <FeaturedLinks links={featured} />
                      </ScrollPanel>
                    </div>
                  </div>
                </div> */}

                {/* About/bio — fills the remaining space */}
                <div className="order-2 md:order-1 flex-1 min-w-0 flex flex-col gap-3">
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

      {isLoading && <WindowsLoader />}

      <SubstackToast
        visible={toastVisible && wins.blogs.status !== 'closed' && blogsView.mode === 'list'}
        onDismiss={dismissToast}
      />
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
