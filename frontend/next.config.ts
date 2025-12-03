import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/measurements',
        destination: 'http://localhost:8080/measurements',
      },
      {
        source: '/api/sensors/rewards',
        destination: 'http://localhost:8080/sensors/rewards',
      },
    ];
  },
};

export default nextConfig;
