'use client'

// Minesweeper — built natively in React instead of embedded, unlike Prince
// of Persia. There's no good reason to fight a cross-origin DOSBox iframe
// (sizing quirks, licensing ambiguity, control schemes) for a game this
// simple to reimplement outright: classic reveal/flag/flood-fill logic,
// rendered with the same win98-button sunken/raised styling already used
// everywhere else on the site.
//
// Structure mirrors the real Windows 98 Minesweeper: a "Game"/"Help" menu
// bar (difficulty + flag mode live under Game, not as a toolbar), a
// counter row (mine count, restart, timer) in its own sunken bevel, then
// the grid — no extra toolbar row, no footer status bar. The window is
// fixed-size (see resizable={false} in HomeClient) and always fits this
// content exactly, same as the real thing.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type Difficulty = 'beginner' | 'intermediate' | 'expert'

const DIFFICULTIES: Record<Difficulty, { label: string; rows: number; cols: number; mines: number }> = {
  beginner: { label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { label: 'Expert', rows: 16, cols: 30, mines: 99 },
}

type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type GameState = 'ready' | 'playing' | 'won' | 'lost'
type MenuKey = 'game' | 'help' | null

const MAX_CELL_SIZE = 24 // px — classic Windows Minesweeper size, always used (window is fixed-size, never shrinks cells)

// The only dimension this component can't measure directly — the parent
// Win98Window renders its own titlebar above `children`, outside this
// component's DOM subtree. It's a fixed, content-independent height, so a
// constant is reliable here. A couple of px of slack is fine; coming in
// short is what caused a scrollbar in an earlier version.
const TITLEBAR_H = 30

// Classic Windows Minesweeper number colors.
const NUMBER_COLORS: Record<number, string> = {
  1: '#0000ff',
  2: '#008000',
  3: '#ff0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
}

function makeEmptyGrid(rows: number, cols: number): Cell[] {
  return Array.from({ length: rows * cols }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))
}

function neighborsOf(index: number, rows: number, cols: number): number[] {
  const row = Math.floor(index / cols)
  const col = index % cols
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) out.push(r * cols + c)
    }
  }
  return out
}

// Mines are placed only after the first click, avoiding that cell and its
// neighbors — guarantees the first reveal always opens up some space
// instead of potentially being a 1x1 dead end right next to a mine.
function placeMines(rows: number, cols: number, mines: number, safeIndex: number): Cell[] {
  const grid = makeEmptyGrid(rows, cols)
  const safe = new Set([safeIndex, ...neighborsOf(safeIndex, rows, cols)])
  const candidates = grid.map((_, i) => i).filter(i => !safe.has(i))
  // Fisher-Yates partial shuffle — pick `mines` random candidates.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const mineSet = new Set(candidates.slice(0, mines))
  for (const i of mineSet) grid[i].mine = true
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].mine) continue
    grid[i].adjacent = neighborsOf(i, rows, cols).filter(n => grid[n].mine).length
  }
  return grid
}

function Led({ value }: { value: number }) {
  const clamped = Math.max(-99, Math.min(999, value))
  const text = (clamped < 0 ? '-' + String(-clamped).padStart(2, '0') : String(clamped).padStart(3, '0'))
  return (
    <div
      className="bg-black text-[#ff0000] font-bold text-lg px-1 border-2 border-t-[#808080] border-l-[#808080] border-b-[#f0f0f0] border-r-[#f0f0f0]"
      style={{ fontFamily: 'monospace', letterSpacing: '2px', minWidth: 44, textAlign: 'right' }}
    >
      {text}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  shortcut,
}: {
  children: React.ReactNode
  onClick: () => void
  shortcut?: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-3 py-1 text-left text-black hover:bg-[#000080] hover:text-white whitespace-nowrap"
    >
      <span>{children}</span>
      {shortcut && <span className="text-[10px] opacity-70">{shortcut}</span>}
    </button>
  )
}

type MinesweeperWindowProps = {
  /** Called whenever the current difficulty's natural window size changes
   *  (i.e. on mount and on every difficulty switch), so the parent window
   *  can size itself exactly to fit — Minesweeper's window is fixed-size,
   *  not resizable, same as the real game. See the measurement effect
   *  below for how this is derived. */
  onMinSizeChange?: (size: { w: number; h: number }) => void
}

export default function MinesweeperWindow({ onMinSizeChange }: MinesweeperWindowProps = {}) {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const { rows, cols, mines } = DIFFICULTIES[difficulty]

  const [grid, setGrid] = useState<Cell[]>(() => makeEmptyGrid(rows, cols))
  const [gameState, setGameState] = useState<GameState>('ready')
  const [flagsPlaced, setFlagsPlaced] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [face, setFace] = useState<'smile' | 'surprised' | 'win' | 'lose'>('smile')
  const [flagMode, setFlagMode] = useState(false) // touch-friendly alternative to right-click
  const [openMenu, setOpenMenu] = useState<MenuKey>(null)
  const [showAbout, setShowAbout] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Synthesized explosion for hitting a mine (WebAudio, no asset file):
  // a white-noise burst through a closing lowpass filter — the "blast" —
  // plus a pitch-dropping sine underneath — the "thump".
  const playExplosion = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const now = ctx.currentTime
      const dur = 0.6

      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1400, now)
      filter.frequency.exponentialRampToValueAtTime(80, now + dur)
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.5, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      noise.connect(filter).connect(noiseGain).connect(ctx.destination)
      noise.start(now)

      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(130, now)
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.4)
      oscGain.gain.setValueAtTime(0.6, now)
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      osc.connect(oscGain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.5)
    } catch { /* Web Audio unavailable/blocked — lose silently */ }
  }

  // Minesweeper's window is fixed-size (see resizable={false} in
  // HomeClient) and always fits the board exactly, like the real game.
  //
  // The window's exact size is derived by measuring `contentRef` below,
  // which wraps everything (menu bar + board card) in a `w-fit` box. That
  // `w-fit` (width: fit-content) is the important part: a first version of
  // this measured the menu bar/board/footer rows directly, but those rows
  // are flex children that STRETCH to fill whatever width their parent
  // currently has — so getBoundingClientRect() on them just echoed back
  // the parent's current (possibly still-wrong) width instead of their own
  // natural content width, and that fed into a runaway feedback loop with
  // the ResizeObserver (each pass reporting a smaller width, shrinking the
  // window down to a sliver). Wrapping the real content in a `w-fit` box
  // opts out of that stretching, so what's measured here is always the
  // content's true natural size regardless of the window's current size.
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!onMinSizeChange) return
    const el = contentRef.current
    if (!el) return

    const measure = () => {
      const r = el.getBoundingClientRect()
      onMinSizeChange({ w: Math.ceil(r.width), h: Math.ceil(r.height + TITLEBAR_H) })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols])

  const resetGame = useCallback((diff: Difficulty) => {
    const d = DIFFICULTIES[diff]
    setGrid(makeEmptyGrid(d.rows, d.cols))
    setGameState('ready')
    setFlagsPlaced(0)
    setElapsed(0)
    setFace('smile')
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    resetGame(difficulty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  useEffect(() => {
    if (gameState === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => setElapsed(e => Math.min(999, e + 1)), 1000)
    }
    if (gameState !== 'playing' && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [gameState])

  const revealAllMines = (g: Cell[]) => {
    for (const c of g) if (c.mine) c.revealed = true
  }

  const floodReveal = (g: Cell[], startIndex: number) => {
    const stack = [startIndex]
    const seen = new Set<number>()
    while (stack.length) {
      const i = stack.pop()!
      if (seen.has(i)) continue
      seen.add(i)
      const cell = g[i]
      if (cell.revealed || cell.flagged) continue
      cell.revealed = true
      if (cell.adjacent === 0 && !cell.mine) {
        for (const n of neighborsOf(i, rows, cols)) {
          if (!g[n].revealed && !g[n].flagged) stack.push(n)
        }
      }
    }
  }

  const checkWin = (g: Cell[]) => {
    const total = rows * cols
    const revealedCount = g.filter(c => c.revealed).length
    return revealedCount === total - mines
  }

  const revealCell = (index: number) => {
    if (gameState === 'won' || gameState === 'lost') return
    const current = grid[index]

    // Flag mode has to be checked before the "already flagged" guard below
    // — otherwise tapping a flagged cell while flag mode is on could never
    // unflag it (the guard would return first every time).
    if (flagMode) {
      toggleFlag(index)
      return
    }
    if (current.flagged) return

    if (gameState === 'ready') {
      const fresh = placeMines(rows, cols, mines, index)
      floodReveal(fresh, index)
      if (fresh[index].mine) {
        // Astronomically unlikely given safe-first-click, but guard anyway.
        revealAllMines(fresh)
        setGrid(fresh)
        playExplosion()
        setGameState('lost')
        setFace('lose')
        return
      }
      setGrid(fresh)
      const won = checkWin(fresh)
      setGameState(won ? 'won' : 'playing')
      if (won) setFace('win')
      return
    }

    if (current.revealed) {
      // Chord: clicking an already-revealed number whose adjacent flag
      // count matches its own number reveals all remaining neighbors —
      // classic Minesweeper convenience.
      if (current.adjacent > 0) {
        const next = grid.map(c => ({ ...c }))
        const neighbors = neighborsOf(index, rows, cols)
        const flagCount = neighbors.filter(n => next[n].flagged).length
        if (flagCount === current.adjacent) {
          let hitMine = false
          for (const n of neighbors) {
            if (next[n].flagged || next[n].revealed) continue
            if (next[n].mine) hitMine = true
            floodReveal(next, n)
          }
          if (hitMine) {
            revealAllMines(next)
            setGrid(next)
            playExplosion()
            setGameState('lost')
            setFace('lose')
            return
          }
          setGrid(next)
          if (checkWin(next)) {
            setGameState('won')
            setFace('win')
          }
        }
      }
      return
    }

    const next = grid.map(c => ({ ...c }))
    if (next[index].mine) {
      next[index].revealed = true
      revealAllMines(next)
      setGrid(next)
      playExplosion()
      setGameState('lost')
      setFace('lose')
      return
    }
    floodReveal(next, index)
    setGrid(next)
    if (checkWin(next)) {
      setGameState('won')
      setFace('win')
    }
  }

  const toggleFlag = (index: number) => {
    if (gameState === 'won' || gameState === 'lost' || gameState === 'ready') {
      if (gameState !== 'ready') return
    }
    const cell = grid[index]
    if (cell.revealed) return
    const next = grid.map(c => ({ ...c }))
    next[index].flagged = !next[index].flagged
    setGrid(next)
    setFlagsPlaced(f => f + (next[index].flagged ? 1 : -1))
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    if (gameState === 'won' || gameState === 'lost') return
    toggleFlag(index)
  }

  const minesLeft = mines - flagsPlaced

  return (
    <div className="flex-1 min-h-0 bg-[#c0c0c0] flex flex-col items-center overflow-hidden relative">
      {/* w-fit is load-bearing — see the comment on contentRef above. */}
      <div ref={contentRef} className="w-fit flex flex-col">
        <div className="flex-shrink-0 flex bg-[#c0c0c0] text-xs z-20">
          <div className="relative">
          <button
            onClick={() => setOpenMenu(m => (m === 'game' ? null : 'game'))}
            className={`px-3 ml-2 py-0.5 text-black ${openMenu === 'game' ? 'bg-[#000080] text-white' : ''}`}
          >
            <span className="underline">G</span>ame
          </button>

          {openMenu === 'game' && (
            <div className="absolute top-full left-1 min-w-[170px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-md py-1">
              <MenuItem shortcut="F2" onClick={() => { resetGame(difficulty); setOpenMenu(null) }}>
                New
              </MenuItem>
              <div className="my-1 border-t border-[#808080] border-b border-b-white" />
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
                <MenuItem key={d} onClick={() => { setDifficulty(d); setOpenMenu(null) }}>
                  {difficulty === d ? '● ' : '  '}{DIFFICULTIES[d].label}
                </MenuItem>
              ))}
              <div className="my-1 border-t border-[#808080] border-b border-b-white" />
              <MenuItem onClick={() => { setFlagMode(m => !m); setOpenMenu(null) }}>
                {flagMode ? '☑' : '☐'} Flag Mode (touch)
              </MenuItem>
            </div>
          )}
          </div>
        </div>

        <div className="flex-shrink-0 p-3 pt-1">
          <div className="inline-block bg-[#c0c0c0] p-2 border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]">
            <div className="flex items-center justify-between mb-2 bg-[#c0c0c0] p-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white">
              <Led value={minesLeft} />
              <button
                onClick={() => resetGame(difficulty)}
                onMouseDown={() => setFace('surprised')}
                onMouseUp={() => setFace(gameState === 'won' ? 'win' : gameState === 'lost' ? 'lose' : 'smile')}
                className="win98-button flex-shrink-0 w-8 h-8 flex items-center justify-center text-lg"
                aria-label="New game"
                title="New game"
              >
                {face === 'win' ? '😎' : face === 'lose' ? '😵' : face === 'surprised' ? '😮' : '🙂'}
              </button>
              <Led value={elapsed} />
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, ${MAX_CELL_SIZE}px)` }}
              onContextMenu={e => e.preventDefault()}
            >
              {grid.map((cell, i) => {
                const showMine = cell.revealed && cell.mine
                const wrongFlag = gameState === 'lost' && cell.flagged && !cell.mine
                return (
                  <button
                    key={i}
                    onClick={() => revealCell(i)}
                    onContextMenu={e => handleContextMenu(e, i)}
                    onMouseDown={() => !cell.revealed && gameState !== 'won' && gameState !== 'lost' && setFace('surprised')}
                    onMouseUp={() => setFace(gameState === 'won' ? 'win' : gameState === 'lost' ? 'lose' : 'smile')}
                    onMouseLeave={() => setFace(gameState === 'won' ? 'win' : gameState === 'lost' ? 'lose' : 'smile')}
                    className={
                      cell.revealed
                        ? 'flex items-center justify-center font-bold bg-[#c0c0c0] border border-[#808080]'
                        : 'win98-button flex items-center justify-center font-bold'
                    }
                    style={{
                      width: MAX_CELL_SIZE,
                      height: MAX_CELL_SIZE,
                      fontSize: Math.max(9, Math.round(MAX_CELL_SIZE * 0.5)),
                      color: cell.revealed && !cell.mine ? NUMBER_COLORS[cell.adjacent] : undefined,
                      backgroundColor: showMine ? (wrongFlag ? undefined : '#ff0000') : undefined,
                    }}
                  >
                    {cell.revealed
                      ? cell.mine
                        ? '💣'
                        : cell.adjacent > 0
                          ? cell.adjacent
                          : ''
                      : cell.flagged
                        ? wrongFlag
                          ? '❌'
                          : '🚩'
                        : ''}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Explicit width matching the board card (cols*MAX_CELL_SIZE + its
            own p-2/border-2 chrome) rather than relying on the surrounding
            flex/w-fit layout to size this row — a flex row here stretches
            to whatever width its container currently happens to be, but a
            single long line of text doesn't wrap within that the way block
            text does, so on narrower boards (Beginner, Intermediate) it was
            overflowing past the window edge and getting clipped instead of
            wrapping to a second line. */}
        <div
          className="flex-shrink-0 px-2 pb-2 text-[11px] text-black text-center leading-snug"
          style={{ width: cols * MAX_CELL_SIZE + 20 }}
        >
          {gameState === 'won' && <span className="font-bold text-green-800">🎉 You win!</span>}
          {gameState === 'lost' && <span className="font-bold text-red-800">💥 Boom — try again.</span>}
          {(gameState === 'ready' || gameState === 'playing') && (
            <span>Left-click to reveal, right-click to flag{flagMode ? ' (flag mode on — tap flags instead)' : ''}.</span>
          )}
        </div>
      </div>

      {/* Click-outside-to-close for the menu dropdowns. */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
