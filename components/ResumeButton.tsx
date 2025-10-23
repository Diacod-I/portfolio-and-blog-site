'use client'

export default function ResumeButton() {
  const handleOpenResume = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open('/resume', '_blank')
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
