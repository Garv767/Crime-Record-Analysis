import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/.netlify/functions/api/:path*",
      },
    ];
  },
};

export default nextConfig;
