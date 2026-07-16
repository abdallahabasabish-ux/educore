// ============================================================
// assets/js/pages/classes.js
// إدارة الحصص - قراءة، إضافة، تعديل، حذف
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
let classesRef = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    classesRef = collection(db, "classes");
    loadClasses();
    loadStats();
    loadCoursesForFilter();
  }
});

function loadClasses() {
  if (unsubscribe) unsubscribe();
  const q = query(classesRef, where("academyId", "==", academyId), orderBy("date", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("classes-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">لا توجد حصص</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusClass = `status-${data.status}`;
      const statusLabels = {
        scheduled: "مجدولة",
        ongoing: "جارية",
        completed: "مكتملة",
        cancelled: "ملغية"
      };
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">${data.title || "بدون عنوان"}</td>
          <td class="px-6 py-4">${data.courseName || "-"}</td>
          <td class="px-6 py-4">${data.teacherName || "-"}</td>
          <td class="px-6 py-4">${data.date ? new Date(data.date).toLocaleDateString("ar") : "-"}</td>
          <td class="px-6 py-4">${data.time || "-"}</td>
          <td class="px-6 py-4">
            <span class="status-badge ${statusClass}">${statusLabels[data.status] || data.status}</span>
          </td>
          <td class="px-6 py-4">
            <button onclick="editClass('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteClass('${doc.id}')" class="text-red-500 hover:text-red-700">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  });
}

async function loadStats() {
  try {
    const q = query(classesRef, where("academyId", "==", academyId));
    const snapshot = await getDocs(q);
    const total = snapshot.size;
    document.getElementById("total-classes").textContent = total;

    const today = new Date().toDateString();
    let todayCount = 0, upcomingCount = 0, completedCount = 0;
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date) {
        const classDate = new Date(data.date);
        if (classDate.toDateString() === today) todayCount++;
        if (classDate > now && data.status !== "cancelled") upcomingCount++;
        if (data.status === "completed") completedCount++;
      }
    });

    document.getElementById("today-classes-count").textContent = todayCount;
    document.getElementById("upcoming-classes").textContent = upcomingCount;
    document.getElementById("completed-classes").textContent = completedCount;
  } catch (error) {
    console.error("خطأ في تحميل الإحصائيات:", error);
  }
}

async function loadCoursesForFilter() {
  const coursesRef = collection(db, "courses");
  const q = query(coursesRef, where("academyId", "==", academyId));
  const snapshot = await getDocs(q);
  const select = document.getElementById("filter-course");
  snapshot.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.title || "بدون عنوان";
    select.appendChild(option);
  });
}

document.getElementById("add-class-btn")?.addEventListener("click", () => {
  alert("سيتم فتح نموذج إضافة حصة جديدة");
});

window.editClass = (id) => {
  alert(`تعديل الحصة: ${id}`);
};

window.deleteClass = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذه الحصة؟")) {
    try {
      await deleteDoc(doc(db, "classes", id));
      alert("تم حذف الحصة بنجاح");
      loadStats();
    } catch (error) {
      alert("فشل حذف الحصة: " + error.message);
    }
  }
};

document.getElementById("search-btn")?.addEventListener("click", () => {
  // يمكن تطبيق الفلترة هنا
  loadClasses();
});

console.log("✅ Classes Module Loaded");
