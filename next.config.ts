import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/manifest.json',
      },
    ];
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  publicExcludes: ['!icons/**/*'],  // Don't exclude icons
  buildExcludes: [], // Include all build files
  cacheOnFrontEndNav: true,
  runtimeCaching: [ 
    {
      urlPattern: /^https:\/\/www\.weko\.ai\/manifest\.json/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'manifest-cache',
      },
    }
  ]
})

module.exports = withPWA(nextConfig);
