# مداد العلم – منصة تعليمية متكاملة

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**مداد العلم** هي منصة SaaS حديثة تتيح لأي مدرس أو أكاديمية إنشاء منصة تعليمية إلكترونية احترافية خلال دقائق، مع إدارة الطلاب، الكورسات، الامتحانات، والاشتراكات من مكان واحد.

---

## 🚀 المميزات الرئيسية

- **Multi-Tenant Architecture**: كل أكاديمية تعمل بشكل معزول مع قاعدة بيانات مستقلة منطقياً.
- **أنظمة متكاملة**: إدارة الطلاب، الكورسات، المدرسون، الحصص، الامتحانات، الواجبات، المالية، والإعدادات.
- **صلاحيات متعددة الأدوار**: Super Admin, Academy Owner, Teacher, Student.
- **تسجيل طلاب عبر رابط فريد**: ينشئ المدرس رابطاً خاصاً لتسجيل الطلاب في أكاديميته.
- **واجهة حديثة بتصميم Black & White**: مستوحى من أفضل المنصات العالمية مثل Notion و Linear.
- **تجاوب كامل**: يعمل على جميع الأجهزة (320px → 1920px).
- **تمرير سلس**: باستخدام Lenis و AOS لتجربة مستخدم سلسة.
- **تكامل Firebase**: Authentication, Firestore, Storage مع إمكانية نقل المشروع لأي Backend مستقبلاً.


## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **HTML5 / CSS3** | بناء الواجهات والتنسيق |
| **Tailwind CSS** | تنسيق سريع وقابل للتخصيص |
| **JavaScript (ES6+)** | منطق الأعمال والتفاعل |
| **Firebase Authentication** | تسجيل الدخول (بريد/كلمة مرور + Google) |
| **Cloud Firestore** | قاعدة البيانات (NoSQL) |
| **Firebase Storage** | تخزين الملفات (الصور، المستندات) |
| **Lenis** | تمرير سلس |
| **AOS** | تأثيرات ظهور العناصر أثناء التمرير |
| **Toastify / SweetAlert2** | إشعارات وتنبيهات |
| **Font Awesome** | أيقونات |
| **GitHub Actions** | CI/CD (للنشر المستقبلي) |

---

## 📂 هيكل المشروع
educore/
├── index.html # الصفحة الرئيسية (التسويقية)
├── features.html # المميزات
├── pricing.html # الأسعار
├── contact.html # تواصل معنا
├── faq.html # الأسئلة الشائعة
├── about.html # عن المنصة
├── blog.html # المدونة (مع Firebase)
├── login.html # تسجيل الدخول
├── register.html # إنشاء حساب
├── register-academy.html # إنشاء أكاديمية جديدة
├── student-register.html # تسجيل طالب عبر الرابط
├── forgot-password.html # استعادة كلمة المرور
├── 404.html # صفحة الخطأ
├── privacy-policy.html # سياسة الخصوصية
├── terms.html # الشروط والأحكام
├── dashboard.html # لوحة التحكم العامة
├── super-admin-dashboard.html # لوحة المالك (Super Admin)
├── owner-dashboard.html # لوحة مالك الأكاديمية
├── teacher-dashboard.html # لوحة المدرس
├── student-dashboard.html # لوحة الطالب
├── owner/
│ ├── dashboard.html # لوحة الأكاديمية
│ ├── students.html # إدارة الطلاب
│ ├── courses.html # إدارة الكورسات
│ ├── teachers.html # إدارة المدرسين
│ ├── classes.html # إدارة الحصص
│ ├── exams.html # إدارة الامتحانات
│ ├── assignments.html # إدارة الواجبات
│ ├── finance.html # المالية
│ ├── settings.html # الإعدادات
│ └── profile.html # الملف الشخصي
├── assets/
│ ├── css/
│ │ └── style.css # التنسيقات الرئيسية
│ ├── js/
│ │ ├── firebase-config.js # إعدادات Firebase المركزية
│ │ ├── auth.js # نظام المصادقة
│ │ ├── app.js # تهيئة التطبيق
│ │ ├── dashboard.js # لوحة التحكم العامة
│ │ └── pages/ # ملفات JavaScript للصفحات
│ │ ├── students.js
│ │ ├── courses.js
│ │ ├── teachers.js
│ │ ├── classes.js
│ │ ├── exams.js
│ │ ├── assignments.js
│ │ ├── finance.js
│ │ ├── settings.js
│ │ └── profile.js
│ └── images/
│ ├── logo.svg
│ └── hero-bg.jpg
├── .env.example # مثال لملف البيئة
├── .gitignore # الملفات المستثناة من Git
├── README.md # توثيق المشروع
└── LICENSE # الترخيص


## ⚙️ تشغيل المشروع محلياً

### 1. نسخ المستودع
```bash
git clone https://github.com/your-username/midad-al-ilm.git
cd midad-al-ilm
