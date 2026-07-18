// ============================================================
// assets/js/pages/finance.js
// إدارة المالية - المعاملات، الإيرادات، المصروفات، التقارير
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

function getTypeBadge(type) {
  const map = {
    revenue: "badge-success",
    expense: "badge-danger",
  };
  const labels = {
    revenue: "إيراد",
    expense: "مصروف",
  };
  return `<span class="badge ${map[type] || "badge-pending"}">${
    labels[type] || type
  }</span>`;
}

function getStatusBadge(status) {
  const map = {
    completed: "badge-success",
    pending: "badge-pending",
    failed: "badge-danger",
  };
  const labels = {
    completed: "مكتمل",
    pending: "معلق",
    failed: "فاشل",
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

function formatCurrency(amount) {
  return (amount || 0).toLocaleString() + " " + (window.currency || "SAR");
}

// ============================================================
// عناصر DOM
// ============================================================
const transactionsTableBody = document.getElementById("transactionsTableBody");
const modal = document.getElementById("transactionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addTransactionBtn = document.getElementById("addTransactionBtn");
const form = document.getElementById("transactionForm");
const transactionIdInput = document.getElementById("transactionId");
const descriptionInput = document.getElementById("transactionDescription");
const typeInput = document.getElementById("transactionType");
const amountInput = document.getElementById("transactionAmount");
const statusInput = document.getElementById("transactionStatus");
const dateInput = document.getElementById("transactionDate");
const categoryInput = document.getElementById("transactionCategory");
const messageEl = document.getElementById("modalMessage");

// ===== عناصر الإحصائيات =====
const totalRevenueEl = document.getElementById("totalRevenue");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("balance");
const pendingTransactionsEl = document.getElementById("pendingTransactions");

let academyId = null;
let currentUser = null;
let unsubscribeTransactions = null;

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
// تحميل المعاملات
// ============================================================
function loadTransactions() {
  if (!academyId) return;

  const transactionsRef = collection(db, "transactions");
  const q = query(
    transactionsRef,
    where("academyId", "==", academyId),
    orderBy("date", "desc")
  );

  unsubscribeTransactions = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      transactionsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-400 py-8">
            <i class="fas fa-coins text-3xl opacity-30 block mb-2"></i>
            <p class="text-sm">لا توجد معاملات مالية</p>
            <p class="text-xs mt-1">اضغط على "إضافة معاملة" لإضافة أول معاملة</p>
          </td>
        </tr>
      `;
      updateStats(snapshot);
      return;
    }

    let html = "";
    let revenue = 0,
      expenses = 0,
      pending = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount || 0;

      if (data.type === "revenue") revenue += amount;
      else if (data.type === "expense") expenses += amount;
      if (data.status === "pending") pending++;

      html += `
        <tr>
          <td>${formatDate(data.date)}</td>
          <td class="font-medium">${data.description || "بدون وصف"}</td>
          <td>${getTypeBadge(data.type || "expense")}</td>
          <td class="font-bold ${data.type === 'revenue' ? 'text-[#22C55E]' : 'text-[#EF4444]'}">
            ${data.type === 'revenue' ? '+' : '-'} ${formatCurrency(amount)}
          </td>
          <td>${getStatusBadge(data.status || "pending")}</td>
          <td class="text-center whitespace-nowrap">
            <button onclick="editTransaction('${doc.id}')" class="btn-sm btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTransaction('${doc.id}')" class="btn-sm btn-danger" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    transactionsTableBody.innerHTML = html;
    updateStats(snapshot);
  });
}

// ============================================================
// تحديث الإحصائيات
// ============================================================
function updateStats(snapshot) {
  if (!totalRevenueEl) return;

  let revenue = 0,
    expenses = 0,
    pending = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const amount = data.amount || 0;

    if (data.type === "revenue") revenue += amount;
    else if (data.type === "expense") expenses += amount;
    if (data.status === "pending") pending++;
  });

  totalRevenueEl.textContent = formatCurrency(revenue);
  totalExpensesEl.textContent = formatCurrency(expenses);
  balanceEl.textContent = formatCurrency(revenue - expenses);
  pendingTransactionsEl.textContent = pending;
}

// ============================================================
// إضافة/تعديل معاملة
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = transactionIdInput.value;
  const amount = parseFloat(amountInput.value) || 0;
  const dateValue = dateInput.value;

  const data = {
    description: descriptionInput.value.trim(),
    type: typeInput.value,
    amount: amount,
    status: statusInput.value,
    category: categoryInput.value.trim() || "عام",
    date: dateValue ? new Date(dateValue) : serverTimestamp(),
    academyId: academyId,
    updatedAt: serverTimestamp(),
  };

  if (!data.description) {
    showModalMessage("الوصف مطلوب", "error");
    return;
  }

  if (amount <= 0) {
    showModalMessage("المبلغ يجب أن يكون أكبر من صفر", "error");
    return;
  }

  try {
    if (id) {
      await updateDoc(doc(db, "transactions", id), data);
      showToast("تم تحديث المعاملة بنجاح", "success");
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "transactions"), data);
      showToast("تم إضافة المعاملة بنجاح", "success");
    }
    closeModal();
  } catch (error) {
    showModalMessage("فشل حفظ المعاملة: " + error.message, "error");
  }
});

// ============================================================
// تعديل معاملة
// ============================================================
window.editTransaction = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "transactions", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      transactionIdInput.value = id;
      descriptionInput.value = data.description || "";
      typeInput.value = data.type || "expense";
      amountInput.value = data.amount || "";
      statusInput.value = data.status || "pending";
      categoryInput.value = data.category || "";
      dateInput.value = data.date
        ? data.date.toDate().toISOString().split("T")[0]
        : "";
      modalTitle.textContent = "تعديل المعاملة";
      modal.classList.add("show");
      messageEl.className = "message-box";
      messageEl.textContent = "";
    }
  } catch (error) {
    showToast("فشل تحميل بيانات المعاملة", "error");
  }
};

// ============================================================
// حذف معاملة
// ============================================================
window.deleteTransaction = async (id) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: "سيتم حذف هذه المعاملة!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "transactions", id));
      showToast("تم حذف المعاملة بنجاح", "success");
    } catch (error) {
      showToast("فشل حذف المعاملة: " + error.message, "error");
    }
  }
};

// ============================================================
// تصدير التقرير المالي
// ============================================================
document.getElementById("exportReportBtn")?.addEventListener("click", async () => {
  if (!academyId) {
    showToast("لم يتم تحديد الأكاديمية", "error");
    return;
  }

  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("academyId", "==", academyId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showToast("لا توجد معاملات للتصدير", "error");
      return;
    }

    let csv = "التاريخ,الوصف,النوع,المبلغ,الحالة,التصنيف\n";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date ? formatDate(data.date) : "-";
      const type = data.type === "revenue" ? "إيراد" : "مصروف";
      const statusMap = { completed: "مكتمل", pending: "معلق", failed: "فاشل" };
      csv += `${date},${data.description || ""},${type},${data.amount || 0},${statusMap[data.status] || data.status},${data.category || "عام"}\n`;
    });

    // إنشاء ملف CSV وتحميله
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financial_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast("تم تصدير التقرير بنجاح", "success");
  } catch (error) {
    showToast("فشل تصدير التقرير: " + error.message, "error");
  }
});

// ============================================================
// التحكم بالمودال
// ============================================================
function openModal() {
  transactionIdInput.value = "";
  form.reset();
  typeInput.value = "expense";
  statusInput.value = "pending";
  modalTitle.textContent = "إضافة معاملة جديدة";
  messageEl.className = "message-box";
  messageEl.textContent = "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

if (addTransactionBtn) addTransactionBtn.addEventListener("click", openModal);
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
      loadTransactions();
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

console.log("✅ Finance Module Loaded");
