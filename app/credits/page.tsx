"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreditsPage() {
  const router = useRouter()
  return (
    <div className="win98-window max-w-2xl mx-auto mt-8 bg-[#f3f3f3] text-black rounded shadow">
      <div className="win98-titlebar w-full flex items-center justify-between">
        <span>Credits & Attributions</span>
        <button
          className="win98-window-button font-bold text-2xl px-2 py-0.5"
          onClick={() => router.push('/?app=open')}
        >×</button>
      </div>
      <div className="win98-window-content p-6 overflow-x-auto overflow-y-auto max-h-[70vh]">
        <h2 className="text-lg font-bold mb-2">Credits</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Windows 98 UI inspired by Microsoft Windows 98</li>
          <li>UI Icons: <a href="https://win98icons.alexmeub.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Win98 Icons by Alex Meub</a></li>
          <li>All icons and images used are either original, free for personal use, or properly attributed.</li>
          <li>Club Penguin GIF: <a href="https://clubpenguin.fandom.com/wiki/Dance" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Club Penguin Wiki</a></li>
          <li>MDX/Markdown blog system: <a href="https://mdxjs.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">MDX.js</a></li>
          <li>Portfolio and blog code: <a href="https://github.com/Diacod-I/portfolio-and-blog-site" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">GitHub</a></li>
          <li>Fonts: Inter, JetBrains Mono, VT323 via Google Fonts</li>
          <li>Next.js framework: <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Next.js</a> (MIT License)</li>
          <li>Supabase backend: <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Supabase</a> (Apache 2.0 License)</li>
          <li>Resend email API: <a href="https://resend.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Resend</a></li>
          <li>Tailwind CSS: <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Tailwind CSS</a> (MIT License)</li>
          <li>Framer Motion: <a href="https://www.framer.com/motion/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Framer Motion</a> (MIT License)</li>
          <li>SWR: <a href="https://swr.vercel.app/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">SWR</a> (MIT License)</li>
          <li>Date-fns: <a href="https://date-fns.org/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">date-fns</a> (MIT License)</li>
        </ul>
        <h2 className="text-lg font-bold mb-2">Licenses</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Site content & code: <a href="/LICENSE.md" className="underline text-blue-700">CC BY-NC-ND 4.0</a> by Advith Krishnan</li>
          <li>Third-party assets retain their original licenses.</li>
        </ul>
        <p className="mt-4 text-sm text-gray-700">If you believe attribution is missing or incorrect, please <Link href="/contact" className="underline text-blue-700">contact me</Link>.</p>
      </div>
    </div>
  )
}
