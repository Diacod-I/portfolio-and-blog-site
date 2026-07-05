'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

const CONTACT_EMAIL = 'advithkrishnan@gmail.com'

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  })

  // Zero-backend contact form: Submit opens the visitor's mail app with
  // everything prefilled. No API route, no email service.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(formData.subject || `Hello from ${formData.name || 'your website'}`)
    const body = encodeURIComponent(
      `${formData.message}\n\n— ${formData.name}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
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
            <p className="text-white">
              Have a question or want to work together?<br/> <br/>
              Kindly ping my socials below and I&apos;ll get back to you as soon as possible.
            </p>

              <div className="mt-8 space-y-2 text-white">
                <p className="flex items-center gap-2">
                  <strong>Email:</strong>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                    {CONTACT_EMAIL}
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

            <div className="mt-8 pt-8 border-t-2 border-[#808080]">
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
