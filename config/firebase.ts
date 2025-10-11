import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHEfpkAnnBlV4Mld00SyJuq7616mB2xcg",
  authDomain: "dccc1-7f7d9.firebaseapp.com",
  projectId: "dccc1-7f7d9",
  storageBucket: "dccc1-7f7d9.firebasestorage.app",
  messagingSenderId: "180038595763",
  appId: "1:180038595763:web:37ec984c4a9e8ee547ecc6",
  databaseURL: "https://dccc1-7f7d9-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Enable offline persistence for a robust, offline-first experience
try {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // This can happen if multiple tabs are open.
        console.warn("Firestore persistence failed: Multiple tabs open. Offline features may be limited.");
      } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore persistence not available in this browser environment.");
      }
    });
} catch (error) {
    console.error("Error enabling Firestore persistence:", error);
}
