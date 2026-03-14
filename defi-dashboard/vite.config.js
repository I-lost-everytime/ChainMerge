import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  plugins: [react()],
  server: { port: 5200 },
  resolve: {
    alias: { 'chainmerge-sdk': path.resolve(__dirname, './sdk/index.js') },
  },
})
