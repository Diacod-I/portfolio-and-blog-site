const fs = require('fs')
const path = require('path')

const DOMAIN = 'https://adviths-blogfolio.vercel.app'
const BLOG_DIR = path.join(__dirname, '../content/notes')
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml')

function getBlogSlugs(dir) {
  return fs.readdirSync(dir)
    .filter(file =>
      file.endsWith('.mdx') &&
      !file.includes('test') &&
      !dir.includes('draft_content')
    )
    .map(file => file.replace('.mdx', ''))
}

const publishedBlogs = getBlogSlugs(BLOG_DIR)

const urls = [
  { loc: `${DOMAIN}/`, priority: 1.0 },
  { loc: `${DOMAIN}/blogs/`, priority: 0.8 },
  ...publishedBlogs.map(slug => ({
    loc: `${DOMAIN}/blogs/${slug}`,
    priority: 0.7
  }))
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>
`

fs.writeFileSync(SITEMAP_PATH, sitemap.trim())
console.log('✅ Sitemap generated at', SITEMAP_PATH)