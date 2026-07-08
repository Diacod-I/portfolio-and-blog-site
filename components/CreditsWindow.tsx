// Credits window content — a standalone app window (see HomeClient), opened
// on demand from the "Credits & attributions" link in the taskbar. No
// desktop icon: it's launched, not pinned. No outer window chrome here —
// that comes from Win98Window.

import Link from 'next/link'

export default function CreditsWindow() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-[#f3f3f3] text-black">
      <h2 className="text-lg font-bold mb-2">Credits</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>
          Website design idea inspired from{' '}
          <a href="https://98.js.org" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
            98.js
          </a>
        </li>
        <li>Windows 98 UI inspired by Microsoft Windows 98</li>
        <li>
          UI Icons:{' '}
          <a
            href="https://win98icons.alexmeub.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            Win98 Icons by Alex Meub
          </a>
        </li>
        <li>All icons and images used are either original, free for personal use, or properly attributed.</li>
        <li>
          Club Penguin GIF:{' '}
          <a
            href="https://clubpenguin.fandom.com/wiki/Dance"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            Club Penguin Wiki
          </a>
        </li>
        <li>
          Click Sound Effect by <a href="https://pixabay.com/users/matthewvakaliuk73627-48347364/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Matthew Vakalyuk</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204">MatthewVakaliuk73627</a> on Pixabay
        </li>
        <li>
          MDX/Markdown blog system:{' '}
          <a href="https://mdxjs.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
            MDX.js
          </a>{' '}
          (MIT License)
        </li>
        <li>
          Portfolio and blog code:{' '}
          <a
            href="https://github.com/Diacod-I/portfolio-and-blog-site"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            GitHub
          </a>
        </li>
        <li>Fonts: Inter, JetBrains Mono, VT323 via Google Fonts</li>
        <li>
          Next.js framework:{' '}
          <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
            Next.js
          </a>{' '}
          (MIT License)
        </li>
        <li>
          Tailwind CSS:{' '}
          <a
            href="https://tailwindcss.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            Tailwind CSS
          </a>{' '}
          (MIT License)
        </li>
        <li>
          Framer Motion:{' '}
          <a
            href="https://www.framer.com/motion/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            Framer Motion
          </a>{' '}
          (MIT License)
        </li>
        <li>
          Date-fns:{' '}
          <a href="https://date-fns.org/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
            date-fns
          </a>{' '}
          (MIT License)
        </li>
      </ul>
      <h2 className="text-lg font-bold mb-2">Licenses</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>
          Site content & code:{' '}
          <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            CC BY-NC-ND 4.0
          </a>{' '}
          by Advith Krishnan
        </li>
        <li>Third-party assets retain their original licenses.</li>
      </ul>
      <p className="mt-4 text-sm text-gray-700">
        If you believe attribution is missing or incorrect, please{' '}
        <Link href="/contact" className="underline text-blue-700">
          contact me
        </Link>
        .
      </p>
    </div>
  )
}
