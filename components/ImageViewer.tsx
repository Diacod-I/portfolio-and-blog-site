'use client'

import { useState, useEffect } from 'react'

const images = [
  {
    src: '/Advith_Krishnan.webp',
    alt: 'Profile Picture',
    description: 'Professional headshot for conferences and publications'
  },
  {
    src: '/win98/advith_krishnan_exe.webp',
    alt: 'Windows 98 Profile',
    description: 'Retro-styled profile picture with Windows 98 aesthetic'
  },
  {
    src: '/win98/windows_98_wallpaper.webp',
    alt: 'Windows 98 Wallpaper',
    description: 'Classic Windows 98 default wallpaper - nostalgia at its finest'
  }
]

export default function ImageViewer() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage()
    }, 4000)

    return () => clearInterval(interval)
  }, [currentIndex])

  const nextImage = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const prevImage = () => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const goToImage = (index: number) => {
    if (!isTransitioning && index !== currentIndex) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(index)
        setIsTransitioning(false)
      }, 300)
    }
  }

  return (
    <div className="win98-window flex-1 flex flex-col">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
          <span>Recent Photos Viewer</span>
        </div>
      </div>
      <div className="flex-1 bg-[#c0c0c0] p-4 flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center w-full h-full max-w-[800px] max-h-[500px]">
          <button
            onClick={prevImage}
            className="win98-button absolute justify-center left-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
          >◀
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center px-12 py-2">
            <div className={`flex-1 flex items-center justify-center w-full max-h-[400px] transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                className="max-w-[650px] max-h-[330px] w-auto h-auto object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            {/* Image description */}
            <div className={`win98-inset bg-white p-3 mt-3 w-full max-w-[650px] h-[60px] flex items-center justify-center flex-shrink-0 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <p className="text-sm text-center">
                {images[currentIndex].description}
              </p>
            </div>
          </div>
          <button
            onClick={nextImage}
            className="win98-button absolute justify-center right-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
          >▶
          </button>
        </div>
      </div>
    </div>
  )
}
