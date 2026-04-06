import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Prisma from bundling issues in server components
  serverExternalPackages: ["@prisma/client", "bcryptjs", "firebase-admin"],
};

export default nextConfig;
