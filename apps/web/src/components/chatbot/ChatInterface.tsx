import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: any;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatInterface({ messages, isLoading }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col">
      <div className="w-full chat-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh] text-center px-4 py-16">
            <div className="space-y-3 max-w-2xl">
              <h3 className="text-4xl font-semibold text-foreground">How can I help you today?</h3>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="w-full py-6 px-4 md:px-8">
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="flex-shrink-0 flex flex-col items-start">
                <div className="h-8 w-8 rounded-full bg-[#10a37f] flex items-center justify-center shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 dark:bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

