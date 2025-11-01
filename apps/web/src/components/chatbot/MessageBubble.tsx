import { type RagResponse } from '@istock/shared';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

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
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%] md:max-w-[70%]">
          <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl px-5 py-3.5 shadow-lg shadow-primary/20">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-right px-2 font-medium">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%] md:max-w-[70%]">
        <div className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 shadow-md">
          <p className="text-sm text-foreground whitespace-pre-wrap mb-4 leading-relaxed">
            {message.text}
          </p>

          {message.response && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {/* Sources */}
              {message.response.sources && message.response.sources.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                    Sources Used
                  </h4>
                  <div className="space-y-2.5">
                    {message.response.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2.5 text-xs text-primary hover:text-primary/80 hover:underline group p-2 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="break-words font-medium">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Score */}
              {message.response.confidence !== undefined && (
                <div className="flex items-center gap-2 text-xs bg-primary/5 px-3 py-2 rounded-lg">
                  <span className="font-semibold text-muted-foreground">Confidence:</span>
                  <span className="font-bold text-primary">
                    {Math.round(message.response.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3 font-medium">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

