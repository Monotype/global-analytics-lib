import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'esbuild',
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, '/src/main.js'),
      name: 'GlobalAnalytics',
      fileName: 'global-analytics-lib',
      formats: ['es'],
    },
    rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html')
          }
    },
    plugins: [],
  },
})