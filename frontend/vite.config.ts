import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/backend': resolve(__dirname, 'src/volatile0/infra'),
      '@/domain': resolve(__dirname, 'src/volatile0/domain'),
      '@/shared': resolve(__dirname, 'src/volatile0/generic'),
      '@/routes': resolve(__dirname, 'src/volatile1/routes'),
      '@/auth': resolve(__dirname, 'src/volatile1/auth'),
      '@/features': resolve(__dirname, 'src/volatile2'),
      '@/pages': resolve(__dirname, 'src/volatile2/pages'),
      '@/layout': resolve(__dirname, 'src/volatile2/layout'),
      '@/app': resolve(__dirname, 'src/volatile2/app'),
    },
  },
  base: './',
  server: {
    port: 5173,
  },
});
