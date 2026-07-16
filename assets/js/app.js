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
});

// ربط Lenis بـ requestAnimationFrame
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ============================================================
// 2. تهيئة GSAP + ScrollTrigger
// ============================================================
gsap.registerPlugin(ScrollTrigger);

// أنيميشن الهيرو عند التمرير
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

// أنيميشن البطاقات عند التمرير
gsap.utils.toArray(".feature-card").forEach((card, i) => {
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
});

// ============================================================
// 4. تفعيل زر القائمة للهواتف
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
      }
    });
  }
});

console.log("مداد العلم - تم تحميل التطبيق بنجاح");
