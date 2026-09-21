// next.config.js
const withMDX = require('@next/mdx')();

// Security headers Lighthouse's "Trust and Safety" section flagged as
// missing (all "High" severity): no HSTS, no COOP, no X-Frame-Options/
// frame-ancestors. CSP is deliberately NOT included here — this site loads
// Vercel Analytics, Google Fonts' CSS+font CDN, and an ogl-based WebGL
// shader background, all of which a CSP would need to allowlist correctly
// or it'll silently break something. These three are safe, no-downside
// additions: nothing on this site is meant to be iframed, and there's no
// legitimate reason for another origin to open this site as a popup and
// retain a window handle to it.
const securityHeaders = [
  // Tells browsers to only ever connect over HTTPS for the next year,
  // including subdomains, and allows this domain to be baked into
  // browsers' HSTS preload list if ever submitted there.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Blocks this site from being embedded in an <iframe> on another origin
  // (clickjacking protection). SAMEORIGIN rather than DENY since nothing
  // here currently frames itself, but this is the conventional safe default.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Isolates this page from cross-origin popups/openers it didn't itself
  // open — same-origin-allow-popups (rather than plain same-origin) so
  // any window.open() this site does to another origin (e.g. the external
  // report links in ContributorArchive.tsx) still works normally.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
]

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    mdxRs: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    // keep your formats + cache TTL
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    // Next 16 only allows next/image `quality` values listed here (default
    // is just [75]) — 70 and 85 are GalleryWindow.tsx's thumbnail-rail and
    // main-viewer qualities respectively (see that file), 75 is every other
    // next/image on the site that doesn't pass a `quality` prop at all (its
    // own default). Keep this in sync if a new quality value gets used
    // anywhere else.
    qualities: [70, 75, 85],
    // Next's image optimizer refuses to serve local SVGs at all unless
    // this is set — needed for the company/institution logo badges in
    // ExperienceSection.tsx/EducationSection.tsx (public/logos/*.svg,
    // sourced from each org's own brand assets). contentSecurityPolicy
    // here is the mitigation Next's own docs recommend alongside this
    // flag (an SVG can embed <script>, so this sandboxes anything served
    // through the image endpoint and disables script execution) — belt
    // and suspenders, since every SVG under public/logos is one this repo
    // fetched and committed itself, not user-uploaded.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allowlists the Cloudflare R2 bucket's public custom domain so
    // next/image will optimize images whose `src` is a full remote URL
    // there — see lib/r2.ts and scripts/migrate-to-r2.mjs for the media
    // migration this supports (gallery/exhibition photos, project
    // thumbnails, blog post images, profile photo — moved out of public/
    // and off the repo instead of growing it every time a new photo or
    // video is added). R2_PUBLIC_HOSTNAME lets the actual subdomain be
    // configured via env instead of hardcoded here; falls back to the
    // real one once it exists so a fresh clone without .env.local set
    // still type-checks/builds (images from it just won't load until the
    // env var — or the bucket's domain itself — is set up).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || 'cdn.advithkrishnan.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

module.exports = withMDX(nextConfig);
