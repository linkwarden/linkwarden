/** @type {import('next').NextConfig} */
const { version } = require("./package.json");
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  i18n,
  reactStrictMode: true,
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
  webpack(config, { isServer }) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Force Next.js shared-runtime modules to be externalized on the server.
    // Without this, webpack may bundle html-context.shared-runtime inline,
    // creating a separate HtmlContext object from the one in pages.runtime.prod.js.
    // This causes "<Html> should not be imported outside of pages/_document"
    // during static page generation in Docker builds.
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : []),
        function ({ request }, callback) {
          if (/shared-runtime/.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
