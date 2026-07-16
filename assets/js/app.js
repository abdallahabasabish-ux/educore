// ============================================================
// assets/js/app.js
// تهيئة التمرير السلس والحركات لمنصة مداد العلم
// ============================================================

import "./firebase-config.js";
import "./auth.js";

// ============================================================
// 1. تهيئة Lenis للتمرير السلس
// ============================================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  autoResize: true,
});

// ربط Lenis بـ requestAnimationFrame للحصول على تمرير سلس
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ============================================================
// 2. تهيئة GSAP + ScrollTrigger (للحركات الاحترافية)
// ============================================================
gsap.registerPlugin(ScrollTrigger);

// أنيميشن الهيرو عند التمرير (اختياري - يعمل في index.html)
const heroExists = document.querySelector("#hero");
if (heroExists) {
  gsap.from("#hero h1", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
    },
    opacity: 0,
    y: 60,
    duration: 1,
    ease: "power3.out",
  });

  gsap.from("#hero p", {
    scrollTrigger: {
      trigger: "#hero",
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
    },
    opacity: 0,
    y: 40,
    duration: 1,
    delay: 0.2,
    ease: "power3.out",
  });
}

// أنيميشن البطاقات (إذا وجدت في الصفحة)
document.querySelectorAll('.feature-card, .card-hover').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      end: "bottom 20%",
      toggleActions: "play none none reverse",
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    delay: i * 0.1,
    ease: "power2.out",
  });
});

// ============================================================
// 3. تهيئة AOS لتأثيرات الظهور
// ============================================================
AOS.init({
  duration: 800,
  once: true,
  offset: 60,
  easing: 'ease-out-cubic',
  disable: window.innerWidth < 768 ? true : false,
  startEvent: 'DOMContentLoaded',
});

// ============================================================
// 4. تفعيل زر القائمة للهواتف (في جميع الصفحات)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const nav = document.querySelector('.md\\:flex');
      if (nav) {
        nav.classList.toggle('hidden');
        nav.classList.toggle('flex');
        nav.classList.toggle('flex-col');
        nav.classList.toggle('absolute');
        nav.classList.toggle('top-16');
        nav.classList.toggle('right-0');
        nav.classList.toggle('left-0');
        nav.classList.toggle('bg-white');
        nav.classList.toggle('p-4');
        nav.classList.toggle('shadow-lg');
        nav.classList.toggle('border-b');
        nav.classList.toggle('border-gray-200');
        nav.classList.toggle('z-50');
      }
    });
  }
});

// ============================================================
// 5. إعادة تهيئة AOS بعد تحميل المحتوى الديناميكي (اختياري)
// ============================================================
window.addEventListener('load', () => {
  AOS.refresh();
  console.log('✅ AOS refreshed after page load');
});

// ============================================================
// 6. إعادة تهيئة ScrollTrigger بعد تغيير الحجم (لتحديث المواقع)
// ============================================================
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
});

// ============================================================
// 7. منع التنقل الداخلي من إعادة تحميل الصفحة (للاستخدام مع Lenis)
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      lenis.scrollTo(target, {
        offset: -70,
        duration: 1.2,
      });
    }
  });
});

// ============================================================
// 8. دالة مساعدة لإعادة تهيئة كل شيء (إذا دعت الحاجة)
// ============================================================
window.refreshAnimations = function() {
  AOS.refresh();
  ScrollTrigger.refresh();
  console.log('✅ Animations refreshed');
};

console.log('✅ مداد العلم - App Module Loaded (Lenis + GSAP + AOS)');
