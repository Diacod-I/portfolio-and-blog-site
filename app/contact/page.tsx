'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

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
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      // Submit form
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({ name: '', email: '', subject: '', message: '' })
          setSubmitStatus('idle')
        }, 3000)
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            <Image src="/win98/notepad.webp" alt="Contact" width={32} height={32} className="w-4 h-4" />
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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 mt-12 text-center text-white">Get in Touch with me!</h1>
            <p className="text-white text-justify">
              Have a question or want to work together?<br/> <br/>
              Kindly ping my socials below and I'll get back to you as soon as possible.
            </p>

              <div className="mt-8 space-y-2 text-white">
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
                  <strong>Twitter/X:</strong>
                  <a href="https://x.com/advith_krishnan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    @advith_krishnan
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <strong>Substack:</strong>
                  <a href="https://substack.com/@advithkrishnan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    @advithkrishnan
                  </a>
                </p>
              </div>
            <div className="mt-8 pt-8 border-t-2 border-[#808080]"/>
          </div>
        </div>
      </div>
    </div>
  )
}
