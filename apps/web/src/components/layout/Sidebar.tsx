import { useState, useEffect } from 'react';
import { Menu, X, History, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppRoute } from './AppLayout';

interface SidebarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  onNewChat?: () => void;
  onHistoryClick?: () => void;
}

export function Sidebar({ currentRoute, onRouteChange, onNewChat, onHistoryClick }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Store sidebar state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-expanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', String(newState));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: newState } }));
  };
  
  // Expose sidebar state via data attribute for CSS
  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-expanded', String(isExpanded));
  }, [isExpanded]);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-border transition-all duration-300 z-40 flex flex-col ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      aria-label="Navigation sidebar"
    >
      {/* Toggle Button */}
      <div className={`flex items-center p-4 border-b border-border ${isExpanded ? 'justify-between' : 'flex-col gap-2'}`}>
        {isExpanded ? (
          <>
            <button
              className="group flex items-center gap-2 rounded-md px-1 focus:outline-none transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Go to home (Chatbot)"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/50 group-hover:scale-110">
                <span className="text-white font-bold text-lg">i</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 group-hover:opacity-90">
                iStock
                <span className="sr-only"> - Precision Livestock Management</span>
              </h1>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              aria-label="Collapse sidebar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => onRouteChange('chatbot')}
              className="group h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center focus:outline-none transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary/50 active:scale-95"
              aria-label="Go to home (Chatbot)"
            >
              <span className="text-white font-bold text-lg">i</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              aria-label="Expand sidebar"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1" aria-label="Main navigation">
        {onNewChat && (
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 ${
              isExpanded ? 'px-3' : 'px-2 justify-center'
            }`}
            onClick={onNewChat}
            aria-label="Start new chat"
          >
            <Plus className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {isExpanded && <span>New Chat</span>}
          </Button>
        )}

        {onHistoryClick && (
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 ${
              isExpanded ? 'px-3' : 'px-2 justify-center'
            }`}
            onClick={onHistoryClick}
            aria-label="Chat history"
          >
            <History className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {isExpanded && <span>History</span>}
          </Button>
        )}

        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 ${
            isExpanded ? 'px-3' : 'px-2 justify-center'
          } ${currentRoute === 'settings' ? 'bg-primary/10 text-primary' : ''}`}
          onClick={() => onRouteChange('settings')}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {isExpanded && <span>Settings</span>}
        </Button>
      </nav>
    </aside>
  );
}

