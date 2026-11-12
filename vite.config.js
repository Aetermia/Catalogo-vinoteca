import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo: permite desplegar el build en cualquier subcarpeta de un hosting compartido.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    // En desarrollo, si hay un servidor PHP local (php -S localhost:8000), se proxea /backend.
    proxy: {
      '/backend': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
