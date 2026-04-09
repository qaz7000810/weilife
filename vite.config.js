import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/weilife/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          charts: ['recharts', 'html2canvas'],
          firebase: ['firebase/app', 'firebase/firestore'],
          content: ['marked', 'lucide-react'],
        },
      },
    },
  },
});
