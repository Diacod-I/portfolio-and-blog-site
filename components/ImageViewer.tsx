'use client'

import { useState } from 'react'

const images = [
  {
    src: '/Advith_Krishnan.png',
    alt: 'Profile Picture'
  },
  {
    src: '/win98/advith_krishnan_exe.jpg',
    alt: 'Windows 98 Profile'
  },
  {
    src: '/win98/windows_98_wallpaper.jpg',
    alt: 'Windows 98 Wallpaper'
  }
]

export default function ImageViewer() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="win98-window flex-1 flex flex-col">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <img src="/win98/photos.png" alt="Photos" className="w-4 h-4" />
          <span>Recent Photos Viewer</span>
        </div>
      </div>
      <div className="flex-1 bg-[#c0c0c0] p-4">
        <div className="overflow-y-auto max-h-[410px]">
          <div className="relative flex items-center justify-center w-full p-4">
            <button
              onClick={prevImage}
              className="win98-button absolute justify-center left-2 px-2 py-1 z-10"
            >◀
            </button>
            <div className="w-[500px] h-[360px] flex items-center justify-center">
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                className="max-w-full max-h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
          </div>
          <button
            onClick={nextImage}
            className="win98-button absolute justify-center right-2 px-2 py-1 z-10"
          >▶
          </button>
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`win98-button w-3 h-3 p-0 ${
                  currentIndex === index ? 'bg-[#000]' : ''
                }`}
              />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
