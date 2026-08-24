import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WaveformDisplay',
      fileName: 'waveform-display',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['d3'],
      output: {
        globals: { d3: 'd3' },
      },
    },
  },
})
