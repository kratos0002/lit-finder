/**
 * Mock toast component for development
 */

export const toast = (props: { title?: string; description?: string; variant?: string }) => {
  console.log('Toast:', props);
}; 