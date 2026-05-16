import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

// ─── Firebase Configuration ──────────────────────────────────────────────────
// Initialized with your actual 'nextgenhire-61e35' project credentials.
const firebaseConfig = {
  apiKey: "AIzaSyBz9KNnRAjocCx4476BhFm6WkWgR-eH3-g",
  authDomain: "nextgenhire-61e35.firebaseapp.com",
  projectId: "nextgenhire-61e35",
  storageBucket: "nextgenhire-61e35.firebasestorage.app",
  messagingSenderId: "808390444011",
  appId: "1:808390444011:web:911aa6fd6a78dbe22dcfae",
  measurementId: "G-ED1NE6KTQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');
