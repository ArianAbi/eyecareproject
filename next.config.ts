import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow multipart overhead; the action enforces the exact 5 MiB file limit.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
