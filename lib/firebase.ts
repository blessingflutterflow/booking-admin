import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Web Firebase config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyCAuA4MJi_NKXWpIIWPr2Q7jtws91hlbLI",
  authDomain: "boo-bookings.firebaseapp.com",
  projectId: "boo-bookings",
  storageBucket: "boo-bookings.firebasestorage.app",
  messagingSenderId: "595004155222",
  appId: "1:595004155222:web:1f59d734d23b950274a2f7",
  measurementId: "G-RBQ2EQ60V3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
