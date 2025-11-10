/**
 * Firebase initialization and configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, firebaseEmulatorConfig } from './firebase-config';
import { env } from './env';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth: Auth = getAuth(app);

// Connect to emulator if configured
if (env.useEmulator && firebaseEmulatorConfig) {
  try {
    connectAuthEmulator(
      auth,
      `http://${firebaseEmulatorConfig.auth.host}`,
      firebaseEmulatorConfig.auth.options
    );
    console.log('Connected to Firebase Auth Emulator');
  } catch (error) {
    // Emulator already connected
    console.warn('Auth emulator connection issue:', error);
  }
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Connect to emulator if configured
if (env.useEmulator && firebaseEmulatorConfig) {
  try {
    const [host, port] = firebaseEmulatorConfig.firestore.host.split(':');
    connectFirestoreEmulator(
      db,
      host,
      parseInt(port, 10)
    );
    console.log('Connected to Firebase Firestore Emulator');
  } catch (error) {
    // Emulator already connected
    console.warn('Firestore emulator connection issue:', error);
  }
}

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app);

// Connect to emulator if configured
if (env.useEmulator && firebaseEmulatorConfig?.storage) {
  try {
    const [host, port] = firebaseEmulatorConfig.storage.host.split(':');
    connectStorageEmulator(storage, host, parseInt(port, 10));
    console.log('Connected to Firebase Storage Emulator');
  } catch (error) {
    // Emulator already connected
    console.warn('Storage emulator connection issue:', error);
  }
}

