import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Allow all remote images (no domain restriction)
  images: {
    unoptimized: true,
  },

  // ✅ Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
