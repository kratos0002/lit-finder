
// This script will create a vite.config.ts file in the root directory
// that redirects to the frontend/vite.config.ts

const fs = require('fs');
const path = require('path');

// Check if we're in the root directory
if (!fs.existsSync(path.join(process.cwd(), 'frontend'))) {
  console.error('Please run this script from the root directory of your project');
  process.exit(1);
}

// Create a simple vite.config.ts in the root that imports the frontend config
const configContent = `import { defineConfig } from "vite";
import frontendConfig from "./frontend/vite.config";

// Re-export the frontend config to make it work from the root directory
export default defineConfig(frontendConfig);
`;

// Write the file
fs.writeFileSync('vite.config.ts', configContent);

console.log('Successfully created vite.config.ts in the root directory');
console.log('This will allow you to run build commands from the root directory');
console.log('\nYou still need to manually add the "build:dev" script to your root package.json:');
console.log('  "build:dev": "vite build --mode development"');
