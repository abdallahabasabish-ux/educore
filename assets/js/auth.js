import { auth } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { db } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ===== تسجيل الدخول =====
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
      alert("فشل تسجيل الدخول: " + error.message);
    }
  });
}

// ===== تسجيل الدخول بـ Google =====
const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard";
    } catch (error) {
      alert("فشل تسجيل الدخول بواسطة Google: " + error.message);
    }
  });
}

// ===== إنشاء حساب =====
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value;
    const academyName = document.getElementById("academyName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // حفظ بيانات المستخدم في Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        academyName,
        email,
        phone,
        role: "owner",
        status: "active",
        createdAt: new Date().toISOString(),
        academyId: user.uid // مؤقتاً نستخدم uid كـ academyId
      });

      // حفظ بيانات الأكاديمية
      await setDoc(doc(db, "academies", user.uid), {
        academyName,
        ownerId: user.uid,
        status: "active",
        createdAt: new Date().toISOString()
      });

      window.location.href = "/dashboard";
    } catch (error) {
      alert("فشل إنشاء الحساب: " + error.message);
    }
  });
}

// ===== استعادة كلمة المرور =====
const forgotForm = document.getElementById("forgot-password-form");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني");
    } catch (error) {
      alert("فشل إرسال رابط الاستعادة: " + error.message);
    }
  });
}

// ===== تسجيل الخروج =====
document.addEventListener("click", (e) => {
  if (e.target.id === "logout-btn" || e.target.closest("#logout-btn")) {
    signOut(auth);
    window.location.href = "/login";
  }
});

// ===== التحقق من حالة المصادقة =====
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname;
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/contact", "/about", "/blog", "/faq", "/privacy-policy", "/terms"];
  const isPublic = publicPaths.includes(currentPath) || currentPath === "";

  if (!user && !isPublic) {
    window.location.href = "/login";
  }

  if (user && (currentPath === "/login" || currentPath === "/register" || currentPath === "/forgot-password")) {
    window.location.href = "/dashboard";
  }

  // تحديث اسم المستخدم في الواجهة إذا كان موجوداً
  if (user && document.getElementById("user-name")) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("user-name").textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
    }
  }
});
