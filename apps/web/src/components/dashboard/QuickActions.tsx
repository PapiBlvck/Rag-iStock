import { MessageSquare, Calculator, FileText, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AppRoute } from '@/components/layout/AppLayout';

interface QuickAction {
  id: AppRoute;
  label: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
}

interface QuickActionsProps {
  onActionClick: (route: AppRoute) => void;
}

const quickActions: QuickAction[] = [
  {
    id: 'chatbot',
    label: 'Health Chatbot',
    icon: MessageSquare,
    description: 'Ask health questions',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'feed-optimizer',
    label: 'Feed Optimizer',
    icon: Calculator,
    description: 'Optimize feed costs',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'health-records',
    label: 'Health Records',
    icon: FileText,
    description: 'View past diagnoses',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'ingredients',
    label: 'Ingredients',
    icon: BookOpen,
    description: 'Manage ingredients',
    gradient: 'from-orange-500 to-orange-600',
  },
];

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Access frequently used features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onActionClick(action.id)}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-background to-background/50 border border-border/50 p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] text-left"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-all duration-300">
                        {action.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors duration-300">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${action.gradient} w-0 group-hover:w-full transition-all duration-500`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

