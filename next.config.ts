import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "dozens-provided-spray-dining.trycloudflare.com",
  ],
};

export default nextConfig;
