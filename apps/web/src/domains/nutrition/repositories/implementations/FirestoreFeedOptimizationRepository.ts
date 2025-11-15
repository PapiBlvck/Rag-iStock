import type { IFeedOptimizationRepository } from '../interfaces/IFeedOptimizationRepository';
import type { FeedOptimization } from '../../entities/FeedOptimization';
import {
  setDocument,
  getDocumentsOrderedByTime,
  timestampToDate,
  dateToTimestamp,
} from '@/lib/firestore';

const FEEDS_COLLECTION = 'feedOptimizations';

/**
 * Firestore implementation of feed optimization repository
 */
export class FirestoreFeedOptimizationRepository implements IFeedOptimizationRepository {
  async findById(id: string, userId: string): Promise<FeedOptimization | null> {
    // This would require a getDocument call, but for now we'll use findAll and filter
    const feeds = await this.findAll(userId);
    return feeds.find((feed) => feed.id === id) || null;
  }

  async findAll(userId: string): Promise<FeedOptimization[]> {
    const feeds = await getDocumentsOrderedByTime<FeedOptimization & { timestamp: any }>(
      FEEDS_COLLECTION,
      userId
    );
    return feeds.map((feed) => ({
      ...feed,
      timestamp: timestampToDate(feed.timestamp),
      createdAt: feed.createdAt ? timestampToDate(feed.createdAt) : undefined,
      updatedAt: feed.updatedAt ? timestampToDate(feed.updatedAt) : undefined,
    }));
  }

  async create(
    feedData: Omit<FeedOptimization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<FeedOptimization> {
    const feedId = feedData.id || `feed-${Date.now()}`;
    
    const firestoreData = {
      ...feedData,
      id: feedId,
      timestamp: dateToTimestamp(feedData.timestamp),
      createdAt: dateToTimestamp(new Date()),
    };

    await setDocument(FEEDS_COLLECTION, feedId, firestoreData);

    return {
      ...feedData,
      id: feedId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

