import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { validateEnv } from '@/lib/env';
// Initialize Firebase (import side effects)
import '@/lib/firebase';
import App from './App.tsx';
import './index.css';

// Suppress React DevTools warning (intercept both console.warn and console.error)
// This is a backup - the main suppression is in index.html
if (typeof window !== 'undefined') {
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  
  console.warn = (...args: any[]) => {
    const message = String(args[0] || '');
    // Suppress React DevTools warning messages
    if (
      message.includes('Download the React DevTools') ||
      message.includes('reactjs.org/link/react-devtools') ||
      message.includes('react-devtools') ||
      message.includes('React DevTools')
    ) {
      return; // Suppress React DevTools message
    }
    originalWarn(...args);
  };
  
  console.error = (...args: any[]) => {
    const message = String(args[0] || '');
    // Suppress React DevTools warning messages (sometimes they come as errors)
    if (
      message.includes('Download the React DevTools') ||
      message.includes('reactjs.org/link/react-devtools') ||
      message.includes('react-devtools') ||
      message.includes('React DevTools')
    ) {
      return; // Suppress React DevTools message
    }
    originalError(...args);
  };
}

// Validate environment variables on app start
if (import.meta.env.DEV) {
  validateEnv();
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <App />
              <Toaster />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

