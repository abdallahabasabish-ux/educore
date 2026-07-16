// ============================================================
// assets/js/pages/materials.js
// إدارة المواد الدراسية
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
let materialsRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    materialsRef = collection(db, "materials");
    loadMaterials();
  }
});

function loadMaterials() {
  if (unsubscribe) unsubscribe();
  const q = query(materialsRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("materials-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">لا توجد مواد</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">${data.name || "غير محدد"}</td>
          <td class="px-6 py-4">${data.courseName || "-"}</td>
          <td class="px-6 py-4">${data.teacherName || "-"}</td>
          <td class="px-6 py-4">${data.level || "-"}</td>
          <td class="px-6 py-4">
            <button onclick="editMaterial('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteMaterial('${doc.id}')" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

document.getElementById("add-material-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة مادة جديدة");
});

window.editMaterial = (id) => {
  alert(`تعديل المادة: ${id}`);
};

window.deleteMaterial = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذه المادة؟")) {
    try {
      await deleteDoc(doc(db, "materials", id));
      alert("تم حذف المادة بنجاح");
    } catch (error) {
      alert("فشل حذف المادة: " + error.message);
    }
  }
};

console.log("✅ Materials Module Loaded");
