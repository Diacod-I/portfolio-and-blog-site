'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Add Google Fonts import for Instrument Sans and Work Sans
if (typeof window !== 'undefined') {
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700&family=Work+Sans:wght@400;600;700&display=swap';
  document.head.appendChild(fontLink);
}

interface Photo {
  id: string
  image_url: string
  alt_text: string
  description: string
  uploaded_at: string
  display_order: number
  is_visible: boolean
}

export default function AdminUploadPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  
  // Upload form states
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Existing photos
  const [photos, setPhotos] = useState<Photo[]>([])
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editAltText, setEditAltText] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDisplayOrder, setEditDisplayOrder] = useState(0)
  const [editIsVisible, setEditIsVisible] = useState(true)


  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // Query admin table
      const { data: adminRows } = await supabase.from('admins').select('email');
      console.log('Raw adminRows:', adminRows)
      console.log('Raw user object:', user)
      const ADMIN_EMAILS = adminRows?.map((row: { email: string }) => row.email.trim().toLowerCase()) || [];
      const userEmail = user.email?.trim().toLowerCase();
      console.log('User email:', userEmail)
      console.log('Admin emails:', ADMIN_EMAILS)
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
    
    if (error) {
      console.error('Error fetching photos:', error)
    } else {
      setPhotos(data || [])
    }
  }

  async function handleGoogleLogin() {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      setAuthError('Google sign-in failed.')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setPhotos([])
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setUploadStatus('')
    
    try {
      let finalImageUrl = imageUrl

      // If uploading a file, upload to Supabase Storage first
      if (uploadType === 'file' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, file)
        
        if (uploadError) {
          throw uploadError
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName)
        
        finalImageUrl = publicUrl
      }

      // Insert photo metadata into database
      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          image_url: finalImageUrl,
          alt_text: altText,
          description: description,
          display_order: displayOrder,
          is_visible: isVisible,
        })
      
      if (insertError) {
        throw insertError
      }

      setUploadStatus('Photo uploaded successfully!')
      
      // Reset form
      setFile(null)
      setImageUrl('')
      setAltText('')
      setDescription('')
      setDisplayOrder(0)
      setIsVisible(true)
      
      // Refresh photos list
      fetchPhotos()
      
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, imageUrl: string) {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }
    
    try {
      if (imageUrl.includes('supabase.co/storage')) {
        const fileName = imageUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('portfolio-images')
            .remove([fileName])
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw error
      }
      
      fetchPhotos()
    } catch (error: any) {
      alert(`Error deleting photo: ${error.message}`)
    }
  }

  async function toggleVisibility(id: string, currentVisibility: boolean) {
    const { error } = await supabase
      .from('photos')
      .update({ is_visible: !currentVisibility })
      .eq('id', id)
    
    if (error) {
      alert(`Error updating visibility: ${error.message}`)
    } else {
      fetchPhotos()
    }
  }

  function startEditing(photo: Photo) {
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPhoto) return

    try {
      const { error } = await supabase
        .from('photos')
        .update({
          alt_text: editAltText,
          description: editDescription,
          display_order: editDisplayOrder,
          is_visible: editIsVisible,
        })
        .eq('id', editingPhoto.id)

      if (error) {
        throw error
      }

      cancelEditing()
      fetchPhotos()
    } catch (error: any) {
      alert(`Error updating photo: ${error.message}`)
    }
  }

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

  // Centered card layout for dashboard
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20] p-4 font-[Instrument_Sans,Work_Sans,sans-serif]">
      <div className="bg-[#23262F] shadow-xl rounded-xl p-8 w-full max-w-3xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white text-center md:text-left">Photo Admin Dashboard</h1>
          <div className="flex items-center gap-4 justify-center md:justify-end">
            <span className="text-gray-400 text-base">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-[#181A20] hover:bg-[#353945] text-gray-100 font-semibold py-2 px-4 rounded transition border border-[#353945]"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Upload New Photo</h2>
            <form onSubmit={handleUpload} className="space-y-4">
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
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Existing Photos ({photos.length})</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-[#181A20] rounded-lg shadow flex flex-col md:flex-row gap-4 p-4 border border-[#353945]">
                  {editingPhoto?.id === photo.id ? (
                    <form onSubmit={handleUpdate} className="flex-1 space-y-2">
                      <div className="flex gap-4 items-center">
                        <img src={photo.image_url} alt={photo.alt_text} className="w-24 h-24 object-cover rounded border border-[#353945]" />
                        <div className="flex-1 space-y-2">
                          <input type="text" value={editAltText} onChange={(e) => setEditAltText(e.target.value)} className="w-full border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100 mb-1" placeholder="Alt text" required />
                          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100" rows={2} placeholder="Description" required />
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <label className="text-sm text-gray-300">Order:</label>
                        <input type="number" value={editDisplayOrder} onChange={(e) => setEditDisplayOrder(parseInt(e.target.value))} className="w-20 border border-[#353945] rounded px-2 py-1 text-sm bg-[#23262F] text-gray-100" />
                        <label className="flex items-center gap-1 ml-2">
                          <input type="checkbox" checked={editIsVisible} onChange={(e) => setEditIsVisible(e.target.checked)} />
                          <span className="text-sm text-gray-200">Visible</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded transition">Save</button>
                        <button type="button" onClick={cancelEditing} className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold py-1 px-4 rounded transition">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex gap-4 items-center">
                        <img src={photo.image_url} alt={photo.alt_text} className="w-24 h-24 object-cover rounded border border-[#353945]" />
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-100">{photo.alt_text}</p>
                          <p className="text-sm text-gray-300">{photo.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Order: {photo.display_order}</p>
                          <p className="text-xs text-gray-500">Status: {photo.is_visible ? '👁️ Visible' : '🚫 Hidden'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEditing(photo)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-4 rounded transition">Edit</button>
                        <button onClick={() => toggleVisibility(photo.id, photo.is_visible)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded transition">{photo.is_visible ? 'Hide' : 'Show'}</button>
                        <button onClick={() => handleDelete(photo.id, photo.image_url)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded transition">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {photos.length === 0 && (
                <p className="text-center text-gray-500 py-8">No photos yet. Upload your first photo!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
