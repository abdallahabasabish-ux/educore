// ============================================================
// assets/js/pages/courses.js
// إدارة الكورسات - عرض، إضافة، تعديل، حذف
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
let coursesRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    coursesRef = collection(db, "courses");
    loadCourses();
  }
});

function loadCourses() {
  if (unsubscribe) unsubscribe();
  const q = query(coursesRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const grid = document.getElementById("courses-grid");
    if (snapshot.empty) {
      grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">لا توجد كورسات</div>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
          <div class="h-40 bg-gradient-to-br from-[#4B5563]/20 to-[#4B5563]/5 flex items-center justify-center">
            <i class="fas fa-book-open text-5xl text-[#4B5563]/40"></i>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-bold">${data.title || "بدون عنوان"}</h3>
              <span class="text-xs px-2 py-1 rounded-full ${data.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">
                ${data.status === 'active' ? 'نشط' : 'مسودة'}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">${data.description || "لا يوجد وصف"}</p>
            <div class="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span><i class="fas fa-user-graduate ml-1"></i> ${data.studentCount || 0} طالب</span>
              <span><i class="fas fa-clock ml-1"></i> ${data.duration || "غير محدد"}</span>
            </div>
            <div class="flex gap-2 mt-4">
              <button onclick="editCourse('${doc.id}')" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                <i class="fas fa-edit ml-1"></i> تعديل
              </button>
              <button onclick="deleteCourse('${doc.id}')" class="flex-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">
                <i class="fas fa-trash ml-1"></i> حذف
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  });
}

document.getElementById("add-course-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة كورس جديد");
});

window.editCourse = (id) => {
  alert(`تعديل الكورس: ${id}`);
};

window.deleteCourse = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا الكورس؟")) {
    try {
      await deleteDoc(doc(db, "courses", id));
      alert("تم حذف الكورس بنجاح");
    } catch (error) {
      alert("فشل حذف الكورس: " + error.message);
    }
  }
};

console.log("✅ Courses Module Loaded");
