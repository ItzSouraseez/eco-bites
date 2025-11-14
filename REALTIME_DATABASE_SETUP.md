# Firebase Realtime Database Setup Guide

## ✅ Migration Complete: Firestore → Realtime Database

The app has been migrated from Firestore to Realtime Database to avoid permission issues.

## 🔧 Setup Steps

### 1. Enable Realtime Database
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click **"Realtime Database"** in the left sidebar (if not visible, click "Build" → "Realtime Database")
4. Click **"Create Database"**
5. Choose a location (closest to your users)
6. Start in **"Test mode"** (we'll update rules next)

### 2. Set Up Security Rules

Go to **Realtime Database → Rules** tab and use these rules:

```json
{
  "rules": {
    "pendingProducts": {
      ".read": "auth != null",
      ".write": "auth != null && (!data.exists() || data.child('userId').val() == auth.uid)"
    },
    "scans": {
      "$scanId": {
        ".read": "auth != null && data.child('userId').val() == auth.uid",
        ".write": "auth != null && (!data.exists() || data.child('userId').val() == auth.uid)"
      }
    },
    "sharedProducts": {
      ".read": "auth != null",
      ".write": "false"
    },
    "userStats": {
      "$userId": {
        ".read": "auth != null && $userId == auth.uid",
        ".write": "auth != null && $userId == auth.uid"
      }
    },
    "_test": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. Get Database URL

1. In Realtime Database, you'll see a URL like: `https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/`
2. Copy this URL
3. Add it to your `.env.local` file (optional, but recommended):

```env
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/
```

**Note**: The database URL is optional - Firebase SDK can auto-detect it from your project config.

### 4. Publish Rules

1. Click **"Publish"** button
2. Wait 10-30 seconds for rules to propagate
3. Try submitting the form again!

## 📊 Data Structure

Realtime Database uses a JSON tree structure:

```
{
  "pendingProducts": {
    "-Nabc123": {
      "userId": "user123",
      "productName": "Product Name",
      "brand": "Brand",
      "nutrition": { ... },
      "timestamp": 1234567890,
      ...
    }
  },
  "scans": {
    "-Ndef456": {
      "userId": "user123",
      "productName": "Scanned Product",
      ...
    }
  },
  "sharedProducts": { ... },
  "userStats": {
    "user123": {
      "points": 10,
      "totalContributions": 1,
      ...
    }
  }
}
```

## 🔄 What Changed

- **Firestore** (`collection`, `addDoc`, `getDoc`) → **Realtime Database** (`ref`, `push`, `get`)
- Collections → JSON paths
- Document IDs → Auto-generated keys
- `serverTimestamp()` still works the same way

## ✅ Benefits

- ✅ Simpler security rules
- ✅ Faster setup
- ✅ Real-time synchronization built-in
- ✅ No complex permission issues
- ✅ Better for simple data structures

## ⚠️ Important Notes

1. **Test Mode**: If you started in test mode, update the rules immediately for security
2. **Data Migration**: Existing Firestore data won't automatically migrate - you'll need to export/import manually if needed
3. **Other Files**: The scanner, profile, and admin pages still need to be updated to use Realtime Database (coming next)

## 🐛 Troubleshooting

- **Permission Denied**: Check rules are published and syntax is correct
- **Timeout**: Check internet connection and database URL
- **Not Found**: Make sure Realtime Database is enabled in your project

