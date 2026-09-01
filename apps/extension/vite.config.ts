import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { buildManifest, resolveTarget } from './manifest.config';

// `build:safari` sets EXT_TARGET; every other build, including the watching dev
// builds, gets the Chrome and Firefox manifest.
const target = resolveTarget();

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

// Writing the manifest here rather than copying a file afterwards keeps it in
// place for `vite build --watch`, which never returns to run a follow-up step.
function manifest(): Plugin {
  let outDir = path.resolve(__dirname, 'dist');

  return {
    name: 'linkwarden:manifest',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      fs.writeFileSync(
        path.join(outDir, 'manifest.json'),
        JSON.stringify(buildManifest(target), null, 2) + '\n'
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), manifest()],
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
