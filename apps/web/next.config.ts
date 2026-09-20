import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Memungkinkan menjalankan server dev kedua (mis. untuk verifikasi) tanpa bentrok lock dengan .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
