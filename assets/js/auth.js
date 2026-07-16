// ============================================================
// assets/js/auth.js
// نظام المصادقة – جميع الرسائل تظهر داخل الصفحة
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

// ============================================================
// دالة لعرض الرسائل داخل الصفحة (بدون alert)
// ============================================================
function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `message-box show ${type === "success" ? "success" : ""}`;
  // إخفاء الرسالة بعد 5 ثوانٍ
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.classList.remove("show");
    el.className = "message-box";
  }, 5000);
}

// ============================================================
// 1. تسجيل الدخول بالبريد الإلكتروني
// ============================================================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember")?.checked || false;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (remember) localStorage.setItem("rememberMe", "true");
      else localStorage.removeItem("rememberMe");
      window.location.href = "dashboard.html";
    } catch (error) {
      let msg = "فشل تسجيل الدخول: ";
      if (error.code === "auth/user-not-found") msg += "البريد الإلكتروني غير مسجل";
      else if (error.code === "auth/wrong-password") msg += "كلمة المرور غير صحيحة";
      else if (error.code === "auth/too-many-requests") msg += "تم إرسال العديد من المحاولات، حاول لاحقاً";
      else msg += error.message;
      showMessage("login-message", msg, "error");
    }
  });
}

// ============================================================
// 2. Google (تسجيل الدخول والتسجيل)
// ============================================================
const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "مستخدم",
          email: user.email,
          avatar: user.photoURL || "",
          role: "owner",
          status: "active",
          createdAt: new Date().toISOString(),
          academyId: user.uid,
        });
        await setDoc(doc(db, "academies", user.uid), {
          academyName: "أكاديميتي",
          ownerId: user.uid,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      }
      window.location.href = "dashboard.html";
    } catch (error) {
      let msg = "فشل Google: ";
      if (error.code === "auth/popup-closed-by-user") msg += "تم إغلاق النافذة المنبثقة قبل إكمال التسجيل";
      else if (error.code === "auth/cancelled-popup-request") msg += "تم إلغاء طلب تسجيل الدخول";
      else if (error.code === "auth/account-exists-with-different-credential") msg += "يوجد حساب بنفس البريد الإلكتروني باستخدام طريقة أخرى";
      else msg += error.message;
      // تحديد مكان عرض الرسالة (إذا كانت الصفحة login أو register)
      const msgEl = document.getElementById("login-message") || document.getElementById("register-message");
      if (msgEl) showMessage(msgEl.id, msg, "error");
      else alert(msg); // احتياطي (نادراً ما يحدث)
    }
  });
}

// ============================================================
// 3. إنشاء حساب جديد (التسجيل)
// ============================================================
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value.trim();
    const academyName = document.getElementById("academyName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms")?.checked || false;

    if (password !== confirmPassword) {
      showMessage("register-message", "كلمات المرور غير متطابقة", "error");
      return;
    }
    if (password.length < 6) {
      showMessage("register-message", "كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }
    if (!terms) {
      showMessage("register-message", "يجب الموافقة على الشروط والأحكام", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        academyName,
        email,
        phone,
        role: "owner",
        status: "active",
        createdAt: new Date().toISOString(),
        academyId: user.uid,
        emailVerified: user.emailVerified || false,
      });
      await setDoc(doc(db, "academies", user.uid), {
        academyName,
        ownerId: user.uid,
        status: "active",
        createdAt: new Date().toISOString(),
        language: "ar",
        currency: "SAR",
      });
      window.location.href = "dashboard.html";
    } catch (error) {
      let msg = "فشل إنشاء الحساب: ";
      if (error.code === "auth/email-already-in-use") msg += "البريد الإلكتروني مستخدم بالفعل";
      else if (error.code === "auth/invalid-email") msg += "البريد الإلكتروني غير صحيح";
      else if (error.code === "auth/weak-password") msg += "كلمة المرور ضعيفة جداً";
      else msg += error.message;
      showMessage("register-message", msg, "error");
    }
  });
}

// ============================================================
// 4. استعادة كلمة المرور
// ============================================================
const forgotForm = document.getElementById("forgot-password-form");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    if (!email) {
      showMessage("forgot-message", "يرجى إدخال البريد الإلكتروني", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage("forgot-message", "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني", "success");
      setTimeout(() => window.location.href = "login.html", 3000);
    } catch (error) {
      let msg = "فشل إرسال رابط الاستعادة: ";
      if (error.code === "auth/user-not-found") msg += "لا يوجد حساب بهذا البريد";
      else msg += error.message;
      showMessage("forgot-message", msg, "error");
    }
  });
}

// ============================================================
// 5. تسجيل الخروج
// ============================================================
document.addEventListener("click", (e) => {
  const target = e.target.closest("#logout-btn");
  if (target) {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        localStorage.removeItem("rememberMe");
        window.location.href = "login.html";
      })
      .catch((error) => console.error("فشل تسجيل الخروج:", error));
  }
});

// ============================================================
// 6. مراقبة حالة المصادقة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname.split("/").pop();
  const publicPages = ["login.html", "register.html", "forgot-password.html", "index.html", ""];
  const isPublic = publicPages.includes(currentPath);

  if (!user && !isPublic && !currentPath.includes("index")) {
    window.location.href = "login.html";
    return;
  }
  if (user && (currentPath === "login.html" || currentPath === "register.html" || currentPath === "forgot-password.html")) {
    window.location.href = "dashboard.html";
    return;
  }
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userNameEl = document.getElementById("user-name");
        if (userNameEl) userNameEl.textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
        const avatarEl = document.getElementById("user-avatar");
        if (avatarEl) avatarEl.src = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || "U")}&size=40`;
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات المستخدم:", error);
    }
  }
});

console.log("✅ مداد العلم - Auth Module Loaded (بدون alert)");
