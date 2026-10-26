import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
