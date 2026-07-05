'use client'

import { useRouter } from 'next/navigation'

// The only interactive part of the blogs index window chrome.
export default function BlogsWindowControls() {
  const router = useRouter()
  return (
    <div className="flex gap-1">
      <button
        className="win98-window-button font-bold text-2xl"
        onClick={() => router.push('/?app=open')}
        aria-label="Back to desktop"
      >↩</button>
      <button
        className="win98-window-button font-bold text-2xl"
        onClick={() => router.push('/')}
        aria-label="Close"
      >×</button>
    </div>
  )
}
