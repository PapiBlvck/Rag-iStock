# ⚡ QUICK FIX: Firestore Permission Errors

## The Problem
You're getting "Missing or insufficient permissions" errors because Firestore security rules are not set up.

## The Solution (2 Minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project: **istock-abebc**

### Step 2: Apply Security Rules
1. Click **Firestore Database** (left sidebar)
2. Click **Rules** tab
3. **DELETE** everything in the rules editor
4. **PASTE** the rules below
5. Click **Publish**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /feedOptimizations/{feedId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /ingredients/{ingredientId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Wait & Refresh
1. Wait 10-15 seconds for rules to propagate
2. Refresh your browser
3. Try signing in/up again
4. Errors should be gone! ✅

## Alternative: Development-Only Rules (Even Faster)

If you just want to get it working quickly for development:

1. Go to Firestore Database > Rules
2. Paste this (allows all authenticated users):
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
3. Click **Publish**
4. ⚠️ **Remember**: These are open rules! Switch to the secure rules above before production.

## Still Not Working?

1. **Check authentication**: Make sure you're signed in
2. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Clear cache**: Clear browser cache and cookies
4. **Check rules published**: Look for green "Published" status in Firebase Console
5. **Wait longer**: Rules can take up to 60 seconds to propagate

