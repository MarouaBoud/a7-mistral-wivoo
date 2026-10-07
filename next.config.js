/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['tile.openstreetmap.org'],
  },
};

module.exports = nextConfig;
