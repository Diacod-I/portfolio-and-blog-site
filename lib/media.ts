// lib/media.ts
// Typed accessor for scripts/r2-manifest.json — the metadata (width,
// height, blurDataURL) that scripts/migrate-to-r2.mjs computed once at
// upload time for every file it moved to R2. A static `import photo from
// '@/public/x.jpg'` gave next/image this same info for free at build time;
// now that the actual bytes live on R2 instead of in public/, this file is
// the replacement — read the manifest instead of the file.
//
// The manifest is keyed by each file's *original* public/ path (e.g.
// '/highlights/ethglobal.jpg'), not its R2 key, so callers here use the
// same paths they used to pass to a static import — see
// scripts/migrate-to-r2.mjs's `manifest[...] = ...` lines for how each key
// was written.
//
// Committed to the repo (scripts/r2-manifest.json is just JSON metadata,
// no image bytes) so this import works at build time on Vercel without
// needing R2 credentials — only scripts/migrate-to-r2.mjs itself (a local,
// by-hand script) needs those.

import manifestJson from '@/scripts/r2-manifest.json'
import { r2Url } from '@/lib/r2'

type ManifestEntry = {
  key: string
  bytes: number
  width?: number
  height?: number
  blurDataURL?: string
}

const manifest = manifestJson as Record<string, ManifestEntry>

/** Shape next/image needs for a `fill` image sourced from a plain URL
 *  string instead of a StaticImageData import: `placeholder="blur"` only
 *  works on a string src if blurDataURL is supplied explicitly alongside
 *  it (Next can't compute it itself), and `sizes`-based responsive layout
 *  still wants approximate width/height for aspect-ratio purposes. */
export type RemoteImage = {
  src: string
  width: number
  height: number
  blurDataURL: string
}

/** Looks up `publicPath` (e.g. '/highlights/ethglobal.jpg' — the same
 *  path you'd have used in `@/public/highlights/ethglobal.jpg`) in the R2
 *  manifest and returns a ready-to-render RemoteImage. Throws at
 *  build/import time if the manifest doesn't have an entry yet — better
 *  than silently rendering a broken image — so re-run `pnpm run
 *  migrate:r2` if this ever fires after adding a new photo. */
export function remoteImage(publicPath: string): RemoteImage {
  const entry = manifest[publicPath]
  if (!entry) {
    throw new Error(
      `lib/media.ts: no R2 manifest entry for "${publicPath}". Add the file to the ` +
        `right folder/list in scripts/migrate-to-r2.mjs and re-run "pnpm run migrate:r2".`
    )
  }
  return {
    src: r2Url(entry.key),
    width: entry.width ?? 0,
    height: entry.height ?? 0,
    blurDataURL: entry.blurDataURL ?? '',
  }
}
