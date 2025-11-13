import { useState } from 'react';
import { type RagResponse } from '@istock/shared';
import { ExternalLink, User, Bot, ThumbsUp, ThumbsDown, Copy, RefreshCw, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { saveMessageFeedback, type MessageFeedback } from '@/lib/firestore-services';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: RagResponse;
  feedback?: 'like' | 'dislike' | null;
}

interface MessageBubbleProps {
  message: Message;
  onRedo?: (messageId: string) => void;
  onFeedbackChange?: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
}

export function MessageBubble({ message, onRedo, onFeedbackChange }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const messageId = `message-${message.id}`;
  const authorId = `${messageId}-author`;
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Message copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      });
    }
  };

  const handleFeedback = async (newFeedback: 'like' | 'dislike') => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to provide feedback',
        variant: 'destructive',
      });
      return;
    }

    // Toggle if clicking the same feedback
    const finalFeedback = feedback === newFeedback ? null : newFeedback;
    
    setIsSubmittingFeedback(true);
    try {
      await saveMessageFeedback(user.id, message.id, {
        messageId: message.id,
        messageText: message.text,
        feedback: finalFeedback,
        timestamp: new Date(),
      });
      
      setFeedback(finalFeedback);
      if (onFeedbackChange) {
        onFeedbackChange(message.id, finalFeedback);
      }
      
      toast({
        title: finalFeedback ? 'Feedback saved' : 'Feedback removed',
        description: finalFeedback 
          ? `You ${finalFeedback === 'like' ? 'liked' : 'disliked'} this response`
          : 'Your feedback has been removed',
      });
    } catch (error) {
      console.error('Failed to save feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      onRedo(message.id);
    }
  };

  if (isUser) {
    return (
      <article
        className="group w-full py-4 px-4"
        aria-labelledby={authorId}
        id={messageId}
      >
        <div className="flex gap-4 max-w-4xl mx-auto">
          <div className="flex-1 min-w-0 flex justify-end">
            <div className="bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[80%] border border-gray-200/60 dark:border-gray-700/40 shadow-sm relative group">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed m-0 text-sm">
                {message.text}
              </p>
              {/* Copy button for user messages */}
              <div className="absolute -bottom-8 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={handleCopy}
                  aria-label="Copy message"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group w-full py-4 px-4"
      aria-labelledby={authorId}
      id={messageId}
    >
      <div className="flex gap-4 max-w-4xl mx-auto">
        <div className="flex-shrink-0 flex flex-col items-start">
          <div
            className="h-8 w-8 rounded-full bg-[#10a37f] flex items-center justify-center"
            id={authorId}
            aria-label="Assistant"
            role="img"
          >
            <Bot className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-green-200/60 dark:border-green-800/40 shadow-sm relative group">
            <div className="text-foreground leading-relaxed">
              {/* Check if content is HTML (contains HTML tags) or markdown */}
              {message.text.trim().startsWith('<') && message.text.includes('</') ? (
                // Render as HTML if it's already HTML
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              ) : (
                // Render as markdown if it's markdown
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:my-2 prose-strong:font-semibold prose-em:italic prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                  <ReactMarkdown
                    components={{
                      // Style headings
                      h1: ({ children }) => <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                      // Style paragraphs
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      // Style lists
                      ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      // Style emphasis and strong
                      em: ({ children }) => <em className="italic">{children}</em>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      // Style code
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              )}

              {message.response && (
                <div className="mt-4 space-y-3 pt-4 border-t border-green-200/50 dark:border-green-800/30">
                  {/* Sources */}
                  {message.response.sources && message.response.sources.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-foreground mb-3" id={`${messageId}-sources-heading`}>
                        Sources
                      </h4>
                      <nav aria-labelledby={`${messageId}-sources-heading`} role="navigation">
                        <ul className="space-y-2" role="list">
                          {message.response.sources.map((source, index) => (
                            <li key={index} role="listitem">
                              <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 text-xs text-primary hover:underline group"
                                aria-label={`Source: ${source.title}. Opens in new tab`}
                              >
                                <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <span className="break-words">{source.title}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {message.response.confidence !== undefined && (
                    <div className="text-xs text-foreground/80 font-medium" role="status" aria-label="Response confidence score">
                      <span>Confidence: </span>
                      <span aria-label={`${Math.round(message.response.confidence * 100)} percent`}>
                        {Math.round(message.response.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Action buttons for AI messages */}
            <div className="absolute -bottom-8 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 ${
                  feedback === 'like' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''
                }`}
                onClick={() => handleFeedback('like')}
                disabled={isSubmittingFeedback}
                aria-label="Like this response"
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${feedback === 'like' ? 'fill-current' : ''}`} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 ${
                  feedback === 'dislike' ? 'bg-green-100 dark:bg-green-900/30 text-red-600 dark:text-red-400' : ''
                }`}
                onClick={() => handleFeedback('dislike')}
                disabled={isSubmittingFeedback}
                aria-label="Dislike this response"
              >
                <ThumbsDown className={`h-3.5 w-3.5 ${feedback === 'dislike' ? 'fill-current' : ''}`} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
                onClick={handleCopy}
                aria-label="Copy response"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
              {onRedo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
                  onClick={handleRedo}
                  aria-label="Regenerate response"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

