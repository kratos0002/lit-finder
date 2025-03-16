import React from 'react';
import ReactDOM from 'react-dom/client';
// Import CSS before any components
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Log to debug CSS loading
console.log('CSS import completed in main.tsx');

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
); 
