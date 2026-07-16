import { auth } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// تسجيل الدخول
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (error) {
      showToast("فشل تسجيل الدخول: " + error.message, "error");
    }
  });
}

// تسجيل الدخول بواسطة Google
const googleBtn = document.getElementById("google-login");
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.href = "/dashboard";
    } catch (error) {
      showToast("فشل تسجيل الدخول بواسطة Google: " + error.message, "error");
    }
  });
}

// استعادة كلمة المرور
const resetForm = document.getElementById("reset-form");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.", "success");
    } catch (error) {
      showToast("فشل إرسال رابط الاستعادة: " + error.message, "error");
    }
  });
}

// تسجيل الخروج
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/login";
  });
}

// التحقق من حالة المصادقة
onAuthStateChanged(auth, (user) => {
  const protectedPages = ['/dashboard', '/customers', '/cases', '/sessions', '/documents', '/contracts', '/consultations', '/tasks', '/calendar', '/notifications', '/reports', '/accounting', '/employees', '/settings', '/profile'];
  const currentPath = window.location.pathname;
  if (!user && protectedPages.some(p => currentPath.startsWith(p))) {
    window.location.href = "/login";
  }
  if (user && (currentPath === '/login' || currentPath === '/register')) {
    window.location.href = "/dashboard";
  }
});

// دالة عرض الإشعارات (Toast)
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 left-4 z-50 px-6 py-3 rounded-2xl text-white font-medium shadow-lg transition-all duration-300 transform translate-y-0 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-[#4B5563]'}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
