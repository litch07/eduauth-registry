import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          'vendor-ui': [
            '@headlessui/react',
            'lucide-react'
          ],
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'yup'
          ],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['html2pdf.js'],
        }
      }
    }
  }
});
