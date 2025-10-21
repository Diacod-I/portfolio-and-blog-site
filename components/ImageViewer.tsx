'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Photo {
  id: string
  image_url: string
  alt_text: string
  description: string
  uploaded_at: string
  display_order: number | null
  is_visible: boolean
}

export default function ImageViewer() {
  const [images, setImages] = useState<Photo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch photos from Supabase
  useEffect(() => {
    fetchPhotos()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('photos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'photos' },
        () => {
          console.log('Photos updated, refetching...')
          fetchPhotos()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_visible', true)
        .order('uploaded_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (data && data.length > 0) {
        setImages(data)
        setError(null)
      } else {
        setError('No photos available')
      }
    } catch (err) {
      console.error('Error fetching photos:', err)
      setError('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      nextImage()
    }, 4000)

    return () => clearInterval(interval)
  }, [currentIndex, images.length])

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

  const goToImage = (index: number) => {
    if (!isTransitioning && index !== currentIndex && images.length > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(index)
        setIsTransitioning(false)
      }, 300)
    }
  }

  // Format date to show recency
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isRecent = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 7 // "New" if uploaded within 7 days
  }

  // Loading state
  if (loading) {
    return (
      <div className="win98-window flex-1 flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
            <span>Recent Photos Viewer</span>
          </div>
        </div>
        <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center">
          <p className="text-sm">Loading photos...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || images.length === 0) {
    return (
      <div className="win98-window flex-1 flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
            <span>Recent Photos Viewer</span>
          </div>
        </div>
        <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm mb-2">{error || 'No photos available'}</p>
            <button onClick={fetchPhotos} className="win98-button px-3 py-1 text-sm">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="win98-window flex-1 flex flex-col min-h-0">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <img src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
          <span>Recent Photos Viewer</span>
        </div>
      </div>
      <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center w-full h-full max-w-full max-h-full">
          <button
            onClick={prevImage}
            className="win98-button absolute justify-center left-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
            disabled={isTransitioning}
          >◀
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center px-12 py-2">
            <div className={`flex-1 flex items-center justify-center w-full min-h-0 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <img
                src={images[currentIndex].image_url}
                alt={images[currentIndex].alt_text}
                className="max-w-[650px] max-h-full w-auto h-auto object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            {/* Image description with date */}
            <div className={`win98-inset bg-white p-3 mt-2 w-full max-w-[650px] min-h-[70px] flex flex-col items-center justify-center flex-shrink-0 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
                <p className="text-sm text-center">
                  {images[currentIndex].description}
                </p>
                {isRecent(images[currentIndex].uploaded_at) && (
                  <span className="bg-yellow-300 border-2 border-t-yellow-100 border-l-yellow-100 border-b-yellow-500 border-r-yellow-500 px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                    🆕 NEW
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600">
                Uploaded {formatDate(images[currentIndex].uploaded_at)}
              </span>
            </div>
          </div>
          <button
            onClick={nextImage}
            className="win98-button absolute justify-center right-2 px-2 py-1 z-10 top-1/2 -translate-y-1/2"
            disabled={isTransitioning}
          >▶
          </button>
        </div>
      </div>
      {/* Dot indicators */}
      <div className="bg-[#c0c0c0] pb-2 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-navy' : 'bg-gray-400'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
