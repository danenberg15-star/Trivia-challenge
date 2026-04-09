import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyArzxTaSFXwd4-bOVj3ggqGjYtb7e2ef0w",
  authDomain: "trivia-time-challenge.firebaseapp.com",
  projectId: "trivia-time-challenge",
  storageBucket: "trivia-time-challenge.firebasestorage.app",
  messagingSenderId: "156140186843",
  appId: "1:156140186843:web:c8ab2845f5b120a578f0fe"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);