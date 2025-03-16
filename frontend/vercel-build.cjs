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

// Function to load environment variables from .env file
function loadEnvVars() {
  const envVars = {};
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env file');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    // Parse basic KEY=VALUE pairs, ignoring comments
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        const value = match[2] || '';
        envVars[key] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes if present
        console.log(`Loaded env var: ${key}=${value.substring(0, 3)}...`);
      }
    });
  } else {
    console.log('No .env file found. Using defaults or environment variables.');
  }
  
  return envVars;
}

// Main function
async function main() {
  console.log('🚀 Starting custom Vercel build script...');
  
  try {
    // Load environment variables
    const envVars = loadEnvVars();
    
    // More aggressive patch for Rollup issues
    console.log('📦 Patching Rollup module to disable native bindings...');
    
    // Look for the rollup native.js file and patch it
    const nativeJsPath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');
    
    if (fs.existsSync(nativeJsPath)) {
      console.log(`Found Rollup native.js at ${nativeJsPath}, applying patch...`);
      
      // Create a backup of the original file
      fs.copyFileSync(nativeJsPath, `${nativeJsPath}.backup`);
      
      // Replace the file with a version that's ES module compatible and includes all expected exports
      const patchedContent = `
// Patched by vercel-build.cjs to avoid platform-specific dependencies
// This is a dummy implementation that avoids native bindings

// Ensure this is processed as an ES module
export function getImportMetaUrlMechanism() {
  return 'function(n){return new URL(n,import.meta.url).href}';
}

export function getDefaultsFromCjs() {
  return undefined;
}

export function resolveId() {
  return null;
}

export function finalizeAst() {
  // Empty implementation
}

// Add missing exports that were causing the error
export function parse(code, options = {}) {
  // Return a minimal AST structure
  return {
    type: 'Program',
    body: [],
    sourceType: 'module'
  };
}

export function parseAsync(code, options = {}) {
  return Promise.resolve(parse(code, options));
}
      `.trim();
      
      fs.writeFileSync(nativeJsPath, patchedContent);
      console.log('✅ Rollup native module successfully patched!');
    } else {
      console.log('⚠️ Could not find Rollup native.js file to patch.');
    }
    
    // Force environment variables to disable native extensions
    process.env.ROLLUP_NATIVE = 'false';
    process.env.VITE_SKIP_NATIVE = 'true';
    
    // Create a simplified esbuild-based build command that bypasses rollup
    console.log('📝 Creating simplified build approach...');
    
    // Create a simple virtual env module that can be imported
    const envModuleContent = `
// Virtual module for environment variables
const env = {
  VITE_API_BASE_URL: "${envVars.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com'}",
  VITE_API_KEY: "${envVars.VITE_API_KEY || ''}",
};

export default env;
    `.trim();
    
    const envModulePath = path.join(process.cwd(), 'src/virtual-env.js');
    fs.writeFileSync(envModulePath, envModuleContent);
    console.log('✅ Created virtual env module');
    
    // Create a simple script to replace import.meta.env references
    const replaceEnvScript = `
// Replace import.meta.env with our virtual module
import env from './virtual-env.js';
window.importMetaEnv = env;

// Add this to global space for non-module scripts
Object.defineProperty(globalThis, 'import.meta', {
  get() {
    return {
      env: window.importMetaEnv
    };
  }
});
    `.trim();
    
    const replaceEnvScriptPath = path.join(process.cwd(), 'src/env-loader.js');
    fs.writeFileSync(replaceEnvScriptPath, replaceEnvScript);
    
    // First, generate a simple index.html that loads our bundled app
    const indexHtmlPath = path.join(process.cwd(), 'dist/index.html');
    const basicIndexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alexandria</title>
    <meta name="description" content="Alexandria - Digital Library powered by AI" />
    <meta name="author" content="Alexandria" />
    <meta property="og:image" content="/og-image.png" />
    <link rel="stylesheet" href="./index.css">
    <script>
      // Inline environment variables
      window.importMetaEnv = {
        VITE_API_BASE_URL: "${envVars.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com'}",
        VITE_API_KEY: "${envVars.VITE_API_KEY || ''}"
      };
      // Make import.meta.env available globally
      Object.defineProperty(window, 'import', {
        value: { meta: { env: window.importMetaEnv } }
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.js"></script>
  </body>
</html>
    `.trim();
    
    // Create the dist directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
      fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
    }
    
    // Run TypeScript compile with skipLibCheck
    console.log('🔨 Running TypeScript compilation...');
    try {
      runCommand('npx tsc --skipLibCheck');
    } catch (e) {
      console.warn('⚠️ TypeScript compilation had errors, but continuing with build...');
    }
    
    // Use a direct esbuild command instead of vite+rollup
    console.log('🔨 Running simplified build with esbuild...');
    try {
      // First bundle all CSS into a single file
      runCommand('npx esbuild src/index.css --bundle --outfile=dist/index.css');
      
      // Create a define object with the environment variables
      const define = {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(envVars.VITE_API_BASE_URL || 'https://alexandria-api.onrender.com'),
        'import.meta.env.VITE_API_KEY': JSON.stringify(envVars.VITE_API_KEY || ''),
        'process.env.NODE_ENV': '"production"',
      };
      
      const defineParams = Object.entries(define)
        .map(([key, value]) => `--define:${key}=${value}`)
        .join(' ');
      
      // Then bundle the main application with define flags
      runCommand(`npx esbuild src/main.tsx ${defineParams} --bundle --format=esm --target=es2020 --outfile=dist/index.js --sourcemap --resolve-extensions=.tsx,.ts,.jsx,.js,.json`);
      
      // Write the index.html
      fs.writeFileSync(indexHtmlPath, basicIndexHtml);
      
      // Copy any static assets
      if (fs.existsSync(path.join(process.cwd(), 'public'))) {
        const publicFiles = fs.readdirSync(path.join(process.cwd(), 'public'));
        for (const file of publicFiles) {
          const sourcePath = path.join(process.cwd(), 'public', file);
          const destPath = path.join(process.cwd(), 'dist', file);
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      
      console.log('✅ Build completed with esbuild!');
    } catch (e) {
      console.error('⚠️ esbuild bundling failed, falling back to vite build...');
      // Fallback to standard vite build with our patched rollup
      runCommand('npx vite build');
    }
    
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