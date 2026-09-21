#!/usr/bin/env node
// scripts/migrate-to-r2.mjs
//
// One-off (but safely re-runnable) migration: uploads the site's actual
// *content* media — exhibition/gallery photos, the profile photo, project
// thumbnails, and blog post images — from public/ to a Cloudflare R2
// bucket, so the repo stops growing every time a new photo or video gets
// added. Deliberately does NOT touch public/win98, public/logos,
// public/internet_shortcuts, or the favicons: those are the app's own UI
// chrome (sound effects, icons, wallpaper) — small, versioned alongside
// the code they style, and not "content" that accumulates over time.
//
// Setup (see the Cloudflare dashboard steps you were given in chat):
//   1. Create the R2 bucket + an API token scoped to it.
//   2. Connect a custom public subdomain to the bucket (R2's own
//      *.r2.dev URL has rate limits and isn't meant for production
//      hotlinking).
//   3. cp .env.example .env.local and fill in the values from step 1/2.
//
// Usage:
//   pnpm install
//   pnpm run migrate:r2
//
// Idempotent: PutObject just overwrites, and the manifest below is
// regenerated fresh each run — safe to re-run after adding new photos to
// the folders/list below. This does NOT delete the local public/ copies;
// see the summary this prints at the end for what to do once you've
// verified the migration worked (spot-check a few URLs load, then
// `git rm` the now-redundant local files yourself — deliberately a
// manual, reviewable step rather than something this script does for
// you).

import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')

const REQUIRED_ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`Missing env var(s): ${missing.join(', ')}`)
  console.error('Copy .env.example to .env.local and fill them in first.')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// Whole folders, uploaded recursively under the same-named prefix.
const FOLDERS = [
  { dir: 'highlights', prefix: 'highlights' },
  { dir: 'project-thumbnails', prefix: 'project-thumbnails' },
  { dir: 'post-images', prefix: 'post-images' },
]

// The profile photo — its own prefix since it isn't an exhibition photo.
const PROFILE_PHOTO = 'Advith_Krishnan.webp'

// Loose personal photos at the public/ root that data/exhibitionFrames.ts
// static-imports for the hidden image-exhibition easter egg — listed by
// name (not swept up as a folder) since they live mixed in with UI
// assets at the root rather than their own subfolder. Uploaded under an
// 'exhibition/' prefix.
const EXHIBITION_PHOTOS = [
  'IMG_20190103_071215.jpg',
  'IMG_20190103_075939.jpg',
  'IMG_20190103_080007.jpg',
  'IMG_20190103_081554.jpg',
  'IMG_20190103_082932.jpg',
  'IMG_20211119_193920.jpg',
  'IMG_20211122_122534.jpg',
  'IMG_20220302_175741.jpg',
  'IMG_20220304_204353.jpg',
  'IMG_20220401_192335_737.jpg',
  'IMG_20231022_140633.jpg',
  'IMG_20240423_080639.jpg',
  'IMG_20240528_224218.jpg',
  'IMG_20240528_225351.jpg',
  'IMG_20240528_225753.jpg',
  'IMG_20240604_130801.jpg',
  'IMG_20250714_005009.jpg',
  'IMG_0756.jpg',
  '05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg',
  '1109AEAE-CB76-481B-A0C5-637DF2636E1C_4_5005_c.jpeg',
  '112EEF32-B66D-49E5-9DB9-6BC6787AEF3D_1_105_c.jpeg',
  '19F77ED7-2604-454D-A740-32B2120BB4EE_1_105_c.jpeg',
  '22152C98-2AA8-4B6F-A831-85BB4A86EA72_1_105_c.jpeg',
  '326387A0-CF8E-42C2-9F7A-87A04A5903D7_1_105_c.jpeg',
  '4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg',
  '67D733B7-A762-4847-84C8-C5A7E5B5500F_1_105_c.jpeg',
  '8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg',
  'E71A0C45-4BA0-42AB-8B15-D2EBFA7A2AB9_1_105_c.jpeg',
  '8eqko4.png',
  'hqdefault.jpg',
  'images.jpeg',
  'maxresdefault.jpg',
]

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

function contentType(ext) {
  return (
    {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
    }[ext] ?? 'application/octet-stream'
  )
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

// Uploads one file and, for images, computes the width/height/blurDataURL
// that data/highlights.ts and data/exhibitionFrames.ts explain they
// previously got for free from next/image via a static import — a plain
// remote URL string can't carry that on its own, so it's computed here
// once and baked into the manifest instead.
async function uploadOne(localPath, key) {
  const buffer = await readFile(localPath)
  const ext = path.extname(localPath).toLowerCase()

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType(ext),
      // Content is immutable once uploaded here (a changed photo would
      // get uploaded under the same key, not edited in place) — safe to
      // cache aggressively at the edge and in visitors' browsers.
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const entry = { key, bytes: buffer.length }
  if (IMAGE_EXT.has(ext)) {
    // .rotate() with no args auto-applies EXIF orientation (same
    // correction a browser/next/image does), so width/height here match
    // what actually gets displayed.
    const rotated = sharp(buffer).rotate()
    const { width, height } = await rotated.metadata()
    const blurBuffer = await rotated.resize(20).jpeg({ quality: 40 }).toBuffer()
    entry.width = width
    entry.height = height
    entry.blurDataURL = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`
  }
  return entry
}

async function main() {
  const manifest = {}
  let count = 0

  for (const { dir, prefix } of FOLDERS) {
    const folder = path.join(PUBLIC, dir)
    let files
    try {
      files = await walk(folder)
    } catch {
      console.warn(`(skipping public/${dir} — not found)`)
      continue
    }
    for (const file of files) {
      const rel = path.relative(folder, file).split(path.sep).join('/')
      const key = `${prefix}/${rel}`
      process.stdout.write(`  ${key} ... `)
      manifest[`/${dir}/${rel}`] = await uploadOne(file, key)
      console.log('done')
      count++
    }
  }

  const profilePath = path.join(PUBLIC, PROFILE_PHOTO)
  try {
    await stat(profilePath)
    const key = `profile/${PROFILE_PHOTO}`
    process.stdout.write(`  ${key} ... `)
    manifest[`/${PROFILE_PHOTO}`] = await uploadOne(profilePath, key)
    console.log('done')
    count++
  } catch {
    console.warn(`(skipping public/${PROFILE_PHOTO} — not found)`)
  }

  for (const name of EXHIBITION_PHOTOS) {
    const localPath = path.join(PUBLIC, name)
    try {
      await stat(localPath)
    } catch {
      console.warn(`(skipping ${name} — not found)`)
      continue
    }
    const key = `exhibition/${name}`
    process.stdout.write(`  ${key} ... `)
    manifest[`/${name}`] = await uploadOne(localPath, key)
    console.log('done')
    count++
  }

  const manifestPath = path.join(ROOT, 'scripts', 'r2-manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nUploaded ${count} file(s) to bucket "${process.env.R2_BUCKET_NAME}".`)
  console.log(`Manifest written to scripts/r2-manifest.json (committed to the repo — it's just metadata, no image bytes).`)
  console.log(`\nNext: let Claude know the manifest is ready — it'll rewrite data/highlights.ts,`)
  console.log(`data/exhibitionFrames.ts, components/HomeClient.tsx, data/projects.ts, and any`)
  console.log(`content/notes/*.mdx post-image references to point at the new R2 URLs instead of`)
  console.log(`the local public/ copies.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
