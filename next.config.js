/** @type {import('next').NextConfig} */
const { version } = require("./package.json");

const nextConfig = {
  reactStrictMode: true,
  images: {
    // For fetching the favicons
    domains: ["t2.gstatic.com"],

    // For profile pictures (Google OAuth)
    remotePatterns: [
      {
        hostname: "*.googleusercontent.com",
      },
    ],

    minimumCacheTTL: 10,
  },
  env: {
    version,
  },
};

module.exports = nextConfig;
