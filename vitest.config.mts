import path from "path";
import { defineConfig } from "vitest/config";

const web = path.resolve(process.cwd(), "apps/web");
const mobile = path.resolve(process.cwd(), "apps/mobile");

export default defineConfig({
  plugins: [
    {
      // "@/" is apps/mobile inside the mobile app and apps/web everywhere else
      name: "app-alias",
      enforce: "pre",
      resolveId(source, importer, options) {
        if (!source.startsWith("@/")) return null;

        const base = importer?.startsWith(mobile + path.sep) ? mobile : web;

        return this.resolve(path.join(base, source.slice(2)), importer, {
          ...options,
          skipSelf: true,
        });
      },
    },
  ],
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],
  },
});
