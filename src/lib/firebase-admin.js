// Firebase Admin SDK for server-side operations
// Note: This requires Firebase Admin SDK to be installed and configured
// Install: npm install firebase-admin
// For now, this is a placeholder that returns null
// To enable: Install firebase-admin and configure environment variables

let adminDb = null;

// Try to initialize Firebase Admin if available
try {
  // Dynamic import to avoid build errors if firebase-admin is not installed
  const firebaseAdmin = require('firebase-admin');
  
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    const { initializeApp, getApps, cert } = firebaseAdmin.app;
    const { getFirestore } = firebaseAdmin.firestore;
    
    let adminApp;
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.warn('Firebase Admin SDK credentials not configured. Shared database lookup will be disabled.');
  }
} catch (error) {
  // firebase-admin not installed or other error
  console.warn('Firebase Admin SDK not available. Shared database lookup will be disabled.');
  console.warn('To enable: npm install firebase-admin and configure environment variables');
  adminDb = null;
}

export { adminDb };

