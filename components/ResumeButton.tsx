'use client'

// Resume is now a tab within advith.exe (see HomeClient's homeTab state),
// not a separate page — clicking it just switches what the window shows.

type ResumeButtonProps = {
  isActive: boolean
  onClick: () => void
}

export default function ResumeButton({ isActive, onClick }: ResumeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`win98-resume-button font-bold ${
        isActive
          ? 'bg-[#92dcd7] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white'
          : ''
      }`}
    >
      Resume
    </button>
  )
}
