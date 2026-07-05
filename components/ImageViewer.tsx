'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import images from '@/data/highlights'

export default function ImageViewer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // Auto-scroll every 5 seconds (paused while the preview modal is open)
  useEffect(() => {
    if (images.length === 0 || previewOpen) return
    const interval = setInterval(() => {
      nextImage()
    }, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, previewOpen])

  const nextImage = () => {
    if (!isTransitioning && images.length > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const prevImage = () => {
    if (!isTransitioning && images.length > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const isRecent = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 7 // "New" if uploaded within 7 days
  }

  // Empty state (manifest has no visible photos)
  if (images.length === 0) {
    return (
      <div className="win98-window flex-1 flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
            <span>Recent Highlights</span>
          </div>
        </div>
        <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center">
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="win98-window flex-1 flex flex-col min-h-0">
      {/* Preview Modal */}
      {previewOpen && previewIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity animate-fade-in">
          <div className="relative bg-[#23262F] rounded-lg shadow-xl p-4 flex flex-col items-center">
            <button
              onClick={() => { setPreviewOpen(false); setPreviewIndex(null); }}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold bg-[#181A20] rounded-full w-9 h-9 flex items-center justify-center border border-[#353945]"
              aria-label="Close preview"
            >
              ×
            </button>
            <div className="relative w-[min(1400px,90vw)] h-[min(933px,75vh)] rounded-lg overflow-hidden border border-[#353945] shadow-lg">
              <Image
                src={images[previewIndex].image}
                alt={images[previewIndex].alt_text}
                fill
                sizes="1400px"
                quality={85}
                placeholder="blur"
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="mt-4 text-center text-white text-lg font-semibold">
              {images[previewIndex].description}
            </div>
          </div>
        </div>
      )}
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
          <span>Recent Highlights</span>
        </div>
      </div>
      <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center w-full h-full max-w-full max-h-full">
          <button
            onClick={prevImage}
            className="win98-button absolute justify-center left-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
            disabled={isTransitioning}
            aria-label="Previous photo"
          >◀
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center px-12 py-2">
            <div className="relative w-full h-full overflow-hidden">
              <div
                className="flex h-full transition-transform duration-300"
                style={{
                  width: `${images.length * 100}%`,
                  transform: `translateX(-${currentIndex * (100 / images.length)}%)`,
                  position: 'relative',
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    style={{ width: `${100 / images.length}%` }}
                    className="flex items-center justify-center flex-shrink-0 flex-grow-0 overflow-hidden max-w-[650px] w-full aspect-[3/2] max-h-full group relative"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <Image
                      src={img.image}
                      alt={img.alt_text}
                      fill
                      sizes="650px"
                      quality={80}
                      priority={idx === 0}
                      placeholder="blur"
                      className="object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {/* Preview Image Button on Hover */}
                    {hoveredIdx === idx && (
                      <button
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity group-hover:opacity-100 opacity-100"
                        onClick={() => { setPreviewIndex(idx); setPreviewOpen(true); }}
                        style={{ zIndex: 20 }}
                      >
                        <span className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow-lg border border-[#353945] text-lg transition-all">Preview Image</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Image description with date */}
            <div className={`win98-inset bg-white mt-1 w-full border border-black max-w-[650px] min-h-[55px] flex flex-col items-center justify-center flex-shrink-0 transition-opacity duration-300 p-2 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <div className="flex items-center flex-wrap justify-center">
                <p className="text-sm text-center font-semibold">
              <span className="text-xs text-gray-600">
              {isRecent(images[currentIndex].uploaded_at) && (
                <span
                  className="bg-yellow-300 border border-[#000000] px-2 py-0.5 text-xs font-extrabold rounded whitespace-nowrap animate-pulse-spiky"
                  style={{
                    minWidth: '40px',
                    minHeight: '22px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >NEW</span>
              )}
              </span>
              &nbsp;
                  {images[currentIndex].description}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={nextImage}
            className="win98-button absolute justify-center right-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
            disabled={isTransitioning}
            aria-label="Next photo"
          >▶
          </button>
        </div>
      </div>
    </div>
  )
}
