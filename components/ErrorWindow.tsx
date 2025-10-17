'use client'

import { useRouter } from 'next/navigation'

export default function ErrorWindow() {
  const router = useRouter()

  return (
    <div 
      className="h-screen p-4 pb-16 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="win98-window max-w-md mx-auto mt-20">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <span>Error</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
            >×</button>
          </div>
        </div>
        <div className="win98-window-content p-6">
          <div className="flex items-start gap-4">
            <img src="/win98/error.png" alt="Error" className="w-8 h-8" />
            <div>
              <h2 className="font-bold mb-4">Page Not Found</h2>
              <p className="mb-6">The requested page could not be found.</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => router.push('/?app=open')}
                  className="win98-button px-6"
                >
                  <span className="font-bold">OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
