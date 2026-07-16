// ============================================================
// assets/js/pages/customers.js
// إدارة العملاء - قراءة، إضافة، تعديل، حذف
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
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let academyId = null;
let customersRef = null;
let unsubscribe = null;

// ============================================================
// 1. تهيئة الصفحة عند تسجيل الدخول
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  // جلب academyId
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    academyId = userDoc.data().academyId || user.uid;
    customersRef = collection(db, "customers");
    loadCustomers();
  }
});

// ============================================================
// 2. تحميل العملاء مع الاستماع للتحديثات
// ============================================================
function loadCustomers() {
  if (unsubscribe) unsubscribe();
  const q = query(customersRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("customers-table-body");
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">لا يوجد عملاء</td></tr>`;
      return;
    }
    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const statusColors = {
        active: "text-green-600 bg-green-50",
        inactive: "text-red-600 bg-red-50",
        pending: "text-yellow-600 bg-yellow-50",
      };
      html += `
        <tr>
          <td class="px-6 py-4 font-medium">${data.fullName || "غير محدد"}</td>
          <td class="px-6 py-4">${data.email || "-"}</td>
          <td class="px-6 py-4">${data.phone || "-"}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[data.status] || "bg-gray-50 text-gray-600"}">
              ${data.status === "active" ? "نشط" : data.status === "inactive" ? "غير نشط" : "معلق"}
            </span>
          </td>
          <td class="px-6 py-4">
            <button onclick="editCustomer('${doc.id}')" class="text-[#4B5563] hover:text-[#3b4553] ml-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteCustomer('${doc.id}')" class="text-red-500 hover:text-red-700">
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
// 3. إضافة عميل جديد
// ============================================================
document.getElementById("customer-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("customer-id").value;
  const data = {
    fullName: document.getElementById("customer-name").value.trim(),
    email: document.getElementById("customer-email").value.trim(),
    phone: document.getElementById("customer-phone").value.trim(),
    status: document.getElementById("customer-status").value,
    academyId: academyId,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (id) {
      await updateDoc(doc(db, "customers", id), data);
      alert("تم تحديث العميل بنجاح");
    } else {
      data.createdAt = new Date().toISOString();
      await addDoc(customersRef, data);
      alert("تم إضافة العميل بنجاح");
    }
    closeModal();
  } catch (error) {
    alert("فشل حفظ العميل: " + error.message);
  }
});

// ============================================================
// 4. تعديل عميل
// ============================================================
window.editCustomer = async (id) => {
  const docSnap = await getDoc(doc(db, "customers", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("customer-id").value = id;
    document.getElementById("customer-name").value = data.fullName || "";
    document.getElementById("customer-email").value = data.email || "";
    document.getElementById("customer-phone").value = data.phone || "";
    document.getElementById("customer-status").value = data.status || "active";
    document.getElementById("modal-title").textContent = "تعديل العميل";
    document.getElementById("customer-modal").classList.remove("hidden");
  }
};

// ============================================================
// 5. حذف عميل
// ============================================================
window.deleteCustomer = async (id) => {
  if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
    try {
      await deleteDoc(doc(db, "customers", id));
      alert("تم حذف العميل بنجاح");
    } catch (error) {
      alert("فشل حذف العميل: " + error.message);
    }
  }
};

// ============================================================
// 6. التحكم في المودال
// ============================================================
document.getElementById("add-customer-btn")?.addEventListener("click", () => {
  document.getElementById("customer-id").value = "";
  document.getElementById("customer-name").value = "";
  document.getElementById("customer-email").value = "";
  document.getElementById("customer-phone").value = "";
  document.getElementById("customer-status").value = "active";
  document.getElementById("modal-title").textContent = "إضافة عميل جديد";
  document.getElementById("customer-modal").classList.remove("hidden");
});

document.getElementById("close-modal")?.addEventListener("click", closeModal);
document.getElementById("customer-modal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function closeModal() {
  document.getElementById("customer-modal").classList.add("hidden");
}

// ============================================================
// 7. بحث وتصفية
// ============================================================
document.getElementById("search-btn")?.addEventListener("click", () => {
  const search = document.getElementById("search-customer").value.toLowerCase();
  const status = document.getElementById("filter-status").value;
  // يمكن تحسين البحث هنا باستخدام استعلامات Firestore
  loadCustomers(); // إعادة تحميل البيانات
  // في التطبيق الحقيقي، نستخدم استعلامات Firestore مع where و orderBy
});

console.log("✅ Customers Module Loaded");
