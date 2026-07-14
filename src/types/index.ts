// ==================== Auth Types ====================
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'teacher' | 'student' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherProfile extends User {
  role: 'teacher';
  academyId: string;
  username: string;
  bio?: string;
  phone?: string;
}

export interface StudentProfile extends User {
  role: 'student';
  academyId: string;
  enrolledCourses: string[];
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  joinDate: Date;
}

// ==================== Academy Types ====================
export interface Academy {
  id: string;
  name: string;
  username: string;
  logo?: string;
  primaryColor: string;
  description?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isActive: boolean;
}

// ==================== Course Types ====================
export interface Course {
  id: string;
  academyId: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  chapters: Chapter[];
  studentsCount: number;
  category?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoSource: 'youtube' | 'vimeo' | 'upload';
  duration?: number;
  order: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Exam Types ====================
export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  answers: number[];
  completedAt: Date;
  timeSpent?: number;
}

// ==================== Student Types ====================
export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  academyId: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  enrolledAt: Date;
  updatedAt: Date;
  progress?: {
    completedLessons: string[];
    examScores: Record<string, number>;
    overallProgress: number;
  };
}

// ==================== Settings Types ====================
export interface AcademySettings {
  academyId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor?: string;
  description?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  features: {
    enableExams: boolean;
    enableCertificates: boolean;
    enableDiscussions: boolean;
  };
  updatedAt: Date;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
