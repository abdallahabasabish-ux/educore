import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getCountFromServer, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // تحميل بيانات المستخدم
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("user-name").textContent = `مرحباً، ${data.fullName || "مستخدم"}`;
      document.getElementById("user-avatar").src = data.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.fullName || "U");
    }
    // تحميل الإحصائيات
    loadStats();
    loadRecentActivity();
  }
});

async function loadStats() {
  if (!currentUser) return;
  // مثال: عدد العملاء
  const customersRef = collection(db, "customers");
  const q = query(customersRef, where("academyId", "==", "YOUR_ACADEMY_ID")); // يجب استبدالها بـ academyId الفعلي
  const snapshot = await getCountFromServer(q);
  document.getElementById("total-customers").textContent = snapshot.data().count;
  // أضف باقي الإحصائيات بنفس الطريقة
}

function loadRecentActivity() {
  // استخدام onSnapshot لعرض آخر الأنشطة
  const container = document.getElementById("recent-activity");
  container.innerHTML = '<p class="text-sm text-gray-500">جاري التحميل...</p>';
  // مثال: الاستماع إلى مجموعة النشاطات
  // ...
}
