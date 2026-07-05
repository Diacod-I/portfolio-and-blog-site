import { ImageResponse } from 'next/og'
import { getNote } from '@/lib/notes'

// Win98-window share card, rendered at build time for each post.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Blog post preview'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const note = await getNote(slug)
  const title = note?.title ?? "Advith Krishnan's Blogfolio"
  const date = note
    ? new Date(note.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #008080 0%, #006666 100%)',
          padding: 48,
        }}
      >
        {/* win98 window */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: '#c0c0c0',
            border: '4px solid #dfdfdf',
            borderRightColor: '#404040',
            borderBottomColor: '#404040',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.35)',
          }}
        >
          {/* titlebar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 700,
              padding: '12px 20px',
            }}
          >
            <span>advith_krishnan.exe — notepad</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 36, height: 36, background: '#c0c0c0', border: '3px solid #ffffff', borderRightColor: '#404040', borderBottomColor: '#404040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 22 }}>_</div>
              <div style={{ width: 36, height: 36, background: '#c0c0c0', border: '3px solid #ffffff', borderRightColor: '#404040', borderBottomColor: '#404040', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 22 }}>×</div>
            </div>
          </div>
          {/* content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              background: '#222222',
              margin: 10,
              padding: '40px 56px',
              border: '3px solid #404040',
              borderRightColor: '#dfdfdf',
              borderBottomColor: '#dfdfdf',
            }}
          >
            <div style={{ color: '#00ff00', fontSize: 30, marginBottom: 20, fontFamily: 'monospace' }}>
              C:\blogs&gt; type {slug}.mdx
            </div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            {date && (
              <div style={{ color: '#9ca3af', fontSize: 30, marginTop: 28 }}>
                {date} · Advith Krishnan
              </div>
            )}
          </div>
          {/* status bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: '#c0c0c0',
              color: '#000000',
              fontSize: 24,
              padding: '8px 20px',
            }}
          >
            <span>www.advithkrishnan.com</span>
            <span>▲ Blogfolio</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
