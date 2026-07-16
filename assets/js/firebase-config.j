import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsSP8Le5_nDG2YFiyGcZ6BFR7aLi3djLU",
  authDomain: "edu-core-ddb48.firebaseapp.com",
  projectId: "edu-core-ddb48",
  storageBucket: "edu-core-ddb48.firebasestorage.app",
  messagingSenderId: "4743644287",
  appId: "1:4743644287:web:9167749cc80417b6876b4a",
  measurementId: "G-S94FBCFCXW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

console.log("✅ Firebase initialized successfully");
