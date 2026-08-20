import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Blog Posts | Advith Krishnan',
  description: "Browse all of Advith Krishnan's blog posts in one place.",
  alternates: {
    canonical: 'https://www.advithkrishnan.com/blogs',
  },
}

// The actual desktop UI (Blogs window forced open on the list view) now
// lives in the persistent shell — see components/AppShellHost.tsx,
// mounted once from app/layout.tsx — which derives forceOpenApp="blogs"
// for this route itself from the URL, so following a link straight to
// /blogs still feels like the real app, not a separate isolated page, and
// this page itself has nothing left to render.
export default function BlogsUnifiedPage() {
  return null
}
