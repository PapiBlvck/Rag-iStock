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
    <div className="flex flex-col" role="region" aria-label="Chat conversation">
      <div
        className="w-full chat-scrollbar"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh] text-center px-4 py-16">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-4xl font-semibold text-foreground drop-shadow-lg">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground drop-shadow-md">
                Start a conversation by typing a question about livestock health, symptoms, or treatments
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="w-full py-6 px-4 md:px-8" role="status" aria-live="polite">
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="flex-shrink-0 flex flex-col items-start">
                <div className="h-8 w-8 rounded-full bg-[#10a37f] flex items-center justify-center shadow-md" aria-hidden="true">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2 text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium" aria-busy="true">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </div>
  );
}

