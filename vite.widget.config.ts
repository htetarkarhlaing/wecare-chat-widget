import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/widget.tsx',
      name: 'ChatWidget',
      fileName: (format) => `chat-widget.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})