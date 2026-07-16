import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const googleBtn = document.getElementById("google-login");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (error) {
      alert("فشل تسجيل الدخول: " + error.message);
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard";
    } catch (error) {
      alert("فشل تسجيل الدخول بواسطة Google: " + error.message);
    }
  });
}

// التحقق من حالة المصادقة في الصفحات المحمية
onAuthStateChanged(auth, (user) => {
  if (!user && !window.location.pathname.includes("login") && !window.location.pathname.includes("register") && !window.location.pathname.includes("index")) {
    window.location.href = "/login";
  }
});
