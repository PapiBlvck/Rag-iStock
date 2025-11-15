/**
 * Chat history entity
 */
export interface ChatHistory {
  id: string;
  userId: string;
  title: string;
  query: string;
  response: string;
  sources?: Array<{ uri: string; title: string }>;
  confidence?: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new chat history entity
 */
export function createChatHistory(
  data: Omit<ChatHistory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): ChatHistory {
  const now = new Date();
  return {
    id: data.id || `chat-${Date.now()}`,
    userId: data.userId,
    title: data.title,
    query: data.query,
    response: data.response,
    sources: data.sources,
    confidence: data.confidence,
    timestamp: data.timestamp,
    createdAt: now,
    updatedAt: now,
  };
}

