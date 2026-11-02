import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "apps/web"),
    },
  },
  // apps/web's tsconfig leaves JSX for Next to compile ("preserve"); component
  // tests need it compiled here.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});
