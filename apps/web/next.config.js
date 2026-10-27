/** @type {import('next').NextConfig} */
const path = require("path");
const { version } = require("./package.json");
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  i18n,
  reactStrictMode: true,
  devIndicators: false,
  staticPageGenerationTimeout: 1000,
  images: {
    remotePatterns: [
      // For profile pictures (Google OAuth)
      { hostname: "*.googleusercontent.com" },
    ],

    minimumCacheTTL: 10,
  },
  transpilePackages: ["@linkwarden/prisma"],
  env: {
    version,
  },
  webpack(config, { dev, webpack }) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Next serves every file under pages/ as a route, including the tests kept
    // next to API routes, so production builds swap those for a 404 handler
    if (!dev)
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]pages[\\/].+\.test\.[jt]sx?$/,
          path.join(__dirname, "lib/api/testFileStub.ts")
        )
      );

    return config;
  },
};

module.exports = nextConfig;
