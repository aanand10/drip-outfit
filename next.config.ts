import type { NextConfig } from "next";

// Tailwind runs through PostCSS (postcss.config.mjs). The template's @tailwindcss/turbopack
// loader kept serving stale CSS after edits to globals.css, so it was replaced.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Allow testing the dev server from a phone on the same Wi-Fi (e.g. http://192.168.1.10:3000).
  allowedDevOrigins: ["192.168.*.*"],
  images: {
    // Product photos come from the brands' Shopify CDN (see scripts/scrape_products.py).
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" }],
  },
};

export default nextConfig;
