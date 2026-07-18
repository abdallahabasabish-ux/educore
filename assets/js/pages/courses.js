// ============================================================
// assets/js/pages/courses.js
// إدارة الكورسات - عرض، إضافة، تعديل، حذف
// ============================================================

import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";

// ============================================================
// دوال مساعدة
// ============================================================
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

function showSuccess(message) {
  Swal.fire({
    icon: "success",
    title: "نجاح",
    text: message,
    confirmButtonColor: "#4B5563",
    confirmButtonText: "حسناً",
    timer: 3000,
    timerProgressBar: true,
  });
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "حسناً",
  });
}

function getStatusBadge(status) {
  const map = {
    active: "badge-active",
    draft: "badge-pending",
    archived: "badge-inactive",
  };
  const labels = {
    active: "نشط",
    draft: "مسودة",
    archived: "مؤرشف",
  };
  return `<span class="badge ${map[status] || "badge-pending"}">${
    labels[status] || status
  }</span>`;
}

// ============================================================
// عناصر DOM
// ============================================================
const coursesGrid = document.getElementById("coursesGrid");
const modal = document.getElementById("courseModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addCourseBtn = document.getElementById("addCourseBtn");
const form = document.getElementById("courseForm");
const courseIdInput = document.getElementById("courseId");
const titleInput = document.getElementById("courseTitle");
const descriptionInput = document.getElementById("courseDescription");
const teacherInput = document.getElementById("courseTeacher");
const priceInput = document.getElementById("coursePrice");
const durationInput = document.getElementById("courseDuration");
const statusInput = document.getElementById("courseStatus");
const messageEl = document.getElementById("modalMessage");

let academyId = null;
let currentUser = null;
let unsubscribeCourses = null;

// ============================================================
// عرض رسائل في المودال
// ============================================================
function showModalMessage(text, type = "error") {
  messageEl.textContent = text;
  messageEl.className = `message-box ${type}`;
  clearTimeout(messageEl._timeout);
  messageEl._timeout = setTimeout(() => {
    messageEl.className = "message-box";
    messageEl.textContent = "";
  }, 5000);
}

// ============================================================
// تحميل الكورسات
// ============================================================
function loadCourses() {
  if (!academyId) return;

  const coursesRef = collection(db, "courses");
  const q = query(
    coursesRef,
    where("academyId", "==", academyId),
    orderBy("createdAt", "desc")
  );

  unsubscribeCourses = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      coursesGrid.innerHTML = `
        <div class="col-span-full text-center text-gray-400 py-12">
          <i class="fas fa-book-open text-4xl opacity-30 block mb-3"></i>
          <p class="text-sm">لا توجد كورسات</p>
          <p class="text-xs mt-1">اضغط على "إضافة كورس" لإضافة أول كورس</p>
        </div>
      `;
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const studentCount = data.studentCount || 0;

      html += `
        <div class="course-card bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
          <div class="h-48 bg-gradient-to-br from-[#4B5563]/20 to-[#4B5563]/5 flex items-center justify-center relative">
            <i class="fas fa-book-open text-5xl text-[#4B5563]/40"></i>
            <div class="absolute top-3 left-3">
              ${getStatusBadge(data.status || "draft")}
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-lg font-bold text-[#000000] line-clamp-1">${data.title || "بدون عنوان"}</h3>
            <p class="text-sm text-[#555555] mt-1 line-clamp-2">${data.description || "لا يوجد وصف"}</p>
            <div class="flex items-center justify-between mt-3 text-sm text-[#555555]">
              <span><i class="fas fa-user-graduate ml-1"></i> ${studentCount} طالب</span>
              <span><i class="fas fa-clock ml-1"></i> ${data.duration || "غير محدد"}</span>
              <span><i class="fas fa-chalkboard-teacher ml-1"></i> ${data.teacher || "-"}</span>
            </div>
            <div class="mt-4 flex items-center justify-between">
              <span class="text-lg font-bold text-[#000000]">${data.price ? '$' + data.price : 'مجاني'}</span>
              <div class="flex gap-2">
                <button onclick="editCourse('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCourse('${doc.id}')" class="btn-sm btn-danger" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    coursesGrid.innerHTML = html;
  });
}

// ============================================================
// إضافة/تعديل كورس
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = courseIdInput.value;
  const data = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    teacher: teacherInput.value.trim(),
    price: parseFloat(priceInput.value) || 0,
    duration: durationInput.value.trim() || "غير محدد",
    status: statusInput.value,
    academyId: academyId,
    updatedAt: serverTimestamp(),
  };

  if (!data.title) {
    showModalMessage("عنوان الكورس مطلوب", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "courses", id), data);
      showToast("تم تحديث الكورس بنجاح", "success");
    } else {
      data.createdAt = serverTimestamp();
      data.studentCount = 0;
      await addDoc(collection(db, "courses"), data);
      showToast("تم إضافة الكورس بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ الكورس: " + error.message, "error");
  }
});

// ============================================================
// تعديل كورس
// ============================================================
window.editCourse = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "courses", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      courseIdInput.value = id;
      titleInput.value = data.title || "";
      descriptionInput.value = data.description || "";
      teacherInput.value = data.teacher || "";
      priceInput.value = data.price || "";
      durationInput.value = data.duration || "";
      statusInput.value = data.status || "draft";
      modalTitle.textContent = "تعديل الكورس";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات الكورس", "error");
  }
};

// ============================================================
// حذف كورس
// ============================================================
window.deleteCourse = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف الكورس وجميع بياناته!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "courses", id));
      showToast("تم حذف الكورس بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف الكورس: " + error.message, "error");
    }
  }
};

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  courseIdInput.value = "";
  form.reset();
  statusInput.value = "draft";
  modalTitle.textContent = "إضافة كورس جديد";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

if (addCourseBtn) addCourseBtn.addEventListener("click", openModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ============================================================
// مراقبة حالة المصادقة
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  currentUser = user;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.role !== "owner") {
        showToast("ليس لديك صلاحية الوصول لهذه الصفحة", "error");
        setTimeout(() => (window.location.href = "../dashboard.html"), 1500);
        return;
      }
      academyId = data.academyId || user.uid;
      loadCourses();
    } else {
      window.location.href = "../register.html";
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات المستخدم:", error);
    showToast("فشل تحميل بيانات المستخدم", "error");
  }
});

// ============================================================
// تسجيل الخروج
// ============================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../login.html";
  } catch (error) {
    showToast("فشل تسجيل الخروج: " + error.message, "error");
  }
});

console.log("✅ Courses Module Loaded");
