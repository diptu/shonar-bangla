import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo root — the roadmap essays are read from there at build time.
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

export default nextConfig;
