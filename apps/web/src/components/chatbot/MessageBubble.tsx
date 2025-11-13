import { type RagResponse } from '@istock/shared';
import { ExternalLink, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  response?: RagResponse;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const messageId = `message-${message.id}`;
  const authorId = `${messageId}-author`;

  if (isUser) {
    return (
      <article
        className="group w-full py-6 px-4 md:px-8"
        aria-labelledby={authorId}
        id={messageId}
      >
        <div className="flex gap-4 max-w-3xl mx-auto justify-end">
          <div className="flex-1 min-w-0 flex justify-end">
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-2xl px-4 py-3 shadow-sm max-w-[85%] md:max-w-[75%]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed m-0">
                  {message.text}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end">
            <div
              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md"
              id={authorId}
              aria-label="User"
              role="img"
            >
              <User className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group w-full py-6 px-4 md:px-8"
      aria-labelledby={authorId}
      id={messageId}
    >
      <div className="flex gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0 flex flex-col items-start">
          <div
            className="h-8 w-8 rounded-full bg-[#10a37f] flex items-center justify-center shadow-md"
            id={authorId}
            aria-label="Assistant"
            role="img"
          >
            <Bot className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 dark:bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div 
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: message.text }}
              />

              {message.response && (
                <div className="mt-4 space-y-4">
                  {/* Sources */}
                  {message.response.sources && message.response.sources.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3" id={`${messageId}-sources-heading`}>
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
                    <div className="text-xs text-muted-foreground" role="status" aria-label="Response confidence score">
                      <span className="font-medium">Confidence: </span>
                      <span aria-label={`${Math.round(message.response.confidence * 100)} percent`}>
                        {Math.round(message.response.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

