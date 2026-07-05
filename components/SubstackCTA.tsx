// Win98 "system notification" panel prompting Substack subscription.
// Shared by the blogs index (bottom) and blog posts (end of article).

const SUBSTACK_URL = 'https://substack.com/@advithkrishnan'

export default function SubstackCTA() {
  return (
    <div className="win98-window max-w-xl mx-auto">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>📬 Post Notification</span>
        </div>
      </div>
      <div className="bg-[#c0c0c0] p-4 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-black text-sm flex-1">
          <strong>Enjoying the blog?</strong> Get new posts straight to your
          inbox — free, via Substack. Unsubscribe anytime.
        </p>
        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="win98-button px-4 py-2 font-bold text-black no-underline whitespace-nowrap"
        >
          Subscribe ✉️
        </a>
      </div>
    </div>
  )
}
