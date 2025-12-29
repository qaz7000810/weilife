// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ 使用你的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyDFGGjow44j4iQR-NZlMmhiiUOzcspis4o",
  authDomain: "climate-quiz-97419.firebaseapp.com",
  projectId: "climate-quiz-97419",
  storageBucket: "climate-quiz-97419.firebasestorage.app",
  messagingSenderId: "57076296245",
  appId: "1:57076296245:web:b6cf47ed503f22ae8d5f7c",
  measurementId: "G-WZXWVC533Y"
};

// 初始化 Firebase 與 Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
