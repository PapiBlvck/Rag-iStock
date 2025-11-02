import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  gradient = 'from-primary/10 to-primary/5',
}: StatsCardProps) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden relative" style={{ isolation: 'isolate' }}>
      {/* Gradient overlay on hover */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradient, 'opacity-0 group-hover:opacity-100 transition-opacity duration-300')} style={{ zIndex: 1 }} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative" style={{ zIndex: 2 }}>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br', gradient, 'flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md')}>
          <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
      </CardHeader>
      <CardContent className="relative" style={{ zIndex: 2 }}>
        <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 mb-3">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className={cn('text-xs font-semibold px-2 py-1 rounded-md', 
              trend.isPositive 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/20'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

