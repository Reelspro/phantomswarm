import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";

// Default Firebase configuration for Phantom Swarm
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD-PHANTOM-SWARM-DEMO-KEY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "phantom-swarm-app.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "phantom-swarm-app",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "phantom-swarm-app.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:102938475610:web:abc123def456789"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
};
