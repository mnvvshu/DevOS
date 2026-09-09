import { defineConfig } from 'electron-vite';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: resolve(__dirname, 'src/preload.ts'),
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  renderer: {},
});
