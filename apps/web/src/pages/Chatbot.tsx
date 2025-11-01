import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAskRag } from '@/lib/trpc';
import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RagResponse } from '@istock/shared';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: RagResponse;
}

const querySchema = z.object({
  query: z.string().min(1, 'Please enter a question or symptom description'),
});

type QueryForm = z.infer<typeof querySchema>;

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const askRag = useAskRag();

  const form = useForm<QueryForm>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: '',
    },
  });

  const onSubmit = async (data: QueryForm) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: data.query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    try {
      const response = await askRag.mutateAsync({
        query: data.query,
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: response.text,
        timestamp: new Date(),
        response: response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        text:
          error instanceof Error
            ? `Error: ${error.message}`
            : 'Failed to get response. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50/50 to-white">
      <div className="p-6 border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Health Chatbot
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Ask questions about livestock health, symptoms, or treatments
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          isLoading={askRag.isPending}
        />
      </div>

      <div className="p-4 md:p-6 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    {...form.register('query')}
                    placeholder="Describe symptoms, ask a question, or request diagnostic advice..."
                    rows={3}
                    className="resize-none border-2 focus:border-primary transition-colors"
                    disabled={askRag.isPending}
                  />
                  {form.formState.errors.query && (
                    <p className="text-sm text-destructive font-medium">
                      {form.formState.errors.query.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={askRag.isPending}
                  className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow font-semibold"
                >
                  {askRag.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

