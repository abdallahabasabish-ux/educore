// ============================================================
// assets/js/pages/classes.js
// إدارة الحصص - عرض، إضافة، تعديل، حذف
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
    scheduled: "badge-primary",
    ongoing: "badge-success",
    completed: "badge-inactive",
    cancelled: "badge-danger",
  };
  const labels = {
    scheduled: "مجدولة",
    ongoing: "جارية",
    completed: "مكتملة",
    cancelled: "ملغية",
  };
  return `<span class="badge ${map[status] || "badge-pending"}">${
    labels[status] || status
  }</span>`;
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("ar");
}

function formatTime(timeString) {
  if (!timeString) return "-";
  return timeString;
}

// ============================================================
// عناصر DOM
// ============================================================
const classesTableBody = document.getElementById("classesTableBody");
const modal = document.getElementById("classModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addClassBtn = document.getElementById("addClassBtn");
const form = document.getElementById("classForm");
const classIdInput = document.getElementById("classId");
const titleInput = document.getElementById("classTitle");
const courseSelect = document.getElementById("classCourse");
const teacherSelect = document.getElementById("classTeacher");
const dateInput = document.getElementById("classDate");
const timeInput = document.getElementById("classTime");
const durationInput = document.getElementById("classDuration");
const statusInput = document.getElementById("classStatus");
const messageEl = document.getElementById("modalMessage");

// ===== عناصر الإحصائيات =====
const totalClassesEl = document.getElementById("totalClasses");
const todayClassesEl = document.getElementById("todayClasses");
const upcomingClassesEl = document.getElementById("upcomingClasses");
const completedClassesEl = document.getElementById("completedClasses");

let academyId = null;
let currentUser = null;
let unsubscribeClasses = null;
let unsubscribeCourses = null;
let unsubscribeTeachers = null;

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
// تحميل قائمة الكورسات للمودال
// ============================================================
function loadCoursesForSelect() {
  if (!academyId) return;

  const coursesRef = collection(db, "courses");
  const q = query(
    coursesRef,
    where("academyId", "==", academyId),
    where("status", "==", "active")
  );

  unsubscribeCourses = onSnapshot(q, (snapshot) => {
    let options = `<option value="">اختر كورس</option>`;
    snapshot.forEach((doc) => {
      const data = doc.data();
      options += `<option value="${doc.id}">${data.title || "بدون عنوان"}</option>`;
    });
    if (courseSelect) courseSelect.innerHTML = options;
  });
}

// ============================================================
// تحميل قائمة المدرسين للمودال
// ============================================================
function loadTeachersForSelect() {
  if (!academyId) return;

  const teachersRef = collection(db, "academies", academyId, "teachers");
  const q = query(teachersRef, where("status", "==", "active"));

  unsubscribeTeachers = onSnapshot(q, (snapshot) => {
    let options = `<option value="">اختر مدرس</option>`;
    snapshot.forEach((doc) => {
      const data = doc.data();
      options += `<option value="${doc.id}">${data.fullName || "غير محدد"}</option>`;
    });
    if (teacherSelect) teacherSelect.innerHTML = options;
  });
}

// ============================================================
// تحميل الحصص
// ============================================================
function loadClasses() {
  if (!academyId) return;

  const classesRef = collection(db, "classes");
  const q = query(
    classesRef,
    where("academyId", "==", academyId),
    orderBy("date", "desc")
  );

  unsubscribeClasses = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      classesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 py-8">
            <i class="fas fa-calendar-times text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا توجد حصص</p>
            <p class="text-xs mt-1">اضغط على "إضافة حصة" لإضافة أول حصة</p>
          </td>
        </tr>
      `;
      updateStats(snapshot);
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const courseName = data.courseName || "-";
      const teacherName = data.teacherName || "-";

      html += `
        <tr>
          <td class="font-medium">${data.title || "بدون عنوان"}</td>
          <td>${courseName}</td>
          <td>${teacherName}</td>
          <td>${formatDate(data.date)}</td>
          <td>${formatTime(data.time)}</td>
          <td>${getStatusBadge(data.status || "scheduled")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="editClass('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteClass('${doc.id}')" class="btn-sm btn-danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    classesTableBody.innerHTML = html;
    updateStats(snapshot);
  });
}

// ============================================================
// تحديث الإحصائيات
// ============================================================
function updateStats(snapshot) {
  if (!totalClassesEl) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  let total = 0,
    todayCount = 0,
    upcomingCount = 0,
    completedCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total++;

    // حصص اليوم
    if (data.date && data.date.toDate) {
      const classDate = data.date.toDate();
      classDate.setHours(0, 0, 0, 0);
      if (classDate.getTime() === today.getTime()) {
        todayCount++;
      }
    }

    // حصص قادمة
    if (data.status === "scheduled") {
      upcomingCount++;
    }

    // حصص مكتملة
    if (data.status === "completed") {
      completedCount++;
    }
  });

  totalClassesEl.textContent = total;
  todayClassesEl.textContent = todayCount;
  upcomingClassesEl.textContent = upcomingCount;
  completedClassesEl.textContent = completedCount;
}

// ============================================================
// إضافة/تعديل حصة
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = classIdInput.value;
  const courseId = courseSelect.value;
  const teacherId = teacherSelect.value;

  // جلب أسماء الكورس والمدرس
  let courseName = "";
  let teacherName = "";

  if (courseId) {
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (courseDoc.exists()) {
      courseName = courseDoc.data().title || "";
    }
  }

  if (teacherId) {
    const teacherDoc = await getDoc(
      doc(db, "academies", academyId, "teachers", teacherId)
    );
    if (teacherDoc.exists()) {
      teacherName = teacherDoc.data().fullName || "";
    }
  }

  const data = {
    title: titleInput.value.trim(),
    courseId: courseId || null,
    courseName: courseName,
    teacherId: teacherId || null,
    teacherName: teacherName,
    date: dateInput.value ? new Date(dateInput.value) : null,
    time: timeInput.value || null,
    duration: durationInput.value || null,
    status: statusInput.value,
    academyId: academyId,
    updatedAt: serverTimestamp(),
  };

  if (!data.title) {
    showModalMessage("عنوان الحصة مطلوب", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "classes", id), data);
      showToast("تم تحديث الحصة بنجاح", "success");
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "classes"), data);
      showToast("تم إضافة الحصة بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ الحصة: " + error.message, "error");
  }
});

// ============================================================
// تعديل حصة
// ============================================================
window.editClass = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "classes", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      classIdInput.value = id;
      titleInput.value = data.title || "";
      courseSelect.value = data.courseId || "";
      teacherSelect.value = data.teacherId || "";
      dateInput.value = data.date
        ? data.date.toDate().toISOString().split("T")[0]
        : "";
      timeInput.value = data.time || "";
      durationInput.value = data.duration || "";
      statusInput.value = data.status || "scheduled";
      modalTitle.textContent = "تعديل الحصة";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات الحصة", "error");
  }
};

// ============================================================
// حذف حصة
// ============================================================
window.deleteClass = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف هذه الحصة!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "classes", id));
      showToast("تم حذف الحصة بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف الحصة: " + error.message, "error");
    }
  }
};

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  classIdInput.value = "";
  form.reset();
  statusInput.value = "scheduled";
  modalTitle.textContent = "إضافة حصة جديدة";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

if (addClassBtn) addClassBtn.addEventListener("click", openModal);
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
      loadCoursesForSelect();
      loadTeachersForSelect();
      loadClasses();
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

console.log("✅ Classes Module Loaded");
