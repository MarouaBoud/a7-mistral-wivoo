/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['tile.openstreetmap.org'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
