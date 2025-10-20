const withMDX = require('@next/mdx')()

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    mdxRs: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  swcMinify: true,
};

module.exports = nextConfig;
