'use client'

import ResumeButton from './ResumeButton'

// Home / Contact / Resume are tabs *within* the already-open advith.exe
// window (see HomeClient's homeTab state) — not separate page navigations.
// That's the whole point: switching tabs should feel like using an app, not
// like leaving the desktop for a new page.
export type HomeTab = 'home' | 'contact' | 'resume'

const tabs: { id: 'home' | 'contact'; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'contact', label: 'Contact' },
]

type NavbarProps = {
  activeTab: HomeTab
  onTabChange: (tab: HomeTab) => void
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
	  <nav className="win98-window-navbar sticky top-0 z-50">
      {/* nowrap + horizontal scroll instead of wrapping to a second row:
          the window is resizable now (see Win98Window), so this bar has to
          hold its height steady at any width, like a real app toolbar —
          scrolling sideways when it doesn't fit, never stacking. */}
      <div className="bg-[#c0c0c0] overflow-x-auto overflow-y-hidden">
        <div className="flex flex-nowrap items-center justify-between w-full min-w-max">
          <div className="flex flex-nowrap items-center gap-0.5 flex-shrink-0">
            {tabs.map(({ id, label }) => {
              const isActive = activeTab === id
              return (
				<div key={id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => onTabChange(id)}
                    className={`win98-navbar-button px-2 py-0.5 font-bold whitespace-nowrap ${
                      isActive ? 'bg-[#a2a2a2] text-black hover:text-black border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white hover:border-t-[#808080] hover:border-l-[#808080] hover:border-b-white hover:border-r-white': ''
                    }` }
                  >
                    {label}
                  </button>
                  <div className='gap-0 flex flex-shrink-0'>
                  <div className="border-l-2 border-[#808080] h-7"></div>
                  <div className="border-l-2 border-[#ffffff] h-7"></div>
                  </div>
				</div>
              )
            })}
            <ResumeButton isActive={activeTab === 'resume'} onClick={() => onTabChange('resume')} />
            <div className='gap-0 flex flex-shrink-0'>
            <div className="border-l-2 border-[#808080] h-7"></div>
            <div className="border-l-2 border-[#ffffff] h-7"></div>
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-1 mr-2 flex-shrink-0">
            <button
              className="win98-navbar-button px-2 font-bold flex items-center gap-1 flex-shrink-0 whitespace-nowrap bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 shadow-md border-yellow-400 hover:from-yellow-200 hover:to-yellow-400 transition-colors duration-200"
              onClick={() => window.open('https://github.com/Diacod-I/portfolio-and-blog-site', '_blank')}
              title="Star this repo on GitHub"
              style={{
                backgroundImage: 'linear-gradient(120deg, #fffbe6 0%, #ffe066 40%, #ffd700 100%)',
                color: '#000000',
                borderColor: '#ffd700',
                fontWeight: 700
              }}
            >
              Star on GitHub! ⭐
            </button>
            <div className='gap-0 flex flex-shrink-0'>
            <div className="border-l-2 border-[#808080] h-7"></div>
            <div className="border-l-2 border-[#ffffff] h-7"></div>
            </div>
            <button
              className="win98-navbar-button px-2 font-bold flex items-center gap-1 flex-shrink-0 whitespace-nowrap bg-gradient-to-br from-pink-500 via-pink-700 to-purple-900 text-pink-100 shadow-md border-pink-700 hover:from-pink-600 hover:to-purple-800 transition-colors duration-200"
              onClick={() => window.open('https://github.com/sponsors/Diacod-I', '_blank')}
              title="Sponsor me on GitHub"
              style={{
                backgroundImage: 'linear-gradient(120deg, #e75480 0%, #b4005a 40%, #5a189a 100%)',
                color: '#fff',
                textShadow: '0 1px 4px #b4005a, 0 0px 1px #5a189a',
                borderColor: '#b4005a',
                fontWeight: 700
              }}
            >
              Sponsor! 💖
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
