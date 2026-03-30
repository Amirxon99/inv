import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Tarmoqdagi boshqa qurilmalar ulanishi uchun
    port: 5713,      // Frontend porti
    // vite.config.js
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // localhost o'rniga IP yozib ko'ring
        changeOrigin: true,
        secure: false,
      },
    },
  },
})