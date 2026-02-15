import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
};

export default nextConfig;
