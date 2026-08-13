'use client'

// Global window-manager store (zustand).
//
// This lives outside React's component tree on purpose: HomeClient (the "/"
// desktop) unmounts whenever the user navigates to a different route (e.g.
// /blogs, /resume). A plain useState in HomeClient would reset every window's
// position, size, open/minimized status and z-order on that unmount. Because
// a zustand store is just a module-scoped singleton, it keeps living across
// client-side navigations, so the desktop looks exactly as it was left when
// the user comes back to "/".
//
// It's also backed by sessionStorage (via the `persist` middleware) so a
// plain page refresh restores the same state too — closing the tab/browser
// still resets it, same as rebooting a real desktop.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AppId = 'advith' | 'blogs' | 'gallery' | 'credits' | 'pop' | 'popReadme' | 'minesweeper' | 'solitaire' | 'projects' | 'report'
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

// Apps whose window is content-driven and never meant to be maximized —
// see resizable={false}/maximizable={false} on Minesweeper's Win98Window
// in HomeClient.tsx: like the real game, its window always fits the
// current difficulty's board exactly. Excluded from the "opens maximized
// by default" behavior below — forcing maximized would fill the screen
// with frame while the actual board stays a small fixed square floating
// inside it.
const NOT_MAXIMIZABLE: AppId[] = ['minesweeper']

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
  // Standalone contributor-report viewer — its own window/app instead of
  // borrowing the Blogs window (see ReportViewer.tsx / app/reports/[slug]).
  report: { status: 'closed', z: 0, rect: null, maximized: false, preMaximizeRect: null },
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
                maximized: openingFresh && !NOT_MAXIMIZABLE.includes(id) ? true : w.maximized,
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
      // Bumped to v10: added 'report'. Older persisted state wouldn't have
      // this key, which would crash on read — bumping the key just starts
      // fresh instead of trying to migrate.
      name: 'win98-window-state-v10',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    }
  )
)
