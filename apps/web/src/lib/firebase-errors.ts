/**
 * Firebase error code to user-friendly message mapping
 */

interface FirebaseError {
  code: string;
  message: string;
}

/**
 * Maps Firebase error codes to user-friendly messages
 */
export function getFirebaseErrorMessage(error: unknown): string {
  // Handle Firebase Auth errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    const errorCode = firebaseError.code;

    // Firebase Auth error codes
    switch (errorCode) {
      // Authentication errors
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support for assistance.';
      
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few minutes before trying again.';
      
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign out and sign in again.';
      
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again.';
      
      case 'auth/invalid-verification-id':
        return 'Verification session expired. Please try again.';
      
      // Firestore errors
      case 'permission-denied':
        return 'Please set up Firestore security rules in Firebase Console. See SETUP_FIRESTORE_RULES.md for instructions.';
      
      case 'unavailable':
        return 'Service is temporarily unavailable. Please try again later.';
      
      case 'deadline-exceeded':
        return 'Request timed out. Please try again.';
      
      case 'not-found':
        return 'The requested resource was not found.';
      
      case 'already-exists':
        return 'This resource already exists.';
      
      case 'failed-precondition':
        return 'Operation cannot be completed in current state.';
      
      case 'aborted':
        return 'Operation was cancelled.';
      
      case 'out-of-range':
        return 'Operation exceeds valid range.';
      
      case 'unimplemented':
        return 'This feature is not yet implemented.';
      
      case 'internal':
        return 'An internal error occurred. Please try again later.';
      
      case 'data-loss':
        return 'Data corruption detected. Please contact support.';
      
      case 'unauthenticated':
        return 'Please sign in to continue.';
      
      default:
        // For unknown Firebase error codes, extract the code name if available
        if (errorCode.startsWith('auth/')) {
          const codeName = errorCode.replace('auth/', '').replace(/-/g, ' ');
          return `Authentication error: ${codeName}. Please try again or contact support.`;
        }
        if (errorCode.startsWith('permission-denied')) {
          return 'You do not have permission to perform this action.';
        }
        // Return the original message if it's more descriptive
        return firebaseError.message || 'An error occurred. Please try again.';
    }
  }

  // Handle Error objects with message
  if (error instanceof Error) {
    // Check if it's a Firebase error by looking at the message
    if (error.message.includes('Firebase:') || error.message.includes('auth/')) {
      // Extract error code from message if present
      const codeMatch = error.message.match(/(auth\/[^)]+)/);
      if (codeMatch) {
        return getFirebaseErrorMessage({ code: codeMatch[1], message: error.message });
      }
      // Remove "Firebase: Error" prefix
      return error.message.replace(/Firebase:\s*Error\s*\(?/g, '').replace(/\)\s*\.?/g, '').trim() || 'An error occurred. Please try again.';
    }
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('Firebase:') || error.includes('auth/')) {
      const codeMatch = error.match(/(auth\/[^)]+)/);
      if (codeMatch) {
        return getFirebaseErrorMessage({ code: codeMatch[1], message: error });
      }
    }
    return error;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Extracts error code from Firebase error
 */
export function getFirebaseErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as FirebaseError).code;
  }
  if (error instanceof Error) {
    const codeMatch = error.message.match(/(auth\/[^)]+)/);
    return codeMatch ? codeMatch[1] : null;
  }
  if (typeof error === 'string') {
    const codeMatch = error.match(/(auth\/[^)]+)/);
    return codeMatch ? codeMatch[1] : null;
  }
  return null;
}

/**
 * Checks if error is a Firebase authentication error
 */
export function isFirebaseAuthError(error: unknown): boolean {
  const code = getFirebaseErrorCode(error);
  return code !== null && code.startsWith('auth/');
}

/**
 * Checks if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  const code = getFirebaseErrorCode(error);
  return code === 'auth/network-request-failed' || code === 'unavailable';
}

