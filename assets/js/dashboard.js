// ============================================================
// assets/js/dashboard.js
// إحصائيات ونشاطات لوحة التحكم
// ============================================================

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
      document.getElementById("user-avatar").src = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || "U")}&size=40`;
    }
    loadStats();
    loadRecentActivity();
  }
});

async function loadStats() {
  if (!academyId) return;
  try {
    // عدد العملاء
    const customersRef = collection(db, "customers");
    const customersQuery = query(customersRef, where("academyId", "==", academyId));
    const customersSnapshot = await getCountFromServer(customersQuery);
    document.getElementById("total-customers").textContent = customersSnapshot.data().count;

    // عدد القضايا النشطة
    const casesRef = collection(db, "cases");
    const casesQuery = query(casesRef, where("academyId", "==", academyId), where("status", "==", "active"));
    const casesSnapshot = await getCountFromServer(casesQuery);
    document.getElementById("active-cases").textContent = casesSnapshot.data().count;

    // عدد الجلسات اليوم (مثال)
    document.getElementById("today-sessions").textContent = "12";

    // عدد المهام المعلقة
    const tasksRef = collection(db, "tasks");
    const tasksQuery = query(tasksRef, where("academyId", "==", academyId), where("status", "==", "pending"));
    const tasksSnapshot = await getCountFromServer(tasksQuery);
    document.getElementById("pending-tasks").textContent = tasksSnapshot.data().count;
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
        <span class="text-sm">تم إضافة عميل جديد</span>
        <span class="text-xs text-gray-400">منذ 5 دقائق</span>
      </div>
      <div class="flex justify-between items-center p-3 border-b border-gray-100">
        <span class="text-sm">تم تحديث قضية #123</span>
        <span class="text-xs text-gray-400">منذ ساعة</span>
      </div>
      <div class="flex justify-between items-center p-3">
        <span class="text-sm">جلسة جديدة مضافة</span>
        <span class="text-xs text-gray-400">منذ 3 ساعات</span>
      </div>
    `;
  }, 500);
}

console.log("✅ Dashboard Module Loaded");
