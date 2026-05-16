import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/front/', // Crucial for serving the app at hotel12.app.aletcloud.com/front
  build: {
    outDir: 'dist', // Standard Vite output directory
  }
})