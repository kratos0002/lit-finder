
#!/usr/bin/env node

// This script runs the build:dev command from the frontend directory
// It can be executed directly from the root without modifying package.json

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(process.cwd(), 'frontend');

if (!fs.existsSync(frontendDir)) {
  console.error('Frontend directory not found. Please run this script from the root directory.');
  process.exit(1);
}

console.log('Running build:dev script from frontend directory...');

try {
  // Change to the frontend directory and run the build:dev command
  process.chdir(frontendDir);
  execSync('npm run build:dev', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
