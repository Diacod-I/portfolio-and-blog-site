'use client'

// Solitaire (Klondike) — built natively, same reasoning as Minesweeper: no
// third-party embed to fight, full control over sizing and touch support.
//
// Architecture notes (the parts that earned their complexity):
//
// DRAG: custom Pointer Events (pointerdown/move/up + setPointerCapture),
// preview portaled to document.body (Win98Window transforms its frame, which
// re-bases position:fixed), position updated via style.transform + rAF so
// React never re-renders mid-drag. Crash-safe lifecycle: pointercancel,
// lostpointercapture, and window-minimize all funnel into cancelDrag().
//
// DROP: the preview element's actual getBoundingClientRect() is the truth —
// the drop is judged by where the CARD is on screen, not where the cursor
// is. Rect-overlap against every pile, candidates tried best-overlap-first
// until one validates (validateMove is pure, so trying in sequence is safe).
//
// FLIGHTS: every non-drag card movement (double-click, stock draw, failed
// drop snap-back, auto-complete cascade) animates as a "flight": a portaled
// fixed-position card transitions from the source rect to the destination
// rect (~180ms). State commits immediately; the landed card is hidden via
// an `arriving` set until its flight touches down. Google-Solitaire feel,
// zero layout thrash.
//
// AUTO-COMPLETE: when the stock+waste are empty and every tableau card is
// face-up, the game is mathematically won — the remaining drags are busywork.
// A staggered cascade flies everything to the foundations, the move counter
// frozen (the player already earned the win).
//
// DIFFICULTY: move budgets, in the spirit of Minesweeper's Game menu.
// Easy = unlimited, Medium = 130, Hard = 85. Card moves count; stock draws
// don't. Run out → "Out of moves" dialog.

import { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'

type Suit = 'S' | 'H' | 'D' | 'C'
type Card = { suit: Suit; rank: number; faceUp: boolean }

type Selection =
  | { from: 'tableau'; col: number; index: number }
  | { from: 'waste' }
  | { from: 'foundation'; suit: Suit }

type Destination = { kind: 'tableau'; col: number } | { kind: 'foundation'; suit: Suit }

type GameState = {
  tableau: Card[][]
  foundations: Record<Suit, Card[]>
  stock: Card[]
  waste: Card[]
}

type Difficulty = 'easy' | 'medium' | 'hard'
// Limits assume stock draws count as moves (24-card stock, usually cycled
// 2-3 times in a winning game) on top of ~52 foundation moves + shuffling.
const DIFFICULTIES: Record<Difficulty, { label: string; limit: number | null }> = {
  easy: { label: 'Easy', limit: null },
  medium: { label: 'Medium', limit: 160 },
  hard: { label: 'Hard', limit: 110 },
}

const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_LABEL: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }

const CARD_W = 60
const CARD_H = 84
const FACE_UP_OFFSET = 22
const FACE_DOWN_OFFSET = 10
const DRAG_THRESHOLD = 6
const FLIGHT_MS = 180
const CASCADE_STEP_MS = 110

const cardKey = (c: Card) => `${c.suit}${c.rank}`

function colorOf(suit: Suit): 'red' | 'black' {
  return suit === 'H' || suit === 'D' ? 'red' : 'black'
}

function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank)
}

function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, faceUp: false })
  }
  return deck
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeNewGame(): GameState {
  const deck = shuffle(makeDeck())
  const tableau: Card[][] = []
  let idx = 0
  for (let col = 0; col < 7; col++) {
    const colCards: Card[] = []
    for (let n = 0; n <= col; n++) {
      const card = deck[idx++]
      colCards.push({ ...card, faceUp: n === col })
    }
    tableau.push(colCards)
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }))
  return { tableau, foundations: { S: [], H: [], D: [], C: [] }, stock, waste: [] }
}

function isRunValid(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i]
    const b = cards[i + 1]
    if (b.rank !== a.rank - 1 || colorOf(a.suit) === colorOf(b.suit)) return false
  }
  return true
}

function getSelectedCards(sel: Selection, s: GameState): Card[] {
  if (sel.from === 'tableau') return s.tableau[sel.col].slice(sel.index)
  if (sel.from === 'waste') return s.waste.length ? [s.waste[s.waste.length - 1]] : []
  const pile = s.foundations[sel.suit]
  return pile.length ? [pile[pile.length - 1]] : []
}

function removeFromSource(sel: Selection, s: GameState): GameState {
  if (sel.from === 'tableau') {
    const tableau = s.tableau.map(c => [...c])
    const col = tableau[sel.col]
    tableau[sel.col] = col.slice(0, sel.index)
    const rem = tableau[sel.col]
    if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
      rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true }
    }
    return { ...s, tableau }
  }
  if (sel.from === 'waste') return { ...s, waste: s.waste.slice(0, -1) }
  return { ...s, foundations: { ...s.foundations, [sel.suit]: s.foundations[sel.suit].slice(0, -1) } }
}

// ---- Pure move logic: validate + apply, so double-click / auto-complete /
// drop candidates can plan moves without side effects. -----------------------
function validateMove(sel: Selection, dest: Destination, s: GameState): boolean {
  const cards = getSelectedCards(sel, s)
  if (cards.length === 0) return false
  const moving = cards[0]

  if (dest.kind === 'foundation') {
    if (cards.length !== 1) return false
    if (moving.suit !== dest.suit) return false
    if (sel.from === 'foundation' && sel.suit === dest.suit) return false
    const pile = s.foundations[dest.suit]
    const top = pile[pile.length - 1]
    return pile.length === 0 ? moving.rank === 1 : !!top && moving.rank === top.rank + 1
  }

  if (sel.from === 'tableau' && sel.col === dest.col) return false
  const destCol = s.tableau[dest.col]
  const destTop = destCol[destCol.length - 1]
  return destCol.length === 0
    ? moving.rank === 13
    : !!destTop && destTop.faceUp && moving.rank === destTop.rank - 1 && colorOf(moving.suit) !== colorOf(destTop.suit)
}

function applyMove(sel: Selection, dest: Destination, s: GameState): GameState {
  const cards = getSelectedCards(sel, s)
  const without = removeFromSource(sel, s)
  if (dest.kind === 'foundation') {
    return {
      ...without,
      foundations: { ...without.foundations, [dest.suit]: [...without.foundations[dest.suit], cards[0]] },
    }
  }
  const tableau = without.tableau.map(c => [...c])
  tableau[dest.col] = [...tableau[dest.col], ...cards]
  return { ...without, tableau }
}

function columnCardTops(column: Card[]): number[] {
  let top = 0
  const tops: number[] = []
  for (const card of column) {
    tops.push(top)
    top += card.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET
  }
  return tops
}

function selectionIncludes(sel: Selection | null, card: 'tableau', col: number, index: number): boolean
function selectionIncludes(sel: Selection | null, card: 'waste'): boolean
function selectionIncludes(sel: Selection | null, card: 'foundation', suit: Suit): boolean
function selectionIncludes(sel: Selection | null, kind: string, a?: number | Suit, b?: number): boolean {
  if (!sel) return false
  if (kind === 'tableau' && sel.from === 'tableau') return sel.col === a && (b as number) >= sel.index
  if (kind === 'waste' && sel.from === 'waste') return true
  if (kind === 'foundation' && sel.from === 'foundation') return sel.suit === a
  return false
}

// ---- Face card art (J / Q / K): simple mirrored court figures in flat
// win98-palette SVG — same double-ended layout as a real deck. --------------
function FaceArt({ rank, suit }: { rank: number; suit: Suit }) {
  const red = colorOf(suit) === 'red'
  const main = red ? '#c00000' : '#1a1a1a'
  const accent = red ? '#7a0000' : '#000080'
  const gold = '#d4a017'
  const skin = '#f0c8a0'

  // One half-figure; rendered twice, second rotated 180° — like real courts.
  const Half = () => (
    <g>
      {/* headwear */}
      {rank === 13 && (
        <g>
          <path d="M8 9 L11 4 L14 8 L17 3 L20 8 L23 4 L26 9 Z" fill={gold} stroke={accent} strokeWidth="0.6" />
          <circle cx="11" cy="4" r="1" fill={main} />
          <circle cx="17" cy="3" r="1" fill={main} />
          <circle cx="23" cy="4" r="1" fill={main} />
        </g>
      )}
      {rank === 12 && (
        <g>
          <path d="M9 9 Q17 1 25 9 Z" fill={gold} stroke={accent} strokeWidth="0.6" />
          <circle cx="17" cy="4.5" r="1.4" fill={main} />
        </g>
      )}
      {rank === 11 && (
        <g>
          <path d="M9 9 L9 5 Q17 2 25 5 L25 9 Z" fill={accent} stroke={main} strokeWidth="0.5" />
          <path d="M23 5 L28 2 L27 7 Z" fill={gold} />
        </g>
      )}
      {/* face */}
      <rect x="12" y="9" width="10" height="9" rx="3" fill={skin} stroke={accent} strokeWidth="0.6" />
      <circle cx="15" cy="12.5" r="0.8" fill="#222" />
      <circle cx="19" cy="12.5" r="0.8" fill="#222" />
      <path d="M15 15.5 Q17 16.8 19 15.5" stroke="#222" strokeWidth="0.7" fill="none" />
      {rank === 13 && <path d="M13 17 Q17 21 21 17 L21 19 Q17 22.5 13 19 Z" fill="#e8e8e8" stroke={accent} strokeWidth="0.4" />}
      {/* shoulders / tunic */}
      <path d="M8 26 Q8 18 13 18 L21 18 Q26 18 26 26 Z" fill={accent} />
      <path d="M14 19 L17 26 L20 19 Z" fill={gold} />
      {/* suit pip on the chest */}
      <text x="17" y="25" textAnchor="middle" fontSize="6" fill="#ffffff">{SUIT_SYMBOL[suit]}</text>
    </g>
  )

  return (
    <svg viewBox="0 0 34 56" width={34} height={50} aria-hidden="true">
      <rect x="0.5" y="0.5" width="33" height="55" fill="#fdf6e3" stroke={gold} strokeWidth="1" />
      <Half />
      <g transform="rotate(180 17 28)">
        <Half />
      </g>
      <line x1="1" y1="28" x2="33" y2="28" stroke={gold} strokeWidth="0.5" />
    </svg>
  )
}

function CardFace({ card }: { card: Card }) {
  const color = colorOf(card.suit) === 'red' ? '#c00000' : '#000000'
  const isCourt = card.rank >= 11
  return (
    <div
      className="bg-white border-2 border-black rounded-sm relative select-none"
      style={{ width: CARD_W, height: CARD_H, color }}
    >
      <div className="absolute top-0.5 left-1 text-xs font-bold leading-none">
        <div>{rankLabel(card.rank)}</div>
        <div>{SUIT_SYMBOL[card.suit]}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {isCourt ? <FaceArt rank={card.rank} suit={card.suit} /> : (
          <span className="text-2xl">{SUIT_SYMBOL[card.suit]}</span>
        )}
      </div>
      <div className="absolute bottom-0.5 right-1 text-xs font-bold leading-none rotate-180">
        <div>{rankLabel(card.rank)}</div>
        <div>{SUIT_SYMBOL[card.suit]}</div>
      </div>
    </div>
  )
}

function CardBack() {
  return (
    <div
      className="border-2 border-white rounded-sm"
      style={{
        width: CARD_W,
        height: CARD_H,
        background:
          'repeating-linear-gradient(45deg, #000080, #000080 4px, #1f3fbf 4px, #1f3fbf 8px)',
      }}
    />
  )
}

// The dashed-outline visual on its own (a div): used INSIDE a still-mounted
// pile button while its last card is mid-drag — swapping the button for the
// EmptySlot component would unmount the DOM node holding the pointer
// capture, killing the drag.
function SlotOutline({ glyph }: { glyph?: string }) {
  return (
    <div
      className="border-2 border-dashed border-[#7a9a7a] rounded-sm flex items-center justify-center text-[#7a9a7a] text-lg"
      style={{ width: CARD_W, height: CARD_H }}
    >
      {glyph ?? ''}
    </div>
  )
}

function EmptySlot({ onClick, glyph }: { onClick?: () => void; glyph?: string }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="block p-0 border-0 bg-transparent disabled:cursor-default"
    >
      <SlotOutline glyph={glyph} />
    </button>
  )
}

type DragInfo = {
  sel: Selection
  cards: Card[]
  pointerId: number
  startX: number
  startY: number
  grabDX: number
  grabDY: number
  moved: boolean
}

type Point = { x: number; y: number }
type Flight = { id: number; cards: Card[]; from: Point; to: Point }

type SolitaireWindowProps = {
  /** False while the window is minimized/hidden — cancels drags and flushes
   *  flight animations (both portal to document.body, OUTSIDE the window,
   *  so they'd otherwise linger as ghost cards over the desktop). */
  windowVisible?: boolean
}

export default function SolitaireWindow({ windowVisible = true }: SolitaireWindowProps) {
  const [state, setState] = useState<GameState>(() => makeNewGame())
  const [moves, setMoves] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [dragCards, setDragCards] = useState<Selection | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [arriving, setArriving] = useState<Set<string>>(new Set())
  const [autoCompleting, setAutoCompleting] = useState(false)

  const dragRef = useRef<DragInfo | null>(null)
  const lastTapRef = useRef<{ key: string; time: number; x: number; y: number } | null>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const gameRootRef = useRef<HTMLDivElement | null>(null)
  // The green felt play area only — gameRootRef also contains the gray
  // toolbar and status rows, and the drag clamp must fence cards to the
  // felt, not let them ride up over the toolbar.
  const boardRef = useRef<HTMLDivElement | null>(null)
  const flightIdRef = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const windowVisibleRef = useRef(windowVisible)
  windowVisibleRef.current = windowVisible

  // Pile anchor elements, so flights know real on-screen coordinates.
  const slotRefs = useRef<Record<string, HTMLElement | null>>({})
  const setSlotRef = (key: string) => (el: HTMLElement | null) => { slotRefs.current[key] = el }

  const applyPreviewPos = () => {
    rafRef.current = null
    const el = previewRef.current
    if (el) el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
  }

  const cancelDrag = () => {
    dragRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setDragCards(null)
  }

  // Minimize mid-anything: kill the drag AND flush flights instantly (their
  // state is already committed, only the animation is discarded).
  useEffect(() => {
    if (!windowVisible) {
      cancelDrag()
      setFlights([])
      setArriving(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowVisible])

  // ---- SFX -------------------------------------------------------------------
  const soundsRef = useRef<Record<string, HTMLAudioElement> | null>(null)
  useEffect(() => {
    soundsRef.current = {
      shuffle: new Audio('/win98/oxidvideos-shuffling-deck-of-cards-522518.mp3'),
      take: new Audio('/win98/oxidvideos-taking-playing-card-522520.mp3'),
      place: new Audio('/win98/oxidvideos-placing-playing-card-522514.mp3'),
      slide: new Audio('/win98/oxidvideos-paper-slide-short-478835.mp3'),
      snapback: new Audio('/win98/oxidvideos-paper-slide-sfx-2-478837.mp3'),
    }
    Object.values(soundsRef.current).forEach(a => {
      a.preload = 'auto'
      a.volume = 0.55
    })
  }, [])

  const playSound = useCallback((name: 'shuffle' | 'take' | 'place' | 'slide' | 'snapback') => {
    const a = soundsRef.current?.[name]
    if (!a) return
    a.currentTime = 0
    a.play().catch(() => {})
  }, [])

  const playWinChime = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0.15, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.3)
      })
    } catch { /* Web Audio unavailable — skip */ }
  }

  // ---- Win / loss ----------------------------------------------------------
  const won = SUITS.reduce((sum, s) => sum + state.foundations[s].length, 0) === 52
  const limit = DIFFICULTIES[difficulty].limit
  const lost = !won && limit !== null && moves >= limit
  const wonRef = useRef(false)
  useEffect(() => {
    if (won && !wonRef.current) playWinChime()
    wonRef.current = won
  }, [won])

  const cascadeTimer = useRef<NodeJS.Timeout | null>(null)
  const newGame = (diff: Difficulty = difficulty) => {
    if (cascadeTimer.current) clearTimeout(cascadeTimer.current)
    cascadeTimer.current = null
    autoStartedRef.current = false
    setAutoCompleting(false)
    setFlights([])
    setArriving(new Set())
    playSound('shuffle')
    setDifficulty(diff)
    setState(makeNewGame())
    setMoves(0)
  }

  useEffect(() => () => {
    if (cascadeTimer.current) clearTimeout(cascadeTimer.current)
  }, [])

  // ---- Flight system ---------------------------------------------------------
  /** Where a card landing at `dest` will sit on screen, measured pre-commit. */
  const destPoint = (dest: Destination, s: GameState): Point | null => {
    if (dest.kind === 'foundation') {
      const el = slotRefs.current[`f-${dest.suit}`]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top }
    }
    const el = slotRefs.current[`col-${dest.col}`]
    if (!el) return null
    const r = el.getBoundingClientRect()
    const col = s.tableau[dest.col]
    const tops = columnCardTops(col)
    const nextTop = col.length === 0 ? 0 : tops[tops.length - 1] + (col[col.length - 1].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET)
    return { x: r.left, y: r.top + nextTop }
  }

  /** Where the moving card currently sits on screen. */
  const srcPoint = (sel: Selection, s: GameState): Point | null => {
    if (sel.from === 'waste') {
      const el = slotRefs.current['waste']
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top }
    }
    if (sel.from === 'foundation') {
      const el = slotRefs.current[`f-${sel.suit}`]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top }
    }
    const el = slotRefs.current[`col-${sel.col}`]
    if (!el) return null
    const r = el.getBoundingClientRect()
    const tops = columnCardTops(s.tableau[sel.col])
    return { x: r.left, y: r.top + (tops[sel.index] ?? 0) }
  }

  const launchFlight = (cards: Card[], from: Point, to: Point) => {
    if (!windowVisibleRef.current) return // minimized: skip animation entirely
    const id = ++flightIdRef.current
    setFlights(f => [...f, { id, cards, from, to }])
    setArriving(prev => {
      const next = new Set(prev)
      cards.forEach(c => next.add(cardKey(c)))
      return next
    })
  }

  const endFlight = (flight: Flight) => {
    setFlights(f => f.filter(x => x.id !== flight.id))
    setArriving(prev => {
      const next = new Set(prev)
      flight.cards.forEach(c => next.delete(cardKey(c)))
      return next
    })
    playSound('place')
  }

  /** Validate → measure → commit → animate. The one move pipeline. */
  const doMove = (
    sel: Selection,
    dest: Destination,
    opts: { countMove?: boolean; from?: Point } = {}
  ): boolean => {
    const s = stateRef.current
    if (!validateMove(sel, dest, s)) return false
    const cards = getSelectedCards(sel, s)
    const from = opts.from ?? srcPoint(sel, s)
    const to = destPoint(dest, s)
    setState(applyMove(sel, dest, s))
    if (opts.countMove !== false) setMoves(m => m + 1)
    if (from && to) launchFlight(cards, from, to)
    else playSound('place')
    return true
  }

  // ---- Double-click: fly to the best destination -----------------------------
  // Priority: foundation (only for single cards), then first valid tableau col.
  const findAutoDest = (sel: Selection, s: GameState): Destination | null => {
    const cards = getSelectedCards(sel, s)
    if (cards.length === 0) return null
    if (cards.length === 1) {
      const f: Destination = { kind: 'foundation', suit: cards[0].suit }
      if (validateMove(sel, f, s)) return f
    }
    for (let col = 0; col < 7; col++) {
      const t: Destination = { kind: 'tableau', col }
      if (validateMove(sel, t, s)) return t
    }
    return null
  }

  const handleDoubleClick = (sel: Selection) => {
    if (autoCompleting || lost) return
    const dest = findAutoDest(sel, stateRef.current)
    if (dest) doMove(sel, dest)
    else playSound('snapback')
  }

  // ---- Stock -----------------------------------------------------------------
  const handleStockClick = () => {
    if (autoCompleting || lost) return
    const s = stateRef.current
    if (s.stock.length > 0) {
      playSound('slide')
      const card = { ...s.stock[s.stock.length - 1], faceUp: true }
      // Animate the draw: stock slot → waste slot
      const fromEl = slotRefs.current['stock']
      const toEl = slotRefs.current['waste']
      setState({ ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, card] })
      setMoves(m => m + 1) // drawing costs a move (recycling the waste stays free)
      if (fromEl && toEl) {
        const fr = fromEl.getBoundingClientRect()
        const tr = toEl.getBoundingClientRect()
        launchFlight([card], { x: fr.left, y: fr.top }, { x: tr.left, y: tr.top })
      }
    } else if (s.waste.length > 0) {
      playSound('shuffle')
      setState({
        ...s,
        stock: s.waste.slice().reverse().map(c => ({ ...c, faceUp: false })),
        waste: [],
      })
    }
  }

  // ---- Auto-complete cascade ---------------------------------------------------
  // Trigger: stock and waste empty, every tableau card face-up, not yet won.
  // From that position Klondike is always winnable — fly it home. Moves are
  // NOT counted: the player has already won.
  const autoStartedRef = useRef(false)
  useEffect(() => {
    if (won) { autoStartedRef.current = false; return }
    if (autoCompleting || lost || dragRef.current) return
    const ready =
      state.stock.length === 0 &&
      state.waste.length === 0 &&
      state.tableau.some(col => col.length > 0) &&
      state.tableau.every(col => col.every(c => c.faceUp))
    if (!ready || autoStartedRef.current) return

    autoStartedRef.current = true
    setAutoCompleting(true)
    cancelDrag()

    const step = () => {
      const s = stateRef.current
      // Find any tableau top that can land on its foundation right now.
      let played = false
      for (let col = 0; col < 7; col++) {
        const column = s.tableau[col]
        if (column.length === 0) continue
        const sel: Selection = { from: 'tableau', col, index: column.length - 1 }
        const dest: Destination = { kind: 'foundation', suit: column[column.length - 1].suit }
        if (validateMove(sel, dest, s)) {
          doMove(sel, dest, { countMove: false })
          played = true
          break
        }
      }
      if (played) {
        cascadeTimer.current = setTimeout(step, windowVisibleRef.current ? CASCADE_STEP_MS : 0)
      } else {
        setAutoCompleting(false)
        cascadeTimer.current = null
      }
    }
    cascadeTimer.current = setTimeout(step, CASCADE_STEP_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, won, lost, autoCompleting])

  // ---- Drag and drop -----------------------------------------------------------
  const beginDrag = (e: React.PointerEvent<HTMLElement>, sel: Selection, cards: Card[]) => {
    if (dragRef.current || autoCompleting || lost) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = {
      sel,
      cards,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      grabDX: e.clientX - rect.left,
      grabDY: e.clientY - rect.top,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current
    if (!info || e.pointerId !== info.pointerId) return
    if (!info.moved && Math.hypot(e.clientX - info.startX, e.clientY - info.startY) < DRAG_THRESHOLD) {
      return
    }
    if (!info.moved) {
      info.moved = true
      playSound('take')
      setDragCards(info.sel)
    }
    // Clamp the held card(s) inside the green felt play area: the preview
    // is portaled to document.body (the window's transform would displace
    // position:fixed), so without this you could drag cards clean off the
    // Solitaire window onto the desktop. Clamped to boardRef (the felt),
    // not gameRootRef — the root also contains the gray toolbar row, and
    // cards shouldn't ride up over it. Clamps by full stacked height.
    let x = e.clientX - info.grabDX
    let y = e.clientY - info.grabDY
    const tableRect = boardRef.current?.getBoundingClientRect()
    if (tableRect) {
      const previewH = CARD_H + (info.cards.length - 1) * FACE_UP_OFFSET
      x = Math.min(Math.max(x, tableRect.left), tableRect.right - CARD_W)
      y = Math.min(Math.max(y, tableRect.top), tableRect.bottom - previewH)
    }
    posRef.current = { x, y }
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(applyPreviewPos)
  }

  const onDragEnd = (e: React.PointerEvent<HTMLElement>) => {
    const info = dragRef.current
    dragRef.current = null
    if (!info || e.pointerId !== info.pointerId) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    if (!info.moved) {
      // Our own double-activation detector, replacing native onDoubleClick:
      // dblclick only fires when both clicks land on the SAME element, but
      // the waste/foundation buttons swap content (and sometimes elements)
      // around draws and flights, silently eating double-clicks — e.g. a
      // freshly drawn queen refusing to fly to an exposed king. Two taps on
      // the same logical pile within 350ms/12px = double-click. Also gives
      // touch users a working double-tap for free.
      const now = performance.now()
      const key = JSON.stringify(info.sel)
      const last = lastTapRef.current
      if (
        last &&
        last.key === key &&
        now - last.time < 350 &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) < 12
      ) {
        lastTapRef.current = null
        cancelDrag()
        handleDoubleClick(info.sel)
        return
      }
      lastTapRef.current = { key, time: now, x: e.clientX, y: e.clientY }
      cancelDrag()
      return
    }
    lastTapRef.current = null // a real drag is not a tap

    // THE CARD, not the cursor: judge the drop by where the preview card
    // actually is on screen. (Fallback to the tracked position if the ref
    // is somehow gone.)
    const pr = previewRef.current?.getBoundingClientRect()
    const cardLeft = pr ? pr.left : posRef.current.x
    const cardTop = pr ? pr.top : posRef.current.y

    type Candidate = { dest: Destination; area: number }
    const candidates: Candidate[] = []
    const root = gameRootRef.current
    if (root) {
      root.querySelectorAll<HTMLElement>('[data-drop-col],[data-drop-suit]').forEach(el => {
        const r = el.getBoundingClientRect()
        const extendBottom = el.dataset.dropCol !== undefined ? CARD_H : 0
        const overlapW = Math.min(cardLeft + CARD_W, r.right) - Math.max(cardLeft, r.left)
        const overlapH = Math.min(cardTop + CARD_H, r.bottom + extendBottom) - Math.max(cardTop, r.top)
        if (overlapW <= 0 || overlapH <= 0) return
        const dest: Destination =
          el.dataset.dropCol !== undefined
            ? { kind: 'tableau', col: Number(el.dataset.dropCol) }
            : { kind: 'foundation', suit: el.dataset.dropSuit as Suit }
        candidates.push({ dest, area: overlapW * overlapH })
      })
    }
    candidates.sort((a, b) => b.area - a.area)

    const releasePos: Point = { x: cardLeft, y: cardTop }
    let success = false
    for (const c of candidates) {
      // Settle animation: from where the player released to the exact slot.
      if (doMove(info.sel, c.dest, { from: releasePos })) {
        success = true
        break
      }
    }

    if (!success) {
      // Snap-back animation: the run flies home to its source pile.
      const s = stateRef.current
      const home = srcPoint(info.sel, s)
      if (home) {
        playSound('snapback')
        launchFlight(getSelectedCards(info.sel, s), releasePos, home)
      } else {
        playSound('snapback')
      }
    }

    cancelDrag()
  }

  const dragHandlers = (sel: Selection, cards: Card[]) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => beginDrag(e, sel, cards),
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
    onPointerCancel: cancelDrag,
    onLostPointerCapture: cancelDrag,
    style: { touchAction: 'none' as const, cursor: 'grab' },
  })

  /** Hidden while mid-drag (source) or mid-flight (arriving). */
  const isHidden = (card: Card, draggingThis: boolean) =>
    draggingThis || arriving.has(cardKey(card))

  const interactionsLocked = autoCompleting || lost

  return (
    <div ref={gameRootRef} className="relative flex-1 min-h-0 bg-[#0e5c24] flex flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse at top, #1a7a34, #0e5c24)' }}>
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 bg-[#c0c0c0] border-b-2 border-[#808080]">
        <div className="flex items-center gap-1">
          <button onClick={() => newGame()} className="win98-button px-3 py-1 text-xs font-bold text-black">
            New Game
          </button>
          <div className="border-l-2 border-[#808080] h-5 mx-1" />
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map(d => (
            <button
              key={d}
              // The active difficulty is disabled: switching difficulty starts
              // a fresh deal, so re-clicking the current one would silently
              // restart the game — New Game is the only restart button.
              disabled={difficulty === d}
              onClick={() => newGame(d)}
              className={`win98-button px-2 py-1 text-xs font-bold text-black ${
                difficulty === d
                  ? 'bg-[#c3c3c3] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white opacity-60 cursor-default'
                  : ''
              }`}
              title={DIFFICULTIES[d].limit === null ? 'No move limit' : `${DIFFICULTIES[d].limit} move limit`}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-black">
          Moves: {moves}{limit !== null ? ` / ${limit}` : ''}
        </span>
      </div>

      <div ref={boardRef} className="flex-1 min-h-0 overflow-auto p-4 relative" style={interactionsLocked ? { pointerEvents: 'none' } : undefined}>
        {/* Stock / waste / foundations row */}
        <div className="flex items-start gap-3 mb-6">
          <div ref={setSlotRef('stock')}>
            {state.stock.length > 0 ? (
              <button type="button" onClick={handleStockClick} className="block p-0 border-0 bg-transparent">
                <CardBack />
              </button>
            ) : (
              <EmptySlot
                onClick={state.waste.length > 0 ? handleStockClick : undefined}
                glyph="↺"
              />
            )}
          </div>

          <div ref={setSlotRef('waste')}>
            {(() => {
              const wasteDragging = selectionIncludes(dragCards, 'waste')
              const top = state.waste[state.waste.length - 1]
              const topInFlight = top && arriving.has(cardKey(top))
              const shown = wasteDragging || topInFlight
                ? state.waste[state.waste.length - 2]
                : top
              // Keep the button mounted while a drawn card is mid-flight too
              // (not just mid-drag): otherwise the pile is a disabled
              // EmptySlot for ~180ms after every draw, eating the first
              // click of an eager double-click.
              if (!shown && !wasteDragging && !topInFlight) return <EmptySlot />
              return (
                <button
                  type="button"
                  className="block p-0 border-0 bg-transparent rounded-sm"
                  {...dragHandlers({ from: 'waste' }, shown ? [shown] : [])}
                >
                  {shown ? <CardFace card={shown} /> : <SlotOutline />}
                </button>
              )
            })()}
          </div>

          <div className="flex-1" />

          {SUITS.map(suit => {
            const pile = state.foundations[suit]
            const dragging = selectionIncludes(dragCards, 'foundation', suit)
            const top = pile[pile.length - 1]
            const topInFlight = top && arriving.has(cardKey(top))
            const shown = dragging || topInFlight ? pile[pile.length - 2] : top
            return (
              <div key={suit} data-drop-suit={suit} ref={setSlotRef(`f-${suit}`)}>
                {shown || dragging ? (
                  <button
                    type="button"
                    className="block p-0 border-0 bg-transparent rounded-sm"
                    {...dragHandlers({ from: 'foundation', suit }, shown ? [shown] : [])}
                  >
                    {shown ? <CardFace card={shown} /> : <SlotOutline glyph={SUIT_SYMBOL[suit]} />}
                  </button>
                ) : (
                  <EmptySlot glyph={SUIT_SYMBOL[suit]} />
                )}
              </div>
            )
          })}
        </div>

        {/* Tableau */}
        <div className="flex items-start gap-3">
          {state.tableau.map((column, col) => {
            const tops = columnCardTops(column)
            const height = column.length ? tops[tops.length - 1] + CARD_H : CARD_H
            // "Effectively empty": every card in the column is visually
            // hidden (mid-drag or mid-flight). The cards are still in state,
            // so the length===0 EmptySlot branch doesn't fire — without this
            // the emptying column shows a blank void instead of the dotted
            // outline (same class of bug as the waste pile earlier).
            const allHidden =
              column.length > 0 &&
              column.every((card, index) =>
                isHidden(card, selectionIncludes(dragCards, 'tableau', col, index))
              )
            return (
              <div key={col} data-drop-col={col} ref={setSlotRef(`col-${col}`)} className="relative" style={{ width: CARD_W, height }}>
                {allHidden && (
                  <div className="absolute left-0 top-0 pointer-events-none">
                    <SlotOutline />
                  </div>
                )}
                {column.length === 0 ? (
                  <EmptySlot />
                ) : (
                  column.map((card, index) => {
                    const draggable = card.faceUp && isRunValid(column.slice(index))
                    const dragging = selectionIncludes(dragCards, 'tableau', col, index)
                    return (
                      <button
                        key={cardKey(card)}
                        type="button"
                        disabled={!card.faceUp}
                        className="absolute left-0 block p-0 border-0 bg-transparent disabled:cursor-default"
                        style={{
                          top: tops[index],
                          zIndex: index,
                          opacity: isHidden(card, dragging) ? 0 : 1,
                          borderRadius: 4,
                          touchAction: draggable ? 'none' : undefined,
                          cursor: draggable ? 'grab' : 'default',
                        }}
                        onPointerDown={draggable ? e => beginDrag(e, { from: 'tableau', col, index }, column.slice(index)) : undefined}
                        onPointerMove={draggable ? onDragMove : undefined}
                        onPointerUp={draggable ? onDragEnd : undefined}
                        onPointerCancel={draggable ? cancelDrag : undefined}
                        onLostPointerCapture={draggable ? cancelDrag : undefined}
                      >
                        {card.faceUp ? <CardFace card={card} /> : <CardBack />}
                      </button>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag preview (portaled: Win98Window transforms re-base position:fixed) */}
      {dragCards &&
        createPortal(
          <div
            ref={(el) => {
              previewRef.current = el
              if (el) el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
            }}
            className="fixed left-0 top-0 pointer-events-none z-[9980] will-change-transform"
          >
            {getSelectedCards(dragCards, state).map((card, i) => (
              <div key={cardKey(card)} className="absolute left-0" style={{ top: i * FACE_UP_OFFSET }}>
                <CardFace card={card} />
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Flight animations (same portal reasoning) */}
      {flights.length > 0 &&
        createPortal(
          <>
            {flights.map(flight => (
              <FlightCard key={flight.id} flight={flight} onDone={endFlight} />
            ))}
          </>,
          document.body
        )}

      {/* Out of moves dialog */}
      {lost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="win98-window w-64">
            <div className="win98-titlebar">
              <span>Solitaire</span>
            </div>
            <div className="bg-[#c0c0c0] p-4 flex flex-col items-center gap-3 text-black">
              <span className="text-2xl">🃏</span>
              <p className="text-sm font-bold text-center">Out of moves!</p>
              <p className="text-xs text-center">
                {DIFFICULTIES[difficulty].label} allows {limit} moves. Better luck next deal.
              </p>
              <button onClick={() => newGame()} className="win98-button px-4 py-1 text-xs font-bold">
                New Game
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#c0c0c0] px-2 py-1 border-t-2 border-[#dfdfdf] text-xs text-black">
        {won ? (
          <span className="font-bold text-green-800">🎉 You win!</span>
        ) : autoCompleting ? (
          <span className="font-bold">✨ Finishing up for you...</span>
        ) : (
          <span>Drag to move · Double-click sends a card to the best pile</span>
        )}
      </div>
    </div>
  )
}

// One flying card (or run): mounts at `from`, transitions to `to`, reports
// done on transitionend (with a timeout fallback in case the browser skips
// the transition, e.g. prefers-reduced-motion).
//
// JITTER LESSON: the transform must be set IMPERATIVELY, EXACTLY ONCE.
// The first version set it inside an inline ref callback — React re-invokes
// inline ref callbacks on every re-render (detach + attach), so each time
// ANY flight landed (two setStates → re-render), every other in-flight card
// had its transform reset to `from` and its launch re-scheduled: visible
// stutter, worst during cascades. Now: stable useRef + a start-once guard in
// useLayoutEffect (pre-paint, so the card never flashes at 0,0), a forced
// reflow instead of double-rAF to flush the start position, and memo() so
// sibling landings don't even re-render this component.
const FlightCard = memo(function FlightCard({
  flight,
  onDone,
}: {
  flight: Flight
  onDone: (f: Flight) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  const doneRef = useRef(false)
  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(flight)
  }

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el || startedRef.current) return
    startedRef.current = true
    el.style.transform = `translate3d(${flight.from.x}px, ${flight.from.y}px, 0)`
    void el.getBoundingClientRect() // flush: commit the start position
    el.style.transform = `translate3d(${flight.to.x}px, ${flight.to.y}px, 0)`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(finish, FLIGHT_MS + 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={elRef}
      onTransitionEnd={finish}
      className="fixed left-0 top-0 pointer-events-none z-[9979] will-change-transform"
      style={{ transition: `transform ${FLIGHT_MS}ms ease-out` }}
    >
      {flight.cards.map((card, i) => (
        <div key={`${card.suit}${card.rank}`} className="absolute left-0" style={{ top: i * FACE_UP_OFFSET }}>
          <CardFace card={card} />
        </div>
      ))}
    </div>
  )
})
