/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  output: 'standalone', // For Docker production builds
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'finstat.sk',
      },
      {
        protocol: 'https',
        hostname: 'www.finstat.sk',
      },
      {
        protocol: 'https',
        hostname: 'orsr.sk',
      },
      {
        protocol: 'https',
        hostname: 'www.orsr.sk',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);

