import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2, MessageSquare } from 'lucide-react';

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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-4 max-w-lg">
              <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Welcome to Health Chatbot</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Ask me about livestock health symptoms, diagnoses, or treatment
                  recommendations. I'll provide evidence-based answers with
                  source citations.
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-md">
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

