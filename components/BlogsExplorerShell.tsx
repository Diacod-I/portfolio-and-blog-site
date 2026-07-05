'use client'

// Owns the toast visibility state so the Explorer window can fill the
// viewport up to the toast while it's shown, and expand to full height
// (matching [slug] pages) once dismissed.

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ExplorerBlogList from '@/components/ExplorerBlogList'
import BlogsWindowControls from '@/components/BlogsWindowControls'
import SubstackToast from '@/components/SubstackToast'
import type { Note } from '@/lib/notes'

// Toast is ~170px tall at bottom-6; reserve its lane while visible.
const TOAST_CLEARANCE = '176px'

type BlogsExplorerShellProps = {
  notes: Note[]
}

export default function BlogsExplorerShell({ notes }: BlogsExplorerShellProps) {
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('substack-toast-dismissed')) {
      setToastVisible(true)
    }
  }, [])

  const dismissToast = () => {
    setToastVisible(false)
    sessionStorage.setItem('substack-toast-dismissed', '1')
  }

  return (
    <div
      className="h-screen p-4 pb-16 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div
        className="win98-window flex flex-col transition-[height] duration-300 ease-in-out"
        style={{ height: toastVisible ? `calc(100% - ${TOAST_CLEARANCE})` : '100%' }}
      >
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Image src="/win98/notepad.webp" alt="" width={32} height={32} className="w-4 h-4" />
            <span>Blogs — Explorer</span>
          </div>
          <BlogsWindowControls />
        </div>

        <div className="win98-window-content bg-[#A6A6A6] flex-1 min-h-0 flex flex-col overflow-y-auto">
          <h1 className="sr-only">All Blog Posts</h1>
          <ExplorerBlogList notes={notes} />
        </div>
      </div>

      <SubstackToast visible={toastVisible} onDismiss={dismissToast} />
    </div>
  )
}
