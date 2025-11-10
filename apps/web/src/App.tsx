import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SignIn } from '@/components/auth/SignIn';
import { SignUp } from '@/components/auth/SignUp';
import { AppLayout, type AppRoute } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy load page components for code splitting
const Chatbot = lazy(() => import('@/pages/Chatbot').then(module => ({ default: module.Chatbot })));
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));

type AuthView = 'sign-in' | 'sign-up';

const STORAGE_KEY = 'istock_current_route';
const VALID_ROUTES: AppRoute[] = ['chatbot', 'settings'];

function App() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('sign-in');
  
  // Load route from localStorage on mount, default to 'chatbot'
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return 'chatbot';
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const route = stored as AppRoute;
        if (VALID_ROUTES.includes(route)) {
          return route;
        }
      }
    } catch (error) {
      console.error('Failed to load stored route:', error);
    }
    return 'chatbot';
  });

  // Save route to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated) {
      try {
        localStorage.setItem(STORAGE_KEY, currentRoute);
      } catch (error) {
        console.error('Failed to save route:', error);
      }
    }
  }, [currentRoute, isAuthenticated]);

  // Not authenticated - show auth screen
  if (!isAuthenticated) {
    if (authView === 'sign-in') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background p-4">
          <SignIn
            onSwitchToSignUp={() => setAuthView('sign-up')}
            onSuccess={() => {}}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background p-4">
        <SignUp
          onSwitchToSignIn={() => setAuthView('sign-in')}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  // Accessible loading fallback
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );

  // Authenticated - show main app with routing
  const renderRoute = () => {
    switch (currentRoute) {
      case 'chatbot':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Chatbot />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Chatbot />
          </Suspense>
        );
    }
  };

  return (
    <AppLayout
      currentRoute={currentRoute}
      onRouteChange={setCurrentRoute}
    >
      {renderRoute()}
    </AppLayout>
  );
}

export default App;
