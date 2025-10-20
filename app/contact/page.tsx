'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission (you can replace this with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    setSubmitStatus('success')
    
    // Reset form after 2 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitStatus('idle')
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
      <div className="win98-window min-h-min max-h-full flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/notepad.webp" alt="Contact" className="w-4 h-4" />
            <span>Contact Me</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/?app=open')}
            >
              ↩
            </button>
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
            >×</button>
          </div>
        </div>
        
        <div className="win98-window-content bg-[#222222] p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-white">Get in Touch!</h1>
            <p className="mb-6 text-white">
              Have a question or want to work together? Fill out the form below and I'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold mb-1 text-white">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-1 text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white text-white"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-bold mb-1 text-white">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white text-white"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold mb-1 text-white">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-2 py-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white text-white resize-none"
                />
              </div>

              <div className="flex gap-2 items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="win98-button px-4 py-2 font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <span>✓</span>
                    <span>Message sent successfully!</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-700 font-bold">
                    <span>✗</span>
                    <span>Failed to send message. Please try again.</span>
                  </div>
                )}
              </div>
            </form>

            <div className="mt-8 pt-8 border-t-2 border-[#808080]">
              <h2 className="text-xl font-bold mb-4 text-white">Other Ways to Reach Me</h2>
              <div className="space-y-2 text-white">
                <p className="flex items-center gap-2">
                  <strong>Email:</strong> 
                  <a href="mailto:advithkrishnan@gmail.com" className="text-blue-600 hover:underline">
                    advithkrishnan@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <strong>LinkedIn:</strong>
                  <a href="https://www.linkedin.com/in/advithkrishnan/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    linkedin.com/in/advithkrishnan
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <strong>GitHub:</strong>
                  <a href="https://github.com/Diacod-I" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    github.com/Diacod-I
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
