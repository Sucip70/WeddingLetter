import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memungkinkan menjalankan server dev kedua (mis. untuk verifikasi) tanpa bentrok lock dengan .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Image Docker (apps/web/Dockerfile) hanya menyalin .next/standalone + aset statis, tanpa node_modules penuh.
  // Root tracing = root repo (npm workspaces, dependency ada di node_modules root), jadi server.js berada di
  // .next/standalone/apps/web/server.js.
  output: "standalone",
};

export default nextConfig;
