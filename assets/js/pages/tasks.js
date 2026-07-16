// ============================================================
// assets/js/pages/tasks.js
// إدارة المهام - عرض، إضافة، تعديل، حذف
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
let tasksRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    tasksRef = collection(db, "tasks");
    loadTasks();
  }
});

function loadTasks() {
  if (unsubscribe) unsubscribe();
  const q = query(tasksRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const grid = document.getElementById("tasks-grid");
    if (snapshot.empty) {
      grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">لا توجد مهام</div>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const priorityColors = {
        high: "text-red-600 bg-red-50",
        medium: "text-yellow-600 bg-yellow-50",
        low: "text-blue-600 bg-blue-50",
      };
      const statusColors = {
        pending: "text-yellow-600 bg-yellow-50",
        "in-progress": "text-blue-600 bg-blue-50",
        completed: "text-green-600 bg-green-50",
      };
      html += `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-1">
          <div class="flex items-start justify-between">
            <h3 class="font-bold">${data.title || "بدون عنوان"}</h3>
            <span class="text-xs px-2 py-1 rounded-full ${priorityColors[data.priority] || "bg-gray-50 text-gray-600"}">
              ${data.priority === "high" ? "عاجل" : data.priority === "medium" ? "متوسط" : "منخفض"}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">${data.description || "لا يوجد وصف"}</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-xs px-2 py-1 rounded-full ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "pending" ? "معلقة" : data.status === "in-progress" ? "قيد التنفيذ" : "مكتملة"}
            </span>
            <span class="text-xs text-gray-400">${data.dueDate ? new Date(data.dueDate).toLocaleDateString("ar") : "-"}</span>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="editTask('${doc.id}')" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
              <i class="fas fa-edit ml-1"></i> تعديل
            </button>
            <button onclick="deleteTask('${doc.id}')" class="flex-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">
              <i class="fas fa-trash ml-1"></i> حذف
            </button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  });
}

document.getElementById("add-task-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة مهمة");
});

document.getElementById("filter-tasks")?.addEventListener("click", () => {
  const filter = document.getElementById("task-filter").value;
  // يمكن تنفيذ التصفية هنا
  loadTasks();
});

window.editTask = (id) => {
  alert(`تعديل المهمة: ${id}`);
};

window.deleteTask = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
    try {
      await deleteDoc(doc(db, "tasks", id));
      alert("تم حذف المهمة بنجاح");
    } catch (error) {
      alert("فشل حذف المهمة: " + error.message);
    }
  }
};

console.log("✅ Tasks Module Loaded");
