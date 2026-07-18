// ============================================================
// assets/js/pages/profile.js
// الملف الشخصي - عرض وتحديث بيانات المستخدم، تغيير الصورة
// ============================================================

import { auth, db, storage } from "../firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ============================================================
// دوال مساعدة
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
// عناصر DOM
// ============================================================
const profileForm = document.getElementById("profileForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const bioInput = document.getElementById("bio");
const avatarImg = document.getElementById("avatarImg");
const avatarUpload = document.getElementById("avatarUpload");
const removeAvatarBtn = document.getElementById("removeAvatarBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const messageEl = document.getElementById("profileMessage");

let currentUser = null;
let userData = null;
let currentAvatarUrl = null;

// ============================================================
// عرض رسائل
// ============================================================
function showMessage(text, type = "success") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message-box ${type}`;
  clearTimeout(messageEl._timeout);
  messageEl._timeout = setTimeout(() => {
    messageEl.className = "message-box";
    messageEl.textContent = "";
  }, 5000);
}

// ============================================================
// تحميل بيانات المستخدم
// ============================================================
async function loadUserProfile(user) {
  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      userData = userDoc.data();
      
      // تعبئة الحقول
      fullNameInput.value = userData.fullName || "";
      emailInput.value = userData.email || "";
      phoneInput.value = userData.phone || "";
      bioInput.value = userData.bio || "";
      
      // الصورة الشخصية
      if (userData.avatar) {
        currentAvatarUrl = userData.avatar;
        avatarImg.src = userData.avatar;
        avatarImg.classList.remove("hidden");
      } else {
        // إنشاء صورة افتراضية
        const name = userData.fullName || "U";
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=120&background=4B5563&color=fff`;
        avatarImg.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات المستخدم:", error);
    showToast("فشل تحميل بيانات المستخدم", "error");
  }
}

// ============================================================
// تحديث الملف الشخصي
// ============================================================
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    showToast("يرجى تسجيل الدخول أولاً", "error");
    return;
  }

  const data = {
    fullName: fullNameInput.value.trim(),
    phone: phoneInput.value.trim(),
    bio: bioInput.value.trim(),
    updatedAt: serverTimestamp(),
  };

  if (!data.fullName) {
    showMessage("الاسم الكامل مطلوب", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "users", currentUser.uid), data);
    showSuccess("تم تحديث الملف الشخصي بنجاح");
    
    // تحديث الاسم في الواجهة
    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.textContent = `مرحباً، ${data.fullName}`;
    }
  } catch (error) {
    showError("فشل تحديث الملف الشخصي: " + error.message);
  }
});

// ============================================================
// رفع الصورة الشخصية
// ============================================================
avatarUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // التحقق من نوع الملف
  if (!file.type.startsWith("image/")) {
    showToast("يرجى اختيار ملف صورة", "error");
    return;
  }

  // التحقق من الحجم (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast("حجم الصورة يجب أن يكون أقل من 2 ميجابايت", "error");
    return;
  }

  try {
    // حذف الصورة القديمة إذا وجدت
    if (currentAvatarUrl && !currentAvatarUrl.includes("ui-avatars.com")) {
      try {
        const oldRef = ref(storage, currentAvatarUrl);
        await deleteObject(oldRef);
      } catch (error) {
        console.warn("فشل حذف الصورة القديمة:", error);
      }
    }

    // رفع الصورة الجديدة
    const storageRef = ref(storage, `users/${currentUser.uid}/avatar/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // تحديث في Firestore
    await updateDoc(doc(db, "users", currentUser.uid), {
      avatar: downloadUrl,
      updatedAt: serverTimestamp(),
    });

    // تحديث الواجهة
    currentAvatarUrl = downloadUrl;
    avatarImg.src = downloadUrl;
    showSuccess("تم تحديث الصورة الشخصية بنجاح");
  } catch (error) {
    showError("فشل رفع الصورة: " + error.message);
  }
});

// ============================================================
// حذف الصورة الشخصية
// ============================================================
removeAvatarBtn?.addEventListener("click", async () => {
  if (!currentAvatarUrl || currentAvatarUrl.includes("ui-avatars.com")) {
    showToast("لا توجد صورة شخصية لحذفها", "error");
    return;
  }

  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف الصورة الشخصية بشكل دائم",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      // حذف من Storage
      const storageRef = ref(storage, currentAvatarUrl);
      await deleteObject(storageRef);

      // حذف من Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        avatar: null,
        updatedAt: serverTimestamp(),
      });

      // استخدام الصورة الافتراضية
      const name = fullNameInput.value || "U";
      currentAvatarUrl = null;
      avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=120&background=4B5563&color=fff`;
      showSuccess("تم حذف الصورة الشخصية بنجاح");
    } catch (error) {
      showError("فشل حذف الصورة: " + error.message);
    }
  }
});

// ============================================================
// تغيير كلمة المرور
// ============================================================
changePasswordBtn?.addEventListener("click", async () => {
  if (!currentUser) {
    showToast("يرجى تسجيل الدخول أولاً", "error");
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: "تغيير كلمة المرور",
    html: `
      <div class="text-right">
        <div class="form-group">
          <label for="currentPassword" class="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
          <input type="password" id="currentPassword" class="form-control" placeholder="••••••••" required />
        </div>
        <div class="form-group mt-3">
          <label for="newPassword" class="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
          <input type="password" id="newPassword" class="form-control" placeholder="••••••••" required minlength="6" />
        </div>
        <div class="form-group mt-3">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">تأكيد كلمة المرور الجديدة</label>
          <input type="password" id="confirmPassword" class="form-control" placeholder="••••••••" required minlength="6" />
        </div>
      </div>
    `,
    confirmButtonColor: "#2563EB",
    confirmButtonText: "تغيير كلمة المرور",
    showCancelButton: true,
    cancelButtonText: "إلغاء",
    preConfirm: () => {
      const current = document.getElementById("currentPassword").value;
      const newPass = document.getElementById("newPassword").value;
      const confirm = document.getElementById("confirmPassword").value;

      if (!current || !newPass || !confirm) {
        Swal.showValidationMessage("يرجى ملء جميع الحقول");
        return false;
      }
      if (newPass.length < 6) {
        Swal.showValidationMessage("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
        return false;
      }
      if (newPass !== confirm) {
        Swal.showValidationMessage("كلمات المرور غير متطابقة");
        return false;
      }
      return { current, newPass };
    },
  });

  if (formValues) {
    try {
      // إعادة المصادقة
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        formValues.current
      );
      await reauthenticateWithCredential(currentUser, credential);

      // تغيير كلمة المرور
      await updatePassword(currentUser, formValues.newPass);
      showSuccess("تم تغيير كلمة المرور بنجاح");
    } catch (error) {
      let msg = "فشل تغيير كلمة المرور";
      if (error.code === "auth/wrong-password") {
        msg = "كلمة المرور الحالية غير صحيحة";
      } else if (error.code === "auth/too-many-requests") {
        msg = "تم إرسال العديد من المحاولات، حاول لاحقاً";
      } else {
        msg = error.message;
      }
      showError(msg);
    }
  }
});

// ============================================================
// تفعيل زر اختيار الصورة
// ============================================================
document.getElementById("uploadAvatarBtn")?.addEventListener("click", () => {
  avatarUpload.click();
});

// ============================================================
// مراقبة حالة المصادقة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  currentUser = user;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // التحقق من الدور (يمكن لأي مستخدم الوصول إلى صفحته الشخصية)
      // ولكن نمنع الطلاب من تغيير بعض البيانات
      if (data.role === "student") {
        // يمكن للطلاب تحديث بياناتهم فقط
        // لا توجد قيود إضافية
      }
      
      await loadUserProfile(user);
    } else {
      window.location.href = "../register.html";
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات المستخدم:", error);
    showToast("فشل تحميل بيانات المستخدم", "error");
  }
});

// ============================================================
// تسجيل الخروج
// ============================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../login.html";
  } catch (error) {
    showToast("فشل تسجيل الخروج: " + error.message, "error");
  }
});

// ============================================================
// تحديث القائمة الجانبية النشطة
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.split("/").pop() || "profile.html";
  document.querySelectorAll("#sidebar .sidebar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});

console.log("✅ Profile Module Loaded");
