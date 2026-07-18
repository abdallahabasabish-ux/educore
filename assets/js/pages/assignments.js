// ============================================================
// assets/js/pages/assignments.js
// إدارة الواجبات - عرض، إضافة، تعديل، حذف، تسليمات
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
    pending: "badge-pending",
    submitted: "badge-primary",
    graded: "badge-success",
    late: "badge-danger",
  };
  const labels = {
    pending: "قيد الانتظار",
    submitted: "تم التسليم",
    graded: "تم التصحيح",
    late: "متأخر",
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

// ============================================================
// عناصر DOM
// ============================================================
const assignmentsTableBody = document.getElementById("assignmentsTableBody");
const modal = document.getElementById("assignmentModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addAssignmentBtn = document.getElementById("addAssignmentBtn");
const form = document.getElementById("assignmentForm");
const assignmentIdInput = document.getElementById("assignmentId");
const titleInput = document.getElementById("assignmentTitle");
const courseSelect = document.getElementById("assignmentCourse");
const dueDateInput = document.getElementById("assignmentDueDate");
const pointsInput = document.getElementById("assignmentPoints");
const statusInput = document.getElementById("assignmentStatus");
const descriptionInput = document.getElementById("assignmentDescription");
const messageEl = document.getElementById("modalMessage");

// ===== عناصر الإحصائيات =====
const totalAssignmentsEl = document.getElementById("totalAssignments");
const pendingAssignmentsEl = document.getElementById("pendingAssignments");
const submittedAssignmentsEl = document.getElementById("submittedAssignments");
const gradedAssignmentsEl = document.getElementById("gradedAssignments");

let academyId = null;
let currentUser = null;
let unsubscribeAssignments = null;
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
// تحميل الواجبات
// ============================================================
function loadAssignments() {
  if (!academyId) return;

  const assignmentsRef = collection(db, "assignments");
  const q = query(
    assignmentsRef,
    where("academyId", "==", academyId),
    orderBy("dueDate", "asc")
  );

  unsubscribeAssignments = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      assignmentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-400 py-8">
            <i class="fas fa-tasks text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا توجد واجبات</p>
            <p class="text-xs mt-1">اضغط على "إضافة واجب" لإضافة أول واجب</p>
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

      html += `
        <tr>
          <td class="font-medium">${data.title || "بدون عنوان"}</td>
          <td>${courseName}</td>
          <td>${formatDate(data.dueDate)}</td>
          <td>${data.points || 0}</td>
          <td>${getStatusBadge(data.status || "pending")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="viewSubmissions('${doc.id}')" class="btn-sm btn-success" title="التسليمات">
              <i class="fas fa-file-upload"></i>
            </button>
            <button onclick="editAssignment('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteAssignment('${doc.id}')" class="btn-sm btn-danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    assignmentsTableBody.innerHTML = html;
    updateStats(snapshot);
  });
}

// ============================================================
// تحديث الإحصائيات
// ============================================================
function updateStats(snapshot) {
  if (!totalAssignmentsEl) return;

  let total = 0,
    pending = 0,
    submitted = 0,
    graded = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total++;

    if (data.status === "pending") pending++;
    else if (data.status === "submitted") submitted++;
    else if (data.status === "graded") graded++;
  });

  totalAssignmentsEl.textContent = total;
  pendingAssignmentsEl.textContent = pending;
  submittedAssignmentsEl.textContent = submitted;
  gradedAssignmentsEl.textContent = graded;
}

// ============================================================
// إضافة/تعديل واجب
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = assignmentIdInput.value;
  const courseId = courseSelect.value;

  // جلب اسم الكورس
  let courseName = "";
  if (courseId) {
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (courseDoc.exists()) {
      courseName = courseDoc.data().title || "";
    }
  }

  const data = {
    title: titleInput.value.trim(),
    courseId: courseId || null,
    courseName: courseName,
    dueDate: dueDateInput.value ? new Date(dueDateInput.value) : null,
    points: parseInt(pointsInput.value) || 0,
    status: statusInput.value,
    description: descriptionInput.value.trim(),
    academyId: academyId,
    updatedAt: serverTimestamp(),
  };

  if (!data.title) {
    showModalMessage("عنوان الواجب مطلوب", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "assignments", id), data);
      showToast("تم تحديث الواجب بنجاح", "success");
    } else {
      data.createdAt = serverTimestamp();
      data.submissionCount = 0;
      await addDoc(collection(db, "assignments"), data);
      showToast("تم إضافة الواجب بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ الواجب: " + error.message, "error");
  }
});

// ============================================================
// تعديل واجب
// ============================================================
window.editAssignment = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "assignments", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      assignmentIdInput.value = id;
      titleInput.value = data.title || "";
      courseSelect.value = data.courseId || "";
      dueDateInput.value = data.dueDate
        ? data.dueDate.toDate().toISOString().split("T")[0]
        : "";
      pointsInput.value = data.points || "";
      statusInput.value = data.status || "pending";
      descriptionInput.value = data.description || "";
      modalTitle.textContent = "تعديل الواجب";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات الواجب", "error");
  }
};

// ============================================================
// عرض تسليمات الطلاب
// ============================================================
window.viewSubmissions = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "assignments", id));
    if (!docSnap.exists()) {
      showToast("الواجب غير موجود", "error");
      return;
    }
    const data = docSnap.data();

    // جلب تسليمات الطلاب
    const submissionsRef = collection(db, "assignments", id, "submissions");
    const q = query(submissionsRef, orderBy("submittedAt", "desc"));
    const submissionsSnap = await getDocs(q);

    let submissionsHtml = "";
    if (submissionsSnap.empty) {
      submissionsHtml =
        '<p class="text-sm text-gray-400 text-center py-4">لا توجد تسليمات بعد</p>';
    } else {
      submissionsSnap.forEach((doc) => {
        const s = doc.data();
        const statusMap = {
          pending: "قيد الانتظار",
          submitted: "تم التسليم",
          graded: "تم التصحيح",
        };
        submissionsHtml += `
          <div class="flex items-center justify-between p-2 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] rounded-lg transition">
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium">${s.studentName || "طالب"}</span>
              <span class="text-xs text-[#555555]">${formatDate(s.submittedAt)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge ${s.status === 'graded' ? 'badge-success' : 'badge-pending'}">${statusMap[s.status] || s.status}</span>
              ${s.score !== undefined ? `<span class="text-sm font-bold ${s.score >= 70 ? 'text-[#22C55E]' : 'text-[#EF4444]'}">${s.score}/${data.points || 0}</span>` : ''}
              <button onclick="gradeSubmission('${doc.id}', '${id}')" class="text-xs text-[#2563EB] hover:underline">تصحيح</button>
            </div>
          </div>
        `;
      });
    }

    Swal.fire({
      title: `تسليمات الواجب: ${data.title}`,
      html: `
        <div class="text-right">
          <div class="grid grid-cols-3 gap-2 mb-4 text-sm">
            <div><span class="text-gray-500">عدد التسليمات:</span> <strong>${data.submissionCount || 0}</strong></div>
            <div><span class="text-gray-500">الدرجة:</span> <strong>${data.points || 0}</strong></div>
            <div><span class="text-gray-500">تاريخ التسليم:</span> <strong>${formatDate(data.dueDate)}</strong></div>
          </div>
          <div class="border-t border-[#e5e5e5] pt-3">
            <p class="text-sm font-semibold mb-2">التسليمات:</p>
            <div class="max-h-60 overflow-y-auto">${submissionsHtml}</div>
          </div>
        </div>
      `,
      confirmButtonColor: "#4B5563",
      confirmButtonText: "إغلاق",
      width: 550,
    });
  } catch (error) {
    showToast("فشل تحميل التسليمات: " + error.message, "error");
  }
};

// ============================================================
// تصحيح تسليم طالب
// ============================================================
window.gradeSubmission = async (submissionId, assignmentId) => {
  const { value: score } = await Swal.fire({
    title: "تصحيح التسليم",
    text: "أدخل درجة الطالب",
    input: "number",
    inputLabel: "الدرجة",
    inputPlaceholder: "0-100",
    inputAttributes: {
      min: 0,
      max: 100,
      step: 1,
    },
    showCancelButton: true,
    confirmButtonColor: "#2563EB",
    confirmButtonText: "حفظ",
    cancelButtonText: "إلغاء",
    preConfirm: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        Swal.showValidationMessage("يرجى إدخال درجة بين 0 و 100");
        return false;
      }
      return num;
    },
  });

  if (score !== undefined && score !== null) {
    try {
      await updateDoc(doc(db, "assignments", assignmentId, "submissions", submissionId), {
        score: score,
        status: "graded",
        gradedAt: serverTimestamp(),
      });

      // تحديث عدد التسليمات المصححة في الواجب الرئيسي
      const assignmentRef = doc(db, "assignments", assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      if (assignmentSnap.exists()) {
        const data = assignmentSnap.data();
        const gradedCount = (data.gradedCount || 0) + 1;
        await updateDoc(assignmentRef, {
          gradedCount: gradedCount,
          updatedAt: serverTimestamp(),
        });
      }

      showToast("تم حفظ الدرجة بنجاح", "success");
    } catch (error) {
      showToast("فشل حفظ الدرجة: " + error.message, "error");
    }
  }
};

// ============================================================
// حذف واجب
// ============================================================
window.deleteAssignment = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف الواجب وجميع تسليمات الطلاب!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      // حذف جميع التسليمات المرتبطة
      const submissionsRef = collection(db, "assignments", id, "submissions");
      const submissionsSnap = await getDocs(submissionsRef);
      const deletePromises = [];
      submissionsSnap.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);

      // حذف الواجب نفسه
      await deleteDoc(doc(db, "assignments", id));
      showToast("تم حذف الواجب بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف الواجب: " + error.message, "error");
    }
  }
};

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  assignmentIdInput.value = "";
  form.reset();
  statusInput.value = "pending";
  modalTitle.textContent = "إضافة واجب جديد";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

if (addAssignmentBtn) addAssignmentBtn.addEventListener("click", openModal);
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
      loadAssignments();
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

console.log("✅ Assignments Module Loaded");
