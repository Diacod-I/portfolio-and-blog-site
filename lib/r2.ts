// lib/r2.ts
// Thin helper for building public URLs to media hosted on Cloudflare R2
// (photos, project thumbnails, blog post images, and eventually video)
// instead of committing them to public/ and growing the git repo every
// time a new one is added. R2 isn't fetched directly by the app — the
// bucket has a custom subdomain connected to it (see the setup notes in
// scripts/migrate-to-r2.mjs), so from next/image's perspective this is
// just a normal HTTPS URL, allowlisted in next.config.js's
// images.remotePatterns.
//
// Nothing in the deployed app talks to R2's S3-compatible API — that
// only happens in scripts/migrate-to-r2.mjs, a one-off local script run
// by hand, never at build or request time.

const R2_URL = (process.env.NEXT_PUBLIC_R2_URL ?? '').replace(/\/$/, '')

/** Builds a public URL for a file uploaded under this key (e.g.
 *  'highlights/ethglobal.jpg') to the R2 bucket. Returns a bucket-less
 *  relative path if NEXT_PUBLIC_R2_URL isn't set yet, so a fresh clone
 *  still type-checks/builds — the image just 404s until the env var (and
 *  the bucket/domain it points at) exist. */
export function r2Url(key: string): string {
  return `${R2_URL}/${key.replace(/^\//, '')}`
}
