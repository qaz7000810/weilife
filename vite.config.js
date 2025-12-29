// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/climate_quiz/', // ✅ GitHub Pages 子目錄對應
  plugins: [react()],
});
