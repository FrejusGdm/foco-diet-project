import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "menu.dartmouth.edu",
      },
    ],
  },
};

export default nextConfig;
