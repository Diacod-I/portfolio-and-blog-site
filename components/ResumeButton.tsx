'use client'

export default function ResumeButton() {
  const handleOpenResume = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = '/resume'
  }

  return (
    <button 
      onClick={handleOpenResume}
      className="win98-resume-button font-bold"
    >
      Resume
    </button>
  )
}
