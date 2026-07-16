// ============================================================
// assets/js/pages/sessions.js
// إدارة الجلسات - عرض، إضافة، تعديل، حذف
// ============================================================

import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let academyId = null;
let sessionsRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    sessionsRef = collection(db, "sessions");
    loadSessions();
    loadStats();
  }
});

function loadSessions() {
  if (unsubscribe) unsubscribe();
  const q = query(sessionsRef, where("academyId", "==", academyId), orderBy("date", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("sessions-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">لا توجد جلسات</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusColors = {
        scheduled: "text-blue-600 bg-blue-50",
        ongoing: "text-green-600 bg-green-50",
        completed: "text-gray-600 bg-gray-50",
        cancelled: "text-red-600 bg-red-50",
      };
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">${data.title || "بدون عنوان"}</td>
          <td class="px-6 py-4">${data.instructor || "-"}</td>
          <td class="px-6 py-4">${data.date ? new Date(data.date).toLocaleDateString("ar") : "-"}</td>
          <td class="px-6 py-4">${data.time || "-"}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "scheduled" ? "مجدولة" : data.status === "ongoing" ? "جارية" : data.status === "completed" ? "مكتملة" : "ملغية"}
            </span>
          </td>
          <td class="px-6 py-4">
            <button onclick="editSession('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteSession('${doc.id}')" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

async function loadStats() {
  try {
    const q = query(sessionsRef, where("academyId", "==", academyId));
    const snapshot = await getDocs(q);
    const today = new Date().toDateString();
    let todayCount = 0;
    let weekCount = 0;
    let upcomingCount = 0;
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date) {
        const sessionDate = new Date(data.date);
        if (sessionDate.toDateString() === today) todayCount++;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        if (sessionDate >= weekStart && sessionDate < weekEnd) weekCount++;
        if (sessionDate > now && data.status !== "cancelled") upcomingCount++;
      }
    });

    document.getElementById("today-sessions").textContent = todayCount;
    document.getElementById("week-sessions").textContent = weekCount;
    document.getElementById("upcoming-sessions").textContent = upcomingCount;
  } catch (error) {
    console.error("خطأ في تحميل الإحصائيات:", error);
  }
}

document.getElementById("add-session-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة جلسة");
});

window.editSession = (id) => {
  alert(`تعديل الجلسة: ${id}`);
};

window.deleteSession = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذه الجلسة؟")) {
    try {
      await deleteDoc(doc(db, "sessions", id));
      alert("تم حذف الجلسة بنجاح");
      loadStats();
    } catch (error) {
      alert("فشل حذف الجلسة: " + error.message);
    }
  }
};

console.log("✅ Sessions Module Loaded");
