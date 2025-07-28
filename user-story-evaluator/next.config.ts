import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  // Disable static optimization for pages that use browser APIs
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      // Don't pre-render /evaluate since it uses browser APIs
    }
  }
};

export default nextConfig;