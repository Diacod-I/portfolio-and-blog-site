import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Credits & attributions — Advith Krishnan',
  alternates: {
    canonical: '/credits',
  },
}

// Credits opens as its own app window on the persistent desktop shell now
// — see components/AppShellHost.tsx, mounted once from app/layout.tsx,
// which derives forceOpenApp="credits" for this route itself from the URL
// — so this page has nothing left to render. Launched, not pinned: there's
// no desktop icon for it, only this route and the taskbar's "Credits &
// attributions" link.
export default function CreditsPage() {
  return null
}
