import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
