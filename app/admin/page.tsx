// Combined Admin Dashboard: Upload & Notify
'use client'

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MDXProvider } from '@mdx-js/react';
import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';

// Add Google Fonts import for Instrument Sans and Work Sans
if (typeof window !== 'undefined') {
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700&family=Work+Sans:wght@400;600;700&display=swap';
  document.head.appendChild(fontLink);
}

// MDX Previewer Component
function MDXPreviewer({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [Content, setContent] = useState(() => () => <div className="text-gray-500">Nothing to preview.</div>);

  useEffect(() => {
    let cancelled = false;
    if (!code) {
      setContent(() => () => <div className="text-gray-500">Nothing to preview.</div>);
      setError(null);
      return;
    }
    async function run() {
      try {
        const fn = await evaluate(code, { ...runtime });
        if (!cancelled) {
          setContent(() => () => <fn.default />);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : String(err);
          setError(errorMessage);
          setContent(() => () => <div className="text-red-400">MDX Error: {errorMessage}</div>);
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [code]);

  return <div className="prose prose-invert"><Content /></div>;
}

// Extend the Window interface to include resumeFile
declare global {
  interface Window {
    resumeFile?: File | null;
  }
}

export default function AdminDashboardPage() {
  // Auth states
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  // Tab state
  const [tab, setTab] = useState<'upload' | 'notify' | 'resume' | 'blog'>('upload')

  // Upload states
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  type PhotoType = {
    id: number | string;
    image_url: string;
    alt_text: string;
    description: string;
    display_order: number;
    is_visible: boolean;
  };
  const [photos, setPhotos] = useState<PhotoType[]>([])
  const [editingPhoto, setEditingPhoto] = useState<{ id: number | string; alt_text: string; description: string; display_order: number; is_visible: boolean } | null>(null)
  const [editAltText, setEditAltText] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDisplayOrder, setEditDisplayOrder] = useState(0)
  const [editIsVisible, setEditIsVisible] = useState(true)

  // Notify states
  const [blogSlug, setBlogSlug] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [subscriberHistory, setSubscriberHistory] = useState([])

  // Resume states
  const [resumeStatus, setResumeStatus] = useState('')

  useEffect(() => {
    checkUser()
    getSubscriberCount()
    getSubscriberHistory()
  }, [])

  async function checkUser() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // Query admin table
      const { data: adminRows } = await supabase.from('admins').select('email');
      const ADMIN_EMAILS = adminRows?.map((row: { email: string }) => row.email.trim().toLowerCase()) || [];
      const userEmail = user.email?.trim().toLowerCase();
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        setAuthError('You are not authorized to access this dashboard.')
        await supabase.auth.signOut()
        setUser(null)
        setPhotos([])
        setLoading(false)
        return
      }
      fetchPhotos()
    }
    setLoading(false)
  }

  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('display_order', { ascending: true })
    if (!error) setPhotos(data || [])
  }

  async function handleGoogleLogin() {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` }
    });
    if (error) setAuthError('Google sign-in failed.')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setPhotos([])
  }

  // Upload logic (same as before)
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setUploadStatus('')
    try {
      let finalImageUrl = imageUrl
      if (uploadType === 'file' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('portfolio-images').upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('portfolio-images').getPublicUrl(fileName)
        finalImageUrl = publicUrl
      }
      const { error: insertError } = await supabase.from('photos').insert({
        image_url: finalImageUrl,
        alt_text: altText,
        description: description,
        display_order: displayOrder,
        is_visible: isVisible,
      })
      if (insertError) throw insertError
      setUploadStatus('Photo uploaded successfully!')
      setFile(null); setImageUrl(''); setAltText(''); setDescription(''); setDisplayOrder(0); setIsVisible(true)
      fetchPhotos()
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number | string, imageUrl: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      if (imageUrl.includes('supabase.co/storage')) {
        const fileName = imageUrl.split('/').pop()
        if (fileName) await supabase.storage.from('portfolio-images').remove([fileName])
      }
      const { error } = await supabase.from('photos').delete().eq('id', id)
      if (error) throw error
      fetchPhotos()
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      alert(`Error deleting photo: ${errorMessage}`)
    }
  }

  async function toggleVisibility(id: number | string, currentVisibility: boolean) {
    const { error } = await supabase.from('photos').update({ is_visible: !currentVisibility }).eq('id', id)
    if (error) alert(`Error updating visibility: ${error.message}`)
    else fetchPhotos()
  }

  function startEditing(photo: any) {
    setEditingPhoto(photo)
    setEditAltText(photo.alt_text)
    setEditDescription(photo.description)
    setEditDisplayOrder(photo.display_order)
    setEditIsVisible(photo.is_visible)
  }
  function cancelEditing() {
    setEditingPhoto(null)
    setEditAltText('')
    setEditDescription('')
    setEditDisplayOrder(0)
    setEditIsVisible(true)
  }
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingPhoto) return
    try {
      const { error } = await supabase.from('photos').update({
        alt_text: editAltText,
        description: editDescription,
        display_order: editDisplayOrder,
        is_visible: editIsVisible,
      }).eq('id', editingPhoto.id)
      if (error) throw error
      cancelEditing(); fetchPhotos()
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      alert(`Error updating photo: ${errorMessage}`)
    }
  }

  // Notify logic
  async function getSubscriberCount() {
    const { count } = await supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true)
    setSubscriberCount(count || 0)
  }
  async function getSubscriberHistory() {
    // Fetch daily active subscriber count for the last 30 days
    try {
      const { data, error, status } = await supabase.rpc('subscriber_growth_timeline')
      if (error) {
        if (error.code === '429' || status === 429) {
          // Rate limited: fallback to last known data or show a message
          setSubscriberHistory([])
          setMessage('⚠️ Rate limit reached. Timeline data temporarily unavailable.')
        } else {
          setSubscriberHistory([])
          setMessage('⚠️ Unable to load timeline data.')
        }
      } else if (data) {
        setSubscriberHistory(data)
      }
    } catch (err) {
      setSubscriberHistory([])
      setMessage('⚠️ Network error. Timeline data unavailable.')
    }
  }
  async function sendNotifications() {
    if (!blogSlug.trim()) {
      setStatus('error'); setMessage('Please enter a blog post slug'); return
    }
    setStatus('loading'); setMessage('Sending notifications...')
    try {
      const response = await fetch('/api/notify-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogSlug }),
      })
      const data = await response.json()
      if (response.ok) {
        setStatus('success'); setMessage(`✅ Successfully sent ${data.count} email notifications!`); setBlogSlug('')
      } else {
        setStatus('error'); setMessage(`❌ ${data.error || 'Failed to send notifications'}`)
      }
    } catch {
      setStatus('error'); setMessage('❌ Network error. Please try again.')
    }
  }

  const tabList = ['upload', 'notify', 'resume', 'blog'] as const;
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = tabList.indexOf(tab);
    const btn = btnRefs.current[idx];
    if (btn) {
      const parent = btn.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      if (parentRect) {
        setIndicatorStyle({
          left: btnRect.left - parentRect.left,
          width: btnRect.width,
        });
      }
    }
  }, [tab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181A20] font-[Instrument_Sans,Work_Sans,sans-serif]">
        <div className="bg-[#23262F] shadow-xl rounded-xl p-8">
          <p className="text-lg font-semibold text-gray-200">Loading...</p>
        </div>
      </div>
    )
  }
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181A20] p-4 font-[Instrument_Sans,Work_Sans,sans-serif]">
        <div className="bg-[#23262F] shadow-xl rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-base text-gray-300 mb-4">{authError}</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
          >
            <img src="/internet_shortcuts/google.webp" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181A20] p-4 font-[Instrument_Sans,Work_Sans,sans-serif]">
        <div className="bg-[#23262F] shadow-xl rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Admin Login</h2>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
          >
            <img src="/internet_shortcuts/google.webp" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20] p-4 font-[Instrument_Sans,Work_Sans,sans-serif]">
      <div className={tab === 'notify' ? 'w-full flex justify-center' : 'w-full max-w-5xl'}>
        <div className={tab === 'notify' ? 'w-full max-w-2xl' : 'w-full'}>
        {/* Logged in as this email */}
          {user && user.email && (
            <div className="mb-2 w-full flex justify-end">
              <div className="text-xs text-gray-400 bg-[#181A20] px-2 py-1 rounded shadow border border-[#353945]">
                Logged in as <span className="font-semibold text-gray-200">{user.email}</span>
              </div>
            </div>
          )}
          {/* Animated Navbar */}
          <div className="w-full mb-4 justify-center relative">
            <div className="w-[560px] justify-center bg-[#181A20] rounded-lg px-2 py-2 shadow border border-[#353945] flex gap-2 relative overflow-hidden">
              <div
                className="absolute top-0 h-full transition-all duration-400 ease-in-out z-10 bg-blue-900/20 rounded-lg pointer-events-none"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
              />
              {tabList.map((t, i) => (
                <button
                  key={t}
                  ref={el => btnRefs.current[i] = el}
                  onClick={() => setTab(t)}
                  className={`font-semibold px-4 py-2 rounded transition ${tab === t ? 'bg-blue-600 text-white z-20' : 'text-gray-300 hover:bg-[#23262F] z-20'}`}
                >
                  {t === 'upload' ? 'Upload' : t === 'notify' ? 'Notify' : t === 'resume' ? 'Update Resume' : 'Blog Management'}
                </button>
              ))}
            </div>
            {/* Logout button on the right */}
            <button
              onClick={handleLogout}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition shadow"
              style={{ minWidth: '90px' }}
            >
              Logout
            </button>
          </div>
          <div className="bg-[#23262F] shadow-xl rounded-xl p-4">
            {/* Tab content */}
            {tab === 'upload' ? (
              <div className="flex flex-col gap-4 md:flex-row md:gap-4">
                {/* Upload Form */}
                <div className="md:w-1/2 w-full">
                  <h2 className="text-lg font-semibold text-gray-100 mb-2">Upload New Photo</h2>
                  <form onSubmit={handleUpload} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Upload Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" value="file" checked={uploadType === 'file'} onChange={() => setUploadType('file')} />
                          <span className="text-gray-200">File Upload</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" value="url" checked={uploadType === 'url'} onChange={() => setUploadType('url')} />
                          <span className="text-gray-200">Image URL</span>
                        </label>
                      </div>
                    </div>
                    {uploadType === 'file' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Select Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm bg-[#181A20] text-gray-100 border border-[#353945] rounded" required />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                        <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Alt Text</label>
                      <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" rows={3} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                      <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value))} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
                      <span className="text-sm text-gray-200">Visible on site</span>
                    </div>
                    {uploadStatus && (
                      <p className={`text-sm ${uploadStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{uploadStatus}</p>
                    )}
                    <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50">
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </form>
                </div>
                {/* Existing Photos */}
                <div className="md:w-3/4 w-full flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-100 mb-2">Existing Photos ({photos.length})</h2>
                  <div className="flex-1 min-h-[200px] max-h-[60vh] border-gray-300 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-[#60a5fa] scrollbar-track-[#23262F] scrollbar-corner-[#181A20]">
                    {photos.map((photo) => (
                      <div key={photo.id} className="bg-[#181A20] rounded-lg shadow flex flex-col p-0 border border-[#353945] overflow-hidden">
                        {/* Image at top, 30% of card height */}
                        <div className="w-full" style={{ aspectRatio: '4/3', maxHeight: '300px', minHeight: '80px', overflow: 'hidden' }}>
                          <img src={photo.image_url} alt={photo.alt_text} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2 p-3">
                          {editingPhoto?.id === photo.id ? (
                            <form onSubmit={handleUpdate} className="flex-1 flex flex-col gap-2">
                              <div className="flex flex-col gap-2">
                                <input type="text" value={editAltText} onChange={(e) => setEditAltText(e.target.value)} className="w-full border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100 mb-1" placeholder="Alt text" required />
                                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100" rows={2} placeholder="Description" required />
                              </div>
                              <div className="flex gap-4 items-center">
                                <label className="text-sm text-gray-300">Order:</label>
                                <input type="number" value={editDisplayOrder} onChange={(e) => setEditDisplayOrder(parseInt(e.target.value))} className="w-20 border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100" />
                                <label className="flex items-center gap-1 ml-2">
                                  <input type="checkbox" checked={editIsVisible} onChange={(e) => setEditIsVisible(e.target.checked)} />
                                  <span className="text-sm text-gray-200">Visible</span>
                                </label>
                              </div>
                              <div className="flex flex-row gap-2 mt-2 justify-center">
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded transition">Save</button>
                                <button type="button" onClick={cancelEditing} className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold py-1 px-4 rounded transition">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-gray-100">{photo.alt_text}</p>
                                <p className="text-sm text-gray-300">{photo.description}</p>
                                <p className="text-xs text-gray-500 mt-1">Order: {photo.display_order}</p>
                                <p className="text-xs text-gray-500">Status: {photo.is_visible ? '👁️ Visible' : '🚫 Hidden'}</p>
                              </div>
                              <div className="flex flex-row flex-wrap gap-2 mt-2">
                                <button onClick={() => startEditing(photo)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-4 rounded transition">Edit</button>
                                <button onClick={() => toggleVisibility(photo.id, photo.is_visible)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded transition">{photo.is_visible ? 'Hide' : 'Show'}</button>
                                <button onClick={() => handleDelete(photo.id, photo.image_url)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded transition">Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {photos.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No photos yet. Upload your first photo!</p>
                    )}
                  </div>
                </div>
              </div>
            ) : tab === 'notify' ? (
              <div className="w-full">
                <div className="flex flex-col gap-2">
                  {/* Subscriber Stats */}
                  <div className="mb-4">
                    <h2 className="text-md font-semibold text-gray-100 mb-2">📊 Subscriber Stats</h2>
                    <div className="bg-[#181A20] rounded-lg p-4 border border-[#353945] mb-0">
                      <p className="text-gray-200 text-center text-md mb-4">Active Subscribers: <span className="font-bold">{subscriberCount}</span></p>
                      {subscriberHistory.length > 0 && (
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={subscriberHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#353945" />
                            <XAxis dataKey="date" tick={{ fill: '#aaa', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#aaa', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#23262F', border: '1px solid #353945', color: '#fff' }} />
                            <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  {/* Send Notification */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100 mb-2">Send Notification</h2>
                    <p className="text-sm text-gray-400 mb-2">Enter the blog post slug (e.g., "web3-is-cool") to notify all subscribers.</p>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Blog Post Slug</label>
                      <input
                        type="text"
                        value={blogSlug}
                        onChange={(e) => setBlogSlug(e.target.value)}
                        placeholder="web3-is-cool"
                        className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100"
                        disabled={status === 'loading'}
                      />
                    </div>
                    <button
                      onClick={sendNotifications}
                      disabled={status === 'loading'}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
                    >
                      {status === 'loading' ? 'Sending...' : `Send to your ${subscriberCount} Subscribers`}
                    </button>
                    {message && (
                      <div className={`mt-2 p-3 rounded text-center ${status === 'success' ? 'bg-green-900 text-green-200' : status === 'error' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                        {message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-[#353945] text-xs text-gray-500 text-center">
                  <p className="mb-2"><strong>Note:</strong> This will send an email to all active subscribers with the blog post details.</p>
                  <p><strong>Automatic:</strong> Notifications are also sent automatically via GitHub Actions when you push new blog posts.</p>
                </div>
              </div>
            ) : tab === 'resume' ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                <h2 className="text-xl font-semibold mb-2 text-gray-100">Update Resume</h2>
                <form
                  className="flex flex-col items-center gap-4 w-full max-w-md"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!window.resumeFile) return;
                    setResumeStatus('Uploading...');
                    const formData = new FormData();
                    formData.append('resume', window.resumeFile);
                    try {
                      const res = await fetch('/api/upload-resume', {
                        method: 'POST',
                        body: formData,
                      });
                      if (res.ok) {
                        setResumeStatus('Resume uploaded successfully!');
                      } else {
                        const data = await res.json();
                        setResumeStatus(data.error || 'Upload failed.');
                      }
                    } catch (err) {
                      setResumeStatus('Network error.');
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    className="block w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-500 file:text-white hover:file:bg-gray-400"
                    onChange={e => { window.resumeFile = e.target.files?.[0] || null; }}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition w-full"
                  >
                    Upload Resume
                  </button>
                  {resumeStatus && <p className="text-sm text-center mt-2">{resumeStatus}</p>}
                </form>
              </div>
            ) : tab === 'blog' ? (
              <BlogManagement />
            ) : null
        }</div>
        </div>
      </div>
    </div>
  );
}

// Blog Management Component
function BlogManagement() {
  interface PostType {
    id?: string | number;
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    author?: string;
    status?: string;
    date?: string;
  }

  const [posts, setPosts] = useState<PostType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [form, setForm] = useState<PostType>({ title: '', slug: '', content: '', excerpt: '', author: 'Advith Krishnan', status: 'Draft' });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all blogs from API route (published + drafts)
  async function fetchAllBlogs() {
    setLoading(true);
    try {
      const [publishedRes, draftsRes] = await Promise.all([
        fetch('/api/admin/blogs'),
        fetch('/api/admin/drafts'),
      ]);
      const published: PostType[] = publishedRes.ok ? (await publishedRes.json()).blogs : [];
      const drafts: PostType[] = draftsRes.ok ? (await draftsRes.json()).drafts : [];
      setPosts([
        ...published,
        ...drafts.map((d: PostType) => ({ ...d, status: 'Draft' })),
      ]);
    } catch (err) {
      setPosts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  function openForm(post: PostType | null = null) {
    setEditingPost(post);
    setForm(post && typeof post === 'object' ? {
      ...post,
      content: post.content || '',
      excerpt: post.excerpt || '',
      author: post.author || 'Advith Krishnan',
      status: post.status || 'Draft',
    } : { title: '', slug: '', content: '', excerpt: '', author: 'Advith Krishnan', status: 'Draft' });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPost(null);
    setForm({ title: '', slug: '', content: '', excerpt: '', author: 'Advith Krishnan', status: 'Draft' });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Always save as draft
    await fetch('/api/admin/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, slug: form.slug, content: form.content, excerpt: form.excerpt, author: form.author }),
    });
    closeForm();
    fetchAllBlogs();
  }
  async function handlePublish(slug: string) {
    await fetch('/api/admin/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    fetchAllBlogs();
  }
interface DeleteablePost {
    id?: string | number;
    [key: string]: any;
}

function handleDelete(id: string | number) {
    if (confirm('Delete this post?')) setPosts(posts.filter((p: DeleteablePost) => p.id !== id));
}

  return (
    <div className="w-full flex flex-col items-center min-h-[300px]">
      <div className="w-full flex justify-end mb-2">
        <button onClick={() => openForm()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded transition">+ New Post</button>
      </div>
      <div className="w-full overflow-x-auto rounded-lg border border-[#353945] bg-[#181A20]">
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-[#23262F]">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-500">Loading...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-500">No blog posts yet.</td></tr>
            ) : posts.map(post => (
              <tr key={post.id || post.slug} className="border-t border-[#353945]">
                <td className="px-4 py-2 font-semibold">{post.title}</td>
                <td className="px-4 py-2">{post.slug}</td>
                <td className="px-4 py-2">{post.date}</td>
                <td className="px-4 py-2">
                  <span className={post.status === 'Published' ? 'text-green-400' : 'text-yellow-400'}>{post.status}</span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => openForm(post)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded transition">Edit</button>
                  {post.status === 'Draft' && (
                    <button onClick={() => handlePublish(post.slug)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition">Publish</button>
                  )}
                  <button onClick={() => handleDelete(post.id || post.slug)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#23262F] rounded-lg shadow-xl p-8 w-full max-w-2xl relative">
            <button onClick={closeForm} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl">&times;</button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="absolute top-2 left-2 text-blue-400 hover:text-blue-200 text-base px-3 py-1 bg-[#181A20] rounded shadow border border-[#353945]"
              type="button"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-100 text-center">{editingPost ? 'Edit Post' : 'New Post'}</h3>
            {showPreview ? (
              <div className="bg-[#181A20] border border-[#353945] rounded p-4 min-h-[400px] max-h-[600px] overflow-y-auto text-gray-100 prose prose-invert">
                <MDXPreviewer code={form.content ?? ''} />
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                <input name="slug" value={form.slug} onChange={handleChange} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Excerpt</label>
                <input name="excerpt" value={form.excerpt} onChange={handleChange} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Author</label>
                <input name="author" value={form.author} onChange={handleChange} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content (MDX supported)</label>
                <textarea name="content" value={form.content} onChange={handleChange} rows={16} className="w-full border border-[#353945] rounded px-3 py-2 text-sm bg-[#181A20] text-gray-100 font-mono min-h-[320px] max-h-[600px] resize-vertical" required />
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <button type="button" onClick={closeForm} className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold py-1 px-4 rounded transition">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded transition">Save as Draft</button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
