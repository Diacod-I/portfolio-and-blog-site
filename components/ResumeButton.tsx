'use client'

export default function ResumeButton() {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    const link = document.createElement('a')
    link.href = '/Advith_Krishnan_Resume.pdf'
    link.download = 'Advith_Krishnan_Resume.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleDownload}
      className="win98-resume-button font-bold"
    >
      Resume
    </button>
  )
}
