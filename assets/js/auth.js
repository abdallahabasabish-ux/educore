// ============================================================
// assets/js/auth.js
// نظام المصادقة الكامل مع رسائل واضحة
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
// 1. تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
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
      if (remember) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      window.location.href = "dashboard.html";
    } catch (error) {
      let msg = "فشل تسجيل الدخول";
      if (error.code === "auth/user-not-found") msg = "البريد الإلكتروني غير مسجل";
      else if (error.code === "auth/wrong-password") msg = "كلمة المرور غير صحيحة";
      else if (error.code === "auth/too-many-requests") msg = "تم إرسال العديد من المحاولات، حاول لاحقاً";
      else msg = error.message;
      alert(msg);
    }
  });
}

// ============================================================
// 2. تسجيل الدخول بواسطة Google (مع رسائل واضحة)
// ============================================================
const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", async () => {
    console.log("✅ تم النقر على زر Google");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ تم تسجيل الدخول بنجاح:", result.user);
      const user = result.user;
      // التحقق من وجود المستخدم في Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("📝 إنشاء مستخدم جديد في Firestore");
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
      // التوجيه إلى لوحة التحكم
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("❌ خطأ في Google Login:", error);
      let msg = "فشل تسجيل الدخول بواسطة Google";
      if (error.code === "auth/popup-closed-by-user") {
        msg = "تم إغلاق النافذة المنبثقة قبل إكمال التسجيل";
      } else if (error.code === "auth/cancelled-popup-request") {
        msg = "تم إلغاء طلب تسجيل الدخول";
      } else if (error.code === "auth/account-exists-with-different-credential") {
        msg = "يوجد حساب بنفس البريد الإلكتروني باستخدام طريقة أخرى";
      } else {
        msg = error.message;
      }
      alert(msg);
    }
  });
} else {
  console.warn("⚠️ لم يتم العثور على زر Google (id='google-login')");
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
      alert("كلمات المرور غير متطابقة");
      return;
    }
    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (!terms) {
      alert("يجب الموافقة على الشروط والأحكام");
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
      let msg = "فشل إنشاء الحساب";
      if (error.code === "auth/email-already-in-use") msg = "البريد الإلكتروني مستخدم بالفعل";
      else if (error.code === "auth/invalid-email") msg = "البريد الإلكتروني غير صحيح";
      else if (error.code === "auth/weak-password") msg = "كلمة المرور ضعيفة جداً";
      else msg = error.message;
      alert(msg);
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
      alert("يرجى إدخال البريد الإلكتروني");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    } catch (error) {
      let msg = "فشل إرسال رابط الاستعادة";
      if (error.code === "auth/user-not-found") msg = "لا يوجد حساب بهذا البريد";
      else msg = error.message;
      alert(msg);
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
      .catch((error) => {
        alert("فشل تسجيل الخروج: " + error.message);
      });
  }
});

// ============================================================
// 6. مراقبة حالة المصادقة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname.split("/").pop(); // اسم الملف الحالي

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
        if (userNameEl) {
          userNameEl.textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
        }
        const avatarEl = document.getElementById("user-avatar");
        if (avatarEl) {
          avatarEl.src = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || "U")}&size=40`;
        }
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات المستخدم:", error);
    }
  }
});

console.log("✅ مداد العلم - Auth Module Loaded");
