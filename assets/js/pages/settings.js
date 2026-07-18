// ============================================================
// assets/js/pages/settings.js
// إعدادات الأكاديمية - تحديث البيانات، الشعار، الألوان، الإعدادات
// ============================================================

import { auth, db, storage } from "../firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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
const settingsForm = document.getElementById("settingsForm");
const academyNameInput = document.getElementById("academyName");
const academyDescriptionInput = document.getElementById("academyDescription");
const languageSelect = document.getElementById("language");
const currencySelect = document.getElementById("currency");
const timezoneSelect = document.getElementById("timezone");

const socialForm = document.getElementById("socialForm");
const facebookInput = document.getElementById("facebook");
const twitterInput = document.getElementById("twitter");
const instagramInput = document.getElementById("instagram");
const youtubeInput = document.getElementById("youtube");
const linkedinInput = document.getElementById("linkedin");

const seoForm = document.getElementById("seoForm");
const seoTitleInput = document.getElementById("seoTitle");
const seoDescriptionInput = document.getElementById("seoDescription");
const seoKeywordsInput = document.getElementById("seoKeywords");

const logoUpload = document.getElementById("logoUpload");
const logoPreview = document.getElementById("logoPreview");
const removeLogoBtn = document.getElementById("removeLogoBtn");

const coverUpload = document.getElementById("coverUpload");
const coverPreview = document.getElementById("coverPreview");
const removeCoverBtn = document.getElementById("removeCoverBtn");

const colorPrimaryInput = document.getElementById("colorPrimary");
const colorSecondaryInput = document.getElementById("colorSecondary");
const colorAccentInput = document.getElementById("colorAccent");

const themeSelect = document.getElementById("theme");

const messageEl = document.getElementById("settingsMessage");

let academyId = null;
let currentUser = null;
let currentLogoUrl = null;
let currentCoverUrl = null;

// ============================================================
// عرض رسائل
// ============================================================
function showMessage(text, type = "success") {
  messageEl.textContent = text;
  messageEl.className = `message-box ${type}`;
  clearTimeout(messageEl._timeout);
  messageEl._timeout = setTimeout(() => {
    messageEl.className = "message-box";
    messageEl.textContent = "";
  }, 5000);
}

// ============================================================
// تحميل إعدادات الأكاديمية
// ============================================================
async function loadSettings() {
  if (!academyId) return;

  try {
    const academyRef = doc(db, "academies", academyId);
    const academySnap = await getDoc(academyRef);

    if (academySnap.exists()) {
      const data = academySnap.data();

      // البيانات الأساسية
      academyNameInput.value = data.academyName || "";
      academyDescriptionInput.value = data.description || "";
      languageSelect.value = data.language || "ar";
      currencySelect.value = data.currency || "SAR";
      timezoneSelect.value = data.timezone || "Asia/Riyadh";

      // الألوان
      colorPrimaryInput.value = data.primaryColor || "#4B5563";
      colorSecondaryInput.value = data.secondaryColor || "#0F172A";
      colorAccentInput.value = data.accentColor || "#2563EB";

      // المظهر
      themeSelect.value = data.theme || "light";

      // الروابط الاجتماعية
      const social = data.social || {};
      facebookInput.value = social.facebook || "";
      twitterInput.value = social.twitter || "";
      instagramInput.value = social.instagram || "";
      youtubeInput.value = social.youtube || "";
      linkedinInput.value = social.linkedin || "";

      // SEO
      const seo = data.seo || {};
      seoTitleInput.value = seo.title || "";
      seoDescriptionInput.value = seo.description || "";
      seoKeywordsInput.value = seo.keywords || "";

      // الشعار
      if (data.logo) {
        currentLogoUrl = data.logo;
        logoPreview.src = data.logo;
        logoPreview.classList.remove("hidden");
      }

      // صورة الغلاف
      if (data.cover) {
        currentCoverUrl = data.cover;
        coverPreview.src = data.cover;
        coverPreview.classList.remove("hidden");
      }
    } else {
      // إذا لم توجد وثيقة الأكاديمية، نقوم بإنشائها
      await setDoc(doc(db, "academies", academyId), {
        academyName: "أكاديميتي",
        description: "",
        language: "ar",
        currency: "SAR",
        timezone: "Asia/Riyadh",
        primaryColor: "#4B5563",
        secondaryColor: "#0F172A",
        accentColor: "#2563EB",
        theme: "light",
        social: {},
        seo: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      loadSettings(); // إعادة التحميل
    }
  } catch (error) {
    console.error("خطأ في تحميل الإعدادات:", error);
    showToast("فشل تحميل الإعدادات", "error");
  }
}

// ============================================================
// حفظ الإعدادات العامة
// ============================================================
settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!academyId) {
    showToast("لم يتم تحديد الأكاديمية", "error");
    return;
  }

  const data = {
    academyName: academyNameInput.value.trim(),
    description: academyDescriptionInput.value.trim(),
    language: languageSelect.value,
    currency: currencySelect.value,
    timezone: timezoneSelect.value,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, "academies", academyId), data);
    showSuccess("تم حفظ الإعدادات العامة بنجاح");
  } catch (error) {
    showError("فشل حفظ الإعدادات: " + error.message);
  }
});

// ============================================================
// حفظ الروابط الاجتماعية
// ============================================================
socialForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!academyId) {
    showToast("لم يتم تحديد الأكاديمية", "error");
    return;
  }

  const social = {
    facebook: facebookInput.value.trim(),
    twitter: twitterInput.value.trim(),
    instagram: instagramInput.value.trim(),
    youtube: youtubeInput.value.trim(),
    linkedin: linkedinInput.value.trim(),
  };

  try {
    await updateDoc(doc(db, "academies", academyId), {
      social: social,
      updatedAt: serverTimestamp(),
    });
    showSuccess("تم حفظ الروابط الاجتماعية بنجاح");
  } catch (error) {
    showError("فشل حفظ الروابط الاجتماعية: " + error.message);
  }
});

// ============================================================
// حفظ إعدادات SEO
// ============================================================
seoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!academyId) {
    showToast("لم يتم تحديد الأكاديمية", "error");
    return;
  }

  const seo = {
    title: seoTitleInput.value.trim(),
    description: seoDescriptionInput.value.trim(),
    keywords: seoKeywordsInput.value.trim(),
  };

  try {
    await updateDoc(doc(db, "academies", academyId), {
      seo: seo,
      updatedAt: serverTimestamp(),
    });
    showSuccess("تم حفظ إعدادات SEO بنجاح");
  } catch (error) {
    showError("فشل حفظ إعدادات SEO: " + error.message);
  }
});

// ============================================================
// حفظ الألوان والمظهر
// ============================================================
document.getElementById("saveAppearanceBtn")?.addEventListener("click", async () => {
  if (!academyId) {
    showToast("لم يتم تحديد الأكاديمية", "error");
    return;
  }

  const data = {
    primaryColor: colorPrimaryInput.value,
    secondaryColor: colorSecondaryInput.value,
    accentColor: colorAccentInput.value,
    theme: themeSelect.value,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, "academies", academyId), data);

    // تطبيق الألوان على الواجهة
    document.documentElement.style.setProperty("--primary", colorPrimaryInput.value);
    document.documentElement.style.setProperty("--secondary", colorSecondaryInput.value);
    document.documentElement.style.setProperty("--accent", colorAccentInput.value);

    // تطبيق الثيم
    if (themeSelect.value === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    showSuccess("تم حفظ المظهر بنجاح");
  } catch (error) {
    showError("فشل حفظ المظهر: " + error.message);
  }
});

// ============================================================
// رفع الشعار
// ============================================================
logoUpload.addEventListener("change", async (e) => {
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
    const storageRef = ref(storage, `academies/${academyId}/logo/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // تحديث في Firestore
    await updateDoc(doc(db, "academies", academyId), {
      logo: downloadUrl,
      updatedAt: serverTimestamp(),
    });

    // عرض الصورة
    currentLogoUrl = downloadUrl;
    logoPreview.src = downloadUrl;
    logoPreview.classList.remove("hidden");
    showSuccess("تم رفع الشعار بنجاح");
  } catch (error) {
    showError("فشل رفع الشعار: " + error.message);
  }
});

// ============================================================
// رفع صورة الغلاف
// ============================================================
coverUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("يرجى اختيار ملف صورة", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("حجم الصورة يجب أن يكون أقل من 5 ميجابايت", "error");
    return;
  }

  try {
    const storageRef = ref(storage, `academies/${academyId}/cover/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "academies", academyId), {
      cover: downloadUrl,
      updatedAt: serverTimestamp(),
    });

    currentCoverUrl = downloadUrl;
    coverPreview.src = downloadUrl;
    coverPreview.classList.remove("hidden");
    showSuccess("تم رفع صورة الغلاف بنجاح");
  } catch (error) {
    showError("فشل رفع صورة الغلاف: " + error.message);
  }
});

// ============================================================
// حذف الشعار
// ============================================================
removeLogoBtn?.addEventListener("click", async () => {
  if (!currentLogoUrl) {
    showToast("لا يوجد شعار لحذفه", "error");
    return;
  }

  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف الشعار بشكل دائم",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      // حذف من Storage
      const storageRef = ref(storage, currentLogoUrl);
      await deleteObject(storageRef);

      // حذف من Firestore
      await updateDoc(doc(db, "academies", academyId), {
        logo: null,
        updatedAt: serverTimestamp(),
      });

      currentLogoUrl = null;
      logoPreview.src = "";
      logoPreview.classList.add("hidden");
      showSuccess("تم حذف الشعار بنجاح");
    } catch (error) {
      showError("فشل حذف الشعار: " + error.message);
    }
  }
});

// ============================================================
// حذف صورة الغلاف
// ============================================================
removeCoverBtn?.addEventListener("click", async () => {
  if (!currentCoverUrl) {
    showToast("لا توجد صورة غلاف لحذفها", "error");
    return;
  }

  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف صورة الغلاف بشكل دائم",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      const storageRef = ref(storage, currentCoverUrl);
      await deleteObject(storageRef);

      await updateDoc(doc(db, "academies", academyId), {
        cover: null,
        updatedAt: serverTimestamp(),
      });

      currentCoverUrl = null;
      coverPreview.src = "";
      coverPreview.classList.add("hidden");
      showSuccess("تم حذف صورة الغلاف بنجاح");
    } catch (error) {
      showError("فشل حذف صورة الغلاف: " + error.message);
    }
  }
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
      if (data.role !== "owner") {
        showToast("ليس لديك صلاحية الوصول لهذه الصفحة", "error");
        setTimeout(() => (window.location.href = "../dashboard.html"), 1500);
        return;
      }
      academyId = data.academyId || user.uid;
      await loadSettings();
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

console.log("✅ Settings Module Loaded");
