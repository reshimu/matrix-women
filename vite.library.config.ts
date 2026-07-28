import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        react: 'src/react.ts',
      },
      formats: ['es'],
      cssFileName: 'react',
    },
    outDir: 'dist/lib',
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: '[name].[ext]',
      },
    },
  },
})