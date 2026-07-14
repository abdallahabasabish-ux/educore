import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Video,
  Clock,
  Users,
  ChevronLeft,
  MoreVertical,
  Eye,
  Play,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { Course, Chapter } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const chapterSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
});

type ChapterForm = z.infer<typeof chapterSchema>;

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { getDocument, updateDocument, deleteDocument, addSubCollection, getDocuments } = useFirestore<Course | Chapter>();
  const { addToast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChapterForm>({
    resolver: zodResolver(chapterSchema),
  });

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const courseResult = await getDocument('courses', id);
      if (courseResult.success && courseResult.data) {
        setCourse(courseResult.data);
        // Load chapters
        const chaptersResult = await getDocuments(`courses/${id}/chapters`, [], 50);
        if (chaptersResult.success && chaptersResult.data) {
          setChapters(chaptersResult.data.items as Chapter[]);
        }
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
        description: 'فشل في تحميل بيانات الكورس',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (data: ChapterForm) => {
    if (!id || !course) return;
    try {
      const result = await addSubCollection('courses', id, 'chapters', {
        ...data,
        order: chapters.length,
        lessons: [],
      });
      if (result.success && result.data) {
        setChapters([...chapters, result.data as Chapter]);
        addToast({
          type: 'success',
          title: 'تم إضافة الفصل',
          description: 'تم إضافة الفصل بنجاح',
        });
        setIsChapterDialogOpen(false);
        reset();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في إضافة الفصل',
      });
    }
  };

  const handleUpdateChapter = async (data: ChapterForm) => {
    if (!id || !editingChapter) return;
    try {
      const result = await updateDocument(`courses/${id}/chapters`, editingChapter.id, data);
      if (result.success && result.data) {
        setChapters(chapters.map(c => c.id === editingChapter.id ? result.data as Chapter : c));
        addToast({
          type: 'success',
          title: 'تم تحديث الفصل',
          description: 'تم حفظ التغييرات بنجاح',
        });
        setIsChapterDialogOpen(false);
        setEditingChapter(null);
        reset();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحديث الفصل',
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!id || !chapterToDelete) return;
    try {
      const result = await deleteDocument(`courses/${id}/chapters`, chapterToDelete);
      if (result.success) {
        setChapters(chapters.filter(c => c.id !== chapterToDelete));
        addToast({
          type: 'success',
          title: 'تم حذف الفصل',
          description: 'تم حذف الفصل بنجاح',
        });
        setDeleteDialogOpen(false);
        setChapterToDelete(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في حذف الفصل',
      });
    }
  };

  const openEditChapterDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setValue('title', chapter.title);
    setValue('description', chapter.description || '');
    setIsChapterDialogOpen(true);
  };

  const openDeleteChapterDialog = (id: string) => {
    setChapterToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="heading-3 mb-2">الكورس غير موجود</h2>
        <p className="text-muted-foreground mb-4">عذراً، لم نتمكن من العثور على هذا الكورس</p>
        <Button asChild>
          <Link to="/courses">العودة إلى الكورسات</Link>
        </Button>
      </div>
    );
  }

  const getLevelBadge = (level: string) => {
    const levels = {
      beginner: { label: 'مبتدئ', variant: 'success' as const },
      intermediate: { label: 'متوسط', variant: 'warning' as const },
      advanced: { label: 'متقدم', variant: 'destructive' as const },
    };
    return levels[level as keyof typeof levels] || levels.beginner;
  };

  const levelBadge = getLevelBadge(course.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Button asChild variant="ghost" className="min-h-[44px]">
        <Link to="/courses">
          <ChevronLeft className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          العودة إلى الكورسات
        </Link>
      </Button>

      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                {course.isPublished ? (
                  <Badge variant="success">منشور</Badge>
                ) : (
                  <Badge variant="secondary">مسودة</Badge>
                )}
                <Badge variant="outline">{course.studentsCount || 0} طالب</Badge>
              </div>
              <CardTitle className="text-2xl mt-2">{course.title}</CardTitle>
              <CardDescription className="text-base mt-1">{course.description}</CardDescription>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration ? `${course.duration} دقيقة` : 'غير محدد'}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {chapters.length} فصول
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="min-h-[44px]" asChild>
                <Link to={`/courses/${course.id}/chapters/new`}>
                  <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                  إضافة فصل
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chapters List */}
      <div>
        <h2 className="heading-4 mb-4">الفصول</h2>
        {chapters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">لا توجد فصول</h3>
              <p className="text-muted-foreground mb-4">أضف أول فصل في هذا الكورس</p>
              <Button onClick={() => {
                setEditingChapter(null);
                reset();
                setIsChapterDialogOpen(true);
              }}>
                <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                إضافة فصل
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            الفصل {index + 1}
                          </span>
                          <h3 className="font-semibold text-lg truncate">{chapter.title}</h3>
                        </div>
                        {chapter.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {chapter.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            {chapter.lessons?.length || 0} دروس
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                          <Link to={`/courses/${course.id}/chapters/${chapter.id}`}>
                            <Eye className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
                            عرض
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditChapterDialog(chapter)}>
                              <Edit className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteChapterDialog(chapter.id)}
                              className="text-danger focus:text-danger"
                            >
                              <Trash2 className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChapter ? 'تعديل الفصل' : 'إضافة فصل جديد'}</DialogTitle>
            <DialogDescription>
              {editingChapter ? 'قم بتحديث معلومات الفصل' : 'أدخل معلومات الفصل الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(editingChapter ? handleUpdateChapter : handleCreateChapter)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chapter-title">عنوان الفصل</Label>
                <Input
                  id="chapter-title"
                  placeholder="أدخل عنوان الفصل"
                  className="min-h-[44px]"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-danger">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter-description">الوصف (اختياري)</Label>
                <Textarea
                  id="chapter-description"
                  placeholder="وصف الفصل"
                  className="min-h-[80px] resize-y"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-danger">{errors.description.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsChapterDialogOpen(false);
                setEditingChapter(null);
                reset();
              }} className="min-h-[44px]">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
                {isSubmitting ? 'جاري الحفظ...' : (editingChapter ? 'تحديث' : 'إضافة')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الفصل؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteChapter} className="min-h-[44px]">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CourseDetailPage;
