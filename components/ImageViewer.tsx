'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [prevIndex, setPrevIndex] = useState<number>(0)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fetch photos from Supabase
  useEffect(() => {
    // Skip if Supabase isn't configured (e.g., during build)
    if (!supabase) {
      setLoading(false)
      setError('Photo gallery not configured')
      return
    }

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
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
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

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      nextImage()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, images.length])

  const nextImage = () => {
    if (!isTransitioning && images.length > 0) {
      setPrevIndex(currentIndex);
      setSwipeDirection('left');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 300);
    }
  }

  const prevImage = () => {
    if (!isTransitioning && images.length > 0) {
      setPrevIndex(currentIndex);
      setSwipeDirection('right');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 300);
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
            <Image src="/win98/photos.webp" alt="Advith Krishnan Photos" className="w-4 h-4" />
            <span>Recent Highlights</span>
          </div>
        </div>
        <div className="flex-1 bg-[#c0c0c0] p-2 flex items-center justify-center">
          <p className="text-xl mt-2">Loading photos...</p>
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
            <Image src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
            <span>Recent Highlights</span>
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
      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity animate-fade-in">
          <div className="relative bg-[#23262F] rounded-lg shadow-xl p-4 max-w-2xl w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold bg-[#181A20] rounded-full w-9 h-9 flex items-center justify-center border border-[#353945]"
              aria-label="Close preview"
            >
              ×
            </button>
            <Image
              src={images[currentIndex].image_url}
              alt={images[currentIndex].alt_text}
              className="max-w-full max-h-[60vh] rounded-lg border border-[#353945] shadow-lg"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="mt-4 text-center text-white text-lg font-semibold">
              {images[currentIndex].description}
            </div>
          </div>
        </div>
      )}
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <Image src="/win98/photos.webp" alt="Photos" className="w-4 h-4" />
          <span>Recent Highlights</span>
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
                    className="flex items-center justify-center flex-shrink-0 flex-grow-0 overflow-hidden max-w-[650px] w-full h-full group relative"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text}
                      className="max-w-[650px] max-h-full w-auto h-auto object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {/* Preview Image Button on Hover */}
                    {hoveredIdx === idx && (
                      <button
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity group-hover:opacity-100 opacity-100"
                        onClick={() => { setCurrentIndex(idx); setPreviewOpen(true); }}
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
          >▶
          </button>
        </div>
      </div>
    </div>
  )
}
