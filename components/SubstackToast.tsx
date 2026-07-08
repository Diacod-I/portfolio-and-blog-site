'use client'

// Fixed bottom-right "system tray notification" version of the Substack CTA.
// Controlled by the parent (HomeClient) — shown once per session whenever
// the Blogs window is open on the list view.

const SUBSTACK_URL = 'https://substack.com/@advithkrishnan'

type SubstackToastProps = {
  visible: boolean
  onDismiss: () => void
}

export default function SubstackToast({ visible, onDismiss }: SubstackToastProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed bottom-6 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] win98-window shadow-lg"
    >
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>📬 Post Notification</span>
        </div>
        <button
          onClick={onDismiss}
          className="win98-window-button font-bold text-xl"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
      <div className="bg-[#c0c0c0] p-3 flex flex-col gap-2">
        <p className="text-black text-sm">
          <strong>Enjoying the blog?</strong> Get new posts straight to your
          inbox — free, via Substack.
        </p>
        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="win98-button px-4 py-1.5 font-bold text-black no-underline text-center"
        >
          Subscribe ✉️
        </a>
      </div>
    </div>
  )
}
