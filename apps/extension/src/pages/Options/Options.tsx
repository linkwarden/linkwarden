import React from 'react';
import ReactDOM from 'react-dom/client';
import '../Popup/index.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../@/components/ThemeProvider.tsx';

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('options')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
