import "./firebase-config.js";
import "./auth.js";

// تفعيل زر القائمة للهواتف
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
console.log("EduCore App Loaded");
