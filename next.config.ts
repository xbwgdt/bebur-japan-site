import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  typescript: { tsconfigPath: "tsconfig.production.json" },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
