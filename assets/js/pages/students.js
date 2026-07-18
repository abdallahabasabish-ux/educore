// ============================================================
// assets/js/pages/students.js
// إدارة الطلاب - عرض، إضافة، تعديل، حذف، مجموعات
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
  setDoc,
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
    inactive: "badge-inactive",
    pending: "badge-pending",
  };
  const labels = {
    active: "نشط",
    inactive: "غير نشط",
    pending: "معلق",
  };
  return `<span class="badge ${map[status] || "badge-pending"}">${
    labels[status] || status
  }</span>`;
}

// ============================================================
// عناصر DOM
// ============================================================
const tbody = document.getElementById("studentsTableBody");
const groupsContainer = document.getElementById("groupsContainer");
const modal = document.getElementById("studentModal");
const groupModal = document.getElementById("groupModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const closeGroupModalBtn = document.getElementById("closeGroupModalBtn");
const addStudentBtn = document.getElementById("addStudentBtn");
const addGroupBtn = document.getElementById("addGroupBtn");
const form = document.getElementById("studentForm");
const groupForm = document.getElementById("groupForm");
const studentIdInput = document.getElementById("studentId");
const nameInput = document.getElementById("studentName");
const emailInput = document.getElementById("studentEmail");
const phoneInput = document.getElementById("studentPhone");
const groupSelect = document.getElementById("studentGroup");
const statusInput = document.getElementById("studentStatus");
const messageEl = document.getElementById("modalMessage");
const groupMessageEl = document.getElementById("groupMessage");
const groupNameInput = document.getElementById("groupName");

let academyId = null;
let currentUser = null;
let unsubscribeStudents = null;
let unsubscribeGroups = null;

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

function showGroupMessage(text, type = "error") {
  groupMessageEl.textContent = text;
  groupMessageEl.className = `message-box ${type}`;
  clearTimeout(groupMessageEl._timeout);
  groupMessageEl._timeout = setTimeout(() => {
    groupMessageEl.className = "message-box";
    groupMessageEl.textContent = "";
  }, 5000);
}

// ============================================================
// تحميل المجموعات
// ============================================================
function loadGroups() {
  if (!academyId) return;

  const groupsRef = collection(db, "academies", academyId, "groups");
  const q = query(groupsRef, orderBy("name", "asc"));

  unsubscribeGroups = onSnapshot(q, (snapshot) => {
    // تحديث حاوية المجموعات
    let html = `<span class="group-badge" data-group="all">جميع الطلاب</span>`;
    const groupSelectOptions = `<option value="all">جميع الطلاب</option>`;

    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `<span class="group-badge" data-group="${doc.id}">${data.name}</span>`;
    });

    if (groupsContainer) groupsContainer.innerHTML = html;

    // تحديث قائمة المجموعات في المودال
    let options = `<option value="all">جميع الطلاب</option>`;
    snapshot.forEach((doc) => {
      const data = doc.data();
      options += `<option value="${doc.id}">${data.name}</option>`;
    });
    if (groupSelect) groupSelect.innerHTML = options;

    // إضافة حدث النقر على المجموعات للتصفية
    document.querySelectorAll(".group-badge").forEach((badge) => {
      badge.addEventListener("click", function () {
        const groupId = this.dataset.group;
        document.querySelectorAll(".group-badge").forEach((b) =>
          b.classList.remove("active")
        );
        this.classList.add("active");
        filterStudentsByGroup(groupId);
      });
    });

    // تفعيل "جميع الطلاب" افتراضياً
    const allBadge = document.querySelector('.group-badge[data-group="all"]');
    if (allBadge) allBadge.classList.add("active");
  });
}

// ============================================================
// تحميل الطلاب
// ============================================================
function loadStudents() {
  if (!academyId) return;

  const studentsRef = collection(db, "academies", academyId, "students");
  const q = query(studentsRef, orderBy("createdAt", "desc"));

  unsubscribeStudents = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-400 py-8">
            <i class="fas fa-user-graduate text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا يوجد طلاب</p>
            <p class="text-xs mt-1">اضغط على "إضافة طالب" لإضافة أول طالب</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const groupName = data.groupId
        ? `<span class="text-xs text-[#555555]">${data.groupName || "بدون مجموعة"}</span>`
        : `<span class="text-xs text-[#555555]">بدون مجموعة</span>`;

      html += `
        <tr>
          <td class="font-medium">${data.fullName || "غير محدد"}</td>
          <td>${data.email || "-"}</td>
          <td>${data.phone || "-"}</td>
          <td>${groupName}</td>
          <td>${getStatusBadge(data.status || "pending")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="editStudent('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteStudent('${doc.id}')" class="btn-sm btn-danger" title="حذف">
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
// تصفية الطلاب حسب المجموعة
// ============================================================
function filterStudentsByGroup(groupId) {
  if (!academyId) return;

  const studentsRef = collection(db, "academies", academyId, "students");
  let q;

  if (groupId === "all") {
    q = query(studentsRef, orderBy("createdAt", "desc"));
  } else {
    q = query(
      studentsRef,
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );
  }

  if (unsubscribeStudents) unsubscribeStudents();

  unsubscribeStudents = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-400 py-8">
            <i class="fas fa-users text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا يوجد طلاب في هذه المجموعة</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const groupName = data.groupId
        ? `<span class="text-xs text-[#555555]">${data.groupName || "بدون مجموعة"}</span>`
        : `<span class="text-xs text-[#555555]">بدون مجموعة</span>`;

      html += `
        <tr>
          <td class="font-medium">${data.fullName || "غير محدد"}</td>
          <td>${data.email || "-"}</td>
          <td>${data.phone || "-"}</td>
          <td>${groupName}</td>
          <td>${getStatusBadge(data.status || "pending")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="editStudent('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteStudent('${doc.id}')" class="btn-sm btn-danger" title="حذف">
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
// إضافة/تعديل طالب
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = studentIdInput.value;
  const groupId = groupSelect.value;
  const groupName = groupSelect.options[groupSelect.selectedIndex]?.text || "";

  const data = {
    fullName: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    groupId: groupId === "all" ? null : groupId,
    groupName: groupId === "all" ? null : groupName,
    status: statusInput.value,
    updatedAt: serverTimestamp(),
  };

  if (!data.fullName || !data.email) {
    showModalMessage("الاسم والبريد الإلكتروني مطلوبان", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "academies", academyId, "students", id), data);
      showToast("تم تحديث الطالب بنجاح", "success");
    } else {
      // التحقق من عدم تكرار البريد الإلكتروني
      const studentsRef = collection(db, "academies", academyId, "students");
      const q = query(studentsRef, where("email", "==", data.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        showModalMessage("البريد الإلكتروني مستخدم بالفعل", "error");
        return;
      }

      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "academies", academyId, "students"), data);

      // تحديث عدد الطلاب في الأكاديمية
      const academyRef = doc(db, "academies", academyId);
      const academySnap = await getDoc(academyRef);
      if (academySnap.exists()) {
        const currentCount = academySnap.data().studentCount || 0;
        await updateDoc(academyRef, {
          studentCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }

      showToast("تم إضافة الطالب بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ الطالب: " + error.message, "error");
  }
});

// ============================================================
// تعديل طالب
// ============================================================
window.editStudent = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "academies", academyId, "students", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      studentIdInput.value = id;
      nameInput.value = data.fullName || "";
      emailInput.value = data.email || "";
      phoneInput.value = data.phone || "";
      groupSelect.value = data.groupId || "all";
      statusInput.value = data.status || "active";
      modalTitle.textContent = "تعديل الطالب";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات الطالب", "error");
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
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "academies", academyId, "students", id));

      // تحديث عدد الطلاب في الأكاديمية
      const academyRef = doc(db, "academies", academyId);
      const academySnap = await getDoc(academyRef);
      if (academySnap.exists()) {
        const currentCount = academySnap.data().studentCount || 0;
        await updateDoc(academyRef, {
          studentCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        });
      }

      showToast("تم حذف الطالب بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف الطالب: " + error.message, "error");
    }
  }
};

// ============================================================
// إنشاء مجموعة جديدة
// ============================================================
groupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = groupNameInput.value.trim();
  if (!name) {
    showGroupMessage("يرجى إدخال اسم المجموعة", "error");
    return;
  }

  try {
    const groupsRef = collection(db, "academies", academyId, "groups");
    await addDoc(groupsRef, {
      name: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    showToast("تم إنشاء المجموعة بنجاح", "success");
    groupNameInput.value = "";
    closeGroupModal();
  } catch (error) {
    showGroupMessage("فشل إنشاء المجموعة: " + error.message, "error");
  }
});

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  studentIdInput.value = "";
  form.reset();
  statusInput.value = "active";
  modalTitle.textContent = "إضافة طالب جديد";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

function openGroupModal() {
  groupNameInput.value = "";
  groupMessageEl.className = "message-box";
  groupMessageEl.textContent = "";
  groupModal.classList.add("show");
}

function closeGroupModal() {
  groupModal.classList.remove("show");
}

if (addStudentBtn) addStudentBtn.addEventListener("click", openModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (addGroupBtn) addGroupBtn.addEventListener("click", openGroupModal);
if (closeGroupModalBtn)
  closeGroupModalBtn.addEventListener("click", closeGroupModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
groupModal.addEventListener("click", (e) => {
  if (e.target === groupModal) closeGroupModal();
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
      loadGroups();
      loadStudents();
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

console.log("✅ Students Module Loaded");
