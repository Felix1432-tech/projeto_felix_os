import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Permite conexão com API externa
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
