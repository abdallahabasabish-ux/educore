// ============================================================
// assets/js/firebase-config.js
// التهيئة المركزية لـ Firebase
// ============================================================

// 1. الاستدعاء المباشر عبر روابط (CDN) لضمان العمل في جميع المتصفحات 
// بدون الحاجة لتعريف importmap في كل صفحة HTML
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ============================================================
// 2. إعدادات Firebase (من Firebase Console)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBsSP8Le5_nDG2YFiyGcZ6BFR7aLi3djLU",
  authDomain: "edu-core-ddb48.firebaseapp.com",
  projectId: "edu-core-ddb48",
  storageBucket: "edu-core-ddb48.firebasestorage.app",
  messagingSenderId: "4743644287",
  appId: "1:4743644287:web:9167749cc80417b6876b4a",
  measurementId: "G-S94FBCFCXW"
};

// ============================================================
// 3. تهيئة التطبيق والخدمات
// ============================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ============================================================
// 4. إعداد استمرارية الجلسة (تذكرني)
// ملاحظة: فايربيس يستخدم browserLocalPersistence كإعداد افتراضي، 
// ولكن تأكيده هنا يضمن بقاء الجلسة نشطة حتى تسجيل الخروج.
// ============================================================
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('✅ Firebase: جلسة Local مهيأة'))
  .catch((error) => console.error('❌ Firebase: فشل تعيين الجلسة:', error));

// ============================================================
// 5. تصدير الخدمات للاستخدام في جميع الصفحات
// ============================================================
export { app, auth, db, storage };

console.log('✅ Firebase: تم التهيئة بنجاح');
