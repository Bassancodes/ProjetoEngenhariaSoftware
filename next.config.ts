import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
      },
      {
        protocol: "https",
        hostname: "consuladodorock.com.br",
      },
      {
        protocol: "https",
        hostname: "www.hangar33.com.br",
      },
    ],
  },
};

export default nextConfig;
