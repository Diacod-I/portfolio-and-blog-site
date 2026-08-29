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
