/**
 * Firestore service utilities
 * Provides typed helper functions for common Firestore operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | Date | string | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return timestamp.toDate();
}

/**
 * Convert Date to Firestore Timestamp format (store as string for simplicity)
 */
export function dateToTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Generic function to get a single document
 */
export async function getDocument<T extends DocumentData>(
  collectionPath: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error: any) {
    // Provide helpful error message for permission errors
    if (error?.code === 'permission-denied') {
      // Only log once per session to avoid spam
      const errorKey = `permission-denied-${collectionPath}`;
      if (!sessionStorage.getItem(errorKey)) {
        console.warn(
          `⚠️ Firestore permission denied: ${collectionPath}. ` +
          `Please set up security rules in Firebase Console. ` +
          `See SETUP_FIRESTORE_RULES.md for quick instructions.`
        );
        sessionStorage.setItem(errorKey, 'true');
      }
    } else {
      console.error(`Error getting document ${collectionPath}/${documentId}:`, error);
    }
    throw error;
  }
}

/**
 * Generic function to get all documents from a collection
 */
export async function getCollection<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionPath), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error: any) {
    // Provide helpful error message for permission errors
    if (error?.code === 'permission-denied') {
      // Only log once per session to avoid spam
      const errorKey = `permission-denied-${collectionPath}`;
      if (!sessionStorage.getItem(errorKey)) {
        console.warn(
          `⚠️ Firestore permission denied: ${collectionPath}. ` +
          `Please set up security rules in Firebase Console. ` +
          `See SETUP_FIRESTORE_RULES.md for quick instructions.`
        );
        sessionStorage.setItem(errorKey, 'true');
      }
    } else {
      console.error(`Error getting collection ${collectionPath}:`, error);
    }
    throw error;
  }
}

/**
 * Generic function to create or update a document
 */
export async function setDocument(
  collectionPath: string,
  documentId: string,
  data: DocumentData
): Promise<void> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await setDoc(docRef, {
      ...data,
      updatedAt: dateToTimestamp(new Date()),
    }, { merge: true });
  } catch (error: any) {
    // Provide helpful error message for permission errors
    if (error?.code === 'permission-denied') {
      console.error(
        `Permission denied writing to ${collectionPath}/${documentId}. ` +
        `Please set up Firestore security rules. ` +
        `See FIREBASE_SETUP_INSTRUCTIONS.md for details.`
      );
    } else {
      console.error(`Error setting document ${collectionPath}/${documentId}:`, error);
    }
    throw error;
  }
}

/**
 * Generic function to update a document
 */
export async function updateDocument(
  collectionPath: string,
  documentId: string,
  data: Partial<DocumentData>
): Promise<void> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: dateToTimestamp(new Date()),
    });
  } catch (error: any) {
    // Provide helpful error message for permission errors
    if (error?.code === 'permission-denied') {
      console.error(
        `Permission denied updating ${collectionPath}/${documentId}. ` +
        `Please set up Firestore security rules. ` +
        `See FIREBASE_SETUP_INSTRUCTIONS.md for details.`
      );
    } else {
      console.error(`Error updating document ${collectionPath}/${documentId}:`, error);
    }
    throw error;
  }
}

/**
 * Generic function to delete a document
 */
export async function deleteDocument(
  collectionPath: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await deleteDoc(docRef);
  } catch (error: any) {
    // Provide helpful error message for permission errors
    if (error?.code === 'permission-denied') {
      console.error(
        `Permission denied deleting ${collectionPath}/${documentId}. ` +
        `Please set up Firestore security rules. ` +
        `See FIREBASE_SETUP_INSTRUCTIONS.md for details.`
      );
    } else {
      console.error(`Error deleting document ${collectionPath}/${documentId}:`, error);
    }
    throw error;
  }
}

/**
 * Get documents by user ID
 */
export async function getDocumentsByUserId<T extends DocumentData>(
  collectionPath: string,
  userId: string,
  additionalConstraints: QueryConstraint[] = []
): Promise<T[]> {
  const constraints = [
    where('userId', '==', userId),
    ...additionalConstraints,
  ];
  return getCollection<T>(collectionPath, constraints);
}

/**
 * Get documents ordered by timestamp (newest first)
 */
export async function getDocumentsOrderedByTime<T extends DocumentData>(
  collectionPath: string,
  userId?: string,
  limitCount?: number
): Promise<T[]> {
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];
  
  if (userId) {
    constraints.unshift(where('userId', '==', userId));
  }
  
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  return getCollection<T>(collectionPath, constraints);
}

