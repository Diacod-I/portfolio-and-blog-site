'use client'

// Solitaire (Klondike) — built natively, same reasoning as Minesweeper: no
// third-party embed to fight, full control over sizing and touch support.
// Cards are drawn with plain CSS (no image spritesheet needed).
//
// Real drag-and-drop, using the same custom Pointer Events technique as
// DesktopIcon.tsx (pointerdown/move/up + setPointerCapture) rather than the
// native HTML5 Drag and Drop API — native DnD has notoriously poor/absent
// touch support, which matters here since the rest of the site goes out of
// its way to work on mobile. Pointer Events give mouse and touch dragging
// for free from the same code path.
//
// Drop targets are found via document.elementFromPoint + closest() against
// data-drop-col/data-drop-suit attributes on each pile's wrapper — simpler
// than tracking a ref/rect per drop zone, and works the same regardless of
// whether the pointer lands on a card, an empty slot, or the bare pile
// background, since closest() walks up to the wrapper either way.
//
// Double-click still sends a card straight to its foundation, same
// shortcut real Solitaire has alongside dragging.

import { useEffect, useRef, useState } from 'react'
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

const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_LABEL: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }

const CARD_W = 60
const CARD_H = 84
const FACE_UP_OFFSET = 22
const FACE_DOWN_OFFSET = 10
const DRAG_THRESHOLD = 6

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

function CardFace({ card }: { card: Card }) {
  const color = colorOf(card.suit) === 'red' ? '#c00000' : '#000000'
  return (
    <div
      className="bg-white border-2 border-black rounded-sm relative select-none"
      style={{ width: CARD_W, height: CARD_H, color }}
    >
      <div className="absolute top-0.5 left-1 text-xs font-bold leading-none">
        <div>{rankLabel(card.rank)}</div>
        <div>{SUIT_SYMBOL[card.suit]}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-2xl">
        {SUIT_SYMBOL[card.suit]}
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
// capture, killing the drag (that was the "drag breaks on drawn cards" bug).
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

type SolitaireWindowProps = {
  /** False while the window is minimized/hidden — cancels any in-flight drag
   *  so the portaled preview (which lives on document.body, OUTSIDE the
   *  window) can't linger as a ghost card over the desktop. */
  windowVisible?: boolean
}

export default function SolitaireWindow({ windowVisible = true }: SolitaireWindowProps) {
  const [state, setState] = useState<GameState>(() => makeNewGame())
  const [moves, setMoves] = useState(0)
  const [dragCards, setDragCards] = useState<Selection | null>(null)
  const dragRef = useRef<DragInfo | null>(null)

  // Preview position lives OUTSIDE React state: a setState per pointermove
  // re-renders the whole board (~50 buttons) on every mouse tick — that was
  // the drag choppiness. Instead the portal div is moved directly via
  // style.transform, batched to one write per frame with rAF.
  const posRef = useRef({ x: 0, y: 0 })
  const previewRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const gameRootRef = useRef<HTMLDivElement | null>(null)

  const applyPreviewPos = () => {
    rafRef.current = null
    const el = previewRef.current
    if (el) el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
  }

  // Single escape hatch for every way a drag can die unexpectedly:
  // pointercancel, lost capture, or the window being minimized mid-drag.
  const cancelDrag = () => {
    dragRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setDragCards(null)
  }

  useEffect(() => {
    if (!windowVisible) cancelDrag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowVisible])

  // Card SFX (public/win98/oxidvideos-*): each real table action has its own
  // sound — shuffle on deal/recycle, "take" on pickup, "place" on a valid
  // drop, a soft paper slide when an invalid move snaps back (the Windows
  // error chime was too harsh for something you hear on every misdrop).
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

  const playSound = (name: 'shuffle' | 'take' | 'place' | 'slide' | 'snapback') => {
    const a = soundsRef.current?.[name]
    if (!a) return
    a.currentTime = 0
    a.play().catch(() => {}) // autoplay policies: fail silently pre-interaction
  }

  const playDrop = () => playSound('place')
  const playError = () => playSound('snapback')
  const playWinChime = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
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
    } catch {
      /* Web Audio unavailable/blocked — silently skip, dragging still works */
    }
  }

  const won = SUITS.reduce((sum, s) => sum + state.foundations[s].length, 0) === 52
  const wonRef = useRef(false)
  useEffect(() => {
    if (won && !wonRef.current) playWinChime()
    wonRef.current = won
  }, [won])

  const newGame = () => {
    playSound('shuffle')
    setState(makeNewGame())
    setMoves(0)
  }

  const attemptMove = (sel: Selection, dest: Destination, srcState: GameState): boolean => {
    const cards = getSelectedCards(sel, srcState)
    if (cards.length === 0) return false
    const moving = cards[0]

    if (dest.kind === 'foundation') {
      if (cards.length !== 1) return false
      if (moving.suit !== dest.suit) return false
      const pile = srcState.foundations[dest.suit]
      const top = pile[pile.length - 1]
      const valid = pile.length === 0 ? moving.rank === 1 : !!top && moving.rank === top.rank + 1
      if (!valid) return false
      const withoutSource = removeFromSource(sel, srcState)
      setState({
        ...withoutSource,
        foundations: {
          ...withoutSource.foundations,
          [dest.suit]: [...withoutSource.foundations[dest.suit], moving],
        },
      })
      setMoves(m => m + 1)
      return true
    }

    const destCol = srcState.tableau[dest.col]
    const destTop = destCol[destCol.length - 1]
    const valid =
      destCol.length === 0
        ? moving.rank === 13
        : !!destTop && destTop.faceUp && moving.rank === destTop.rank - 1 && colorOf(moving.suit) !== colorOf(destTop.suit)
    if (!valid) return false
    const withoutSource = removeFromSource(sel, srcState)
    const tableau = withoutSource.tableau.map(c => [...c])
    tableau[dest.col] = [...tableau[dest.col], ...cards]
    setState({ ...withoutSource, tableau })
    setMoves(m => m + 1)
    return true
  }

  const handleDoubleClick = (sel: Selection) => {
    const cards = getSelectedCards(sel, state)
    if (cards.length !== 1) return
    if (attemptMove(sel, { kind: 'foundation', suit: cards[0].suit }, state)) playDrop()
    else playError()
  }

  const handleStockClick = () => {
    if (state.stock.length > 0) {
      playSound('slide') // flipping a card off the stock
      const card = { ...state.stock[state.stock.length - 1], faceUp: true }
      setState(s => ({ ...s, stock: s.stock.slice(0, -1), waste: [...s.waste, card] }))
    } else if (state.waste.length > 0) {
      playSound('shuffle') // recycling the waste back into the stock
      setState(s => ({
        ...s,
        stock: s.waste.slice().reverse().map(c => ({ ...c, faceUp: false })),
        waste: [],
      }))
    }
  }

  // ---- Drag and drop (Pointer Events — same technique as DesktopIcon) ----
  const beginDrag = (e: React.PointerEvent<HTMLElement>, sel: Selection, cards: Card[]) => {
    if (dragRef.current) return // second finger / stray pointer during a drag
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
      playSound('take') // first frame past the threshold = pickup
      setDragCards(info.sel) // ONE render: mounts the preview portal
    }
    // Every subsequent frame: direct DOM write, zero React re-renders
    posRef.current = { x: e.clientX - info.grabDX, y: e.clientY - info.grabDY }
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
      cancelDrag()
      return
    }

    // Rectangle-overlap hit testing, like real Solitaire — a single-point
    // test (elementFromPoint) missed valid stacks whenever the card's center
    // landed a few px outside a pile's box. Instead: intersect the held
    // card's rect with every pile, then try candidates from most- to
    // least-overlapped until one is a legal move. attemptMove only mutates
    // on success, so trying candidates in sequence is safe.
    const cardLeft = e.clientX - info.grabDX
    const cardTop = e.clientY - info.grabDY
    type Candidate = { dest: Destination; area: number }
    const candidates: Candidate[] = []
    const root = gameRootRef.current
    if (root) {
      root.querySelectorAll<HTMLElement>('[data-drop-col],[data-drop-suit]').forEach(el => {
        const r = el.getBoundingClientRect()
        // Columns get one extra card-height of landing room below the pile:
        // players naturally drop "underneath" the last card.
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

    let success = false
    for (const c of candidates) {
      if (attemptMove(info.sel, c.dest, state)) {
        success = true
        break
      }
    }

    if (success) playDrop()
    else playError()

    cancelDrag()
  }

  const dragHandlers = (sel: Selection, cards: Card[]) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => beginDrag(e, sel, cards),
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
    // Browsers cancel gestures (OS interruptions, capture theft, touch
    // heuristics) — without these the drag died stuck, leaving a ghost card.
    onPointerCancel: cancelDrag,
    onLostPointerCapture: cancelDrag,
    style: { touchAction: 'none' as const, cursor: 'grab' },
  })

  return (
    <div ref={gameRootRef} className="flex-1 min-h-0 bg-[#0e5c24] flex flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse at top, #1a7a34, #0e5c24)' }}>
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-2 py-1.5 bg-[#c0c0c0] border-b-2 border-[#808080]">
        <button onClick={newGame} className="win98-button px-3 py-1 text-xs font-bold text-black">
          🂠 New Game
        </button>
        <span className="text-xs font-bold text-black">Moves: {moves}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        {/* Stock / waste / foundations row */}
        <div className="flex items-start gap-3 mb-6">
          {/* Branch OUTSIDE the button: EmptySlot is itself a <button>, and
              nesting it inside another button is invalid HTML (hydration
              error once the stock runs out). */}
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

          <div>
            {(() => {
              // While the top waste card is mid-drag, show what's UNDER it —
              // the next card, or the dotted empty slot when it was the last
              // one. (The old opacity:0 trick left a blank void instead.)
              const wasteDragging = selectionIncludes(dragCards, 'waste')
              const shown = state.waste[state.waste.length - (wasteDragging ? 2 : 1)]
              // Only swap to the standalone EmptySlot when NO drag is active:
              // mid-drag, this button is the pointer-capture holder and must
              // stay mounted (content switches to SlotOutline instead).
              if (!shown && !wasteDragging) return <EmptySlot />
              return (
                <button
                  type="button"
                  className="block p-0 border-0 bg-transparent rounded-sm"
                  onDoubleClick={() => handleDoubleClick({ from: 'waste' })}
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
            // Same under-card rule as the waste: mid-drag, show the card
            // beneath or the suit's dotted slot — never a blank void, and
            // never unmount the capture-holding button mid-drag.
            const shown = pile[pile.length - (dragging ? 2 : 1)]
            return (
              <div key={suit} data-drop-suit={suit}>
                {shown || dragging ? (
                  <button
                    type="button"
                    className="block p-0 border-0 bg-transparent rounded-sm"
                    onDoubleClick={() => handleDoubleClick({ from: 'foundation', suit })}
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
            return (
              <div key={col} data-drop-col={col} className="relative" style={{ width: CARD_W, height }}>
                {column.length === 0 ? (
                  <EmptySlot />
                ) : (
                  column.map((card, index) => {
                    const draggable = card.faceUp && isRunValid(column.slice(index))
                    const dragging = selectionIncludes(dragCards, 'tableau', col, index)
                    return (
                      <button
                        key={`${card.suit}${card.rank}`}
                        type="button"
                        disabled={!card.faceUp}
                        className="absolute left-0 block p-0 border-0 bg-transparent disabled:cursor-default"
                        style={{
                          top: tops[index],
                          zIndex: index,
                          outline: dragging ? '3px solid #ffd700' : undefined,
                          opacity: dragging ? 0 : 1,
                          borderRadius: 4,
                          touchAction: draggable ? 'none' : undefined,
                          cursor: draggable ? 'grab' : 'default',
                        }}
                        onPointerDown={draggable ? e => beginDrag(e, { from: 'tableau', col, index }, column.slice(index)) : undefined}
                        onPointerMove={draggable ? onDragMove : undefined}
                        onPointerUp={draggable ? onDragEnd : undefined}
                        onPointerCancel={draggable ? cancelDrag : undefined}
                        onLostPointerCapture={draggable ? cancelDrag : undefined}
                        onDoubleClick={
                          card.faceUp && index === column.length - 1
                            ? () => handleDoubleClick({ from: 'tableau', col, index })
                            : undefined
                        }
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

      {/* Floating drag preview — pointer-events none so elementFromPoint on
          drop sees the real pile underneath, not this overlay. z stays below
          the taskbar (9990) so a card never floats over it.
          PORTALED to document.body: position:fixed is relative to the nearest
          TRANSFORMED ancestor, not the viewport — and Win98Window transforms
          its frame, which shifted the preview way off the pointer. The portal
          escapes every ancestor so fixed means the actual viewport again. */}
      {dragCards &&
        createPortal(
          <div
            ref={(el) => {
              previewRef.current = el
              // Position immediately on mount so the first frame isn't at 0,0
              if (el) el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`
            }}
            className="fixed left-0 top-0 pointer-events-none z-[9980] will-change-transform"
          >
            {getSelectedCards(dragCards, state).map((card, i) => (
              <div key={`${card.suit}${card.rank}`} className="absolute left-0" style={{ top: i * FACE_UP_OFFSET }}>
                <CardFace card={card} />
              </div>
            ))}
          </div>,
          document.body
        )}

      <div className="flex-shrink-0 flex items-center justify-center gap-2 bg-[#c0c0c0] px-2 py-1 border-t-2 border-[#dfdfdf] text-xs text-black">
        {won ? (
          <span className="font-bold text-green-800">🎉 You win!</span>
        ) : (
          <span>Drag a card to move it. Double-click sends it to its foundation.</span>
        )}
      </div>
    </div>
  )
}
