import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error("Missing Firebase configuration. Please set NEXT_PUBLIC_FIREBASE_* environment variables.");
}

const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

let dbInstance: Firestore;

if (typeof window !== "undefined") {
  try {
    dbInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch (error) {
    console.warn("Falling back to default Firestore initialization", error);
    dbInstance = getFirestore(app);
  }
} else {
  dbInstance = getFirestore(app);
}

export const auth = getAuth(app);
export const db = dbInstance;

// Initialize Firebase Functions
let functionsInstance: Functions;

if (typeof window !== "undefined") {
    functionsInstance = getFunctions(app, "europe-central2");
    
    // Connect to emulator in development
    if (process.env.NODE_ENV === "development") {
        connectFunctionsEmulator(functionsInstance, "localhost", 5001);
    }
} else {
    functionsInstance = getFunctions(app, "europe-central2");
}

export const functions = functionsInstance;

export default app;
