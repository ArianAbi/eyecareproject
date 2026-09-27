import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/financial/print": ["./assets/fonts/NotoSansArabic.ttf"],
    "/api/admin/users/[id]/financial/print": ["./assets/fonts/NotoSansArabic.ttf"],
  },
  experimental: {
    // Allow multipart overhead; the action enforces the exact 5 MiB file limit.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
