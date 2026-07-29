import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT is only used by the dev/preview server — not by `vite build`.
// Default to 5173 so the config doesn't throw in CI / Vercel build environments
// where PORT is not injected.
const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

// BASE_PATH controls the `base` option for asset URLs.
// Default to '/' for standard deployments (Vercel, CDN, etc.).
// Replit workflows inject the correct sub-path when needed.
const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
      // Stub heavy packages blocked by the Replit package firewall.
      // AWB/barcode/PDF features show a graceful error; all other features work normally.
      'jspdf': path.resolve(import.meta.dirname, 'src/stubs/jspdf-stub.ts'),
      'bwip-js': path.resolve(import.meta.dirname, 'src/stubs/bwip-stub.ts'),
      'html2canvas': path.resolve(import.meta.dirname, 'src/stubs/html2canvas-stub.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
