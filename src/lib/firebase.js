import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

// Initialize Firebase only if configured
let app;
let auth;
let googleProvider;
let realtimeDb;
let firestoreDb;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  // Only initialize on client side and if configured
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Add redirect URL for better mobile support
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  realtimeDb = getDatabase(app);
  firestoreDb = getFirestore(app);
} else {
  // Create mock objects for server-side rendering
  auth = null;
  googleProvider = null;
  realtimeDb = null;
  firestoreDb = null;
}

export { auth, realtimeDb, firestoreDb, googleProvider };
export default app;

