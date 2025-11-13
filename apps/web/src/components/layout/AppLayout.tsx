import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SkipLinks } from '@/components/a11y/SkipLinks';

export type AppRoute = 'chatbot' | 'settings';

interface AppLayoutProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  children: React.ReactNode;
}

export function AppLayout({
  currentRoute,
  onRouteChange,
  children,
}: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-transparent">
      <SkipLinks />
      
      {/* Main Content - No header for chatbot (sidebar handles it), but keep for settings */}
      {currentRoute === 'settings' && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 h-16">
            {/* Logo/Branding - Clickable to go to chatbot */}
            <button
              onClick={() => onRouteChange('chatbot')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-1"
              aria-label="Go to home (Chatbot)"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-white font-bold text-lg">i</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                iStock
                <span className="sr-only"> - Precision Livestock Management</span>
              </h1>
            </button>

            {/* Right side: Profile Picture (Settings), Theme Toggle, Logout */}
            <div className="flex items-center gap-2">
              {/* Profile Picture / Settings Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRouteChange('settings')}
                aria-label="Open Settings"
                className={currentRoute === 'settings' ? 'bg-primary/10 text-primary' : ''}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user?.displayName ? (
                      <span className="text-xs font-semibold text-primary">
                        {user.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    ) : (
                      <User className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                )}
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Log out of your account"
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        id="main-content"
        className={`flex-1 overflow-auto bg-transparent chat-scrollbar ${
          currentRoute === 'settings' ? 'pt-16' : ''
        }`}
        role="main"
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
