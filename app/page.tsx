'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
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

  // Morphing animation for roles with cryptic letters
  const roles = [
    "An AI Engineer",
    "An AI Researcher",
    "A Software Developer",
    "A Full Stack Engineer"
  ];
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState(roles[0]);
  const morphing = useRef(false);

  // Helper for random cryptic chars
  const randomChar = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  useEffect(() => {
    let morphTimeout: NodeJS.Timeout;
    let revealTimeout: NodeJS.Timeout;
    let holdTimeout: NodeJS.Timeout;

    const morphTo = roles[(roleIndex + 1) % roles.length];
    morphing.current = true;

    // 1. Animate random strings of same length for 0.5s (500ms)
    let morphFrame = 0;
    const morphFrames = 500 / 40; // 0.5s at 40ms per frame
    const morph = () => {
      setDisplayText(() => {
        let cryptic = '';
        for (let i = 0; i < morphTo.length; i++) {
          cryptic += randomChar();
        }
        return cryptic;
      });
      morphFrame++;
      if (morphFrame < morphFrames) {
        morphTimeout = setTimeout(morph, 40);
      } else {
        // 2. Reveal actual text, one character at a time
        let revealFrame = 0;
        const reveal = () => {
          setDisplayText(() => {
            let revealed = '';
            for (let i = 0; i < morphTo.length; i++) {
              if (i <= revealFrame) {
                revealed += morphTo[i];
              } else {
                revealed += randomChar();
              }
            }
            return revealed;
          });
          if (revealFrame < morphTo.length - 1) {
            revealFrame++;
            revealTimeout = setTimeout(reveal, 40);
          } else {
            setDisplayText(morphTo);
            // 3. Hold the final text for 2s before next morph
            holdTimeout = setTimeout(() => {
              setRoleIndex((prev) => (prev + 1) % roles.length);
              morphing.current = false;
            }, 2000);
          }
        };
        reveal();
      }
    };
    morph();

    return () => {
      clearTimeout(morphTimeout);
      clearTimeout(revealTimeout);
      clearTimeout(holdTimeout);
    };
    // eslint-disable-next-line
  }, [roleIndex]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1 min-h-0 h-full overflow-y-auto">
              {/* Left Column */}
              <div className="flex flex-col gap-2 h-full flex-1">
                {/* <div className="items-center justify-center text-center"> */}
                <h1 className="text-white text-3xl font-bold">
                  👋 Hi, I'm Advith Krishnan! 
                </h1>
                <span className="text-white text-md min-h-[28px]">
                  &gt; {" "} <span
                    className="inline-block transition-opacity duration-300"
                    style={{ fontFamily: 'monospace, monospace', letterSpacing: '0.5px' }}
                  >
                    {displayText.trim()}
                  </span>
                  &nbsp;who works on cool stuff!
                </span>
                {/* </div> */}
                {/* Image Viewer - now fills left column */}
                <div className="flex-1">
                  <ImageViewer />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col h-full gap-4">
                {/* Recent Blogs */}
                <div className="win98-window flex-1 flex flex-col">
                  <div className="win98-titlebar">
                    <div className="flex items-center gap-2">
                      <img src="/win98/notepad.webp" alt="Notes" className="w-4 h-4" />
                      <span>Recent Blog Posts</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#f0f0f0] border-2 p-2">
                    <p className="font-bold mb-1">
                      &gt; Fresh new blogs below 👇 and older ones <a href="/blog" className="text-blue-700 underline hover:text-blue-900">here</a>! Come one, come all!
                    </p>
                    <div className="overflow-y-auto border-2" style={{ maxHeight: 226 }}>
                    <RecentNotes />
                    </div>
                  </div>
                </div>
                {/* Internet Shortcuts */}
                <div className="win98-window flex-1 flex flex-col">
                  <div className="win98-titlebar">
                    <div className="flex items-center gap-2">
                      <img src="/win98/internet.webp" alt="Internet" className="w-4 h-4" />
                      <span>Internet Shortcuts</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#f0f0f0] border-2 p-2">
                   <p className="font-bold mb-1">
                    &gt; My online presence! (Still not famous tho)
                    </p>
                    <div className="overflow-y-auto border-2" style={{ maxHeight: 226 }}>
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
