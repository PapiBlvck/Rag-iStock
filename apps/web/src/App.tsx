import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SignIn } from '@/components/auth/SignIn';
import { SignUp } from '@/components/auth/SignUp';
import { AppLayout } from '@/components/layout/AppLayout';
import { Chatbot } from '@/pages/Chatbot';
import { FeedOptimizer } from '@/pages/FeedOptimizer';

type AuthView = 'sign-in' | 'sign-up';
type AppRoute = 'chatbot' | 'feed-optimizer';

function App() {
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('sign-in');
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('chatbot');

  // Not authenticated - show auth screen
  if (!isAuthenticated) {
    if (authView === 'sign-in') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
          <SignIn
            onSwitchToSignUp={() => setAuthView('sign-up')}
            onSuccess={() => {}}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
        <SignUp
          onSwitchToSignIn={() => setAuthView('sign-in')}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  // Authenticated - show main app with routing
  const renderRoute = () => {
    switch (currentRoute) {
      case 'chatbot':
        return <Chatbot />;
      case 'feed-optimizer':
        return <FeedOptimizer />;
      default:
        return <Chatbot />;
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
