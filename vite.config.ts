import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    return {
      base: process.env.DEMO_BASE_PATH ?? '/waveform-display/',
      build: {
        outDir: 'dist-demo',
        emptyOutDir: true,
      },
    }
  }

  return {
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
  }
})
