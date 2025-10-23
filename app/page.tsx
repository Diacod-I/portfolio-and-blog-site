'use client'

import { Suspense, useState, useEffect } from 'react'
import UptimeCounter from '@/components/UptimeCounter'
import RecentNotes from '@/components/RecentNotes'
import FeaturedLinks from '@/components/FeaturedLinks'
import Navbar from '@/components/Navbar'
import ImageViewer from '@/components/ImageViewer'
import WindowsLoader from '@/components/WindowsLoader'
import FooterConsole from '@/components/FooterConsole'
import useSWR from 'swr'

export default function HomePage() {
  const [isAppOpen, setIsAppOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeApps, setActiveApps] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
  }>>([])

  const fetcher = (url: string) => fetch(url).then(res => res.json())
  const { data: notes } = useSWR<Array<{ date: string }>>('/api/notes', fetcher)
  const hasNewBlog = Array.isArray(notes) && notes.some(note => new Date(note.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  const handleAppOpen = async () => {
    if (!isAppOpen) {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsAppOpen(true)
      setIsLoading(false)
      window.history.replaceState({}, '', '/?app=open')
    }
  }

  const handleAppClick = (id: string) => {
    if (id === 'main-app') {
      setIsAppOpen(prev => !prev)
      setActiveApps(prev => prev.map(app => 
        app.id === id ? { ...app, isActive: !app.isActive } : app
      ))
    }
  }

  useEffect(() => {
    setActiveApps(prev => {
      if (isAppOpen && !prev.some(app => app.id === 'main-app')) {
        return [{
          id: 'main-app',
          name: 'advith_krishnan.exe',
          icon: '/win98/advith_krishnan_exe.webp',
          isActive: true
        }]
      }
      return prev.map(app => 
        app.id === 'main-app' ? { ...app, isActive: isAppOpen } : app
      )
    })
  }, [isAppOpen])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('app') === 'open') {
      setIsAppOpen(true)
    }
  }, [])


  return (
    <>
      <div 
        className="h-screen p-4 pb-16 overflow-hidden relative"
        style={{
          backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
      {/* Desktop Icon */}
      <button 
        onClick={handleAppOpen}
        className="flex flex-col items-center gap-2 p-2 relative"
      >
        {hasNewBlog && (
          <span className="absolute top-0 right-14 -translate-y-2 translate-x-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse-expand pointer-events-none"></span>
        )}
        <div>
          <img
            src="/win98/advith_krishnan_exe.webp"
            alt="Application"
            className="w-14 h-14"
          />
        </div>
        <span className={`win98-app-name ${isAppOpen ? 'active' : ''}`}>
          advith_krishnan.exe
        </span>
      </button>
      
      {/* Application Window */}
      {isAppOpen && (
        <div className="win98-app-window fixed z-40 flex flex-col" style={{ top: '5px', right: '5px', bottom: '43px', left: '5px' }}>
          <div className="win98-titlebar">
            <div className="flex items-center gap-2">
              <img src="/win98/advith_krishnan_exe.webp" alt="App Icon" className="w-4 h-4" />
              <span>advith_krishnan.exe</span>
            </div>
            <div className="flex gap-2">
              <button 
                className="win98-window-button font-bold text-xl flex items-center justify-center" 
                style={{ paddingBottom: '4px' }}
                onClick={() => {
                  setIsAppOpen(false);
                  setActiveApps(prev => prev.map(app => 
                    app.id === 'main-app' ? { ...app, isActive: false } : app
                  ));
                }}
              >_</button>
              <button 
                className="win98-window-button font-bold text-2xl"
                onClick={() => {
                  setTimeout(() => {
                    setIsAppOpen(false);
                    setActiveApps(prev => prev.filter(app => app.id !== 'main-app'));
                    window.history.replaceState({}, '', '/');
                  }, 400);
                }}
              >×</button>
            </div>
          </div>
            <Navbar />
          <div className="flex-1 win98-window-content flex flex-col bg-[#222222] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1 overflow-y-auto">
              {/* Left Column */}
              <div className="flex flex-col h-full">
                {/* Image Viewer */}
                <div className="flex-1">
                  <ImageViewer />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col h-full gap-4">
                {/* System Information */}
                {/* <div className="win98-window">
                  <div className="win98-titlebar">
                    <div className="flex items-center gap-2">
                      <img src="/win98/info.webp" alt="System" className="w-4 h-4" />
                      <span>System Information</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <Suspense fallback={<div className="win98-window p-2">Loading uptime...</div>}>
                      <UptimeCounter />
                    </Suspense>
                  </div>
                </div> */}

                {/* Recent Blogs */}
                <div className="win98-window flex-1 flex flex-col max-h-[300px]">
                  <div className="win98-titlebar">
                    <div className="flex items-center gap-2">
                      <img src="/win98/notepad.webp" alt="Notes" className="w-4 h-4" />
                      <span>Recent Blog Posts</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#f0f0f0] p-2">
                    <RecentNotes />
                  </div>
                </div>
                
                {/* Internet Shortcuts */}
                <div className="win98-window flex-1 flex flex-col max-h-[300px]">
                  <div className="win98-titlebar">
                    <div className="flex items-center gap-2">
                      <img src="/win98/internet.webp" alt="Internet" className="w-4 h-4" />
                      <span>Internet Shortcuts</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white border-2 p-2">
                    <div className="overflow-y-auto border-2 max-h-[230px]">
                      <FeaturedLinks />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && <WindowsLoader />}
    </div>
    <FooterConsole activeApps={activeApps} onAppClick={handleAppClick} />
    </>
  )
}
