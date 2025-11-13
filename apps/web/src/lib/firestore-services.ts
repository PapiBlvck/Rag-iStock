/**
 * Firestore service functions for specific collections
 */

import {
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument as deleteDocumentUtil,
  getDocumentsByUserId,
  getDocumentsOrderedByTime,
  timestampToDate,
  dateToTimestamp,
} from './firestore';

// Re-export deleteDocument for convenience (used in Settings page)
export { deleteDocumentUtil as deleteDocument };

// ============================================================================
// Chat History Service
// ============================================================================

export interface ChatHistoryItem {
  id: string;
  userId: string;
  title: string;
  query: string;
  response: string;
  sources?: Array<{ uri: string; title: string }>;
  confidence?: number;
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

const CHATS_COLLECTION = 'chats';

export async function getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
  const chats = await getDocumentsOrderedByTime<ChatHistoryItem>(CHATS_COLLECTION, userId);
  return chats.map((chat) => ({
    ...chat,
    timestamp: timestampToDate(chat.timestamp),
  }));
}

export async function getChat(userId: string, chatId: string): Promise<ChatHistoryItem | null> {
  const chat = await getDocument<ChatHistoryItem>(CHATS_COLLECTION, chatId);
  if (!chat || chat.userId !== userId) return null;
  return {
    ...chat,
    timestamp: timestampToDate(chat.timestamp),
  };
}

export async function saveChat(
  userId: string,
  chatData: Omit<ChatHistoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const chatId = chatData.id || `chat-${Date.now()}`;
  const { id, ...dataWithoutId } = chatData;
  await setDocument(CHATS_COLLECTION, chatId, {
    ...dataWithoutId,
    userId,
    id: chatId,
    timestamp: typeof dataWithoutId.timestamp === 'string' 
      ? dataWithoutId.timestamp 
      : dateToTimestamp(dataWithoutId.timestamp as Date),
    createdAt: dateToTimestamp(new Date()),
  });
  return chatId;
}

export async function updateChat(
  userId: string,
  chatId: string,
  updates: Partial<Pick<ChatHistoryItem, 'title' | 'query' | 'response' | 'sources' | 'confidence'>>
): Promise<void> {
  const chat = await getDocument<ChatHistoryItem>(CHATS_COLLECTION, chatId);
  if (!chat || chat.userId !== userId) {
    throw new Error('Chat not found or access denied');
  }
  await updateDocument(CHATS_COLLECTION, chatId, updates);
}

export async function deleteChat(userId: string, chatId: string): Promise<void> {
  const chat = await getDocument<ChatHistoryItem>(CHATS_COLLECTION, chatId);
  if (!chat || chat.userId !== userId) {
    throw new Error('Chat not found or access denied');
  }
  await deleteDocumentUtil(CHATS_COLLECTION, chatId);
}

// ============================================================================
// Message Feedback Service
// ============================================================================

export interface MessageFeedback {
  messageId: string;
  messageText: string;
  feedback: 'like' | 'dislike' | null;
  timestamp: Date | string;
}

const MESSAGE_FEEDBACK_COLLECTION = 'messageFeedback';

export async function saveMessageFeedback(
  userId: string,
  messageId: string,
  feedback: MessageFeedback
): Promise<void> {
  const feedbackId = `${userId}_${messageId}`;
  await setDocument(MESSAGE_FEEDBACK_COLLECTION, feedbackId, {
    ...feedback,
    userId,
    messageId,
    timestamp: typeof feedback.timestamp === 'string' 
      ? feedback.timestamp 
      : dateToTimestamp(feedback.timestamp as Date),
    updatedAt: dateToTimestamp(new Date()),
  });
}

export async function getMessageFeedback(
  userId: string,
  messageId: string
): Promise<MessageFeedback | null> {
  const feedbackId = `${userId}_${messageId}`;
  const feedback = await getDocument<MessageFeedback & { userId: string }>(
    MESSAGE_FEEDBACK_COLLECTION,
    feedbackId
  );
  if (!feedback || feedback.userId !== userId) {
    return null;
  }
  return {
    messageId: feedback.messageId,
    messageText: feedback.messageText,
    feedback: feedback.feedback,
    timestamp: feedback.timestamp,
  };
}

// ============================================================================
// Feed Optimizations Service
// ============================================================================

export interface FeedOptimization {
  id: string;
  userId: string;
  targetAnimal: string;
  cost: number;
  rations: Array<{ ingredientName: string; percentage: number }>;
  timestamp: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

const FEEDS_COLLECTION = 'feedOptimizations';

export async function getFeedOptimizations(userId: string): Promise<FeedOptimization[]> {
  const feeds = await getDocumentsOrderedByTime<FeedOptimization>(FEEDS_COLLECTION, userId);
  return feeds.map((feed) => ({
    ...feed,
    timestamp: timestampToDate(feed.timestamp),
  }));
}

export async function saveFeedOptimization(
  userId: string,
  feedData: Omit<FeedOptimization, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const feedId = feedData.id || `feed-${Date.now()}`;
  const { id, ...dataWithoutId } = feedData;
  await setDocument(FEEDS_COLLECTION, feedId, {
    ...dataWithoutId,
    userId,
    id: feedId,
    timestamp: typeof dataWithoutId.timestamp === 'string'
      ? dataWithoutId.timestamp
      : dateToTimestamp(dataWithoutId.timestamp as Date),
    createdAt: dateToTimestamp(new Date()),
  });
  return feedId;
}

// ============================================================================
// Ingredients Library Service
// ============================================================================

export interface Ingredient {
  id: string;
  userId: string;
  name: string;
  unitPrice: number;
  nutritionalValues: {
    protein: number;
    energy: number;
    fiber?: number;
    fat?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

const INGREDIENTS_COLLECTION = 'ingredients';

export async function getIngredients(userId: string): Promise<Ingredient[]> {
  return getDocumentsByUserId<Ingredient>(INGREDIENTS_COLLECTION, userId);
}

export async function getIngredient(userId: string, ingredientId: string): Promise<Ingredient | null> {
  const ingredient = await getDocument<Ingredient>(INGREDIENTS_COLLECTION, ingredientId);
  if (!ingredient || ingredient.userId !== userId) return null;
  return ingredient;
}

export async function saveIngredient(
  userId: string,
  ingredientData: Omit<Ingredient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Use name as ID for uniqueness per user
  const ingredientId = ingredientData.name.toLowerCase().replace(/\s+/g, '-');
  await setDocument(INGREDIENTS_COLLECTION, `${userId}-${ingredientId}`, {
    ...ingredientData,
    userId,
    id: `${userId}-${ingredientId}`,
    createdAt: dateToTimestamp(new Date()),
  });
  return `${userId}-${ingredientId}`;
}

export async function updateIngredient(
  userId: string,
  ingredientId: string,
  updates: Partial<Omit<Ingredient, 'id' | 'userId' | 'createdAt'>>,
): Promise<void> {
  const ingredient = await getDocument<Ingredient>(INGREDIENTS_COLLECTION, ingredientId);
  if (!ingredient || ingredient.userId !== userId) {
    throw new Error('Ingredient not found or access denied');
  }
  await updateDocument(INGREDIENTS_COLLECTION, ingredientId, updates);
}

export async function deleteIngredient(userId: string, ingredientId: string): Promise<void> {
  const ingredient = await getDocument<Ingredient>(INGREDIENTS_COLLECTION, ingredientId);
  if (!ingredient || ingredient.userId !== userId) {
    throw new Error('Ingredient not found or access denied');
  }
  await deleteDocumentUtil(INGREDIENTS_COLLECTION, ingredientId);
}

// ============================================================================
// User Profile Service
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  role: 'Farmer';
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const USERS_COLLECTION = 'users';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>(USERS_COLLECTION, userId);
}

export async function createUserProfile(
  userId: string,
  profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  await setDocument(USERS_COLLECTION, userId, {
    ...profileData,
    id: userId,
    createdAt: dateToTimestamp(new Date()),
  });
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDocument(USERS_COLLECTION, userId, updates);
}

