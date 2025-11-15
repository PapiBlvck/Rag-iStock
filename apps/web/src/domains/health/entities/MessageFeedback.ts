/**
 * Message feedback entity
 */
export interface MessageFeedback {
  messageId: string;
  messageText: string;
  feedback: 'like' | 'dislike' | null;
  timestamp: Date;
  userId?: string;
}

/**
 * Create a new message feedback entity
 */
export function createMessageFeedback(
  data: Omit<MessageFeedback, 'timestamp'>
): MessageFeedback {
  return {
    ...data,
    timestamp: new Date(),
  };
}

