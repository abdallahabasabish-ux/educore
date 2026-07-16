// ============================================================
// assets/js/auth.js
// نظام المصادقة الكامل لمنصة مداد العلم
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ... (نفس الكود السابق كاملاً مع جميع الوظائف)

console.log("✅ مداد العلم - Auth Module Loaded");
