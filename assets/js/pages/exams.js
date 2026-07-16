// ============================================================
// assets/js/pages/exams.js
// إدارة الامتحانات - إنشاء، عرض، تعديل، حذف
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
let examsRef = null;
let coursesRef = null;
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
    examsRef = collection(db, "exams");
    coursesRef = collection(db, "courses");
    loadExams();
    loadCoursesForSelect();
    loadStats();
  }
});

// ============================================================
// 2. تحميل الامتحانات
// ============================================================
function loadExams() {
  if (unsubscribe) unsubscribe();
  const q = query(examsRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("exams-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">لا توجد امتحانات</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusColors = {
        active: "text-green-600 bg-green-50",
        draft: "text-yellow-600 bg-yellow-50",
        closed: "text-gray-600 bg-gray-50",
      };
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">${data.title || "بدون عنوان"}</td>
          <td class="px-6 py-4">${data.courseName || "-"}</td>
          <td class="px-6 py-4">${data.questionCount || 0}</td>
          <td class="px-6 py-4">${data.duration || 0} دقائق</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "active" ? "نشط" : data.status === "draft" ? "مسودة" : "مغلق"}
            </span>
          </td>
          <td class="px-6 py-4">
            <button onclick="editExam('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="viewExamResults('${doc.id}')" class="text-blue-500 hover:text-blue-700 ml-3">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button onclick="deleteExam('${doc.id}')" class="text-red-500 hover:text-red-700">
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
// 3. تحميل قائمة الكورسات للاختيار
// ============================================================
function loadCoursesForSelect() {
  const q = query(coursesRef, where("academyId", "==", academyId));
  getDocs(q).then((snapshot) => {
    const select = document.getElementById("exam-course");
    snapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = data.title || "بدون عنوان";
      select.appendChild(option);
    });
  });
}

// ============================================================
// 4. تحميل الإحصائيات
// ============================================================
async function loadStats() {
  try {
    const q = query(examsRef, where("academyId", "==", academyId));
    const snapshot = await getDocs(q);
    const total = snapshot.size;
    document.getElementById("total-exams").textContent = total;

    const activeQuery = query(examsRef, where("academyId", "==", academyId), where("status", "==", "active"));
    const activeSnapshot = await getDocs(activeQuery);
    document.getElementById("active-exams").textContent = activeSnapshot.size;

    // متوسط النتائج (مثال)
    document.getElementById("avg-score").textContent = "78%";
    document.getElementById("total-participants").textContent = "156";
  } catch (error) {
    console.error("خطأ في تحميل الإحصائيات:", error);
  }
}

// ============================================================
// 5. إضافة/تعديل امتحان
// ============================================================
document.getElementById("exam-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("exam-id").value;
  const courseId = document.getElementById("exam-course").value;
  const courseName = document.getElementById("exam-course").selectedOptions[0]?.text || "";
  
  const data = {
    title: document.getElementById("exam-title").value.trim(),
    courseId: courseId,
    courseName: courseName,
    questionCount: parseInt(document.getElementById("exam-questions").value) || 0,
    duration: parseInt(document.getElementById("exam-duration").value) || 0,
    status: document.getElementById("exam-status").value,
    description: document.getElementById("exam-description").value.trim(),
    academyId: academyId,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (id) {
      await updateDoc(doc(db, "exams", id), data);
      alert("تم تحديث الامتحان بنجاح");
    } else {
      data.createdAt = new Date().toISOString();
      await addDoc(examsRef, data);
      alert("تم إنشاء الامتحان بنجاح");
    }
    closeExamModal();
    loadStats();
  } catch (error) {
    alert("فشل حفظ الامتحان: " + error.message);
  }
});

// ============================================================
// 6. تعديل امتحان
// ============================================================
window.editExam = async (id) => {
  const docSnap = await getDoc(doc(db, "exams", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("exam-id").value = id;
    document.getElementById("exam-title").value = data.title || "";
    document.getElementById("exam-course").value = data.courseId || "";
    document.getElementById("exam-questions").value = data.questionCount || "";
    document.getElementById("exam-duration").value = data.duration || "";
    document.getElementById("exam-status").value = data.status || "draft";
    document.getElementById("exam-description").value = data.description || "";
    document.getElementById("exam-modal-title").textContent = "تعديل الامتحان";
    document.getElementById("exam-modal").classList.remove("hidden");
  }
};

// ============================================================
// 7. عرض نتائج الامتحان
// ============================================================
window.viewExamResults = (id) => {
  alert(`عرض نتائج الامتحان: ${id}`);
  // يمكن فتح صفحة نتائج أو مودال
};

// ============================================================
// 8. حذف امتحان
// ============================================================
window.deleteExam = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
    try {
      await deleteDoc(doc(db, "exams", id));
      alert("تم حذف الامتحان بنجاح");
      loadStats();
    } catch (error) {
      alert("فشل حذف الامتحان: " + error.message);
    }
  }
};

// ============================================================
// 9. التحكم في المودال
// ============================================================
document.getElementById("add-exam-btn")?.addEventListener("click", () => {
  document.getElementById("exam-id").value = "";
  document.getElementById("exam-title").value = "";
  document.getElementById("exam-course").value = "";
  document.getElementById("exam-questions").value = "";
  document.getElementById("exam-duration").value = "";
  document.getElementById("exam-status").value = "draft";
  document.getElementById("exam-description").value = "";
  document.getElementById("exam-modal-title").textContent = "إنشاء امتحان جديد";
  document.getElementById("exam-modal").classList.remove("hidden");
});

document.getElementById("close-exam-modal")?.addEventListener("click", closeExamModal);
document.getElementById("exam-modal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeExamModal();
});

function closeExamModal() {
  document.getElementById("exam-modal").classList.add("hidden");
}

console.log("✅ Exams Module Loaded");
