'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
    
    if (user) {
      fetchPhotos()
    }
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setAuthError(error.message)
    } else {
      setUser(data.user)
      fetchPhotos()
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setAuthError(error.message)
    } else {
      setAuthError('Check your email to confirm your account!')
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
  } if (error) {
      alert(`Error updating visibility: ${error.message}`)
    } else {
      fetchPhotos()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-6">
          <p className="font-['MS_Sans_Serif'] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4">
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-6 max-w-md w-full">
          {/* Title bar */}
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-0.5 mb-4 flex items-center">
            <span className="font-['MS_Sans_Serif'] text-white text-sm font-bold">Admin Login</span>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-2 py-1 font-['MS_Sans_Serif'] text-sm bg-black text-white"
                required
              />
            </div>
            
            <div>
              <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-2 py-1 font-['MS_Sans_Serif'] text-sm bg-black text-white"
                required
              />
            </div>
            
            {authError && (
              <p className="font-['MS_Sans_Serif'] text-sm text-red-700">{authError}</p>
            )}
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-6 py-1 font-['MS_Sans_Serif'] text-sm active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
              >
                Login
              </button>
              
              <button
                type="button"
                onClick={handleSignup}
                className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-6 py-1 font-['MS_Sans_Serif'] text-sm active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#008080] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="font-['MS_Sans_Serif'] text-lg font-bold">Photo Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-4 py-1 font-['MS_Sans_Serif'] text-sm active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
            >
              Logout
            </button>
          </div>
          <p className="font-['MS_Sans_Serif'] text-sm mt-2">Logged in as: {user.email}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upload Form */}
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-4">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-0.5 mb-4">
              <span className="font-['MS_Sans_Serif'] text-white text-sm font-bold">Upload New Photo</span>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Upload Type:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="file"
                      checked={uploadType === 'file'}
                      onChange={() => setUploadType('file')}
                    />
                    <span className="font-['MS_Sans_Serif'] text-sm">File Upload</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="url"
                      checked={uploadType === 'url'}
                      onChange={() => setUploadType('url')}
                    />
                    <span className="font-['MS_Sans_Serif'] text-sm">Image URL</span>
                  </label>
                </div>
              </div>
              
              {uploadType === 'file' ? (
                <div>
                  <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Select Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full font-['MS_Sans_Serif'] text-sm"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Image URL:</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-2 py-1 font-['MS_Sans_Serif'] text-sm bg-black text-white"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="font-['MS_Sans_Serif'] text-sm block mb-1">Alt Text:</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-2 py-1 font-['MS_Sans_Serif'] text-sm bg-black text-white"
                  required
                />
              </div>
              
              <div>
          {/* Photos List */}
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-4">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-0.5 mb-4">
              <span className="font-['MS_Sans_Serif'] text-white text-sm font-bold">Existing Photos ({photos.length})</span>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {photos.map((photo) => (
                <div key={photo.id} className="border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white p-2">
                  {editingPhoto?.id === photo.id ? (
                    // Edit Form
                    <form onSubmit={handleUpdate} className="space-y-2">
                      <div className="flex gap-2">
                        <img
                          src={photo.image_url}
                          alt={photo.alt_text}
                          className="w-20 h-20 object-cover border border-black"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={editAltText}
                            onChange={(e) => setEditAltText(e.target.value)}
                            className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-1 py-0.5 font-['MS_Sans_Serif'] text-xs bg-black text-white mb-1"
                            placeholder="Alt text"
                            required
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-1 py-0.5 font-['MS_Sans_Serif'] text-xs bg-black text-white"
                            rows={2}
                            placeholder="Description"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <label className="font-['MS_Sans_Serif'] text-xs">Order:</label>
                        <input
                          type="number"
                          value={editDisplayOrder}
                          onChange={(e) => setEditDisplayOrder(parseInt(e.target.value))}
                          className="w-20 border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white px-1 py-0.5 font-['MS_Sans_Serif'] text-xs bg-black text-white"
                        />
                        <label className="flex items-center gap-1 ml-2">
                          <input
                            type="checkbox"
                            checked={editIsVisible}
                            onChange={(e) => setEditIsVisible(e.target.checked)}
                          />
                          <span className="font-['MS_Sans_Serif'] text-xs">Visible</span>
                        </label>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display View
                    <>
                      <div className="flex gap-2">
                        <img
                          src={photo.image_url}
                          alt={photo.alt_text}
                          className="w-20 h-20 object-cover border border-black"
                        />
                        <div className="flex-1">
                          <p className="font-['MS_Sans_Serif'] text-sm font-bold">{photo.alt_text}</p>
                          <p className="font-['MS_Sans_Serif'] text-xs text-gray-700">{photo.description}</p>
                          <p className="font-['MS_Sans_Serif'] text-xs text-gray-600 mt-1">Order: {photo.display_order}</p>
                          <p className="font-['MS_Sans_Serif'] text-xs text-gray-600">
                            Status: {photo.is_visible ? '👁️ Visible' : '🚫 Hidden'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => startEditing(photo)}
                          className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleVisibility(photo.id, photo.is_visible)}
                          className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                        >
                          {photo.is_visible ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => handleDelete(photo.id, photo.image_url)}
                          className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs text-red-700 active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {photos.length === 0 && (
                <p className="font-['MS_Sans_Serif'] text-sm text-gray-600 text-center py-8">
                  No photos yet. Upload your first photo!
                </p>
              )}
            </div>
          </div>lassName="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black p-4">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-0.5 mb-4">
              <span className="font-['MS_Sans_Serif'] text-white text-sm font-bold">Existing Photos ({photos.length})</span>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {photos.map((photo) => (
                <div key={photo.id} className="border-2 border-t-[#7b7b7b] border-l-[#7b7b7b] border-r-white border-b-white p-2">
                  <div className="flex gap-2">
                    <img
                      src={photo.image_url}
                      alt={photo.alt_text}
                      className="w-20 h-20 object-cover border border-black"
                    />
                    <div className="flex-1">
                      <p className="font-['MS_Sans_Serif'] text-sm font-bold">{photo.alt_text}</p>
                      <p className="font-['MS_Sans_Serif'] text-xs text-gray-700">{photo.description}</p>
                      <p className="font-['MS_Sans_Serif'] text-xs text-gray-600 mt-1">Order: {photo.display_order}</p>
                      <p className="font-['MS_Sans_Serif'] text-xs text-gray-600">
                        Status: {photo.is_visible ? '👁️ Visible' : '🚫 Hidden'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => toggleVisibility(photo.id, photo.is_visible)}
                      className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                    >
                      {photo.is_visible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id, photo.image_url)}
                      className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black px-3 py-0.5 font-['MS_Sans_Serif'] text-xs text-red-700 active:border-t-black active:border-l-black active:border-r-white active:border-b-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {photos.length === 0 && (
                <p className="font-['MS_Sans_Serif'] text-sm text-gray-600 text-center py-8">
                  No photos yet. Upload your first photo!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
