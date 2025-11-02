# Firebase Setup Instructions - Fix Console Errors

## ⚠️ IMPORTANT: Fix Permission Errors

The "Missing or insufficient permissions" errors you're seeing indicate that **Firestore security rules are not configured**. This must be fixed before the app will work properly.

## Quick Fix Steps

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`istock-abebc`)
3. Click on **Firestore Database** in the left sidebar

### Step 2: Set Up Security Rules
1. Click the **Rules** tab at the top
2. Copy and paste the rules below
3. Click **Publish**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Chats collection - users can read/write their own chats
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Feed optimizations collection - users can read/write their own optimizations
    match /feedOptimizations/{feedId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Ingredients collection - users can read/write their own ingredients
    match /ingredients/{ingredientId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Wait and Test
1. Wait 10-15 seconds for rules to propagate
2. Refresh your app
3. Try signing up or signing in again
4. Permission errors should be resolved

## Fixed Issues

✅ **Environment Variable Warnings** - No longer shows warnings for optional variables:
- `VITE_FIREBASE_MEASUREMENT_ID` (optional - only needed for Analytics)
- `VITE_SENTRY_DSN` (optional - only needed for Sentry)

✅ **React DevTools Warning** - Suppressed in development mode

✅ **Permission Error Messages** - Now provides helpful guidance pointing to this file

## Optional Environment Variables

These are optional and won't cause warnings:
- `VITE_FIREBASE_MEASUREMENT_ID` - Only needed if using Firebase Analytics
- `VITE_SENTRY_DSN` - Only needed if using Sentry for error tracking

## React DevTools Warning

The React DevTools warning is now suppressed in development. It doesn't affect functionality.

## Still Getting Permission Errors?

If you still see permission errors after setting up rules:

1. **Wait Longer**: Rules can take up to 60 seconds to fully propagate
2. **Check Rules Status**: Go to Firestore > Rules and verify they're published
3. **Clear Browser Cache**: Clear cache and reload
4. **Check Authentication**: Make sure users are properly signed in
5. **Verify userId Field**: All documents must include a `userId` field matching the user's auth ID

## Testing Rules

Test your rules in Firebase Console:
1. Go to Firestore Database > Rules tab
2. Click **Rules Playground**
3. Test scenarios:
   - Authenticated user accessing their own data ✅ (should work)
   - Authenticated user accessing another user's data ❌ (should fail)
   - Unauthenticated user accessing any data ❌ (should fail)

## Development-Only Rules (Temporary Testing)

⚠️ **WARNING**: Only for quick testing! Never use in production.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows all authenticated users to access everything. Use only for initial testing, then switch to the proper rules above.
