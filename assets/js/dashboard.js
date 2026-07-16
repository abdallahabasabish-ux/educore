// ============================================================
// assets/js/dashboard.js
// لوحة التحكم - إحصائيات تعليمية
// ============================================================

import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let academyId = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      academyId = data.academyId || user.uid;
      document.getElementById("user-name").textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
      document.getElementById("user-avatar").src =
        data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || "U")}&size=40`;
    }
    loadStats();
    loadRecentActivity();
  }
});

async function loadStats() {
  if (!academyId) return;
  try {
    // عدد الطلاب
    const studentsRef = collection(db, "students");
    const studentsQuery = query(studentsRef, where("academyId", "==", academyId));
    const studentsSnapshot = await getCountFromServer(studentsQuery);
    document.getElementById("total-students").textContent = studentsSnapshot.data().count;

    // عدد الكورسات النشطة
    const coursesRef = collection(db, "courses");
    const coursesQuery = query(coursesRef, where("academyId", "==", academyId), where("status", "==", "active"));
    const coursesSnapshot = await getCountFromServer(coursesQuery);
    document.getElementById("active-courses").textContent = coursesSnapshot.data().count;

    // عدد الحصص اليوم (مثال)
    document.getElementById("today-classes").textContent = "8";

    // عدد الواجبات المعلقة
    const assignmentsRef = collection(db, "assignments");
    const assignmentsQuery = query(assignmentsRef, where("academyId", "==", academyId), where("status", "==", "pending"));
    const assignmentsSnapshot = await getCountFromServer(assignmentsQuery);
    document.getElementById("pending-assignments").textContent = assignmentsSnapshot.data().count;
  } catch (error) {
    console.error("خطأ في تحميل الإحصائيات:", error);
  }
}

function loadRecentActivity() {
  const container = document.getElementById("recent-activity");
  container.innerHTML = '<p class="text-sm text-gray-500">جاري التحميل...</p>';
  setTimeout(() => {
    container.innerHTML = `
      <div class="flex justify-between items-center p-3 border-b border-gray-100">
        <span class="text-sm">تم تسجيل طالب جديد</span>
        <span class="text-xs text-gray-400">منذ 5 دقائق</span>
      </div>
      <div class="flex justify-between items-center p-3 border-b border-gray-100">
        <span class="text-sm">تم إضافة كورس جديد: "مقدمة في البرمجة"</span>
        <span class="text-xs text-gray-400">منذ ساعة</span>
      </div>
      <div class="flex justify-between items-center p-3">
        <span class="text-sm">تم إنهاء حصة: "رياضيات - المستوى الأول"</span>
        <span class="text-xs text-gray-400">منذ 3 ساعات</span>
      </div>
    `;
  }, 500);
}

console.log("✅ Dashboard Module Loaded (Education)");
