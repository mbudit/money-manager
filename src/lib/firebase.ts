
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYy58iyTP-hnVhoBR-FMqJF0g5Vd6u9h8",
  authDomain: "money-manager-fee53.firebaseapp.com",
  projectId: "money-manager-fee53",
  storageBucket: "money-manager-fee53.firebasestorage.app",
  messagingSenderId: "860224746195",
  appId: "1:860224746195:web:d12e2085956fbcfa699a26"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
