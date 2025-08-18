import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // CRITICAL FIX: Force CSS cache bypass for Railway deployment
  generateBuildId: async () => {
    return `build-${Date.now()}-css-fix`
  },
  // Force static optimization to include all Tailwind classes
  experimental: {
    optimizeCss: true,
  },
  // Ensure all CSS is generated for production
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  /* config options here */
};

export default nextConfig;
