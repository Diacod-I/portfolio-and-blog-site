'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function NotifySubscribersPage() {
  const [blogSlug, setBlogSlug] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
    getSubscriberCount()
  }, [])

  async function checkAuth() {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    setIsAuthenticated(!!data.session)
  }

  async function getSubscriberCount() {
    if (!supabase) return
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    setSubscriberCount(count || 0)
  }

  async function sendNotifications() {
    if (!blogSlug.trim()) {
      setStatus('error')
      setMessage('Please enter a blog post slug')
      return
    }

    setStatus('loading')
    setMessage('Sending notifications...')

    try {
      const response = await fetch('/api/notify-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogSlug }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(`✅ Successfully sent ${data.count} email notifications!`)
        setBlogSlug('')
      } else {
        setStatus('error')
        setMessage(`❌ ${data.error || 'Failed to send notifications'}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage('❌ Network error. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4">
        <div className="win98-window max-w-md w-full">
          <div className="win98-titlebar">
            <span>Access Denied</span>
          </div>
          <div className="p-6 bg-[#c0c0c0]">
            <p className="text-black mb-4">You must be logged in to access this page.</p>
            <a href="/admin/upload" className="win98-button px-4 py-2 inline-block">
              Go to Admin Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#008080] p-4">
      <div className="max-w-2xl mx-auto mt-10">
        <div className="win98-window">
          <div className="win98-titlebar">
            <div className="flex items-center gap-2">
              <img src="/internet_shortcuts/rss_feed_logo.webp" alt="RSS" className="w-4 h-4" />
              <span>Send Blog Notifications</span>
            </div>
          </div>

          <div className="p-6 bg-[#c0c0c0]">
            <div className="bg-white border-2 border-[#808080] p-4 mb-4">
              <h2 className="font-bold text-lg mb-2 text-black">📊 Subscriber Stats</h2>
              <p className="text-black">
                Active Subscribers: <strong>{subscriberCount}</strong>
              </p>
            </div>

            <div className="bg-white border-2 border-[#808080] p-4 mb-4">
              <h2 className="font-bold text-lg mb-3 text-black">Send Notification</h2>
              
              <p className="text-sm text-gray-700 mb-4">
                Enter the blog post slug (e.g., "web3-is-cool") to notify all subscribers.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-black">
                  Blog Post Slug:
                </label>
                <input
                  type="text"
                  value={blogSlug}
                  onChange={(e) => setBlogSlug(e.target.value)}
                  placeholder="web3-is-cool"
                  className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-3 py-2 bg-white text-black"
                  disabled={status === 'loading'}
                />
              </div>

              <button
                onClick={sendNotifications}
                disabled={status === 'loading'}
                className="win98-button px-6 py-2 font-bold disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : `Send to ${subscriberCount} Subscribers`}
              </button>
            </div>

            {message && (
              <div className={`win98-inset p-4 ${
                status === 'success' ? 'bg-green-100' : status === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <p className={`text-sm font-bold ${
                  status === 'success' ? 'text-green-800' : status === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {message}
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t-2 border-[#808080]">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Note:</strong> This will send an email to all active subscribers with the blog post details.
              </p>
              <p className="text-xs text-gray-600">
                <strong>Automatic:</strong> Notifications are also sent automatically via GitHub Actions when you push new blog posts.
              </p>
            </div>

            <div className="mt-4">
              <a href="/admin/upload" className="win98-button inline-block px-4 py-2">
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
