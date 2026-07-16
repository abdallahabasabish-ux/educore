// ============================================================
// assets/js/pages/students.js
// إدارة الطلاب - قراءة، إضافة، تعديل، حذف
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
let studentsRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    studentsRef = collection(db, "students");
    loadStudents();
  }
});

function loadStudents() {
  if (unsubscribe) unsubscribe();
  const q = query(studentsRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("students-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">لا يوجد طلاب</td></tr>`;
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
        <tr>
          <td class="px-6 py-4 font-medium">${data.fullName || "غير محدد"}</td>
          <td class="px-6 py-4">${data.email || "-"}</td>
          <td class="px-6 py-4">${data.phone || "-"}</td>
          <td class="px-6 py-4">${data.courseName || "-"}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "active" ? "نشط" : data.status === "inactive" ? "غير نشط" : "معلق"}
            </span>
          </td>
          <td class="px-6 py-4">
            <button onclick="editStudent('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteStudent('${doc.id}')" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

document.getElementById("add-student-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة طالب جديد");
});

window.editStudent = (id) => {
  alert(`تعديل الطالب: ${id}`);
};

window.deleteStudent = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
    try {
      await deleteDoc(doc(db, "students", id));
      alert("تم حذف الطالب بنجاح");
    } catch (error) {
      alert("فشل حذف الطالب: " + error.message);
    }
  }
};

console.log("✅ Students Module Loaded");
