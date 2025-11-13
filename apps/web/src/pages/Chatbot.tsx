import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAskRag } from '@/lib/trpc';
import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, History, Edit2, Trash2, X, Check, Loader2, Plus, Mic, MicOff, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTitle,
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
import { Sidebar } from '@/components/layout/Sidebar';
import type { AppRoute } from '@/components/layout/AppLayout';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: RagResponse;
  feedback?: 'like' | 'dislike' | null;
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

interface ChatbotProps {
  currentRoute?: AppRoute;
  onRouteChange?: (route: AppRoute) => void;
}

export function Chatbot({ currentRoute = 'chatbot', onRouteChange }: ChatbotProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string | null>(null);
  const [, setIsLoadingHistory] = useState(false);
  const askRag = useAskRag();
  const { announce } = useLiveRegion({ level: 'polite' });
  const historySheetRef = useRef<HTMLDivElement>(null);
  const historyItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  const form = useForm<QueryForm>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: '',
    },
  });

  // Voice input
  const {
    isListening,
    transcript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceInput({
    onTranscript: (text) => {
      form.setValue('query', text, { shouldValidate: true });
    },
    onError: (error) => {
      toast({
        title: 'Voice Input Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    continuous: false,
    interimResults: true,
  });

  // Load chat history from Firestore and restore saved chat
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
        const sortedHistory = parsedHistory.sort((a: ChatHistoryItem, b: ChatHistoryItem) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatHistory(sortedHistory);

        // Restore saved chat state from localStorage
        try {
          const savedChatId = localStorage.getItem(`istock_current_chat_${user.id}`);
          const savedChatTitle = localStorage.getItem(`istock_current_chat_title_${user.id}`);
          const savedMessages = localStorage.getItem(`istock_current_messages_${user.id}`);

          if (savedChatId && savedChatTitle) {
            // Prioritize localStorage messages (full conversation) over Firestore (single Q&A)
            if (savedMessages) {
              try {
                const parsedMessages = JSON.parse(savedMessages);
                // Convert timestamp strings back to Date objects
                const restoredMessages = parsedMessages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                }));
                
                // Only restore if we have valid messages
                if (restoredMessages.length > 0) {
                  setMessages(restoredMessages);
                  setCurrentChatId(savedChatId);
                  setCurrentChatTitle(savedChatTitle);
                }
              } catch (e) {
                console.error('Failed to parse saved messages:', e);
                // Fallback to Firestore if localStorage parse fails
                const savedChat = sortedHistory.find((chat) => chat.id === savedChatId);
                if (savedChat) {
                  setCurrentChatId(savedChat.id);
                  setCurrentChatTitle(savedChat.title);
                  const timestamp = savedChat.timestamp instanceof Date ? savedChat.timestamp : new Date(savedChat.timestamp);
                  setMessages([
                    {
                      id: `user-${savedChat.id}`,
                      type: 'user',
                      text: savedChat.query,
                      timestamp,
                    },
                    {
                      id: `ai-${savedChat.id}`,
                      type: 'ai',
                      text: savedChat.response,
                      timestamp,
                      response: {
                        text: savedChat.response,
                        sources: savedChat.sources || [],
                        confidence: savedChat.confidence,
                      },
                    },
                  ]);
                }
              }
            } else {
              // No localStorage messages, try Firestore
              const savedChat = sortedHistory.find((chat) => chat.id === savedChatId);
              if (savedChat) {
                setCurrentChatId(savedChat.id);
                setCurrentChatTitle(savedChat.title);
                const timestamp = savedChat.timestamp instanceof Date ? savedChat.timestamp : new Date(savedChat.timestamp);
                setMessages([
                  {
                    id: `user-${savedChat.id}`,
                    type: 'user',
                    text: savedChat.query,
                    timestamp,
                  },
                  {
                    id: `ai-${savedChat.id}`,
                    type: 'ai',
                    text: savedChat.response,
                    timestamp,
                    response: {
                      text: savedChat.response,
                      sources: savedChat.sources || [],
                      confidence: savedChat.confidence,
                    },
                  },
                ]);
              }
            }
          }
        } catch (error) {
          console.error('Failed to restore saved chat:', error);
        }
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
        
        // Clear saved state
        if (user?.id) {
          try {
            localStorage.removeItem(`istock_current_chat_${user.id}`);
            localStorage.removeItem(`istock_current_chat_title_${user.id}`);
            localStorage.removeItem(`istock_current_messages_${user.id}`);
          } catch (error) {
            console.error('Failed to clear saved chat state:', error);
          }
        }
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
    const loadedMessages = [
      {
        id: `user-${item.id}`,
        type: 'user' as const,
        text: item.query,
        timestamp,
      },
      {
        id: `ai-${item.id}`,
        type: 'ai' as const,
        text: item.response,
        timestamp,
        response: {
          text: item.response,
          sources: item.sources || [],
          confidence: item.confidence,
        },
      },
    ];
    setMessages(loadedMessages);
    
    // Save to localStorage
    if (user?.id) {
      try {
        localStorage.setItem(`istock_current_chat_${user.id}`, item.id);
        localStorage.setItem(`istock_current_chat_title_${user.id}`, item.title);
        const messagesToSave = loadedMessages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }));
        localStorage.setItem(`istock_current_messages_${user.id}`, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error('Failed to save loaded chat state:', error);
      }
    }
    
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

  // Persist current chat state to localStorage
  useEffect(() => {
    if (!user?.id) return;
    
    try {
      if (currentChatId && currentChatTitle) {
        localStorage.setItem(`istock_current_chat_${user.id}`, currentChatId);
        localStorage.setItem(`istock_current_chat_title_${user.id}`, currentChatTitle);
      } else {
        // Clear saved state when starting new chat
        localStorage.removeItem(`istock_current_chat_${user.id}`);
        localStorage.removeItem(`istock_current_chat_title_${user.id}`);
        localStorage.removeItem(`istock_current_messages_${user.id}`);
      }
    } catch (error) {
      console.error('Failed to save current chat state:', error);
    }
  }, [currentChatId, currentChatTitle, user?.id]);

  // Persist messages to localStorage
  useEffect(() => {
    if (!user?.id || !currentChatId || messages.length === 0) return;
    
    try {
      // Only save if we have messages and a current chat
      const messagesToSave = messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(), // Convert Date to string for JSON
      }));
      localStorage.setItem(`istock_current_messages_${user.id}`, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }, [messages, currentChatId, user?.id]);

  const startNewChat = () => {
    setCurrentChatId(null);
    setCurrentChatTitle(null);
    setMessages([]);
    form.reset();
    clearTranscript();
    
    // Clear saved state
    if (user?.id) {
      try {
        localStorage.removeItem(`istock_current_chat_${user.id}`);
        localStorage.removeItem(`istock_current_chat_title_${user.id}`);
        localStorage.removeItem(`istock_current_messages_${user.id}`);
      } catch (error) {
        console.error('Failed to clear saved chat state:', error);
      }
    }
  };

  // Handle redo (regenerate response)
  const handleRedo = async (messageId: string) => {
    // Find the user message that corresponds to this AI message
    const aiMessageIndex = messages.findIndex((msg) => msg.id === messageId && msg.type === 'ai');
    if (aiMessageIndex === -1) return;
    
    // Find the previous user message
    const userMessageIndex = aiMessageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].type !== 'user') return;
    
    const userMessage = messages[userMessageIndex];
    
    // Remove the AI message and regenerate
    setMessages((prev) => prev.slice(0, aiMessageIndex));
    
    // Submit the query again
    try {
      const response = await askRag.mutateAsync({
        query: userMessage.text,
      });

      const newAiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: response.text,
        timestamp: new Date(),
        response: response,
      };

      setMessages((prev) => [...prev, newAiMessage]);
      
      // Update Firestore if this is a saved chat
      if (user?.id && currentChatId) {
        try {
          await updateChat(user.id, currentChatId, {
            response: response.text,
            sources: response.sources,
            confidence: response.confidence,
          });
        } catch (error) {
          console.error('Failed to update chat:', error);
        }
      }
      
      announce(`Response regenerated`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate response',
        variant: 'destructive',
      });
    }
  };

  // Handle feedback change
  const handleFeedbackChange = (messageId: string, feedback: 'like' | 'dislike' | null) => {
    // Update the message's feedback state in the messages array
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
  };

  // Handle voice input toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening();
    }
  };

  // Update form when transcript changes
  useEffect(() => {
    if (transcript) {
      form.setValue('query', transcript, { shouldValidate: true });
    }
  }, [transcript, form]);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-expanded');
    if (stored !== null) {
      setSidebarExpanded(stored === 'true');
    }
    
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarExpanded(e.detail.expanded);
    };
    
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const handleRouteChange = (route: AppRoute) => {
    if (onRouteChange) {
      onRouteChange(route);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        onNewChat={startNewChat}
        onHistoryClick={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300" 
        style={{ marginLeft: sidebarExpanded ? '16rem' : '4rem' }}
      >
        {/* Top Bar with Chat Title */}
        <div className="sticky top-0 z-40 border-b border-border bg-white dark:bg-gray-950">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
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
                          className="text-xl font-medium border-primary"
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
                        <h1 className="text-xl font-medium text-foreground truncate">
                          {currentChatTitle}
                        </h1>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startRename({ id: currentChatId!, title: currentChatTitle!, query: '', response: '', timestamp: new Date() })}
                          className="h-7 w-7"
                          aria-label={`Edit chat title: ${currentChatTitle}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteChat(currentChatId!)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete chat: ${currentChatTitle}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <h1 className="text-xl font-medium text-foreground">
                    Chat
                  </h1>
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
              </div>
            </div>
          </div>
        </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto chat-scrollbar">
                <div className="py-4">
                  <ChatInterface
                    messages={messages}
                    isLoading={askRag.isPending}
                    onRedo={handleRedo}
                    onFeedbackChange={handleFeedbackChange}
                  />
                </div>
              </div>

        {/* Input Area */}
        <div className="sticky bottom-0 border-t border-border bg-white dark:bg-gray-950 py-4">
          <div className="max-w-4xl mx-auto px-4">
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
                  className="resize-none border rounded-2xl pr-24 py-3 px-4 min-h-[52px] max-h-[200px] focus:outline-none focus:ring-0 bg-background text-base leading-normal"
                  disabled={askRag.isPending || isListening}
                  aria-describedby="chat-description chat-error"
                  aria-label="Chat message input"
                  aria-busy={askRag.isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                    if (e.key === 'Escape' && isListening) {
                      e.preventDefault();
                      stopListening();
                      clearTranscript();
                      form.setValue('query', '');
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {isListening ? (
                    <>
                      {/* Cancel Recording Button - Only shown when listening */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          stopListening();
                          clearTranscript();
                          form.setValue('query', '');
                        }}
                        disabled={askRag.isPending}
                        className="h-8 px-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all duration-200"
                        aria-label="Cancel recording"
                      >
                        <Square className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                        <span className="text-xs font-medium">Cancel</span>
                      </Button>
                      {/* Stop Recording Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleVoiceToggle}
                        disabled={askRag.isPending}
                        className="h-8 w-8 rounded-lg bg-red-500 text-white hover:bg-red-600 animate-pulse transition-all duration-200"
                        aria-label="Stop recording"
                      >
                        <Square className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Voice Input Button - Only shown when not listening */}
                      {isVoiceSupported && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleVoiceToggle}
                          disabled={askRag.isPending}
                          className="h-8 w-8 rounded-lg hover:bg-muted transition-all duration-200"
                          aria-label="Start voice input"
                        >
                          <Mic className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      {/* Send Button */}
                      <Button
                        type="submit"
                        disabled={askRag.isPending || !form.watch('query')?.trim()}
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-[#10a37f] hover:bg-[#0d8c6e] text-white disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed"
                        aria-label={askRag.isPending ? 'Sending message...' : 'Send message'}
                      >
                        {askRag.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Send className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {form.formState.errors.query && (
                <p id="chat-error" className="text-sm text-destructive font-medium mt-2 px-4" role="alert">
                  {form.formState.errors.query.message}
                </p>
              )}
              {isListening && (
                <div className="mt-2 px-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1" role="status" aria-live="polite">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
                    <span>Listening... Speak now</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click <span className="font-medium">Cancel</span> to discard, click <span className="font-medium">Stop</span> to finish, or press <span className="font-medium">Esc</span> to cancel
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Chat History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent
          side="left"
          className="w-80 sm:w-96 p-0"
          id="chat-history-sheet"
          aria-label="Chat history"
        >
          <FocusTrap enabled={isHistoryOpen}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b">
                <SheetTitle className="text-lg font-medium">Chat History</SheetTitle>
              </div>

              {/* Chat List */}
              <div
                ref={historySheetRef}
                className="flex-1 overflow-y-auto px-2 py-2"
                role="list"
                aria-label="Chat history list"
              >
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <p className="text-sm text-muted-foreground text-center" role="status">
                      No chat history yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatHistory.map((item, index) => (
                      <div
                        key={item.id}
                        ref={(el) => {
                          historyItemsRef.current[index] = el;
                        }}
                        role="listitem"
                        tabIndex={0}
                        className={`group relative rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          item.id === currentChatId ? 'bg-accent' : ''
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
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className="text-sm h-8"
                              autoFocus
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
                              <Check className="h-3.5 w-3.5" />
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
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-sm font-medium text-foreground line-clamp-2">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(item.timestamp))}
                              </p>
                            </div>
                            <div 
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChat(item.id);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete chat: ${item.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FocusTrap>
        </SheetContent>
      </Sheet>
    </div>
  );
}

