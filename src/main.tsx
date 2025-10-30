import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import process from 'process';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EnvironmentsProvider } from './contexts/EnvironmentsContext';

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (!globalThis.process) {
  globalThis.process = process;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <EnvironmentsProvider>
          <App />
        </EnvironmentsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);

