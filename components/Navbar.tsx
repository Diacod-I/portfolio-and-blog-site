'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ResumeButton from './ResumeButton'

const routes = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/projects', label: 'Projects' }
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
          </div>
          <div className="flex items-center gap-1 mr-2">
            <button
              className="win98-navbar-button px-1 font-bold flex items-center gap-1"
              onClick={() => window.open('https://github.com/Diacod-I/portfolio-and-blog-site', '_blank')}
              title="Star this repo on GitHub"
            >
              <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Star" className="w-6 h-6 object-contain" />
            </button>
            <button className="win98-navbar-button font-bold px-1.5 py-0.5 flex items-center gap-1">
              <img src="https://github.githubassets.com/images/icons/emoji/unicode/2764.png" alt="Heart" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
