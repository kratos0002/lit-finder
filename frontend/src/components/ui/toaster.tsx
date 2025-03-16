import React from 'react';

interface ToastProps {
  message?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

// A simplified Toast component that will show up in the UI
export function Toast({ message, type = 'info', duration = 3000 }: ToastProps) {
  const [visible, setVisible] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  if (!visible) return null;
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded shadow-lg text-white ${colors[type]}`}>
      {message}
    </div>
  );
}

// This exports the Toaster component that's being referenced in main.tsx
export function Toaster() {
  return (
    <div id="toaster" />
  );
}

export default Toaster; 