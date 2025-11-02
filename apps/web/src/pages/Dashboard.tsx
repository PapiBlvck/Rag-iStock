import { useEffect, useState } from 'react';
import { MessageSquare, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent } from '@/components/ui/card';
import type { AppRoute } from '@/components/layout/AppLayout';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalChats: 0,
    totalOptimizations: 0,
    avgFeedCost: 0,
    savedCost: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // Load stats from localStorage
    const chats = JSON.parse(localStorage.getItem('istock_chats') || '[]');
    const feeds = JSON.parse(localStorage.getItem('istock_feeds') || '[]');

    setStats({
      totalChats: chats.length,
      totalOptimizations: feeds.length,
      avgFeedCost: feeds.length > 0
        ? feeds.reduce((sum: number, f: any) => sum + (f.cost || 0), 0) / feeds.length
        : 0,
      savedCost: feeds.length * 15, // Mock savings calculation
    });

    // Create activity feed
    const allActivities = [
      ...chats.slice(-5).map((chat: any) => ({
        id: `chat-${chat.id || Date.now()}`,
        type: 'chat' as const,
        title: chat.query || 'Health query',
        timestamp: new Date(chat.timestamp || Date.now()),
        description: 'Chat conversation',
      })),
      ...feeds.slice(-5).map((feed: any) => ({
        id: `feed-${feed.id || Date.now()}`,
        type: 'feed' as const,
        title: `Feed optimization for ${feed.targetAnimal || 'Animal'}`,
        timestamp: new Date(feed.timestamp || Date.now()),
        description: `Cost: $${feed.cost?.toFixed(2) || '0.00'}`,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    setActivities(allActivities);
  }, []);

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Overview of your livestock management
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
        {/* Hero Welcome Section */}
        {(stats.totalChats === 0 && stats.totalOptimizations === 0) && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 border border-primary/20 dark:border-primary/30 p-8 md:p-12">
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 dark:bg-primary/30 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Welcome to iStock!
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
                Get started by asking a health question or optimizing your feed costs. 
                Your activity and insights will appear here.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <button
                  onClick={() => onNavigate('chatbot')}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Ask Health Question
                </button>
                <button
                  onClick={() => onNavigate('feed-optimizer')}
                  className="px-6 py-3 rounded-xl bg-background border-2 border-primary/20 hover:border-primary/40 text-foreground font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Optimize Feed Costs
                </button>
              </div>
            </div>
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Chats"
            value={stats.totalChats}
            icon={MessageSquare}
            description="Health queries asked"
            trend={{ value: 12, isPositive: true }}
            gradient="from-blue-500/10 to-blue-500/5"
          />
          <StatsCard
            title="Optimizations"
            value={stats.totalOptimizations}
            icon={Calculator}
            description="Feed calculations"
            trend={{ value: 8, isPositive: true }}
            gradient="from-green-500/10 to-green-500/5"
          />
          <StatsCard
            title="Avg Feed Cost"
            value={`$${stats.avgFeedCost.toFixed(2)}`}
            icon={DollarSign}
            description="Per unit cost"
            trend={{ value: 5, isPositive: false }}
            gradient="from-purple-500/10 to-purple-500/5"
          />
          <StatsCard
            title="Cost Saved"
            value={`$${stats.savedCost.toFixed(2)}`}
            icon={TrendingUp}
            description="Estimated savings"
            trend={{ value: 15, isPositive: true }}
            gradient="from-orange-500/10 to-orange-500/5"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <QuickActions onActionClick={onNavigate} />
          </div>
          
          {/* Activity Feed - Takes 1 column */}
          <div className="lg:col-span-1">
            <ActivityFeed
              activities={activities}
              onActivityClick={(activity) => {
                if (activity.type === 'chat') {
                  onNavigate('chatbot');
                } else {
                  onNavigate('feed-optimizer');
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

