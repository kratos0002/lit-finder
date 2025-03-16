import React from 'react';
import ReactDOM from 'react-dom/client';
// Import CSS before any components to ensure it's loaded first
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Log CSS loading
console.log('CSS loaded from main.tsx');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
); 
