import { MessageSquare, Calculator, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'chat' | 'feed';
  title: string;
  timestamp: Date;
  description?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
}

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Your recent actions</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs mt-2">Start using the app to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Your recent actions</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              className="w-full text-left flex items-start gap-4 p-4 rounded-xl hover:bg-accent/50 border border-transparent hover:border-primary/20 transition-all duration-300 group"
            >
              <div className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300",
                activity.type === 'chat'
                  ? "bg-blue-500/10 dark:bg-blue-500/20"
                  : "bg-green-500/10 dark:bg-green-500/20"
              )}>
                {activity.type === 'chat' ? (
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {activity.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

