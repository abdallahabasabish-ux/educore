// ============================================================
// assets/js/pages/courses.js
// إدارة الكورسات
// ============================================================

import { auth, db } from "../auth.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  getDoc,
} from "firebase/firestore";

let academyId = null;
let coursesRef = null;
let unsubscribe = null;

function showToast(message, type = "error") {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background: type === "success" ? "#22C55E" : "#EF4444",
      borderRadius: "12px",
      padding: "12px 24px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    },
    stopOnFocus: true,
  }).showToast();
}
function showSuccess(message) { Swal.fire({ icon: "success", title: "نجاح", text: message, confirmButtonColor: "#4B5563", confirmButtonText: "حسناً", timer: 3000, timerProgressBar: true }); }
function showError(message) { Swal.fire({ icon: "error", title: "خطأ", text: message, confirmButtonColor: "#EF4444", confirmButtonText: "حسناً" }); }

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "login.html"; return; }
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
        <div class="course-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
              <span><i class="fas fa-clock ml-1"></i> ${data.duration || "غير محدد"} ساعة</span>
              <span><i class="fas fa-dollar-sign ml-1"></i> ${data.price || "مجاني"}</span>
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

document.getElementById("course-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("course-id").value;
  const data = {
    title: document.getElementById("course-title").value.trim(),
    description: document.getElementById("course-description").value.trim(),
    teacher: document.getElementById("course-teacher").value.trim(),
    duration: document.getElementById("course-duration").value || "0",
    price: document.getElementById("course-price").value || "0",
    status: document.getElementById("course-status").value,
    academyId: academyId,
    studentCount: 0,
    updatedAt: new Date().toISOString(),
  };
  try {
    if (id) { await updateDoc(doc(db, "courses", id), data); showSuccess("تم تحديث الكورس بنجاح"); }
    else { data.createdAt = new Date().toISOString(); await addDoc(coursesRef, data); showSuccess("تم إضافة الكورس بنجاح"); }
    document.getElementById("course-modal").classList.remove("show");
  } catch (error) { showError("فشل حفظ الكورس: " + error.message); }
});

window.editCourse = async (id) => {
  const docSnap = await getDoc(doc(db, "courses", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("course-id").value = id;
    document.getElementById("course-title").value = data.title || "";
    document.getElementById("course-description").value = data.description || "";
    document.getElementById("course-teacher").value = data.teacher || "";
    document.getElementById("course-duration").value = data.duration || "";
    document.getElementById("course-price").value = data.price || "";
    document.getElementById("course-status").value = data.status || "active";
    document.getElementById("modal-title").textContent = "تعديل الكورس";
    document.getElementById("course-modal").classList.add("show");
  }
};

window.deleteCourse = async (id) => {
  const result = await Swal.fire({ title: "هل أنت متأكد؟", text: "لن تتمكن من استعادة هذا الكورس!", icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "نعم، احذف", cancelButtonText: "إلغاء" });
  if (result.isConfirmed) { try { await deleteDoc(doc(db, "courses", id)); showSuccess("تم حذف الكورس بنجاح"); } catch (error) { showError("فشل حذف الكورس: " + error.message); } }
};
console.log("✅ Courses Module Loaded");
