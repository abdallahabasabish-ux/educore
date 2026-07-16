import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getCountFromServer, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUser = null;
let academyId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUser = user;
  // تحميل بيانات المستخدم
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    academyId = data.academyId || 'default';
    document.getElementById("user-name").textContent = `مرحباً، ${data.fullName || 'مستخدم'}`;
    document.getElementById("user-avatar").src = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || 'U')}&background=4B5563&color=fff&size=40`;
  }
  // تحميل الإحصائيات
  loadStats();
  loadRecentActivity();
});

async function loadStats() {
  if (!academyId) return;
  try {
    // إجمالي العملاء
    const customersRef = collection(db, "customers");
    const qCustomers = query(customersRef, where("academyId", "==", academyId));
    const customersSnap = await getCountFromServer(qCustomers);
    document.getElementById("total-customers").textContent = customersSnap.data().count;

    // القضايا النشطة
    const casesRef = collection(db, "cases");
    const qCases = query(casesRef, where("academyId", "==", academyId), where("status", "==", "active"));
    const casesSnap = await getCountFromServer(qCases);
    document.getElementById("active-cases").textContent = casesSnap.data().count;

    // الجلسات اليوم
    const sessionsRef = collection(db, "sessions");
    const today = new Date().toISOString().split('T')[0];
    const qSessions = query(sessionsRef, where("academyId", "==", academyId), where("date", "==", today));
    const sessionsSnap = await getCountFromServer(qSessions);
    document.getElementById("today-sessions").textContent = sessionsSnap.data().count;

    // المهام المعلقة
    const tasksRef = collection(db, "tasks");
    const qTasks = query(tasksRef, where("academyId", "==", academyId), where("status", "==", "pending"));
    const tasksSnap = await getCountFromServer(qTasks);
    document.getElementById("pending-tasks").textContent = tasksSnap.data().count;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

function loadRecentActivity() {
  const container = document.getElementById("recent-activity");
  if (!academyId) {
    container.innerHTML = '<p class="text-sm text-gray-500 py-4 text-center">جاري التحميل...</p>';
    return;
  }
  // عرض آخر 5 نشاطات
  const activitiesRef = collection(db, "activities");
  const q = query(activitiesRef, where("academyId", "==", academyId), orderBy("createdAt", "desc"), limit(5));
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = '<p class="text-sm text-gray-500 py-4 text-center">لا توجد أنشطة حديثة</p>';
      return;
    }
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const time = data.createdAt?.toDate?.()?.toLocaleString('ar-SA') || 'منذ قليل';
      html += `<div class="flex justify-between items-center py-3">
        <div>
          <p class="font-medium text-gray-800">${data.title || 'نشاط جديد'}</p>
          <p class="text-sm text-gray-500">${data.description || ''}</p>
        </div>
        <span class="text-xs text-gray-400">${time}</span>
      </div>`;
    });
    container.innerHTML = html;
  }, (error) => {
    console.error("Error loading activities:", error);
    container.innerHTML = '<p class="text-sm text-red-500 py-4 text-center">حدث خطأ في تحميل النشاطات</p>';
  });
}
