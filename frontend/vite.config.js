import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173, // ✅ Forces Vite to use port 5173
  },
  plugins: [react()],
})
