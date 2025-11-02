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

  if (isUser) {
    return (
      <div className="group w-full py-6 px-4 md:px-8">
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
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group w-full py-6 px-4 md:px-8">
      <div className="flex gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0 flex flex-col items-start">
          <div className="h-8 w-8 rounded-full bg-[#10a37f] flex items-center justify-center shadow-md">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 dark:bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4 m-0">
                {message.text}
              </p>

              {message.response && (
                <div className="mt-4 space-y-4">
                  {/* Sources */}
                  {message.response.sources && message.response.sources.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                        Sources
                      </h4>
                      <div className="space-y-2">
                        {message.response.sources.map((source, index) => (
                          <a
                            key={index}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-xs text-primary hover:underline group"
                          >
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {message.response.confidence !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Confidence: </span>
                      <span>{Math.round(message.response.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

