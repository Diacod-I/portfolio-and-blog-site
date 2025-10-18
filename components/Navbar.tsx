'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ResumeButton from './ResumeButton'

const routes = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
  { path: '/projects', label: 'Projects' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="win98-window-navbar sticky top-0 z-50">
      <div className="bg-[#c0c0c0]">
        <div className="flex items-center justify-between">
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
        </div>
      </div>
    </nav>
  )
}
