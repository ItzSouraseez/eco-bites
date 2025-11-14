# 🔥 URGENT: Fix Firestore Security Rules

## The Problem
Your form is timing out because **Firestore security rules are blocking writes** to the `pendingProducts` collection.

## The Solution (5 Minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. Click the **"Rules"** tab at the top

### Step 2: Replace Your Rules
**Delete everything** in the rules editor and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to create pending products
    match /pendingProducts/{productId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if false;
      allow delete: if false;
    }
    
    // Users can read/write their own scans
    match /scans/{scanId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Anyone authenticated can read shared products
    match /sharedProducts/{productId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Users can read/write their own stats
    match /userStats/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3: Publish
1. Click the **"Publish"** button
2. Wait **10-30 seconds** for rules to propagate
3. Try submitting the form again

## Quick Test (Development Only)
If you want to test quickly, temporarily use these permissive rules:

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

⚠️ **WARNING**: These allow any authenticated user to read/write everything. Only use for testing!

## Still Not Working?

1. **Check you're logged in**: Make sure you see your profile picture/name in the top right
2. **Check Firebase config**: Verify your `.env.local` has all Firebase variables
3. **Restart dev server**: After changing `.env.local`, restart with `npm run dev`
4. **Check browser console**: Look for specific error codes (F12 → Console)

## Need Help?
- Check the console logs - they'll show exactly where it's failing
- The error message will tell you if it's a permission issue or something else
- Make sure your Firebase project is active and billing is enabled (if required)

