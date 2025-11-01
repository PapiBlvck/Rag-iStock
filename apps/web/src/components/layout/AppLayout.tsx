import { useState } from 'react';
import { Menu, X, LogOut, MessageSquare, Calculator } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

interface AppLayoutProps {
  currentRoute: 'chatbot' | 'feed-optimizer';
  onRouteChange: (route: 'chatbot' | 'feed-optimizer') => void;
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
      id: 'chatbot' as const,
      label: 'Health Chatbot',
      icon: MessageSquare,
    },
    {
      id: 'feed-optimizer' as const,
      label: 'Feed Optimizer',
      icon: Calculator,
    },
  ];

  const handleRouteChange = (route: 'chatbot' | 'feed-optimizer') => {
    onRouteChange(route);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50">
      <div className="p-6 border-b border-gray-200/80 bg-white">
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
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 relative group',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span className={cn('font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200/80 bg-white">
        <div className="mb-3 p-3 rounded-lg bg-gray-50/80">
          <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
        </div>
        <Button
          variant="outline"
          className="w-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
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
      <div className="md:hidden fixed top-0 left-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm">
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
      <main className="flex-1 overflow-auto md:ml-0">
        <div className="h-full md:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  );
}

