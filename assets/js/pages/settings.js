import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    document.getElementById("academyName").value = data.academyName || "";
    document.getElementById("language").value = data.language || "ar";
    document.getElementById("currency").value = data.currency || "SAR";
  }
});

const settingsForm = document.getElementById("academy-settings-form");
if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const academyName = document.getElementById("academyName").value;
    const language = document.getElementById("language").value;
    const currency = document.getElementById("currency").value;
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        academyName,
        language,
        currency,
        updatedAt: new Date().toISOString()
      });
      
      // تحديث بيانات الأكاديمية أيضاً
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const academyId = userDoc.data().academyId || user.uid;
      await updateDoc(doc(db, "academies", academyId), {
        academyName,
        language,
        currency,
        updatedAt: new Date().toISOString()
      });
      
      alert("تم تحديث الإعدادات بنجاح");
    } catch (error) {
      alert("فشل تحديث الإعدادات: " + error.message);
    }
  });
}
