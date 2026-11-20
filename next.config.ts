import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app when a parent lockfile exists.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
