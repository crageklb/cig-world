import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three': ['three'],
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          'phosphor': ['@phosphor-icons/react'],
        },
      },
    },
  },
})
