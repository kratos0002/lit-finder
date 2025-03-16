import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only use componentTagger in development, dynamically import to avoid build issues
    mode === 'development' && (() => {
      try {
        // Try to import only in dev mode
        const { componentTagger } = require("lovable-tagger");
        return componentTagger();
      } catch (e) {
        console.warn('lovable-tagger not available, skipping');
        return null;
      }
    })(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Base URL for production - can be adjusted if needed
  base: '/',
  // Optimize dependencies to avoid issues with optional packages
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu']
  },
  // Make build more robust for CI environments like Vercel
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore circular dependency warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  }
}));
