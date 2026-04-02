/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  output: 'standalone', // For Docker production builds
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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

