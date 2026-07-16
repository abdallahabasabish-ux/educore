// ============================================================
// assets/js/pages/students.js
// إدارة الطلاب - عرض، إضافة، تعديل، حذف
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
let studentsRef = null;
let unsubscribe = null;

// دوال مساعدة للرسائل
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

// ============================================================
// تحميل البيانات عند تسجيل الدخول
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    studentsRef = collection(db, "students");
    loadStudents();
  }
});

// ============================================================
// عرض الطلاب (Realtime)
// ============================================================
function loadStudents() {
  if (unsubscribe) unsubscribe();
  const q = query(studentsRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("students-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">لا يوجد طلاب</td></tr>`;
      return;
    }
    let html = "";
    let counter = 1;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusClass = data.status === "active" ? "status-active" : data.status === "inactive" ? "status-inactive" : "status-pending";
      const statusText = data.status === "active" ? "نشط" : data.status === "inactive" ? "غير نشط" : "معلق";
      html += `
        <tr>
          <td class="px-6 py-4 text-sm">${counter++}</td>
          <td class="px-6 py-4 font-medium">${data.fullName || "غير محدد"}</td>
          <td class="px-6 py-4">${data.email || "-"}</td>
          <td class="px-6 py-4">${data.phone || "-"}</td>
          <td class="px-6 py-4">${data.courseName || "-"}</td>
          <td class="px-6 py-4"><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td class="px-6 py-4">
            <button onclick="editStudent('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3"><i class="fas fa-edit"></i></button>
            <button onclick="deleteStudent('${doc.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

// ============================================================
// إضافة / تعديل طالب
// ============================================================
document.getElementById("student-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("student-id").value;
  const data = {
    fullName: document.getElementById("student-name").value.trim(),
    email: document.getElementById("student-email").value.trim(),
    phone: document.getElementById("student-phone").value.trim(),
    courseName: document.getElementById("student-course").value.trim(),
    status: document.getElementById("student-status").value,
    academyId: academyId,
    updatedAt: new Date().toISOString(),
  };
  try {
    if (id) {
      await updateDoc(doc(db, "students", id), data);
      showSuccess("تم تحديث الطالب بنجاح");
    } else {
      data.createdAt = new Date().toISOString();
      await addDoc(studentsRef, data);
      showSuccess("تم إضافة الطالب بنجاح");
    }
    document.getElementById("student-modal").classList.remove("show");
  } catch (error) {
    showError("فشل حفظ الطالب: " + error.message);
  }
});

// ============================================================
// تعديل طالب
// ============================================================
window.editStudent = async (id) => {
  const docSnap = await getDoc(doc(db, "students", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("student-id").value = id;
    document.getElementById("student-name").value = data.fullName || "";
    document.getElementById("student-email").value = data.email || "";
    document.getElementById("student-phone").value = data.phone || "";
    document.getElementById("student-course").value = data.courseName || "";
    document.getElementById("student-status").value = data.status || "active";
    document.getElementById("modal-title").textContent = "تعديل الطالب";
    document.getElementById("student-modal").classList.add("show");
  }
};

// ============================================================
// حذف طالب
// ============================================================
window.deleteStudent = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "لن تتمكن من استعادة هذا الطالب!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });
  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "students", id));
      showSuccess("تم حذف الطالب بنجاح");
    } catch (error) {
      showError("فشل حذف الطالب: " + error.message);
    }
  }
};

console.log("✅ Students Module Loaded");
