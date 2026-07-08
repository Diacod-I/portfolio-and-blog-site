'use client'

// Resume tab content for the advith.exe window (see HomeClient's homeTab
// state). No outer window chrome — that comes from Win98Window/Navbar.

import Image from 'next/image'

export default function ResumeView() {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex justify-end px-4 py-2 bg-[#c0c0c0] border-b border-[#b0b0b0] flex-shrink-0">
        <a
          href="/Advith_Krishnan_Resume.pdf"
          download
          className="win98-button px-3 py-1 text-sm font-semibold flex items-center gap-1"
        >
          <Image src="/win98/notes.webp" alt="" width={20} height={20} className="w-4 h-4" />
          Download PDF
        </a>
      </div>
      <div className="flex-1 min-h-0 bg-[#222222]">
        <iframe
          src="/Advith_Krishnan_Resume.pdf"
          title="Resume PDF"
          className="w-full h-full bg-white border-none"
        />
      </div>
    </div>
  )
}
