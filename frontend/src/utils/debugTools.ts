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

// Log that this file was loaded (serves as a cache validation)
console.log('[DEBUG] Debug tools loaded');
console.log(`[DEBUG] Build timestamp: ${BUILD_TIMESTAMP}`); 