<p align="center">
  <a href="https://advithkrishnan.com" target="_blank">
    <img src="https://api.microlink.io/?url=https://advithkrishnan.com/&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark" alt="Advith's Blog" width="800px" />
  </a>
</p>

# Advith's Portfolio

A nostalgic Windows 98-inspired portfolio and blog website built with Next.js and Tailwind CSS.


## Features

- 🖥️ Authentic Windows 98 desktop: draggable/resizable windows, a real taskbar with Start menu, minimize/maximize/close, and drag-to-reorder taskbar buttons.
- 🪟 advith.exe:  Home, About, Contact, and Resume tabs in one window.
- 📈 Contribution Graph: A GitHub-style 365-day contribution heatmap on the Home tab, fetched live from GitHub's GraphQL API.
- 🗃️ Contribution Archive: Monthly Contributor Reports grouped into a year-by-year timeline, each tagged with `#repo` hashtags for what was worked on.
- 🤖 Automated monthly reports: A scheduled GitHub Action scaffolds each month's Contributor Report from the GitHub Search API (commits, PRs, issues, reviews) with a narrative paragraph drafted by GitHub Models, then opens it as a PR for review before it goes live (see `scripts/generate-report.mjs` and `.github/workflows/monthly-report.yml`).
- 📝 MDX-powered blog with tag filtering, search, and sortable columns in a Win98 Explorer-style list.
- 🎮 Minesweeper and Solitaire, built from scratch in React, plus Prince of Persia embedded via archive.org's in-browser MS-DOS emulation.
- 🖼️ Gallery window with personal photo highlights
- 🔗 Internet Shortcuts panel linking out to social profile links, and a downloadable resume.
- 💻 Responsive design

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- MDX (`@next/mdx`, `@mdx-js/*`) for blog posts and monthly reports
- Zustand for window-manager state (open/closed, position, z-order, taskbar order)
- Framer Motion for animations
- date-fns for date formatting
- gray-matter for MDX frontmatter parsing
- GitHub Search API, GitHub GraphQL API, and GitHub Models powering the Contribution Graph and the automated monthly report pipeline

## License

Content (blog posts, original writing, and original photos) is licensed
under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
International License. To view a copy of this license, visit
[CC BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/).

The source code is **all rights reserved** — published for portfolio and
reference purposes only, not licensed for reuse. (Creative Commons
licenses aren't intended for software, so code is deliberately excluded
from the CC terms above.)

See [LICENSE.md](./LICENSE.md) for the full terms, and [CREDITS.md](./CREDITS.md)
(or the in-app Credits window) for third-party attributions.
