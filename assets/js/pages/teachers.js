// ============================================================
// assets/js/pages/teachers.js
// إدارة المدرسين - عرض، إضافة، تعديل، حذف
// ============================================================

import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let academyId = null;
let teachersRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    teachersRef = collection(db, "teachers");
    loadTeachers();
  }
});

function loadTeachers() {
  if (unsubscribe) unsubscribe();
  const q = query(teachersRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const grid = document.getElementById("teachers-grid");
    if (snapshot.empty) {
      grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">لا يوجد مدرسون</div>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusColors = {
        active: "text-green-600 bg-green-50",
        inactive: "text-red-600 bg-red-50",
        pending: "text-yellow-600 bg-yellow-50",
      };
      html += `
        <div class="teacher-card bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <img src="${data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || 'T')}&size=60`}" 
                 alt="${data.fullName}" class="w-16 h-16 rounded-full border-2 border-[#4B5563]/20" />
            <div class="flex-1">
              <h3 class="font-bold text-lg">${data.fullName || "غير محدد"}</h3>
              <p class="text-sm text-gray-500">${data.specialization || "-"}</p>
              <span class="text-xs px-2 py-1 rounded-full ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
                ${data.status === "active" ? "نشط" : data.status === "inactive" ? "غير نشط" : "معلق"}
              </span>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span><i class="fas fa-envelope ml-1"></i> ${data.email || "-"}</span>
            <span><i class="fas fa-phone ml-1"></i> ${data.phone || "-"}</span>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="editTeacher('${doc.id}')" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
              <i class="fas fa-edit ml-1"></i> تعديل
            </button>
            <button onclick="deleteTeacher('${doc.id}')" class="flex-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">
              <i class="fas fa-trash ml-1"></i> حذف
            </button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  });
}

document.getElementById("add-teacher-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة مدرس جديد");
});

window.editTeacher = (id) => {
  alert(`تعديل المدرس: ${id}`);
};

window.deleteTeacher = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا المدرس؟")) {
    try {
      await deleteDoc(doc(db, "teachers", id));
      alert("تم حذف المدرس بنجاح");
    } catch (error) {
      alert("فشل حذف المدرس: " + error.message);
    }
  }
};

console.log("✅ Teachers Module Loaded");
