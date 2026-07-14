import { z } from 'zod';

export const emailSchema = z.string().email('البريد الإلكتروني غير صحيح');
export const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
export const nameSchema = z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    displayName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['teacher', 'student']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

export const courseSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().optional(),
  price: z.number().min(0, 'السعر يجب أن يكون 0 أو أكثر'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().optional(),
});

export const chapterSchema = z.object({
  title: z.string().min(3, 'عنوان الفصل مطلوب'),
  description: z.string().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(3, 'عنوان الدرس مطلوب'),
  description: z.string().optional(),
  videoUrl: z.string().url('رابط الفيديو غير صحيح'),
  videoSource: z.enum(['youtube', 'vimeo', 'upload']),
  isFree: z.boolean().default(false),
});

export const questionSchema = z.object({
  text: z.string().min(3, 'نص السؤال مطلوب'),
  options: z.array(z.string().min(1, 'الخيار مطلوب')).min(2, 'يجب إضافة خيارين على الأقل'),
  correctAnswer: z.number().min(0, 'يرجى اختيار الإجابة الصحيحة'),
  points: z.number().min(1, 'النقاط يجب أن تكون 1 على الأقل'),
  explanation: z.string().optional(),
});
