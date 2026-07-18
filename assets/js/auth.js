// ============================================================
// assets/js/auth.js
// نظام المصادقة الكامل - تسجيل الدخول، إنشاء حساب، Google، استعادة كلمة المرور
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// ============================================================
// دوال مساعدة للرسائل (بدون alert)
// ============================================================
function showToast(message, type = "error") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background: type === "success" ? "#22C55E" : "#EF4444",
      borderRadius: "12px",
      padding: "12px 24px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    },
    stopOnFocus: true,
  }).showToast();
}

function showSuccess(message) {
  Swal.fire({
    icon: "success",
    title: "نجاح",
    text: message,
    confirmButtonColor: "#4B5563",
    confirmButtonText: "حسناً",
    timer: 3000,
    timerProgressBar: true,
  });
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "حسناً",
  });
}

// ============================================================
// 1. تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const remember = document.getElementById("loginRemember")?.checked || false;

      if (!email || !password) {
        showToast("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        return;
      }

      try {
        // تعيين استمرارية الجلسة
        await setPersistence(
          auth,
          remember ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess("تم تسجيل الدخول بنجاح!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } catch (error) {
        let msg = "فشل تسجيل الدخول";
        if (error.code === "auth/user-not-found") msg = "البريد الإلكتروني غير مسجل";
        else if (error.code === "auth/wrong-password") msg = "كلمة المرور غير صحيحة";
        else if (error.code === "auth/too-many-requests")
          msg = "تم إرسال العديد من المحاولات، حاول لاحقاً";
        else if (error.code === "auth/invalid-email") msg = "البريد الإلكتروني غير صحيح";
        else if (error.code === "auth/user-disabled") msg = "تم تعطيل هذا الحساب";
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 2. تسجيل الدخول بواسطة Google
  // ============================================================
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // التحقق من وجود المستخدم في Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          // إنشاء مستخدم جديد
          await setDoc(doc(db, "users", user.uid), {
            fullName: user.displayName || "مستخدم",
            email: user.email,
            avatar: user.photoURL || "",
            role: "student", // افتراضي
            status: "active",
            academyId: null, // سيتم تعيينه لاحقاً
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        showSuccess("تم تسجيل الدخول بواسطة Google بنجاح!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } catch (error) {
        let msg = "فشل تسجيل الدخول عبر Google";
        if (error.code === "auth/popup-closed-by-user")
          msg = "تم إغلاق النافذة المنبثقة قبل إكمال التسجيل";
        else if (error.code === "auth/cancelled-popup-request")
          msg = "تم إلغاء طلب تسجيل الدخول";
        else if (error.code === "auth/account-exists-with-different-credential")
          msg = "يوجد حساب بنفس البريد الإلكتروني باستخدام طريقة أخرى";
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 3. إنشاء حساب جديد (التسجيل)
  // ============================================================
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = document.getElementById("registerName").value.trim();
      const academyName = document.getElementById("registerAcademy").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const phone = document.getElementById("registerPhone").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirm = document.getElementById("registerConfirm").value;
      const terms = document.getElementById("registerTerms").checked;

      // التحقق من صحة المدخلات
      if (!fullName || !academyName || !email || !password || !confirm) {
        showToast("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
      if (password.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      if (password !== confirm) {
        showToast("كلمات المرور غير متطابقة");
        return;
      }
      if (!terms) {
        showToast("يجب الموافقة على الشروط والأحكام");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast("البريد الإلكتروني غير صحيح");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // حفظ بيانات المستخدم في Firestore
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          academyName,
          email,
          phone: phone || "",
          role: "owner", // المدرس هو مالك الأكاديمية
          status: "active",
          academyId: user.uid, // يستخدم كمعرف للأكاديمية
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // إنشاء وثيقة الأكاديمية
        await setDoc(doc(db, "academies", user.uid), {
          academyName,
          ownerId: user.uid,
          slug: academyName.toLowerCase().replace(/\s+/g, "-"),
          status: "active",
          language: "ar",
          currency: "SAR",
          studentCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        showSuccess("تم إنشاء الحساب بنجاح! جاري التوجيه...");
        setTimeout(() => {
          window.location.href = "owner-dashboard.html";
        }, 2000);
      } catch (error) {
        let msg = "فشل إنشاء الحساب";
        if (error.code === "auth/email-already-in-use")
          msg = "البريد الإلكتروني مستخدم بالفعل";
        else if (error.code === "auth/invalid-email")
          msg = "البريد الإلكتروني غير صحيح";
        else if (error.code === "auth/weak-password")
          msg = "كلمة المرور ضعيفة جداً";
        else if (error.code === "auth/network-request-failed")
          msg = "فشل الاتصال بالشبكة، تأكد من اتصال الإنترنت";
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 4. استعادة كلمة المرور
  // ============================================================
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      if (!email) {
        showToast("يرجى إدخال البريد الإلكتروني");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast("البريد الإلكتروني غير صحيح");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        showSuccess("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      } catch (error) {
        let msg = "فشل إرسال رابط الاستعادة";
        if (error.code === "auth/user-not-found")
          msg = "لا يوجد حساب بهذا البريد";
        else if (error.code === "auth/invalid-email")
          msg = "البريد الإلكتروني غير صحيح";
        else if (error.code === "auth/too-many-requests")
          msg = "تم إرسال العديد من الطلبات، حاول لاحقاً";
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 5. تسجيل الخروج
  // ============================================================
  document.addEventListener("click", (e) => {
    const target = e.target.closest("#logoutBtn");
    if (target) {
      e.preventDefault();
      signOut(auth)
        .then(() => {
          localStorage.removeItem("rememberMe");
          window.location.href = "login.html";
        })
        .catch((error) => {
          showError("فشل تسجيل الخروج: " + error.message);
        });
    }
  });

  // ============================================================
  // 6. مراقبة حالة المصادقة وتوجيه المستخدم حسب الدور
  // ============================================================
  onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname.split("/").pop();
    const publicPages = [
      "login.html",
      "register.html",
      "forgot-password.html",
      "index.html",
      "features.html",
      "pricing.html",
      "contact.html",
      "faq.html",
      "about.html",
      "blog.html",
      "privacy-policy.html",
      "terms.html",
      "404.html",
      "",
    ];
    const isPublic = publicPages.includes(currentPath);

    if (!user && !isPublic && !currentPath.includes("index")) {
      window.location.href = "login.html";
      return;
    }

    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const role = data.role || "student";

          // تحديث اسم المستخدم في الواجهة
          const userNameEl = document.getElementById("userName");
          if (userNameEl) {
            userNameEl.textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
          }
          const avatarEl = document.getElementById("userAvatar");
          if (avatarEl) {
            avatarEl.src =
              data.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.fullName || "U"
              )}&size=40`;
          }

          // توجيه المستخدم حسب دوره إذا كان في الصفحات العامة
          if (isPublic || currentPath === "dashboard.html") {
            const roleMap = {
              super_admin: "super-admin-dashboard.html",
              owner: "owner-dashboard.html",
              teacher: "teacher-dashboard.html",
              student: "student-dashboard.html",
            };
            const targetPage = roleMap[role] || "student-dashboard.html";
            if (currentPath !== targetPage && !isPublic) {
              window.location.href = targetPage;
            }
          }
        }
      } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
      }
    }
  });
});

console.log("✅ Auth Module Loaded");
