# Firestore Security Rules - URGENT FIX NEEDED

## ⚠️ Your form is timing out because Firestore security rules are blocking writes!

## Quick Fix Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Navigate to**: Firestore Database → Rules tab
4. **Replace ALL existing rules** with the rules below
5. **Click "Publish"**
6. **Wait 10-30 seconds** for rules to propagate
7. **Try submitting the form again**

## Required Security Rules

**Copy and paste this entire block into your Firestore Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to create pending products
    match /pendingProducts/{productId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if false; // Only admins can update
      allow delete: if false; // Only admins can delete
    }
    
    // Users can read/write their own scans
    match /scans/{scanId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if false;
      allow delete: if false;
    }
    
    // Anyone authenticated can read shared products
    match /sharedProducts/{productId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via server-side code
    }
    
    // Users can read/write their own stats
    match /userStats/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
  }
}
```

## If You're Still Having Issues:

### Option 1: Temporary Test Rules (Development Only)
For testing purposes, you can temporarily use these permissive rules:

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

**⚠️ WARNING**: These rules allow any authenticated user to read/write everything. Only use for testing, then switch back to the secure rules above!

### Option 2: Check Your Firebase Configuration
1. Verify your `.env.local` file has all Firebase variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

2. Restart your development server after changing `.env.local`

## Common Error Messages:

- **"Save operation timed out"** → Security rules are blocking the write
- **"Permission denied"** → Security rules explicitly deny the operation
- **"Database not initialized"** → Firebase config is missing or incorrect
- **"Network error"** → Check internet connection

## Still Stuck?

1. Check browser console (F12) for detailed error messages
2. Verify you're logged in (check if user object exists)
3. Test in Firebase Console → Firestore → Data tab to see if collection exists
4. Try creating a document manually in Firebase Console to test rules

