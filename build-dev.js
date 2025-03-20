
#!/usr/bin/env node

// This script runs the build:dev command from the frontend directory
// It can be executed directly from the root without modifying package.json

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// First try the current directory
let frontendDir = path.join(process.cwd(), 'frontend');

// If frontend directory doesn't exist in the current path, try parent directory
if (!fs.existsSync(frontendDir)) {
  console.log('Frontend directory not found in current path, checking parent directory...');
  frontendDir = path.join(process.cwd(), '..', 'frontend');
}

// If still not found, try the directory itself (in case we're already in frontend)
if (!fs.existsSync(frontendDir)) {
  console.log('Checking if current directory is frontend...');
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    if (packageJson.name === 'alexandria-frontend') {
      console.log('Already in frontend directory');
      frontendDir = process.cwd();
    }
  }
}

if (!fs.existsSync(frontendDir)) {
  console.error('Frontend directory not found. Please run this script from the project root or frontend directory.');
  process.exit(1);
}

console.log(`Using frontend directory: ${frontendDir}`);
console.log('Running build:dev script...');

try {
  // Change to the frontend directory and run the build:dev command
  process.chdir(frontendDir);
  
  // Check if the build:dev script exists in package.json
  const packageJsonPath = path.join(frontendDir, 'package.json');
  const packageData = require(packageJsonPath);
  
  if (!packageData.scripts || !packageData.scripts['build:dev']) {
    console.error('Error: build:dev script not found in package.json');
    console.log('Available scripts:', Object.keys(packageData.scripts || {}).join(', '));
    process.exit(1);
  }
  
  console.log('Executing: npm run build:dev');
  execSync('npm run build:dev', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
