import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /\.[jt]sx?$/,
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    include: ['tests/**/*.test.jsx', 'tests/**/*.test.js'],
    globals: true,
  },
});
