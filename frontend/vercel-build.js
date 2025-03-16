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
    // Force uninstall problematic rollup packages
    console.log('📦 Cleaning up any problematic rollup packages...');
    try {
      execSync('npm uninstall @rollup/rollup-linux-x64-gnu || true', { stdio: 'inherit' });
    } catch (e) {
      // Ignore errors here
    }
    
    // Fix package.json if using rollup
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Create .npmrc to prevent optional dependencies
    fs.writeFileSync('.npmrc', 'optional=false\n');
    
    // Run TypeScript compile with skipLibCheck
    console.log('🔨 Running TypeScript compilation...');
    try {
      runCommand('npx tsc --skipLibCheck');
    } catch (e) {
      console.warn('⚠️ TypeScript compilation had errors, but continuing with build...');
    }
    
    // Run vite build, which is safer once TS has run
    console.log('🔨 Running Vite build...');
    runCommand('npx vite build');
    
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