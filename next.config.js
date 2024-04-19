/** @type {import('next').NextConfig} */
const { version } = require("./package.json");

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["t2.gstatic.com"],
    minimumCacheTTL: 10,
  },
  env: {
    version,
  },
};

module.exports = nextConfig;
