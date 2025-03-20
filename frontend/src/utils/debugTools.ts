
/**
 * Debug Utilities - v1.0.0
 * This file helps with debugging and ensuring cache busting on new deployments
 */

// The BUILD_TIMESTAMP is used to verify that the latest code is running
export const BUILD_TIMESTAMP = new Date().toISOString();

/**
 * Print a debug message to the console with clear formatting
 */
export const debugLog = (component: string, message: string, data?: any) => {
  console.log(`[DEBUG][${component}] ${message}`);
  if (data !== undefined) {
    console.log(data);
  }
};

/**
 * Identify which version of the code is running
 * This can help debug caching issues
 */
export const logVersion = (name: string, version: string) => {
  console.log(`%c ${name} v${version} `, 'background: #222; color: #bada55; font-size: 14px;');
  console.log(`Build timestamp: ${BUILD_TIMESTAMP}`);
};

/**
 * Debug environment variables in development mode
 */
export const debugEnvironment = () => {
  console.log('[DEBUG] Environment check:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- MODE: ${import.meta.env.MODE}`);
  console.log(`- DEV: ${import.meta.env.DEV}`);
  console.log(`- PROD: ${import.meta.env.PROD}`);
  
  // Check for API configuration
  console.log('[DEBUG] API Configuration:');
  console.log(`- API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL || 'not set'}`);
  console.log(`- API_KEY: ${import.meta.env.VITE_API_KEY ? 'set (hidden)' : 'not set'}`);
  
  // Output all env variables (safely)
  console.log('[DEBUG] All environment variables:');
  Object.keys(import.meta.env).forEach(key => {
    const value = import.meta.env[key];
    const isSecret = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN');
    console.log(`- ${key}: ${isSecret ? '******' : value}`);
  });
};

// Initialize debug info immediately
console.log('[DEBUG] Debug tools loaded');
console.log(`[DEBUG] Build timestamp: ${BUILD_TIMESTAMP}`);
if (import.meta.env.DEV) {
  console.log('[DEBUG] Running in development mode');
  debugEnvironment();
}
