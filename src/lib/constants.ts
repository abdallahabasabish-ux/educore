export const APP_NAME = 'EduCore';
export const APP_DESCRIPTION = 'نظام تشغيل متكامل للأكاديميات التعليمية';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ACADEMY: '/academy',
  COURSES: '/courses',
  COURSE: '/courses/:id',
  CHAPTER: '/courses/:courseId/chapters/:chapterId',
  STUDENTS: '/students',
  EXAMS: '/exams',
  EXAM: '/exams/:id',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  TEACHER: '/@:username',
} as const;

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  ACADEMIES: 'academies',
  COURSES: 'courses',
  CHAPTERS: 'chapters',
  LESSONS: 'lessons',
  EXAMS: 'exams',
  EXAM_RESULTS: 'examResults',
  ENROLLMENTS: 'enrollments',
  SETTINGS: 'settings',
} as const;

export const COURSE_LEVELS = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
] as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PENDING: 'pending',
} as const;

export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const VIDEO_SOURCES = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  UPLOAD: 'upload',
} as const;
