import { useState, useEffect, useRef } from 'react';
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
import { useLiveRegion } from '@/hooks/useLiveRegion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { handleArrowKeys, getFocusableElements } from '@/lib/accessibility';
import { useAuth } from '@/hooks/useAuth';
import {
  getChatHistory,
  saveChat,
  updateChat,
  deleteChat as deleteChatFromFirestore,
  type ChatHistoryItem as FirestoreChatHistoryItem,
} from '@/lib/firestore-services';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const askRag = useAskRag();
  const { announce } = useLiveRegion({ level: 'polite' });
  const historySheetRef = useRef<HTMLDivElement>(null);
  const historyItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  // Load chat history from Firestore
  useEffect(() => {
    if (!user?.id) return;

    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await getChatHistory(user.id);
        const parsedHistory = history.map((r) => ({
          ...r,
          timestamp: r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp),
          title: r.title || r.query?.substring(0, 50) || 'Untitled Chat',
        }));
        setChatHistory(parsedHistory.sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error: any) {
        // Don't log errors for permission issues - they're expected until rules are set up
        if (error?.code !== 'permission-denied') {
          console.error('Failed to load chat history:', error);
          toast({
            title: 'Error',
            description: 'Failed to load chat history',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id, toast]);

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

      // Announce new message to screen readers
      announce(`Assistant responded with ${response.text.substring(0, 100)}...`);

      // Save to Firestore
      if (user?.id) {
        try {
          const chatRecord: Omit<FirestoreChatHistoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
            title: currentChatTitle || data.query.substring(0, 50) || 'Untitled Chat',
            query: data.query,
            response: response.text,
            sources: response.sources,
            confidence: response.confidence,
            timestamp: new Date(),
          };
          
          await saveChat(user.id, chatRecord);
          
          // Reload chat history
          const history = await getChatHistory(user.id);
          const parsedHistory = history.map((r) => ({
            ...r,
            timestamp: r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp),
            title: r.title || r.query?.substring(0, 50) || 'Untitled Chat',
          }));
          setChatHistory(parsedHistory.sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        } catch (error: any) {
          console.error('Failed to save chat:', error);
          // Don't show toast for permission errors (rules not set up)
          if (error?.code !== 'permission-denied') {
            toast({
              title: 'Error',
              description: 'Failed to save chat history',
              variant: 'destructive',
            });
          }
        }
      }
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
      
      // Announce error to screen readers
      announce(
        `Error: ${error instanceof Error ? error.message : 'Failed to get response. Please try again.'}`,
        'assertive'
      );
    }
  };

  const startRename = (item: ChatHistoryItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const saveRename = async () => {
    if (!editingId || !user?.id) return;
    
    try {
      await updateChat(user.id, editingId, { title: editTitle || 'Untitled Chat' });
      
      const updated = chatHistory.map((item) =>
        item.id === editingId ? { ...item, title: editTitle || 'Untitled Chat' } : item
      );
      setChatHistory(updated);
      
      // Update current chat title if editing current chat
      if (editingId === currentChatId) {
        setCurrentChatTitle(editTitle || 'Untitled Chat');
      }
      
      setEditingId(null);
      setEditTitle('');
      
      toast({
        title: 'Success',
        description: 'Chat title updated',
      });
    } catch (error: any) {
      console.error('Failed to update chat title:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to update chat title',
          variant: 'destructive',
        });
      }
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const deleteChat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?') || !user?.id) return;
    
    try {
      await deleteChatFromFirestore(user.id, id);
      
      const updated = chatHistory.filter((item) => item.id !== id);
      setChatHistory(updated);
      
      // If deleting current chat, reset
      if (id === currentChatId) {
        setCurrentChatId(null);
        setCurrentChatTitle(null);
        setMessages([]);
      }
      
      toast({
        title: 'Success',
        description: 'Chat deleted',
      });
    } catch (error: any) {
      console.error('Failed to delete chat:', error);
      // Only show toast for non-permission errors
      if (error?.code !== 'permission-denied') {
        toast({
          title: 'Error',
          description: 'Failed to delete chat',
          variant: 'destructive',
        });
      }
    }
  };

  const loadChat = (item: ChatHistoryItem) => {
    setCurrentChatId(item.id);
    setCurrentChatTitle(item.title);
    const timestamp = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
    setMessages([
      {
        id: `user-${item.id}`,
        type: 'user',
        text: item.query,
        timestamp,
      },
      {
        id: `ai-${item.id}`,
        type: 'ai',
        text: item.response,
        timestamp,
      },
    ]);
    setIsHistoryOpen(false);
    announce(`Loaded chat: ${item.title}`);
  };

  // Handle keyboard navigation in chat history
  const handleHistoryKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (!historySheetRef.current) return;

    const historyItems = getFocusableElements(historySheetRef.current);
    
    handleArrowKeys(event.nativeEvent, {
      items: historyItems,
      currentIndex: index,
      orientation: 'vertical',
      onNavigate: (newIndex) => {
        if (historyItemsRef.current[newIndex]) {
          historyItemsRef.current[newIndex]?.focus();
        }
      },
    });
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
                    <label htmlFor="edit-chat-title" className="sr-only">
                      Edit chat title
                    </label>
                    <Input
                      id="edit-chat-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="text-3xl font-bold border-primary"
                      autoFocus
                      aria-label="Chat title"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={saveRename}
                      className="h-8 w-8"
                      aria-label="Save chat title"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelRename}
                      className="h-8 w-8"
                      aria-label="Cancel editing chat title"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
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
                      aria-label={`Edit chat title: ${currentChatTitle}`}
                    >
                      <Edit2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteChat(currentChatId!)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete chat: ${currentChatTitle}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2 font-medium" id="chat-description">
                  Ask questions about livestock health, symptoms, or treatments
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Chat
                </h1>
                <p className="text-sm text-muted-foreground mt-2 font-medium" id="chat-description">
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
              aria-label="Start a new chat"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Open chat history"
                  aria-expanded={isHistoryOpen}
                  aria-controls="chat-history-sheet"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 sm:w-96"
                id="chat-history-sheet"
                aria-label="Chat history"
              >
                <FocusTrap enabled={isHistoryOpen}>
                  <SheetHeader>
                    <SheetTitle>Chat History</SheetTitle>
                    <SheetDescription>
                      View and manage your previous chats
                    </SheetDescription>
                  </SheetHeader>
                  <div
                    ref={historySheetRef}
                    className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto"
                    role="list"
                    aria-label="Chat history list"
                  >
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8" role="status">
                        No chat history yet
                      </p>
                    ) : (
                      chatHistory.map((item, index) => (
                        <Card
                          key={item.id}
                          ref={(el) => {
                            historyItemsRef.current[index] = el;
                          }}
                          role="listitem"
                          tabIndex={0}
                          className={`cursor-pointer hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                            item.id === currentChatId ? 'border-primary' : ''
                          }`}
                          onClick={() => loadChat(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              loadChat(item);
                            }
                            handleHistoryKeyDown(e, index);
                          }}
                          aria-label={`Chat: ${item.title}`}
                          aria-current={item.id === currentChatId ? 'true' : undefined}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRename(item);
                                    }}
                                    className="h-7 w-7"
                                    aria-label={`Rename chat: ${item.title}`}
                                  >
                                    <Edit2 className="h-3 w-3" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteChat(item.id);
                                    }}
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    aria-label={`Delete chat: ${item.title}`}
                                  >
                                    <Trash2 className="h-3 w-3" aria-hidden="true" />
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
                </FocusTrap>
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
        <form onSubmit={form.handleSubmit(onSubmit)} aria-label="Chat input form">
          <div className="relative">
            <label htmlFor="chat-input" className="sr-only">
              Enter your question about livestock health, symptoms, or treatments
            </label>
            <Textarea
              id="chat-input"
              {...form.register('query')}
              placeholder="Message iStock chatbot..."
              rows={1}
              className="resize-none border rounded-2xl pr-12 py-3 px-4 min-h-[52px] max-h-[200px] focus:outline-none focus:ring-0 bg-background text-base leading-normal"
              disabled={askRag.isPending}
              aria-describedby="chat-description chat-error"
              aria-label="Chat message input"
              aria-busy={askRag.isPending}
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
              aria-label={askRag.isPending ? 'Sending message...' : 'Send message'}
            >
              {askRag.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          {form.formState.errors.query && (
            <p id="chat-error" className="text-sm text-destructive font-medium mt-2 px-4" role="alert">
              {form.formState.errors.query.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

