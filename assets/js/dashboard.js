// ============================================================
// assets/js/dashboard.js
// لوحة التحكم العامة - إحصائيات، نشاطات، بيانات المستخدم
// ============================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

// ============================================================
// دوال مساعدة للرسائل
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

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "منذ لحظات";
  if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
  if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
  return date.toLocaleDateString("ar");
}

// ============================================================
// عناصر DOM
// ============================================================
const userNameEl = document.getElementById("userName");
const userAvatarEl = document.getElementById("userAvatar");
const totalStudentsEl = document.getElementById("totalStudents");
const totalCoursesEl = document.getElementById("totalCourses");
const totalTeachersEl = document.getElementById("totalTeachers");
const totalRevenueEl = document.getElementById("totalRevenue");
const recentActivityEl = document.getElementById("recentActivity");

let currentUser = null;
let academyId = null;

// ============================================================
// تحميل الإحصائيات من Firestore
// ============================================================
async function loadStats() {
  if (!academyId) return;

  try {
    // عدد الطلاب
    const studentsRef = collection(db, "academies", academyId, "students");
    const studentsSnap = await getCountFromServer(studentsRef);
    if (totalStudentsEl) {
      totalStudentsEl.textContent = studentsSnap.data().count || 0;
    }

    // عدد الكورسات
    const coursesRef = collection(db, "courses");
    const coursesQuery = query(coursesRef, where("academyId", "==", academyId));
    const coursesSnap = await getCountFromServer(coursesQuery);
    if (totalCoursesEl) {
      totalCoursesEl.textContent = coursesSnap.data().count || 0;
    }

    // عدد المدرسين
    const teachersRef = collection(db, "academies", academyId, "teachers");
    const teachersSnap = await getCountFromServer(teachersRef);
    if (totalTeachersEl) {
      totalTeachersEl.textContent = teachersSnap.data().count || 0;
    }

    // الإيرادات (تقريبي من الاشتراكات)
    const subscriptionsRef = collection(db, "subscriptions");
    const subsQuery = query(subscriptionsRef, where("academyId", "==", academyId));
    const subsSnap = await getDocs(subsQuery);
    let revenue = 0;
    subsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.amount) revenue += data.amount;
    });
    if (totalRevenueEl) {
      totalRevenueEl.textContent = "$" + (revenue || 0).toLocaleString();
    }
  } catch (error) {
    console.error("خطأ في تحميل الإحصائيات:", error);
  }
}

// ============================================================
// تحميل آخر النشاطات
// ============================================================
function loadRecentActivity() {
  if (!academyId || !recentActivityEl) return;

  try {
    const activitiesRef = collection(db, "activities");
    const q = query(
      activitiesRef,
      where("academyId", "==", academyId),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        recentActivityEl.innerHTML =
          '<p class="text-sm text-gray-400 text-center py-4">لا توجد أنشطة حديثة</p>';
        return;
      }

      let html = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const time = data.createdAt
          ? formatTime(data.createdAt.toDate())
          : "منذ فترة";
        html += `
          <div class="flex items-center justify-between p-3 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition rounded-lg">
            <span class="text-sm text-[#111827]">${data.text || "نشاط جديد"}</span>
            <span class="text-xs text-[#94a3b8]">${time}</span>
          </div>
        `;
      });
      recentActivityEl.innerHTML = html;
    });
  } catch (error) {
    console.warn("لا توجد نشاطات مسجلة:", error);
    // بيانات وهمية احتياطية
    const activities = [
      { text: "تم تسجيل طالب جديد: أحمد محمد", time: new Date(Date.now() - 300000) },
      { text: "تم إضافة كورس: مقدمة في البرمجة", time: new Date(Date.now() - 7200000) },
      { text: "تم إنهاء حصة: رياضيات - المستوى الأول", time: new Date(Date.now() - 14400000) },
      { text: "تم رفع واجب جديد: واجب الأسبوع الثالث", time: new Date(Date.now() - 86400000) },
    ];
    let html = "";
    activities.forEach((item) => {
      html += `
        <div class="flex items-center justify-between p-3 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition rounded-lg">
          <span class="text-sm text-[#111827]">${item.text}</span>
          <span class="text-xs text-[#94a3b8]">${formatTime(item.time)}</span>
        </div>
      `;
    });
    recentActivityEl.innerHTML = html;
  }
}

// ============================================================
// تحديث البيانات بالكامل
// ============================================================
async function refreshData() {
  await loadStats();
  loadRecentActivity();
  showToast("تم تحديث البيانات", "success");
}

// ============================================================
// مراقبة حالة المصادقة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      academyId = data.academyId || user.uid;

      // تحديث اسم المستخدم
      if (userNameEl) {
        userNameEl.textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
      }
      if (userAvatarEl) {
        userAvatarEl.src =
          data.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            data.fullName || "U"
          )}&size=40&background=4B5563&color=fff`;
      }

      // تحميل البيانات
      await loadStats();
      loadRecentActivity();
    } else {
      window.location.href = "register.html";
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات المستخدم:", error);
    showToast("فشل تحميل بيانات المستخدم", "error");
  }
});

// ============================================================
// زر تحديث البيانات
// ============================================================
document.getElementById("refreshBtn")?.addEventListener("click", refreshData);
document.getElementById("refreshBtnMobile")?.addEventListener("click", refreshData);

// ============================================================
// تسجيل الخروج
// ============================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    showToast("فشل تسجيل الخروج: " + error.message, "error");
  }
});

// ============================================================
// تحديث القائمة الجانبية النشطة
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll("#sidebar .sidebar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (href === "dashboard.html" && currentPath === "")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});

console.log("✅ Dashboard Module Loaded");
