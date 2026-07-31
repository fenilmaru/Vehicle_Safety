import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/* calls to the Django backend at localhost:8000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        // WebSocket proxy for Django Channels
        source: "/ws/:path*",
        destination: "http://127.0.0.1:8000/ws/:path*",
      },
    ];
  },
};

export default nextConfig;
