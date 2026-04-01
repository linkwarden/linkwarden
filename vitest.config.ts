import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    include: [
      "apps/web/pages/api/**/*.spec.ts",
      "apps/web/pages/api/**/*.test.ts",
    ],
  },
});
