import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { buildManifest, resolveTarget, version } from "./manifest.config";

// `build:safari` sets EXT_TARGET; every other build, including the watching dev
// builds, gets the Chrome and Firefox manifest.
const target = resolveTarget();

const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

function readBuildNumber(file: string) {
  if (!fs.existsSync(file)) return "1";
  const match = fs
    .readFileSync(file, "utf8")
    .match(/^CURRENT_PROJECT_VERSION\s*=\s*(\d+)\s*$/m);
  return match ? match[1] : "1";
}

function writeVersionXcconfig() {
  const file = path.resolve(__dirname, "version.xcconfig");

  fs.writeFileSync(
    file,
    [
      "// Generated from manifest.config.ts by vite.config.ts.",
      "// MARKETING_VERSION is overwritten on every build: change it in",
      "// manifest.config.ts, not here.",
      "// CURRENT_PROJECT_VERSION is preserved across builds and is yours to edit.",
      "// Raise it before every App Store Connect upload you archive locally; it",
      "// must always be higher than the last build Apple accepted.",
      `MARKETING_VERSION = ${version}`,
      `CURRENT_PROJECT_VERSION = ${readBuildNumber(file)}`,
      "",
    ].join("\n")
  );
}

// Writing the manifest here rather than copying a file afterwards keeps it in
// place for `vite build --watch`, which never returns to run a follow-up step.
function manifest(): Plugin {
  let outDir = path.resolve(__dirname, "dist");

  return {
    name: "linkwarden:manifest",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      fs.writeFileSync(
        path.join(outDir, "manifest.json"),
        JSON.stringify(buildManifest(target), null, 2) + "\n"
      );
      // Every target, not just safari, so the two cannot drift apart just
      // because `build:safari` happened not to run.
      writeVersionXcconfig();
    },
  };
}

export default defineConfig({
  plugins: [react(), manifest()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // While watching, leave the previous output in place so web-ext always has
    // a complete extension to read. Rebuilds overwrite files rather than
    // clearing the directory out from under it.
    emptyOutDir: !isWatch,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        options: path.resolve(__dirname, "src/pages/Options/options.html"),
        background: path.resolve(__dirname, "src/pages/Background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
