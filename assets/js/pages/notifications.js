// ============================================================
// assets/js/pages/notifications.js
// إدارة الإشعارات - عرض، تحديد كمقروء، حذف
// ============================================================

import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let academyId = null;
let notificationsRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    notificationsRef = collection(db, "notifications");
    loadNotifications();
  }
});

function loadNotifications() {
  if (unsubscribe) unsubscribe();
  const q = query(notificationsRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const container = document.getElementById("notifications-list");
    if (snapshot.empty) {
      container.innerHTML = `<div class="text-center text-gray-500 py-8">لا توجد إشعارات</div>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const isRead = data.read || false;
      html += `
        <div class="bg-white rounded-xl shadow-sm border ${isRead ? 'border-gray-200' : 'border-[#4B5563]/30'} p-4 hover:shadow-md transition">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold ${isRead ? 'text-gray-600' : 'text-gray-900'}">${data.title || "إشعار"}</h3>
              <p class="text-sm text-gray-500 mt-1">${data.body || ""}</p>
              <p class="text-xs text-gray-400 mt-2">${data.createdAt ? new Date(data.createdAt).toLocaleString("ar") : "-"}</p>
            </div>
            <div class="flex gap-2">
              ${!isRead ? `<button onclick="markAsRead('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] text-sm"><i class="fas fa-check"></i></button>` : ''}
              <button onclick="deleteNotification('${doc.id}')" class="text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

window.markAsRead = async (id) => {
  try {
    await updateDoc(doc(db, "notifications", id), {
      read: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("خطأ في تحديد الإشعار كمقروء:", error);
  }
};

document.getElementById("mark-all-read")?.addEventListener("click", async () => {
  try {
    const q = query(notificationsRef, where("academyId", "==", academyId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { read: true, updatedAt: new Date().toISOString() }));
    });
    await Promise.all(batch);
    alert("تم تحديد جميع الإشعارات كمقروءة");
  } catch (error) {
    alert("فشل تحديث الإشعارات: " + error.message);
  }
});

window.deleteNotification = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا الإشعار؟")) {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error) {
      alert("فشل حذف الإشعار: " + error.message);
    }
  }
};

console.log("✅ Notifications Module Loaded");
