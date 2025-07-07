import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        chunkFileNames: 'main.js',
        assetFileNames: 'main.[ext]'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 