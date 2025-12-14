/** @type {import('next').NextConfig} */
const { version } = require("./package.json");
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  i18n,
  reactStrictMode: true,
  staticPageGenerationTimeout: 1000,
  images: {
    remotePatterns: [
      // For fetching the favicons
      { hostname: "t2.gstatic.com" },

      // For profile pictures (Google OAuth)
      { hostname: "*.googleusercontent.com" },
    ],

    minimumCacheTTL: 10,
  },
  transpilePackages: ["@linkwarden/prisma"],
  env: {
    version,
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

module.exports = nextConfig;
