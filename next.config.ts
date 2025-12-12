import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Allow all remote images (no domain restriction)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
