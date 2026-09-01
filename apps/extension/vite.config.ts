import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// `vite build --watch` never returns, so the `cp ./manifest.json` step in the
// build scripts is unreachable while watching. The dev builds copy the manifest
// themselves instead. `build` and `build:safari` are untouched and keep copying
// their own manifest, which is what picks manifest.safari.json for Safari.
const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

function devManifest(): Plugin {
  let outDir = path.resolve(__dirname, 'dist');

  return {
    name: 'linkwarden:dev-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      fs.copyFileSync(
        path.resolve(__dirname, 'manifest.json'),
        path.join(outDir, 'manifest.json')
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), ...(isWatch ? [devManifest()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // While watching, leave the previous output in place so web-ext always has
    // a complete extension to read. Rebuilds overwrite files rather than
    // clearing the directory out from under it.
    emptyOutDir: !isWatch,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        options: path.resolve(__dirname, 'src/pages/Options/options.html'),
        background: path.resolve(__dirname, 'src/pages/Background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
