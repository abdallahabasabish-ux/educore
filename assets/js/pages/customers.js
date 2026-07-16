import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  // تحميل العملاء
  const q = query(collection(db, "customers"), where("academyId", "==", "YOUR_ACADEMY_ID"));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById("customers-list");
    if (snapshot.empty) {
      container.innerHTML = '<p class="text-sm text-gray-500">لا يوجد عملاء</p>';
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `<div class="flex justify-between items-center p-3 border-b border-gray-100">
        <div><span class="font-medium">${data.fullName}</span> - ${data.email}</div>
        <button class="text-red-500 hover:text-red-700 text-sm" data-id="${doc.id}">حذف</button>
      </div>`;
    });
    container.innerHTML = html;
  });
});
