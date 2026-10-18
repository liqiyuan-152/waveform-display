import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: process.env.DEMO_BASE_PATH ?? '/waveform-display/',
  build: {
    outDir: fileURLToPath(new URL('../dist-demo', import.meta.url)),
    emptyOutDir: true,
  },
})
