import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.BACKEND_API_URL || "https://hormone-bench-ai-1.onrender.com"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
