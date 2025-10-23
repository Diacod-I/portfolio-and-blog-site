'use client'

import { useState } from 'react'

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        if (data.alreadySubscribed) {
          setMessage('✅ You\'re already subscribed! You won\'t miss any posts.')
        } else {
          setMessage('🎉 Subscribed! You\'ll get email updates when I post.')
        }
        setEmail('')
        setTimeout(() => onClose(), 2500)
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Try again!')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div 
        className="win98-window w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/internet_shortcuts/rss_feed_logo.webp" alt="RSS" className="w-4 h-4" />
            <span>Subscribe to Blog Updates</span>
          </div>
          <button 
            className="win98-window-button font-bold"
            onClick={onClose}
          >×</button>
        </div>

        <div className="p-4 bg-[#c0c0c0]">
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-black font-bold">
              Get notified via email whenever I publish a new blog post!
            </p>

            <div>
              <label className="text-sm block mb-1 text-black">
                Your Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-2 py-1 text-sm bg-white text-black"
                required
                disabled={status === 'loading'}
              />
            </div>

            {message && (
              <div className={`win98-inset p-2 text-sm ${
                status === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="win98-button font-semibold px-4 py-1 text-sm disabled:opacity-50"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="win98-button font-semibold px-4 py-1 text-sm"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-600">
              📧 No spam. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
