import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyC8cwwkbNrvHJA65s7toOtBG9dqgfeo0PI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'later-852c6.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'later-852c6',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'later-852c6.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '178566464422',
  appId: env.VITE_FIREBASE_APP_ID || '1:178566464422:web:870ddc2336f794cf390567',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


