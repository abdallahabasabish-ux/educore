// ============================================================
// assets/js/pages/exams.js
// إدارة الامتحانات - عرض، إضافة، تعديل، حذف، نتائج
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
    active: "badge-active",
    draft: "badge-pending",
    closed: "badge-inactive",
  };
  const labels = {
    active: "نشط",
    draft: "مسودة",
    closed: "مغلق",
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
const examsTableBody = document.getElementById("examsTableBody");
const modal = document.getElementById("examModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addExamBtn = document.getElementById("addExamBtn");
const form = document.getElementById("examForm");
const examIdInput = document.getElementById("examId");
const titleInput = document.getElementById("examTitle");
const courseSelect = document.getElementById("examCourse");
const questionCountInput = document.getElementById("examQuestions");
const durationInput = document.getElementById("examDuration");
const statusInput = document.getElementById("examStatus");
const descriptionInput = document.getElementById("examDescription");
const messageEl = document.getElementById("modalMessage");

// ===== عناصر الإحصائيات =====
const totalExamsEl = document.getElementById("totalExams");
const activeExamsEl = document.getElementById("activeExams");
const avgScoreEl = document.getElementById("avgScore");
const totalParticipantsEl = document.getElementById("totalParticipants");

let academyId = null;
let currentUser = null;
let unsubscribeExams = null;
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
// تحميل الامتحانات
// ============================================================
function loadExams() {
  if (!academyId) return;

  const examsRef = collection(db, "exams");
  const q = query(
    examsRef,
    where("academyId", "==", academyId),
    orderBy("createdAt", "desc")
  );

  unsubscribeExams = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      examsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-400 py-8">
            <i class="fas fa-pencil-alt text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا توجد امتحانات</p>
            <p class="text-xs mt-1">اضغط على "إنشاء امتحان" لإضافة أول امتحان</p>
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
          <td>${data.questionCount || 0}</td>
          <td>${data.duration || 0} دقائق</td>
          <td>${getStatusBadge(data.status || "draft")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="viewExamResults('${doc.id}')" class="btn-sm btn-success" title="النتائج">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button onclick="editExam('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteExam('${doc.id}')" class="btn-sm btn-danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    examsTableBody.innerHTML = html;
    updateStats(snapshot);
  });
}

// ============================================================
// تحديث الإحصائيات
// ============================================================
function updateStats(snapshot) {
  if (!totalExamsEl) return;

  let total = 0,
    active = 0,
    totalParticipants = 0,
    totalScores = 0,
    scoreCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total++;

    if (data.status === "active") {
      active++;
    }

    // حساب عدد المشاركين والدرجات (تقريبي)
    if (data.participants) {
      totalParticipants += data.participants || 0;
    }
    if (data.averageScore) {
      totalScores += data.averageScore || 0;
      scoreCount++;
    }
  });

  totalExamsEl.textContent = total;
  activeExamsEl.textContent = active;
  totalParticipantsEl.textContent = totalParticipants || 0;

  const avg = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;
  avgScoreEl.textContent = avg > 0 ? avg + "%" : "0%";
}

// ============================================================
// إضافة/تعديل امتحان
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = examIdInput.value;
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
    questionCount: parseInt(questionCountInput.value) || 0,
    duration: parseInt(durationInput.value) || 0,
    status: statusInput.value,
    description: descriptionInput.value.trim(),
    academyId: academyId,
    updatedAt: serverTimestamp(),
  };

  if (!data.title) {
    showModalMessage("عنوان الامتحان مطلوب", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "exams", id), data);
      showToast("تم تحديث الامتحان بنجاح", "success");
    } else {
      data.createdAt = serverTimestamp();
      data.participants = 0;
      data.averageScore = 0;
      await addDoc(collection(db, "exams"), data);
      showToast("تم إنشاء الامتحان بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ الامتحان: " + error.message, "error");
  }
});

// ============================================================
// تعديل امتحان
// ============================================================
window.editExam = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "exams", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      examIdInput.value = id;
      titleInput.value = data.title || "";
      courseSelect.value = data.courseId || "";
      questionCountInput.value = data.questionCount || "";
      durationInput.value = data.duration || "";
      statusInput.value = data.status || "draft";
      descriptionInput.value = data.description || "";
      modalTitle.textContent = "تعديل الامتحان";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات الامتحان", "error");
  }
};

// ============================================================
// عرض نتائج الامتحان
// ============================================================
window.viewExamResults = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "exams", id));
    if (docSnap.exists()) {
      const data = docSnap.data();

      // جلب نتائج الامتحان من مجموعة فرعية (إذا وجدت)
      const resultsRef = collection(db, "exams", id, "results");
      const q = query(resultsRef, orderBy("score", "desc"));
      const resultsSnap = await getDocs(q);

      let resultsHtml = "";
      if (resultsSnap.empty) {
        resultsHtml =
          '<p class="text-sm text-gray-400 text-center py-4">لا توجد نتائج بعد</p>';
      } else {
        resultsSnap.forEach((doc) => {
          const r = doc.data();
          resultsHtml += `
            <div class="flex items-center justify-between p-2 border-b border-[#f1f5f9] last:border-0">
              <span class="text-sm">${r.studentName || "طالب"}</span>
              <span class="text-sm font-bold ${r.score >= 70 ? 'text-[#22C55E]' : r.score >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}">${r.score || 0}%</span>
            </div>
          `;
        });
      }

      Swal.fire({
        title: `نتائج الامتحان: ${data.title}`,
        html: `
          <div class="text-right">
            <div class="grid grid-cols-3 gap-2 mb-4 text-sm">
              <div><span class="text-gray-500">المشاركون:</span> <strong>${data.participants || 0}</strong></div>
              <div><span class="text-gray-500">متوسط الدرجة:</span> <strong>${data.averageScore || 0}%</strong></div>
              <div><span class="text-gray-500">المدة:</span> <strong>${data.duration || 0} دقائق</strong></div>
            </div>
            <div class="border-t border-[#e5e5e5] pt-3">
              <p class="text-sm font-semibold mb-2">النتائج التفصيلية:</p>
              <div class="max-h-60 overflow-y-auto">${resultsHtml}</div>
            </div>
          </div>
        `,
        confirmButtonColor: "#4B5563",
        confirmButtonText: "إغلاق",
        width: 500,
      });
    }
  } catch (error) {
    showToast("فشل تحميل النتائج: " + error.message, "error");
  }
};

// ============================================================
// حذف امتحان
// ============================================================
window.deleteExam = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف الامتحان وجميع بياناته!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "exams", id));
      showToast("تم حذف الامتحان بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف الامتحان: " + error.message, "error");
    }
  }
};

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  examIdInput.value = "";
  form.reset();
  statusInput.value = "draft";
  modalTitle.textContent = "إنشاء امتحان جديد";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

if (addExamBtn) addExamBtn.addEventListener("click", openModal);
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
      loadExams();
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

console.log("✅ Exams Module Loaded");
