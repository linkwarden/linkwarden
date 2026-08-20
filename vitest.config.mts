import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "apps/web"),
      // Next resolves this through the web app's tsconfig baseUrl, Vite doesn't.
      "next-i18next.config": path.resolve(
        process.cwd(),
        "apps/web/next-i18next.config.js"
      ),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});
