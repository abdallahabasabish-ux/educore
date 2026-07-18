// ============================================================
// assets/js/pages/teachers.js
// إدارة المدرسين - عرض، إضافة، تعديل، حذف، مجموعات
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

function getSpecializationLabel(specialization) {
  const map = {
    math: "رياضيات",
    arabic: "لغة عربية",
    english: "لغة إنجليزية",
    science: "علوم",
    programming: "برمجة",
    design: "تصميم",
    marketing: "تسويق",
    business: "إدارة أعمال",
    other: "أخرى",
  };
  return map[specialization] || specialization || "غير محدد";
}

// ============================================================
// عناصر DOM
// ============================================================
const teachersGrid = document.getElementById("teachersGrid");
const modal = document.getElementById("teacherModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const form = document.getElementById("teacherForm");
const teacherIdInput = document.getElementById("teacherId");
const nameInput = document.getElementById("teacherName");
const emailInput = document.getElementById("teacherEmail");
const phoneInput = document.getElementById("teacherPhone");
const specializationInput = document.getElementById("teacherSpecialization");
const bioInput = document.getElementById("teacherBio");
const statusInput = document.getElementById("teacherStatus");
const messageEl = document.getElementById("modalMessage");

// ===== عناصر المجموعات =====
const groupsContainer = document.getElementById("groupsContainer");
const groupModal = document.getElementById("groupModal");
const closeGroupModalBtn = document.getElementById("closeGroupModalBtn");
const addGroupBtn = document.getElementById("addGroupBtn");
const groupForm = document.getElementById("groupForm");
const groupNameInput = document.getElementById("groupName");
const groupMessageEl = document.getElementById("groupMessage");
const groupSelect = document.getElementById("teacherGroup");

let academyId = null;
let currentUser = null;
let unsubscribeTeachers = null;
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
// تحميل مجموعات المدرسين
// ============================================================
function loadTeacherGroups() {
  if (!academyId) return;

  const groupsRef = collection(db, "academies", academyId, "teacherGroups");
  const q = query(groupsRef, orderBy("name", "asc"));

  unsubscribeGroups = onSnapshot(q, (snapshot) => {
    // تحديث حاوية المجموعات
    let html = `<span class="group-badge" data-group="all">جميع المدرسين</span>`;
    let options = `<option value="all">جميع المدرسين</option>`;

    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `<span class="group-badge" data-group="${doc.id}">${data.name}</span>`;
      options += `<option value="${doc.id}">${data.name}</option>`;
    });

    if (groupsContainer) groupsContainer.innerHTML = html;
    if (groupSelect) groupSelect.innerHTML = options;

    // إضافة حدث النقر على المجموعات للتصفية
    document.querySelectorAll(".group-badge").forEach((badge) => {
      badge.addEventListener("click", function () {
        const groupId = this.dataset.group;
        document.querySelectorAll(".group-badge").forEach((b) =>
          b.classList.remove("active")
        );
        this.classList.add("active");
        filterTeachersByGroup(groupId);
      });
    });

    // تفعيل "جميع المدرسين" افتراضياً
    const allBadge = document.querySelector('.group-badge[data-group="all"]');
    if (allBadge) allBadge.classList.add("active");
  });
}

// ============================================================
// تحميل المدرسين
// ============================================================
function loadTeachers() {
  if (!academyId) return;

  const teachersRef = collection(db, "academies", academyId, "teachers");
  const q = query(teachersRef, orderBy("createdAt", "desc"));

  unsubscribeTeachers = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      teachersGrid.innerHTML = `
        <div class="col-span-full text-center text-gray-400 py-12">
          <i class="fas fa-chalkboard-teacher text-4xl opacity-30 block mb-3"></i>
          <p class="text-sm">لا يوجد مدرسون</p>
          <p class="text-xs mt-1">اضغط على "إضافة مدرس" لإضافة أول مدرس</p>
        </div>
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
        <div class="teacher-card bg-white rounded-2xl border border-[#E5E5E5] p-5 hover:shadow-lg transition-all hover:-translate-y-1">
          <div class="flex items-start gap-4">
            <img src="${data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || 'T')}&size=60&background=4B5563&color=fff`}" 
                 alt="${data.fullName}" 
                 class="w-14 h-14 rounded-full border-2 border-[#E5E5E5] object-cover" 
                 loading="lazy" />
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-bold text-[#000000]">${data.fullName || "غير محدد"}</h3>
                  <p class="text-sm text-[#555555]">${getSpecializationLabel(data.specialization)}</p>
                </div>
                ${getStatusBadge(data.status || "pending")}
              </div>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#555555]">
                <span><i class="fas fa-envelope ml-1"></i> ${data.email || "-"}</span>
                <span><i class="fas fa-phone ml-1"></i> ${data.phone || "-"}</span>
                <span><i class="fas fa-users ml-1"></i> ${groupName}</span>
              </div>
              ${data.bio ? `<p class="text-sm text-[#555555] mt-2 line-clamp-2">${data.bio}</p>` : ''}
              <div class="flex gap-2 mt-3">
                <button onclick="editTeacher('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTeacher('${doc.id}')" class="btn-sm btn-danger" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    teachersGrid.innerHTML = html;
  });
}

// ============================================================
// تصفية المدرسين حسب المجموعة
// ============================================================
function filterTeachersByGroup(groupId) {
  if (!academyId) return;

  const teachersRef = collection(db, "academies", academyId, "teachers");
  let q;

  if (groupId === "all") {
    q = query(teachersRef, orderBy("createdAt", "desc"));
  } else {
    q = query(
      teachersRef,
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );
  }

  if (unsubscribeTeachers) unsubscribeTeachers();

  unsubscribeTeachers = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      teachersGrid.innerHTML = `
        <div class="col-span-full text-center text-gray-400 py-12">
          <i class="fas fa-users text-4xl opacity-30 block mb-3"></i>
          <p class="text-sm">لا يوجد مدرسون في هذه المجموعة</p>
        </div>
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
        <div class="teacher-card bg-white rounded-2xl border border-[#E5E5E5] p-5 hover:shadow-lg transition-all hover:-translate-y-1">
          <div class="flex items-start gap-4">
            <img src="${data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || 'T')}&size=60&background=4B5563&color=fff`}" 
                 alt="${data.fullName}" 
                 class="w-14 h-14 rounded-full border-2 border-[#E5E5E5] object-cover" 
                 loading="lazy" />
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-bold text-[#000000]">${data.fullName || "غير محدد"}</h3>
                  <p class="text-sm text-[#555555]">${getSpecializationLabel(data.specialization)}</p>
                </div>
                ${getStatusBadge(data.status || "pending")}
              </div>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#555555]">
                <span><i class="fas fa-envelope ml-1"></i> ${data.email || "-"}</span>
                <span><i class="fas fa-phone ml-1"></i> ${data.phone || "-"}</span>
                <span><i class="fas fa-users ml-1"></i> ${groupName}</span>
              </div>
              ${data.bio ? `<p class="text-sm text-[#555555] mt-2 line-clamp-2">${data.bio}</p>` : ''}
              <div class="flex gap-2 mt-3">
                <button onclick="editTeacher('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTeacher('${doc.id}')" class="btn-sm btn-danger" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    teachersGrid.innerHTML = html;
  });
}

// ============================================================
// إضافة/تعديل مدرس
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = teacherIdInput.value;
  const groupId = groupSelect.value;
  const groupName = groupSelect.options[groupSelect.selectedIndex]?.text || "";

  const data = {
    fullName: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    specialization: specializationInput.value,
    bio: bioInput.value.trim(),
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
      await updateDoc(doc(db, "academies", academyId, "teachers", id), data);
      showToast("تم تحديث المدرس بنجاح", "success");
    } else {
      // التحقق من عدم تكرار البريد الإلكتروني
      const teachersRef = collection(db, "academies", academyId, "teachers");
      const q = query(teachersRef, where("email", "==", data.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        showModalMessage("البريد الإلكتروني مستخدم بالفعل", "error");
        return;
      }

      data.createdAt = serverTimestamp();
      data.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&size=60&background=4B5563&color=fff`;
      await addDoc(collection(db, "academies", academyId, "teachers"), data);
      showToast("تم إضافة المدرس بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ المدرس: " + error.message, "error");
  }
});

// ============================================================
// تعديل مدرس
// ============================================================
window.editTeacher = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "academies", academyId, "teachers", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      teacherIdInput.value = id;
      nameInput.value = data.fullName || "";
      emailInput.value = data.email || "";
      phoneInput.value = data.phone || "";
      specializationInput.value = data.specialization || "other";
      bioInput.value = data.bio || "";
      groupSelect.value = data.groupId || "all";
      statusInput.value = data.status || "active";
      modalTitle.textContent = "تعديل المدرس";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات المدرس", "error");
  }
};

// ============================================================
// حذف مدرس
// ============================================================
window.deleteTeacher = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف المدرس وجميع بياناته!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "academies", academyId, "teachers", id));
      showToast("تم حذف المدرس بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف المدرس: " + error.message, "error");
    }
  }
};

// ============================================================
// إنشاء مجموعة جديدة للمدرسين
// ============================================================
groupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = groupNameInput.value.trim();
  if (!name) {
    showGroupMessage("يرجى إدخال اسم المجموعة", "error");
    return;
  }

  try {
    const groupsRef = collection(db, "academies", academyId, "teacherGroups");
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
  teacherIdInput.value = "";
  form.reset();
  specializationInput.value = "other";
  statusInput.value = "active";
  modalTitle.textContent = "إضافة مدرس جديد";
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

if (addTeacherBtn) addTeacherBtn.addEventListener("click", openModal);
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
      loadTeacherGroups();
      loadTeachers();
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

console.log("✅ Teachers Module Loaded");
