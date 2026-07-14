import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Plus, 
  Edit, 
  Trash2, 
  PlayCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useFirestore } from '@/hooks/useFirestore';
import { Course, Chapter, Lesson } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, cn } from '@/lib/utils';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, updateDocument, deleteDocument, addSubCollection } = useFirestore<Course>();
  const { addToast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoSource: 'youtube' as 'youtube' | 'vimeo' | 'upload',
    isFree: false,
  });

  useEffect(() => {
    if (id) {
      loadCourse();
    }
  }, [id]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const result = await getDocument('courses', id!);
      if (result.success && result.data) {
        setCourse(result.data);
        // Auto-expand all chapters
        const chapterIds = new Set(result.data.chapters?.map(c => c.id) || []);
        setExpandedChapters(chapterIds);
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
        description: 'فشل في تحميل الكورس',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleAddChapter = async () => {
    if (!course) return;
    setIsSubmitting(true);
    try {
      const newChapter: Omit<Chapter, 'id'> = {
        courseId: course.id,
        title: chapterForm.title,
        description: chapterForm.description,
        order: course.chapters?.length || 0,
        lessons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to course chapters
      const updatedChapters = [...(course.chapters || []), { ...newChapter, id: `chapter-${Date.now()}` }];
      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
        updatedAt: new Date(),
      });

      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الإضافة',
          description: 'تم إضافة الفصل بنجاح',
        });
        setIsChapterDialogOpen(false);
        setChapterForm({ title: '', description: '' });
        loadCourse();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في إضافة الفصل',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLesson = async () => {
    if (!course || !selectedChapterId) return;
    setIsSubmitting(true);
    try {
      const newLesson: Omit<Lesson, 'id'> = {
        chapterId: selectedChapterId,
        title: lessonForm.title,
        description: lessonForm.description,
        videoUrl: lessonForm.videoUrl,
        videoSource: lessonForm.videoSource,
        isFree: lessonForm.isFree,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedChapters = course.chapters?.map(chapter => {
        if (chapter.id === selectedChapterId) {
          return {
            ...chapter,
            lessons: [...(chapter.lessons || []), { ...newLesson, id: `lesson-${Date.now()}` }],
          };
        }
        return chapter;
      }) || [];

      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
        updatedAt: new Date(),
      });

      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الإضافة',
          description: 'تم إضافة الدرس بنجاح',
        });
        setIsLessonDialogOpen(false);
        setLessonForm({
          title: '',
          description: '',
          videoUrl: '',
          videoSource: 'youtube',
          isFree: false,
        });
        loadCourse();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في إضافة الدرس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!course || !confirm('هل أنت متأكد من حذف هذا الفصل؟')) return;
    try {
      const updatedChapters = course.chapters?.filter(c => c.id !== chapterId) || [];
      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الحذف',
          description: 'تم حذف الفصل بنجاح',
        });
        loadCourse();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في حذف الفصل',
      });
    }
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string) => {
    if (!course || !confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      const updatedChapters = course.chapters?.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            lessons: chapter.lessons?.filter(l => l.id !== lessonId) || [],
          };
        }
        return chapter;
      }) || [];

      const result = await updateDocument('courses', course.id, {
        chapters: updatedChapters,
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الحذف',
          description: 'تم حذف الدرس بنجاح',
        });
        loadCourse();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في حذف الدرس',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="heading-3 mb-4">الكورس غير موجود</h2>
        <Button asChild>
          <Link to="/courses">العودة إلى الكورسات</Link>
        </Button>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground">الكورسات</Link>
            <span>/</span>
            <span>{course.title}</span>
          </div>
          <h1 className="heading-3 mt-2">{course.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge variant={course.isPublished ? 'success' : 'warning'}>
              {course.isPublished ? 'منشور' : 'مسودة'}
            </Badge>
            <Badge variant="outline">
              {course.level === 'beginner' && 'مبتدئ'}
              {course.level === 'intermediate' && 'متوسط'}
              {course.level === 'advanced' && 'متقدم'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              <Users className="inline h-4 w-4 ml-1" />
              {course.studentsCount || 0} طالب
            </span>
          </div>
        </div>
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to="/courses">
            <ArrowRight className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
            العودة
          </Link>
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">الوصف</p>
              <p className="mt-1">{course.description || 'لا يوجد وصف'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">التصنيف</p>
              <p className="mt-1">{course.category || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">السعر</p>
              <p className="mt-1">{course.price === 0 ? 'مجاني' : `${course.price} ريال`}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="heading-4">الفصول والدروس</h2>
        <div className="flex gap-2">
          <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="min-h-[44px]">
                <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                إضافة فصل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة فصل جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter-title">عنوان الفصل</Label>
                  <Input
                    id="chapter-title"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapter-description">الوصف</Label>
                  <Textarea
                    id="chapter-description"
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
                <Button 
                  onClick={handleAddChapter} 
                  className="w-full min-h-[44px]"
                  disabled={isSubmitting || !chapterForm.title}
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة الفصل'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="min-h-[44px]">
                <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                إضافة درس
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة درس جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-chapter">الفصل</Label>
                  <Select
                    value={selectedChapterId}
                    onValueChange={setSelectedChapterId}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="اختر الفصل" />
                    </SelectTrigger>
                    <SelectContent>
                      {course.chapters?.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">عنوان الدرس</Label>
                  <Input
                    id="lesson-title"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">الوصف</Label>
                  <Textarea
                    id="lesson-description"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-video">رابط الفيديو</Label>
                  <Input
                    id="lesson-video"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-source">مصدر الفيديو</Label>
                  <Select
                    value={lessonForm.videoSource}
                    onValueChange={(value) => setLessonForm({ ...lessonForm, videoSource: value as any })}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="اختر المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                      <SelectItem value="upload">رفع مباشر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lesson-free"
                    checked={lessonForm.isFree}
                    onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="lesson-free">درس مجاني</Label>
                </div>
                <Button 
                  onClick={handleAddLesson} 
                  className="w-full min-h-[44px]"
                  disabled={isSubmitting || !lessonForm.title || !selectedChapterId || !lessonForm.videoUrl}
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة الدرس'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chapters List */}
      <div className="space-y-3">
        {course.chapters?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد فصول</h3>
              <p className="text-muted-foreground">أضف أول فصل للبدء في بناء الكورس</p>
            </CardContent>
          </Card>
        ) : (
          course.chapters?.map((chapter, index) => (
            <Card key={chapter.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{chapter.title}</h3>
                    {chapter.description && (
                      <p className="text-sm text-muted-foreground">{chapter.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {chapter.lessons?.length || 0} دروس
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(chapter.id);
                    }}
                    className="min-h-[44px] min-w-[44px] text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedChapters.has(chapter.id) && (
                <div className="border-t border-border p-4 space-y-2">
                  {chapter.lessons?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا توجد دروس في هذا الفصل
                    </p>
                  ) : (
                    chapter.lessons?.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.isFree && (
                            <Badge variant="success" className="shrink-0">مجاني</Badge>
                          )}
                          <Badge variant="outline" className="shrink-0">
                            {lesson.videoSource === 'youtube' && 'YouTube'}
                            {lesson.videoSource === 'vimeo' && 'Vimeo'}
                            {lesson.videoSource === 'upload' && 'رفع مباشر'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLesson(chapter.id, lesson.id)}
                          className="min-h-[44px] min-w-[44px] text-danger hover:text-danger shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default CourseDetailPage;
