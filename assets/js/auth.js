// ============================================================
// assets/js/auth.js
// نظام المصادقة الكامل + منع إعادة تحميل الصفحة
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBsSP8Le5_nDG2YFiyGcZ6BFR7aLi3djLU",
  authDomain: "edu-core-ddb48.firebaseapp.com",
  projectId: "edu-core-ddb48",
  storageBucket: "edu-core-ddb48.firebasestorage.app",
  messagingSenderId: "4743644287",
  appId: "1:4743644287:web:9167749cc80417b6876b4a",
  measurementId: "G-S94FBCFCXW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
// 1. تسجيل الدخول
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        showToast("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        return;
      }

      try {
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
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 2. التسجيل (إنشاء حساب)
  // ============================================================
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("registerName").value.trim();
      const academy = document.getElementById("registerAcademy").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const phone = document.getElementById("registerPhone").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirm = document.getElementById("registerConfirm").value;
      const terms = document.getElementById("registerTerms").checked;

      // التحقق
      if (!name || !academy || !email || !password || !confirm) {
        showToast("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
      if (password !== confirm) {
        showToast("كلمات المرور غير متطابقة");
        return;
      }
      if (password.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      if (!terms) {
        showToast("يجب الموافقة على الشروط والأحكام");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // حفظ في Firestore
        await setDoc(doc(db, "users", user.uid), {
          fullName: name,
          academyName: academy,
          email: email,
          phone: phone,
          role: "owner",
          status: "active",
          createdAt: new Date().toISOString(),
          academyId: user.uid,
          emailVerified: user.emailVerified || false,
        });

        await setDoc(doc(db, "academies", user.uid), {
          academyName: academy,
          ownerId: user.uid,
          status: "active",
          createdAt: new Date().toISOString(),
          language: "ar",
          currency: "SAR",
        });

        showSuccess("تم إنشاء الحساب بنجاح!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
      } catch (error) {
        let msg = "فشل إنشاء الحساب";
        if (error.code === "auth/email-already-in-use")
          msg = "البريد الإلكتروني مستخدم بالفعل";
        else if (error.code === "auth/invalid-email")
          msg = "البريد الإلكتروني غير صحيح";
        else if (error.code === "auth/weak-password")
          msg = "كلمة المرور ضعيفة جداً";
        else msg = error.message;
        showError(msg);
      }
    });
  }

  // ============================================================
  // 3. Google Auth
  // ============================================================
  function handleGoogleAuth() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
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
        showSuccess("تم تسجيل الدخول بواسطة Google بنجاح!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      })
      .catch((error) => {
        let msg = "فشل Google";
        if (error.code === "auth/popup-closed-by-user")
          msg = "تم إغلاق النافذة المنبثقة قبل إكمال التسجيل";
        else if (error.code === "auth/cancelled-popup-request")
          msg = "تم إلغاء طلب تسجيل الدخول";
        else if (error.code === "auth/account-exists-with-different-credential")
          msg = "يوجد حساب بنفس البريد الإلكتروني باستخدام طريقة أخرى";
        else msg = error.message;
        showError(msg);
      });
  }

  document
    .getElementById("googleLoginBtn")
    ?.addEventListener("click", handleGoogleAuth);
  document
    .getElementById("googleRegisterBtn")
    ?.addEventListener("click", handleGoogleAuth);

  // ============================================================
  // 4. استعادة كلمة المرور
  // ============================================================
  document
    .getElementById("forgotPasswordLink")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      const { value: email } = await Swal.fire({
        title: "استعادة كلمة المرور",
        text: "أدخل بريدك الإلكتروني لإرسال رابط الاستعادة",
        input: "email",
        inputPlaceholder: "example@email.com",
        confirmButtonColor: "#4B5563",
        confirmButtonText: "إرسال",
        showCancelButton: true,
        cancelButtonText: "إلغاء",
      });
      if (email) {
        try {
          await sendPasswordResetEmail(auth, email);
          showSuccess(
            "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني"
          );
        } catch (error) {
          let msg = "فشل إرسال الرابط";
          if (error.code === "auth/user-not-found")
            msg = "لا يوجد حساب بهذا البريد";
          else msg = error.message;
          showError(msg);
        }
      }
    });

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
          showError("فشل تسجيل الخروج: " + error.message);
        });
    }
  });

  // ============================================================
  // 6. مراقبة حالة المصادقة
  // ============================================================
  onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname.split("/").pop();
    const publicPages = [
      "login.html",
      "register.html",
      "forgot-password.html",
      "index.html",
      "",
    ];
    const isPublic = publicPages.includes(currentPath);

    if (!user && !isPublic && !currentPath.includes("index")) {
      window.location.href = "login.html";
      return;
    }
    if (
      user &&
      (currentPath === "login.html" ||
        currentPath === "register.html" ||
        currentPath === "forgot-password.html")
    ) {
      window.location.href = "dashboard.html";
      return;
    }
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userNameEl = document.getElementById("user-name");
          if (userNameEl)
            userNameEl.textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
          const avatarEl = document.getElementById("user-avatar");
          if (avatarEl)
            avatarEl.src =
              data.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.fullName || "U"
              )}&size=40`;
        }
      } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
      }
    }
  });
});

console.log("✅ مداد العلم - Auth Module Loaded (بدون إعادة تحميل)");
