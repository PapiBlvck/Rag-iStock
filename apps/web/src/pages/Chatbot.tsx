import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAskRag } from '@/lib/trpc';
import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, History, Edit2, Trash2, X, Check, Loader2, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { RagResponse } from '@istock/shared';
import { formatDistanceToNow } from '@/lib/date-utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: RagResponse;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  query: string;
  response: string;
  sources?: Array<{ uri: string; title: string }>;
  confidence?: number;
  timestamp: Date | string;
}

const querySchema = z.object({
  query: z.string().min(1, 'Please enter a question or symptom description'),
});

type QueryForm = z.infer<typeof querySchema>;

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string | null>(null);
  const askRag = useAskRag();

  // Load chat history on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('istock_chats') || '[]');
    const parsedHistory = stored.map((r: any) => ({
      ...r,
      timestamp: new Date(r.timestamp || r.date || Date.now()),
      title: r.title || r.query?.substring(0, 50) || 'Untitled Chat',
    }));
    setChatHistory(parsedHistory.sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, []);

  const form = useForm<QueryForm>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: '',
    },
  });

  const onSubmit = async (data: QueryForm) => {
    const chatId = currentChatId || `chat-${Date.now()}`;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: data.query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    // If this is a new chat, create a new chat session
    if (!currentChatId) {
      setCurrentChatId(chatId);
      setCurrentChatTitle(data.query.substring(0, 50));
    }

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

      // Save to localStorage for chat history
      const chatRecord: ChatHistoryItem = {
        id: chatId,
        title: currentChatTitle || data.query.substring(0, 50) || 'Untitled Chat',
        query: data.query,
        response: response.text,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date().toISOString(),
      };
      
      const existingChats = JSON.parse(localStorage.getItem('istock_chats') || '[]');
      const existingIndex = existingChats.findIndex((c: any) => c.id === chatId);
      
      if (existingIndex >= 0) {
        // Update existing chat
        existingChats[existingIndex] = chatRecord;
      } else {
        // Add new chat
        existingChats.push(chatRecord);
      }
      
      localStorage.setItem('istock_chats', JSON.stringify(existingChats));
      
      // Reload chat history
      const parsedHistory = existingChats.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp || r.date || Date.now()),
        title: r.title || r.query?.substring(0, 50) || 'Untitled Chat',
      }));
      setChatHistory(parsedHistory.sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
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

  const startRename = (item: ChatHistoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const saveRename = () => {
    if (!editingId) return;
    
    const updated = chatHistory.map((item) =>
      item.id === editingId ? { ...item, title: editTitle || 'Untitled Chat' } : item
    );
    setChatHistory(updated);
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('istock_chats') || '[]');
    const updatedStored = stored.map((r: any) =>
      r.id === editingId ? { ...r, title: editTitle || 'Untitled Chat' } : r
    );
    localStorage.setItem('istock_chats', JSON.stringify(updatedStored));
    
    // Update current chat title if editing current chat
    if (editingId === currentChatId) {
      setCurrentChatTitle(editTitle || 'Untitled Chat');
    }
    
    setEditingId(null);
    setEditTitle('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const deleteChat = (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    const updated = chatHistory.filter((item) => item.id !== id);
    setChatHistory(updated);
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('istock_chats') || '[]');
    const updatedStored = stored.filter((r: any) => r.id !== id);
    localStorage.setItem('istock_chats', JSON.stringify(updatedStored));
    
    // If deleting current chat, reset
    if (id === currentChatId) {
      setCurrentChatId(null);
      setCurrentChatTitle(null);
      setMessages([]);
    }
  };

  const loadChat = (item: ChatHistoryItem) => {
    setCurrentChatId(item.id);
    setCurrentChatTitle(item.title);
    setMessages([
      {
        id: `user-${item.id}`,
        type: 'user',
        text: item.query,
        timestamp: new Date(item.timestamp),
      },
      {
        id: `ai-${item.id}`,
        type: 'ai',
        text: item.response,
        timestamp: new Date(item.timestamp),
      },
    ]);
    setIsHistoryOpen(false);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setCurrentChatTitle(null);
    setMessages([]);
  };

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {currentChatTitle ? (
              <>
                {editingId === currentChatId ? (
                  <div className="flex items-center gap-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="text-3xl font-bold border-primary"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={saveRename} className="h-8 w-8">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelRename} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">
                      {currentChatTitle}
                    </h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startRename({ id: currentChatId!, title: currentChatTitle!, query: '', response: '', timestamp: new Date() })}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteChat(currentChatId!)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Ask questions about livestock health, symptoms, or treatments
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Chat
                </h1>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Ask questions about livestock health, symptoms, or treatments
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              className="h-9 w-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                  <SheetDescription>
                    View and manage your previous chats
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No chat history yet
                    </p>
                  ) : (
                    chatHistory.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer hover:bg-accent transition-colors ${
                          item.id === currentChatId ? 'border-primary' : ''
                        }`}
                        onClick={() => loadChat(item)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            {editingId === item.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename();
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                  className="text-sm"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveRename();
                                  }}
                                  className="h-7 w-7"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelRename();
                                  }}
                                  className="h-7 w-7"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-semibold line-clamp-2">
                                    {item.title}
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(item.timestamp))}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startRename(item)}
                                    className="h-7 w-7"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteChat(item.id)}
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto pb-32">
        <ChatInterface
          messages={messages}
          isLoading={askRag.isPending}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sticky bottom-0 py-3">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="relative">
            <Textarea
              {...form.register('query')}
              placeholder="Message iStock chatbot..."
              rows={1}
              className="resize-none border rounded-2xl pr-12 py-3 px-4 min-h-[52px] max-h-[200px] focus:outline-none focus:ring-0 bg-background text-base leading-normal"
              disabled={askRag.isPending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }
              }}
            />
            <Button
              type="submit"
              disabled={askRag.isPending || !form.watch('query')?.trim()}
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-[#10a37f] hover:bg-[#0d8c6e] text-white disabled:opacity-50 disabled:bg-muted"
            >
              {askRag.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {form.formState.errors.query && (
            <p className="text-sm text-destructive font-medium mt-2 px-4">
              {form.formState.errors.query.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

