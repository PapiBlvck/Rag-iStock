import { useState } from 'react';
import { Menu, X, LogOut, MessageSquare, Calculator, LayoutDashboard, FileText, BookOpen, Settings, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type AppRoute = 'dashboard' | 'chatbot' | 'feed-optimizer' | 'health-records' | 'ingredients' | 'settings';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'chatbot' as const,
      label: 'Chat',
      icon: MessageSquare,
    },
    {
      id: 'feed-optimizer' as const,
      label: 'Feed Optimizer',
      icon: Calculator,
    },
    {
      id: 'health-records' as const,
      label: 'Chat History',
      icon: FileText,
    },
    {
      id: 'ingredients' as const,
      label: 'Ingredients',
      icon: BookOpen,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleRouteChange = (route: AppRoute) => {
    onRouteChange(route);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <div className="p-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg">i</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            iStock
          </h1>
        </div>
        <p className="text-xs text-muted-foreground font-medium">Precision Livestock</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleRouteChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 relative group hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground hover:translate-x-1'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-all duration-300', isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3')} />
              <span className={cn('font-medium transition-all duration-300', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full transition-all duration-300 group-hover:h-8" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900">
        <div className="mb-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
          <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
        </div>
        <div className="mb-2">
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          className="w-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800 transition-colors"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Sheet */}
      <div className="md:hidden fixed top-0 left-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-white font-bold">i</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              iStock
            </h1>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Navigate between features</SheetDescription>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-0 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background/99 dark:to-primary/15 chat-scrollbar">
        <div className="h-full md:pt-0 pt-16">
          {children}
        </div>
      </main>

      {/* Floating Chat Button - Only show when not already on chat page */}
      {user && currentRoute !== 'chatbot' && (
        <Button
          onClick={() => handleRouteChange('chatbot')}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 z-40 flex items-center justify-center p-0"
          size="icon"
          aria-label="Open Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

