'use client'

// FastStone-Image-Viewer-flavored gallery: a thumbnail rail down the side
// (a horizontal strip on narrow windows) plus a main viewer with caption
// and prev/next nav. Everything below uses flex-1/min-h-0/min-w-0 and
// object-contain/object-cover instead of fixed pixel sizes, so the window
// can be resized down to its minimum without any text or image overflowing
// (the old Recent Highlights carousel didn't do this, which is why it broke
// on resize).

import { useState } from 'react'
import Image from 'next/image'
import highlights from '@/data/highlights'

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function GalleryWindow() {
  const [selected, setSelected] = useState(0)

  if (highlights.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#c0c0c0]">
        <p className="text-sm">No photos yet — check back soon :)</p>
      </div>
    )
  }

  const photo = highlights[selected]
  const goPrev = () => setSelected((i) => (i - 1 + highlights.length) % highlights.length)
  const goNext = () => setSelected((i) => (i + 1) % highlights.length)

  return (
    <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden bg-[#c0c0c0]">
      {/* Thumbnail rail: horizontal scrolling strip on narrow windows,
          vertical scrolling rail on wide ones. */}
      <div
        className="flex-shrink-0 w-full h-24 sm:h-auto sm:w-36 border-b-2 sm:border-b-0 sm:border-r-2
                  border-[#808080] bg-[#dcdcdc] overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto
                    p-1.5 flex flex-row sm:flex-col gap-1.5"
      >
        {highlights.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setSelected(idx)}
            aria-current={idx === selected}
            className={`win98-button flex-shrink-0 p-1 flex flex-col items-center gap-1 w-24 sm:w-full ${
              idx === selected
                ? 'border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#9fb8d9]'
                : ''
            }`}
          >
            <div className="relative w-full aspect-[3/2] border border-[#808080] bg-white overflow-hidden">
              <Image
                src={p.image}
                alt={p.alt_text}
                fill
                sizes="140px"
                quality={70}
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <span className="text-[10px] font-bold text-black leading-tight truncate w-full text-center">
              {formatDate(p.uploaded_at)}
            </span>
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col p-2 gap-2">
        <div className="relative flex-1 min-h-0 bg-black border-2 border-[#808080]">
          <Image
            key={photo.id}
            src={photo.image}
            alt={photo.alt_text}
            fill
            sizes="(max-width: 640px) 100vw, 700px"
            quality={85}
            placeholder="blur"
            className="object-contain"
          />
          {highlights.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="win98-button absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1"
                aria-label="Previous photo"
              >
                ◀
              </button>
              <button
                onClick={goNext}
                className="win98-button absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1"
                aria-label="Next photo"
              >
                ▶
              </button>
            </>
          )}
        </div>
        <div className="win98-inset bg-white border border-black p-2 flex-shrink-0 min-h-0">
          <p className="text-sm font-semibold break-words">{photo.description}</p>
        </div>
        <div className="flex items-center justify-between flex-shrink-0 text-xs font-mono px-1 text-black">
          <span>{formatDate(photo.uploaded_at)}</span>
          <span>{selected + 1} / {highlights.length}</span>
        </div>
      </div>
    </div>
  )
}
