import type { IUserRepository } from '../interfaces/IUserRepository';
import type { UserProfile } from '../../entities/UserProfile';
import {
  getDocument,
  setDocument,
  updateDocument,
  timestampToDate,
  dateToTimestamp,
} from '@/lib/firestore';

const USERS_COLLECTION = 'users';

/**
 * Firestore implementation of user repository
 */
export class FirestoreUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const profile = await getDocument<UserProfile & { createdAt?: any; updatedAt?: any }>(
      USERS_COLLECTION,
      id
    );
    if (!profile) {
      return null;
    }
    return {
      ...profile,
      createdAt: profile.createdAt ? timestampToDate(profile.createdAt) : undefined,
      updatedAt: profile.updatedAt ? timestampToDate(profile.updatedAt) : undefined,
    };
  }

  async create(
    profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<UserProfile> {
    const userId = profileData.id || '';
    if (!userId) {
      throw new Error('User ID is required');
    }

    const firestoreData = {
      ...profileData,
      id: userId,
      createdAt: dateToTimestamp(new Date()),
    };

    await setDocument(USERS_COLLECTION, userId, firestoreData);

    return {
      ...profileData,
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    id: string,
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
  ): Promise<UserProfile> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('User profile not found');
    }

    await updateDocument(USERS_COLLECTION, id, {
      ...updates,
      updatedAt: dateToTimestamp(new Date()),
    });

    return {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
  }
}

