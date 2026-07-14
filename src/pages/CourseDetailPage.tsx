import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  Users,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Video,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Course, Chapter, Lesson } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const chapterSchema = z.object({
  title: z.string().min(3, 'عنوان الفصل مطلوب'),
  description: z.string().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(3, 'عنوان الدرس مطلوب'),
  description: z.string().optional(),
  videoUrl: z.string().url('رابط الفيديو غير صحيح'),
  videoSource: z.enum(['youtube', 'vimeo', 'upload']),
  isFree: z.boolean().default(false),
});

type ChapterForm = z.infer<typeof chapterSchema>;
type LessonForm = z.infer<typeof lessonSchema>;

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { getDocument, updateDocument, addSubCollection } = useFirestore<Course>();
  const { addToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chapterForm = useForm<ChapterForm>({
    resolver: zodResolver(chapterSchema),
  });

  const lessonForm = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      isFree: false,
      videoSource: 'youtube',
    },
  });

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await getDocument('courses', id);
        if (result.success && result.data) {
          setCourse(result.data);
        } else {
          addToast({
            type: 'error',
            title: 'خطأ',
            description: 'الكورس غير موجود',
          });
          navigate('/courses');
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'فشل تحميل الكورس',
        });
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id]);

  const handleAddChapter = async (data: ChapterForm) => {
    if (!course) return;
    setIsSubmitting(true);
    try {
      const chapter: Chapter = {
        id: Math.random().toString(36).substring(2, 9),
        courseId: course.id,
        title: data.title,
        description: data.description,
        order: (course.chapters?.length || 0) + 1,
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedChapters = [...(course.chapters || []), chapter];
      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
      });

      if (result.success && result.data) {
        setCourse(result.data);
        addToast({
          type: 'success',
          title: 'تم إضافة الفصل',
          description: 'تم إضافة الفصل بنجاح',
        });
        setIsAddingChapter(false);
        chapterForm.reset();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل إضافة الفصل',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLesson = async (data: LessonForm) => {
    if (!course || !selectedChapterId) return;
    setIsSubmitting(true);
    try {
      const lesson: Lesson = {
        id: Math.random().toString(36).substring(2, 9),
        chapterId: selectedChapterId,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        videoSource: data.videoSource,
        order: 0,
        isFree: data.isFree,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedChapters = course.chapters?.map(chapter => {
        if (chapter.id === selectedChapterId) {
          return {
            ...chapter,
            lessons: [...(chapter.lessons || []), lesson],
          };
        }
        return chapter;
      });

      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
      });

      if (result.success && result.data) {
        setCourse(result.data);
        addToast({
          type: 'success',
          title: 'تم إضافة الدرس',
          description: 'تم إضافة الدرس بنجاح',
        });
        setIsAddingLesson(false);
        lessonForm.reset();
        setSelectedChapterId(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل إضافة الدرس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!course) return;
    try {
      const updatedChapters = course.chapters?.filter(c => c.id !== chapterId) || [];
      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
      });
      if (result.success && result.data) {
        setCourse(result.data);
        addToast({
          type: 'success',
          title: 'تم حذف الفصل',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حذف الفصل',
      });
    }
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string) => {
    if (!course) return;
    try {
      const updatedChapters = course.chapters?.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            lessons: chapter.lessons?.filter(l => l.id !== lessonId) || [],
          };
        }
        return chapter;
      });

      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
      });

      if (result.success && result.data) {
        setCourse(result.data);
        addToast({
          type: 'success',
          title: 'تم حذف الدرس',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حذف الدرس',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">الكورس غير موجود</h2>
        <Button onClick={() => navigate('/courses')}>العودة إلى الكورسات</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
              <ArrowRight className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              العودة
            </Button>
            <h1 className="heading-3">{course.title}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={course.isPublished ? 'success' : 'warning'}>
            {course.isPublished ? 'منشور' : 'مسودة'}
          </Badge>
          <Badge variant="secondary">
            {course.level === 'beginner' && 'مبتدئ'}
            {course.level === 'intermediate' && 'متوسط'}
            {course.level === 'advanced' && 'متقدم'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">الفصول</p>
            <p className="text-2xl font-bold">{course.chapters?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">الدروس</p>
            <p className="text-2xl font-bold">
              {course.chapters?.reduce((acc, c) => acc + (c.lessons?.length || 0), 0) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">الطلاب</p>
            <p className="text-2xl font-bold">{course.studentsCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">السعر</p>
            <p className="text-2xl font-bold">{course.price === 0 ? 'مجاني' : `${course.price} ريال`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chapters Management */}
      {isTeacher && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">الفصول والدروس</h3>
            <Dialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                  إضافة فصل
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة فصل جديد</DialogTitle>
                  <DialogDescription>أدخل تفاصيل الفصل الجديد</DialogDescription>
                </DialogHeader>
                <form onSubmit={chapterForm.handleSubmit(handleAddChapter)}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapterTitle">عنوان الفصل</Label>
                      <Input
                        id="chapterTitle"
                        placeholder="مثال: مقدمة في React"
                        {...chapterForm.register('title')}
                      />
                      {chapterForm.formState.errors.title && (
                        <p className="text-sm text-danger">
                          {chapterForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapterDescription">الوصف (اختياري)</Label>
                      <Input
                        id="chapterDescription"
                        placeholder="وصف الفصل"
                        {...chapterForm.register('description')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddingChapter(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Chapters List */}
          <div className="space-y-4">
            {course.chapters?.map((chapter) => (
              <Card key={chapter.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">الفصل {chapter.order}</Badge>
                        <h4 className="font-semibold">{chapter.title}</h4>
                      </div>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {chapter.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {chapter.lessons?.length || 0} دروس
                      </p>

                      {/* Lessons List */}
                      <div className="mt-4 space-y-2">
                        {chapter.lessons?.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{lesson.title}</span>
                              {lesson.isFree && (
                                <Badge variant="success" className="text-xs">مجاني</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.videoSource}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-danger min-h-[36px] min-w-[36px]"
                                onClick={() => handleDeleteLesson(chapter.id, lesson.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog
                        open={isAddingLesson && selectedChapterId === chapter.id}
                        onOpenChange={(open) => {
                          setIsAddingLesson(open);
                          if (!open) setSelectedChapterId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChapterId(chapter.id)}
                          >
                            <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                            إضافة درس
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>إضافة درس جديد</DialogTitle>
                            <DialogDescription>
                              أدخل تفاصيل الدرس الجديد في الفصل: {chapter.title}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={lessonForm.handleSubmit(handleAddLesson)}>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="lessonTitle">عنوان الدرس</Label>
                                <Input
                                  id="lessonTitle"
                                  placeholder="مثال: مقدمة في React"
                                  {...lessonForm.register('title')}
                                />
                                {lessonForm.formState.errors.title && (
                                  <p className="text-sm text-danger">
                                    {lessonForm.formState.errors.title.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="lessonDescription">الوصف (اختياري)</Label>
                                <Input
                                  id="lessonDescription"
                                  placeholder="وصف الدرس"
                                  {...lessonForm.register('description')}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="videoUrl">رابط الفيديو</Label>
                                <Input
                                  id="videoUrl"
                                  placeholder="https://youtube.com/watch?v=..."
                                  {...lessonForm.register('videoUrl')}
                                />
                                {lessonForm.formState.errors.videoUrl && (
                                  <p className="text-sm text-danger">
                                    {lessonForm.formState.errors.videoUrl.message}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="videoSource">مصدر الفيديو</Label>
                                  <Select
                                    onValueChange={(value) =>
                                      lessonForm.setValue('videoSource', value as 'youtube' | 'vimeo' | 'upload')
                                    }
                                    defaultValue="youtube"
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر المصدر" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="youtube">YouTube</SelectItem>
                                      <SelectItem value="vimeo">Vimeo</SelectItem>
                                      <SelectItem value="upload">رفع ملف</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="isFree">مجاني</Label>
                                  <div className="flex items-center gap-2 pt-2">
                                    <input
                                      type="checkbox"
                                      {...lessonForm.register('isFree')}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">جعل هذا الدرس مجانياً</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsAddingLesson(false);
                                  setSelectedChapterId(null);
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger min-h-[36px] min-w-[36px]"
                        onClick={() => handleDeleteChapter(chapter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CourseDetailPage;
