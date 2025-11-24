// next.config.js
const withMDX = require('@next/mdx')();

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
    // allow Supabase storage host
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ttpljybsuarsntidclmc.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
  },
  swcMinify: true,
};

module.exports = withMDX(nextConfig);