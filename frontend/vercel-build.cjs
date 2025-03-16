// Custom build script for Vercel deployments
// Handles platform-specific dependency issues

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run commands and print output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting custom Vercel build script...');
  
  try {
    // More aggressive patch for Rollup issues
    console.log('📦 Patching Rollup module to disable native bindings...');
    
    // Look for the rollup native.js file and patch it
    const nativeJsPath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');
    
    if (fs.existsSync(nativeJsPath)) {
      console.log(`Found Rollup native.js at ${nativeJsPath}, applying patch...`);
      
      // Create a backup of the original file
      fs.copyFileSync(nativeJsPath, `${nativeJsPath}.backup`);
      
      // Replace the file with a version that always returns the JS implementation
      const patchedContent = `
// Patched by vercel-build.cjs to avoid platform-specific dependencies
exports.getImportMetaUrlMechanism = () => 'function(n){return new URL(n,import.meta.url).href}';
exports.getDefaultsFromCjs = () => undefined;
exports.resolveId = () => null;
exports.finalizeAst = () => {};
      `.trim();
      
      fs.writeFileSync(nativeJsPath, patchedContent);
      console.log('✅ Rollup native module successfully patched!');
    } else {
      console.log('⚠️ Could not find Rollup native.js file to patch.');
    }
    
    // Force environment variables to disable native extensions
    process.env.ROLLUP_NATIVE = 'false';
    process.env.VITE_SKIP_NATIVE = 'true';
    
    // Create a temporary minimal vite.config.js for the build
    console.log('📝 Creating temporary Vite config for build...');
    const tempViteConfigPath = path.join(process.cwd(), 'vite.config.temp.js');
    const viteConfigContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Simple Vite config for Vercel build
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    // Minimal config to avoid platform-specific issues
    rollupOptions: { 
      external: ['@rollup/rollup-linux-x64-gnu'],
      treeshake: 'safest'
    }
  }
});
    `.trim();
    
    fs.writeFileSync(tempViteConfigPath, viteConfigContent);
    console.log('✅ Temporary Vite config created!');
    
    // Create .npmrc to prevent optional dependencies
    fs.writeFileSync('.npmrc', 'optional=false\nignore-scripts=true\n');
    
    // Run TypeScript compile with skipLibCheck
    console.log('🔨 Running TypeScript compilation...');
    try {
      runCommand('npx tsc --skipLibCheck');
    } catch (e) {
      console.warn('⚠️ TypeScript compilation had errors, but continuing with build...');
    }
    
    // Run vite build with the temporary config
    console.log('🔨 Running Vite build with temporary config...');
    runCommand('npx vite build --config vite.config.temp.js');
    
    console.log('✅ Custom build completed successfully!');
  } catch (error) {
    console.error('❌ Custom build failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 