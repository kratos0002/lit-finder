interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    console.log('Toast:', options);
    // In a real implementation, this would use a toast library
    // but for now we'll just log to console
  };

  return { toast };
} 