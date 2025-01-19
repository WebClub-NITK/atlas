import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
  },
  optimizeDeps: {
    esbuild: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
})

