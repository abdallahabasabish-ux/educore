// ============================================================
// assets/js/pages/cases.js
// إدارة القضايا - قراءة، إضافة، تعديل، حذف
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
let casesRef = null;
let unsubscribe = null;

// ============================================================
// 1. تهيئة الصفحة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    casesRef = collection(db, "cases");
    loadCases();
  }
});

// ============================================================
// 2. تحميل القضايا
// ============================================================
function loadCases() {
  if (unsubscribe) unsubscribe();
  const q = query(casesRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("cases-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">لا توجد قضايا</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusColors = {
        active: "text-green-600 bg-green-50",
        pending: "text-yellow-600 bg-yellow-50",
        closed: "text-gray-600 bg-gray-50",
      };
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">#${doc.id.slice(0, 6)}</td>
          <td class="px-6 py-4">${data.customerName || "-"}</td>
          <td class="px-6 py-4">${data.title || "-"}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "active" ? "نشطة" : data.status === "pending" ? "معلقة" : "مغلقة"}
            </span>
          </td>
          <td class="px-6 py-4">${data.createdAt ? new Date(data.createdAt).toLocaleDateString("ar") : "-"}</td>
          <td class="px-6 py-4">
            <button onclick="editCase('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteCase('${doc.id}')" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

// ============================================================
// 3. إضافة قضية جديدة
// ============================================================
document.getElementById("add-case-btn")?.addEventListener("click", () => {
  // يمكن فتح مودال لإضافة قضية
  alert("سيتم فتح نموذج إضافة قضية");
});

// ============================================================
// 4. تعديل وحذف القضايا
// ============================================================
window.editCase = (id) => {
  alert(`تعديل القضية: ${id}`);
};

window.deleteCase = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذه القضية؟")) {
    try {
      await deleteDoc(doc(db, "cases", id));
      alert("تم حذف القضية بنجاح");
    } catch (error) {
      alert("فشل حذف القضية: " + error.message);
    }
  }
};

console.log("✅ Cases Module Loaded");
