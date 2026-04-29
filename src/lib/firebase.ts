import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json'; // using explicit path from src/lib

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);

// Client App RTDB Config from the User
const clientFirebaseConfig = {
  apiKey: "AIzaSyAAMzOnBkEoxyxmeAIf0YFJc47hwvsYJRk",
  authDomain: "gen-lang-client-0833518119.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0833518119-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gen-lang-client-0833518119",
  storageBucket: "gen-lang-client-0833518119.firebasestorage.app",
  messagingSenderId: "223205220221",
  appId: "1:223205220221:web:3217e5f9a8db66a4aef614"
};

export const clientApp = initializeApp(clientFirebaseConfig, "ClientApp");
export const rtdb = getDatabase(clientApp);

// Initialize provider
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
