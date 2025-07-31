import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: any = null;
let auth: any = null;

// Only initialize Firebase if we have the required config
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  console.warn('Firebase config not complete - falling back to Replit Auth');
}

const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

export const signInWithGoogle = async () => {
  if (!auth) {
    // Fallback to Replit Auth
    window.location.href = "/api/login";
    return;
  }
  
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    // Fallback to Replit Auth
    window.location.href = "/api/login";
  }
};

export const signOutUser = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
    }
  }
  
  // Also sign out from Replit Auth
  window.location.href = "/api/logout";
};