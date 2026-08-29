'use client'

// Global window-manager store (zustand).
//
// This lives outside React's component tree on purpose: HomeClient (the "/"
// desktop) unmounts whenever the user navigates to a different route (e.g.
// /blogs, /reports/[slug]). A plain useState in HomeClient would reset every window's
// position, size, open/minimized status and z-order on that unmount. Because
// a zustand store is just a module-scoped singleton, it keeps living across
// client-side navigations, so the desktop looks exactly as it was left when
// the user comes back to "/" — e.g. leaving advith.exe or the blog viewer
// open, reading a post, then navigating back still shows that same window.
//
// Also backed by sessionStorage (via the `persist` middleware below) so a
// real page reload restores the same layout too, on top of PowerOnGate's
// boot-sequence animation (see that component) — closing the tab/browser
// still resets it, same as rebooting a real desktop (which, on most real
// OSes, also reopens whatever you had up before). `skipHydration: true`
// keeps the store's state identical between server and client for the very
// first render (both just use initialWins below) so there's no SSR
// hydration mismatch — see HomeClient.tsx's own call to
// `useWindowStore.persist.rehydrate()` for how (and, importantly, *when*)
// the real stored state actually gets pulled back in after that.
//
// The storage engine below is a debounced wrapper around sessionStorage,
// not sessionStorage directly — that's deliberate, not an oversight.
// zustand's persist middleware writes to storage synchronously on every
// single set() call, and Win98Window.tsx's setRect fires on every
// pointermove while a window is being dragged or resized (for live visual
// feedback) — 60+ times a second. Without debouncing, that's a synchronous
// JSON.stringify + sessionStorage.setItem of the whole store on every one
// of those frames, which is exactly the kind of main-thread work that
// shows up as visibly laggy dragging/resizing. Reads (getItem, used by
// rehydrate()) are untouched and stay fully synchronous either way — only
// the high-frequency write side needed coalescing.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// How long to wait after the *last* write attempt before actually touching
// sessionStorage — long enough to coalesce an entire drag/resize gesture
// (which fires continuously, with no gap between frames) into a single
// write once it settles, short enough that a reload moments after
// finishing a drag still sees the right position. The one accepted
// trade-off: closing the tab within this window of finishing a drag could
// lose that last move — acceptable for a portfolio site's window
// positions, not the kind of data that needs a stronger guarantee.
const PERSIST_WRITE_DEBOUNCE_MS = 200

function createDebouncedSessionStorage() {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    // Reads stay synchronous and immediate — rehydrate() on mount (see
    // HomeClient.tsx) depends on this to avoid its own flash-of-default-
    // positions problem, which debouncing writes doesn't affect at all.
    getItem: (name: string) => sessionStorage.getItem(name),
    setItem: (name: string, value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        sessionStorage.setItem(name, value)
      }, PERSIST_WRITE_DEBOUNCE_MS)
    },
    removeItem: (name: string) => {
      if (timer) clearTimeout(timer)
      timer = null
      sessionStorage.removeItem(name)
    },
  }
}

export type AppId = 'advith' | 'blogs' | 'gallery' | 'credits' | 'pop' | 'popReadme' | 'minesweeper' | 'solitaire' | 'projects'
export type WinStatus = 'closed' | 'open' | 'minimized'
export type Rect = { x: number; y: number; w: number; h: number }
export type WinState = {
  status: WinStatus
  z: number
  rect: Rect | null
  maximized: boolean
  /** rect to restore to when un-maximized (may itself be null → default inset) */
  preMaximizeRect: Rect | null
}

// Apps excluded from the "opens maximized by default" behavior below.
// 'minesweeper': its window is content-driven and never meant to be
// maximized at all — see resizable={false}/maximizable={false} on its
// Win98Window in HomeClient.tsx. Like the real game, its window always
// fits the current difficulty's board exactly; forcing maximized would
// fill the screen with frame while the board stays a small fixed square
// floating inside it.
//
// advith.exe used to be excluded here too (a deliberate center-right
// default position, see its old cardOffset comment in HomeClient.tsx) but
// that's since been changed back to auto-maximize on first open like
// every other app — cardOffset only matters now for whatever size/position
// the user restores to after manually un-maximizing it.
const SKIP_AUTO_MAXIMIZE: AppId[] = ['minesweeper']

const initialWins: Record<AppId, WinState> = {
  advith: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  blogs: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  gallery: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  credits: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  pop: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  popReadme: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  // Minesweeper and Solitaire — built natively in React (see their Window
  // components), not embedded, so no cross-origin quirks to work around.
  minesweeper: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  solitaire: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
  projects: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
}

type WindowStore = {
  wins: Record<AppId, WinState>
  taskOrder: AppId[]
  zCounter: number

  /** Add a window to the taskbar without changing focus (idempotent). */
  registerApp: (id: AppId) => void
  /** Bring a window to front, opening it (and registering it) if needed. */
  focusApp: (id: AppId) => void
  minimizeApp: (id: AppId) => void
  closeApp: (id: AppId) => void
  /** Persist a window's dragged/resized rect. */
  setRect: (id: AppId, rect: Rect) => void
  /** Toggle between the user's rect and a full-screen (up to the taskbar) frame. */
  toggleMaximize: (id: AppId) => void
  setTaskOrder: (ids: AppId[]) => void
}

export const useWindowStore = create<WindowStore>()(
  persist(
    (set) => ({
      wins: initialWins,
      taskOrder: [],
      zCounter: 1,

      registerApp: (id) =>
        set((s) => (s.taskOrder.includes(id) ? s : { taskOrder: [...s.taskOrder, id] })),

      focusApp: (id) =>
        set((s) => {
          const z = s.zCounter + 1
          const w = s.wins[id]
          // Windows open maximized by default, same as clicking a real
          // taskbar shortcut for the first time — full mode, not a small
          // card the user has to stretch out themselves. Only applies the
          // moment a window actually transitions from closed -> open, so
          // re-focusing an already-open (or minimized) window never
          // overrides a size/maximize state the user already chose.
          const openingFresh = w.status === 'closed'
          return {
            zCounter: z,
            taskOrder: s.taskOrder.includes(id) ? s.taskOrder : [...s.taskOrder, id],
            wins: {
              ...s.wins,
              [id]: {
                ...w,
                status: 'open',
                z,
                maximized: openingFresh && !SKIP_AUTO_MAXIMIZE.includes(id) ? true : w.maximized,
              },
            },
          }
        }),

      minimizeApp: (id) =>
        set((s) => ({ wins: { ...s.wins, [id]: { ...s.wins[id], status: 'minimized' } } })),

      closeApp: (id) =>
        set((s) => ({
          wins: { ...s.wins, [id]: { ...s.wins[id], status: 'closed' } },
          taskOrder: s.taskOrder.filter((a) => a !== id),
        })),

      setRect: (id, rect) =>
        // Dragging/resizing implicitly un-maximizes (matches real Windows:
        // grabbing a maximized window's titlebar restores it first).
        set((s) => ({
          wins: { ...s.wins, [id]: { ...s.wins[id], rect, maximized: false, preMaximizeRect: null } },
        })),

      toggleMaximize: (id) =>
        set((s) => {
          const w = s.wins[id]
          return {
            wins: {
              ...s.wins,
              [id]: w.maximized
                ? { ...w, maximized: false, rect: w.preMaximizeRect, preMaximizeRect: null }
                : { ...w, maximized: true, preMaximizeRect: w.rect },
            },
          }
        }),

      setTaskOrder: (ids) => set({ taskOrder: ids }),
    }),
    {
      // Bumped to v11: removed 'report' — it's now a tab inside advith.exe
      // (see ReportViewer.tsx/HomeClient.tsx) rather than its own window/app.
      // Old persisted state could still have a 'report' key open, which
      // nothing reads anymore but would otherwise sit around as a phantom
      // taskbar entry — bumping the key just starts fresh instead.
      name: 'win98-window-state-v11',
      storage: createJSONStorage(createDebouncedSessionStorage),
      skipHydration: true,
    }
  )
)
