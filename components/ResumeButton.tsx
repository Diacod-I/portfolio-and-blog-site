'use client'

// Resume button in advith.exe's navbar — a direct PDF download, not a tab.
// There's no more in-app resume viewer (see the removed ResumeView.tsx and
// app/resume route): same visual slot as the Home/About/Contact buttons
// next to it, just an <a download> instead of a tab switch.

export default function ResumeButton() {
  return (
    <a
      href="/Advith_Krishnan_Resume.pdf"
      download
      className="win98-resume-button font-bold"
    >
      Resume
    </a>
  )
}
