import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/measurements',
        destination: 'http://localhost:8080/measurements',
      },
    ];
  },
};

export default nextConfig;
