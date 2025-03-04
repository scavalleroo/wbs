import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // changed this to false
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
