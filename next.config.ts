import withPWA from 'next-pwa';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
});

export default nextConfig;
