import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-only code stays server-only
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
