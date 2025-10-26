'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ResumeButton from './ResumeButton'

// TODO: Add "about page" content, then implement "projects page", then "gallery page".

const routes = [
  { path: '/', label: 'Home' },
  // { path: '/about', label: 'About' },
  { path: '/blogs', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
  // { path: '/gallery', label: 'Gallery' },
  // { path: '/projects', label: 'Projects' }
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="win98-window-navbar sticky top-0 z-50">
      <div className="bg-[#c0c0c0] overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-between min-w-max w-full">
          <div className="flex items-center gap-0.5">
            {routes.map(({ path, label }) => {
              const isActive = pathname === path
              return (
                <>
                  <Link
                    key={path}
                    href={path}
                    className={`win98-navbar-button px-2 py-0.5 font-bold ${
                      isActive ? 'bg-[#a2a2a2] text-black hover:text-black border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white hover:border-t-[#808080] hover:border-l-[#808080] hover:border-b-white hover:border-r-white': ''
                    }` }
                  >
                    {label}
                  </Link>
                  <div className='gap-0 flex'>
                  <div className="border-l-2 border-[#808080] h-7"></div>
                  <div className="border-l-2 border-[#ffffff] h-7"></div>
                  </div>
                </>
              )
            })}
            <ResumeButton />
            <div className='gap-0 flex'>
            <div className="border-l-2 border-[#808080] h-7"></div>
            <div className="border-l-2 border-[#ffffff] h-7"></div>
            </div>
          </div>
          <div className="flex items-center gap-1 mr-2">
            <button
              className="win98-navbar-button px-2 font-bold flex items-center gap-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 shadow-md border-yellow-400 hover:from-yellow-200 hover:to-yellow-400 transition-colors duration-200"
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
            <div className='gap-0 flex'>
            <div className="border-l-2 border-[#808080] h-7"></div>
            <div className="border-l-2 border-[#ffffff] h-7"></div>
            </div>
            <button
              className="win98-navbar-button px-2 font-bold flex items-center gap-1 bg-gradient-to-br from-pink-500 via-pink-700 to-purple-900 text-pink-100 shadow-md border-pink-700 hover:from-pink-600 hover:to-purple-800 transition-colors duration-200"
              onClick={() => window.open('https://www.buymeacoffee.com/advithk', '_blank')}
              title="Donate"
              style={{
                backgroundImage: 'linear-gradient(120deg, #e75480 0%, #b4005a 40%, #5a189a 100%)',
                color: '#fff',
                textShadow: '0 1px 4px #b4005a, 0 0px 1px #5a189a',
                borderColor: '#b4005a',
                fontWeight: 700
              }}
            >
              Donate! ❤️
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
