
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
}));
