// Credits window content — a standalone app window (see HomeClient), opened
// on demand from the "Credits & attributions" link in the taskbar. No
// desktop icon: it's launched, not pinned. No outer window chrome here —
// that comes from Win98Window.
//
// Organized into clear sections so every third-party asset, library, and
// trademark reference is properly and formally attributed — see
// LICENSE.md at the repo root for the full licensing terms this summarizes.

import Link from 'next/link'

const linkClass = 'underline text-blue-700'
const h3Class = 'font-bold text-sm mt-3 mb-1'

export default function CreditsWindow() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 pr-8 bg-[#f3f3f3] text-black text-justify">
      <h2 className="text-lg font-bold mb-2">Credits</h2>

      <h3 className={h3Class}>Design &amp; Inspiration</h3>
      <ul className="list-disc ml-6 mb-2">
        <li>
          Site concept inspired by{' '}
          <a href="https://98.js.org" target="_blank" rel="noopener noreferrer" className={linkClass}>
            98.js
          </a>
        </li>
        <li>
          The UI is a visual homage to Microsoft Windows 98. Microsoft, Windows, and
          Windows 98 are trademarks of Microsoft Corporation. This is an independent,
          non-commercial fan project and is not affiliated with, endorsed by, or
          sponsored by Microsoft.
        </li>
      </ul>

      <h3 className={h3Class}>Visual &amp; Audio Assets</h3>
      <ul className="list-disc ml-6 mb-2">
        <li>Desktop wallpaper: original photograph by Advith Krishnan.</li>
        <li>
          UI icon set:{' '}
          <a href="https://win98icons.alexmeub.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Windows 98 Icons by Alex Meub
          </a>
        </li>
        <li>
          Error alert sound: a classic Windows system sound effect, used for
          stylistic authenticity as part of the Windows 98 homage described above.
        </li>
        <li>
          Click sound effect by{' '}
          <a
            href="https://pixabay.com/users/matthewvakaliuk73627-48347364/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Matthew Vakalyuk
          </a>{' '}
          via{' '}
          <a
            href="https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=290204"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Pixabay
          </a>{' '}
          (Pixabay Content License — free to use, attribution appreciated but not
          required).
        </li>
        <li>
          Club Penguin dance GIF, sourced via{' '}
          <a
            href="https://clubpenguin.fandom.com/wiki/Dance"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Club Penguin Wiki
          </a>
          . Club Penguin and related characters are trademarks of Disney. Used here
          purely for nostalgic, decorative purposes; not affiliated with, endorsed
          by, or sponsored by Disney.
        </li>
        <li>All other icons and images are original or used with permission.</li>
      </ul>

      <h3 className={h3Class}>Fonts</h3>
      <ul className="list-disc ml-6 mb-2">
        <li>
          Inter, JetBrains Mono, and VT323 — served via Google Fonts through
          next/font, each under the SIL Open Font License.
        </li>
      </ul>

      <h3 className={h3Class}>Games</h3>
      <ul className="list-disc ml-6 mb-2">
        <li>
          Prince of Persia, created by{' '}
          <a
            href="https://www.jordanmechner.com/en/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Jordan Mechner
          </a>{' '}
          and originally published by Broderbund for the Apple II in 1989.
          The 1990 MS-DOS version played here is embedded via{' '}
          <a
            href="https://archive.org/details/msdos_Prince_of_Persia_1990"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            archive.org&apos;s in-browser MS-DOS emulation
          </a>
          . The game is not hosted or redistributed by this site — the embed
          loads directly from archive.org, in keeping with the overall
          nostalgic, Windows 98-era style of this project. Prince of Persia
          is a trademark of Ubisoft Entertainment; this is an independent,
          non-commercial fan project and is not affiliated with, endorsed
          by, or sponsored by Ubisoft or Jordan Mechner.
        </li>
      </ul>

      <h3 className={h3Class}>Open Source Software</h3>
      <ul className="list-disc ml-6 mb-2">
        <li>
          <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Next.js
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Tailwind CSS
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://www.framer.com/motion/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Framer Motion
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://date-fns.org/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            date-fns
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://mdxjs.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>
            MDX.js
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://github.com/pmndrs/zustand" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Zustand
          </a>{' '}
          (MIT License)
        </li>
        <li>
          <a href="https://github.com/jonschlinkert/gray-matter" target="_blank" rel="noopener noreferrer" className={linkClass}>
            gray-matter
          </a>{' '}
          (MIT License)
        </li>
      </ul>

      <h3 className={h3Class}>Source Code</h3>
      <ul className="list-disc ml-6 mb-4">
        <li>
          Full source available on{' '}
          <a
            href="https://github.com/Diacod-I/portfolio-and-blog-site"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub
          </a>{' '}
          for portfolio and reference viewing — see License below for reuse terms.
        </li>
      </ul>

      <h2 className="text-lg font-bold mb-2">License</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>
          Content (blog posts, original writing, and original photos) is licensed
          under{' '}
          <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            CC BY-NC-ND 4.0
          </a>{' '}
          by Advith Krishnan.
        </li>
        <li>
          Source code is <strong>all rights reserved</strong> — published for
          portfolio and reference purposes only, not licensed for reuse.
          (Creative Commons licenses aren&apos;t intended for software, so code is
          deliberately excluded from the CC terms above — see LICENSE.md.)
        </li>
        <li>Third-party assets and libraries listed above retain their own original licenses.</li>
      </ul>

      <p className="mt-4 text-sm text-gray-700">
        If you believe attribution is missing or incorrect, please{' '}
        <Link href="/contact" className={linkClass}>
          contact
        </Link> via the provided channels.
      </p>
    </div>
  )
}
