import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { buildManifest, resolveTarget, version } from './manifest.config';

// `build:safari` sets EXT_TARGET; every other build, including the watching dev
// builds, gets the Chrome and Firefox manifest.
const target = resolveTarget();

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

// Xcode resolves build settings before any script it could run, so the Safari
// project cannot read manifest.config.ts. It reads this instead, as the base
// configuration on both targets. Committed so a fresh clone opens without a
// dangling reference, which would leave MARKETING_VERSION empty and produce an
// archive App Store Connect rejects.
//
// CURRENT_PROJECT_VERSION is the build number rather than the version, and only
// has to be unique per upload. CI overrides it on the xcodebuild command line,
// which beats an xcconfig.
function writeVersionXcconfig() {
  fs.writeFileSync(
    path.resolve(__dirname, 'version.xcconfig'),
    [
      '// Generated from manifest.config.ts by vite.config.ts. Do not edit.',
      '// Bump the version in manifest.config.ts and rebuild.',
      `MARKETING_VERSION = ${version}`,
      'CURRENT_PROJECT_VERSION = 1',
      '',
    ].join('\n')
  );
}

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
