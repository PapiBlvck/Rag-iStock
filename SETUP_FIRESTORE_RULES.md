# 🔥 URGENT: Set Up Firestore Security Rules

## ⚠️ You're seeing permission errors because Firestore security rules are NOT configured!

The errors will continue until you set up the security rules. This takes 2 minutes.

## Quick Fix (Copy & Paste)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `istock-abebc`
3. **Go to**: Firestore Database → **Rules** tab
4. **Delete everything** in the rules editor
5. **Paste** the rules below
6. **Click "Publish"**
7. **Wait 10 seconds**, then refresh your app

### Security Rules (Copy This):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users - read/write own profile
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Chats - read/write own chats
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Feed optimizations - read/write own feeds
    match /feedOptimizations/{feedId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Ingredients - read/write own ingredients
    match /ingredients/{ingredientId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## That's It!

After publishing, wait 10-15 seconds and refresh. All permission errors will be gone!

## Alternative: Quick Test Rules (Development Only)

If you want to get it working even faster (but less secure):

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

⚠️ **Warning**: These rules allow all authenticated users to access everything. Only use for testing!

