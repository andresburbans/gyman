import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Use environment variables for your Firebase config!
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Check if Firebase should be initialized (client-side)
if (typeof window !== 'undefined') {
  // Check if all required config values are present
  const requiredConfigKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    console.error(`Firebase config is missing or invalid: ${missingKeys.join(', ')}. Please set NEXT_PUBLIC_FIREBASE_* environment variables.`);
    // Set services to null to prevent errors downstream
    app = null;
    auth = null;
    db = null;
  } else {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }

      auth = getAuth(app);
      db = getFirestore(app);
      console.log("Firebase initialized successfully.");
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      // Ensure services are null on error
      app = null;
      auth = null;
      db = null;
    }
  }
} else {
  // Optional: Server-side initialization if needed (requires different handling)
  // console.log("Firebase initialization skipped on the server.");
}


export { app, auth, db };
