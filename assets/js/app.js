// ============================================================
// assets/js/app.js
// تهيئة التطبيق العام - التمرير السلس، التأثيرات، القوائم
// ============================================================

import "./firebase-config.js";
import "./auth.js";

// ============================================================
// 1. تهيئة Lenis (التمرير السلس)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Lenis !== "undefined") {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      autoResize: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // إلغاء التمرير السلس مؤقتاً عند التمرير السريع بالماوس
    let wheelTimeout;
    document.addEventListener("wheel", () => {
      clearTimeout(wheelTimeout);
      lenis.stop();
      wheelTimeout = setTimeout(() => lenis.start(), 100);
    });

    console.log("✅ Lenis initialized");
  }

  // ============================================================
  // 2. تهيئة AOS (تأثيرات الظهور)
  // ============================================================
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 600,
      once: true,
      offset: 30,
      easing: "ease-out-cubic",
      disable: window.innerWidth < 768,
    });
    console.log("✅ AOS initialized");
  }

  // ============================================================
  // 3. القائمة الجانبية (للأجهزة الصغيرة)
  // ============================================================
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const openBtn = document.getElementById("openSidebarBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (openBtn) openBtn.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  // إغلاق القائمة عند النقر على أي رابط داخلي
  document.querySelectorAll("#sidebar a").forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });

  // إغلاق القائمة عند تغيير حجم الشاشة للكمبيوتر
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      closeSidebar();
    }
  });

  // ============================================================
  // 4. القائمة العلوية (Mobile Drawer) - للصفحات التسويقية
  // ============================================================
  const menuToggle = document.getElementById("menuToggle");
  const drawer = document.getElementById("mobileDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerClose = document.getElementById("drawerClose");

  function openDrawer() {
    if (drawer) drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (menuToggle) menuToggle.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  // إغلاق القائمة عند النقر على أي رابط داخلي
  document.querySelectorAll("#mobileDrawer a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  // ============================================================
  // 5. تأثير شريط التنقل عند التمرير
  // ============================================================
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        navbar.classList.add("shadow-sm");
        navbar.style.borderBottomColor = "rgba(229, 231, 235, 0.6)";
      } else {
        navbar.classList.remove("shadow-sm");
        navbar.style.borderBottomColor = "rgba(229, 231, 235, 0.2)";
      }
    });
  }

  // ============================================================
  // 6. زر تبديل الوضع الداكن (تجريبي)
  // ============================================================
  document.querySelectorAll(".dark-mode-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-moon");
        icon.classList.toggle("fa-sun");
      }
      document.body.classList.toggle("dark-mode");
    });
  });

  // ============================================================
  // 7. زر نسخ الرابط (للمدرسين)
  // ============================================================
  const copyUrlBtn = document.getElementById("copyUrlBtn");
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener("click", function () {
      const input = document.getElementById("studentRegisterUrl");
      if (input) {
        input.select();
        navigator.clipboard
          .writeText(input.value)
          .then(() => {
            Toastify({
              text: "✅ تم نسخ الرابط بنجاح",
              duration: 3000,
              gravity: "top",
              position: "center",
              style: {
                background: "#22C55E",
                borderRadius: "12px",
                padding: "12px 24px",
              },
            }).showToast();
          })
          .catch(() => {
            document.execCommand("copy");
            Toastify({
              text: "✅ تم نسخ الرابط بنجاح",
              duration: 3000,
              gravity: "top",
              position: "center",
              style: {
                background: "#22C55E",
                borderRadius: "12px",
                padding: "12px 24px",
              },
            }).showToast();
          });
      }
    });
  }

  // ============================================================
  // 8. إعادة تهيئة AOS بعد تحميل المحتوى الديناميكي
  // ============================================================
  window.addEventListener("load", () => {
    if (typeof AOS !== "undefined") {
      AOS.refresh();
    }
  });

  console.log("✅ App Module Loaded");
});
