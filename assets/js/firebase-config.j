// ============================================================
// assets/js/firebase-config.js
// التهيئة المركزية لـ Firebase
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// إعدادات Firebase (تأكد من تطابقها مع مشروعك)
const firebaseConfig = {
  apiKey: "AIzaSyBsSP8Le5_nDG2YFiyGcZ6BFR7aLi3djLU",
  authDomain: "edu-core-ddb48.firebaseapp.com",
  projectId: "edu-core-ddb48",
  storageBucket: "edu-core-ddb48.firebasestorage.app",
  messagingSenderId: "4743644287",
  appId: "1:4743644287:web:9167749cc80417b6876b4a",
  measurementId: "G-S94FBCFCXW"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// المصادقة
const auth = getAuth(app);

// إعداد استمرارية الجلسة (تذكرني)
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('✅ جلسة Firebase مهيأة (Local)'))
  .catch((error) => console.error('❌ فشل تعيين الجلسة:', error));

// قاعدة البيانات
const db = getFirestore(app);

// التخزين
const storage = getStorage(app);

// تصدير الخدمات للاستخدام في جميع الصفحات
export { app, auth, db, storage };

console.log('✅ Firebase initialized successfully');
