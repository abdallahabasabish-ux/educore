import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { Course } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const courseSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0, 'السعر يجب أن يكون 0 أو أكثر'),
  category: z.string().optional(),
});

type CourseForm = z.infer<typeof courseSchema>;

const CoursesPage = () => {
  const { user, isTeacher } = useAuth();
  const { getDocuments, createDocument, updateDocument, deleteDocument } = useFirestore<Course>();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: 'beginner',
      price: 0,
    },
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await getDocuments('courses', [], 50);
      if (result.success && result.data) {
        setCourses(result.data.items);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحميل الكورسات',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (data: CourseForm) => {
    try {
      const courseData = {
        ...data,
        academyId: user?.id,
        isPublished: false,
        studentsCount: 0,
        chapters: [],
      };
      const result = await createDocument('courses', courseData);
      if (result.success && result.data) {
        setCourses([result.data, ...courses]);
        addToast({
          type: 'success',
          title: 'تم إنشاء الكورس',
          description: 'تم إضافة الكورس بنجاح',
        });
        setIsDialogOpen(false);
        reset();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في إنشاء الكورس',
      });
    }
  };

  const handleUpdateCourse = async (data: CourseForm) => {
    if (!editingCourse) return;
    try {
      const result = await updateDocument('courses', editingCourse.id, data);
      if (result.success && result.data) {
        setCourses(courses.map(c => c.id === editingCourse.id ? result.data : c));
        addToast({
          type: 'success',
          title: 'تم تحديث الكورس',
          description: 'تم حفظ التغييرات بنجاح',
        });
        setIsDialogOpen(false);
        setEditingCourse(null);
        reset();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحديث الكورس',
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      const result = await deleteDocument('courses', courseToDelete);
      if (result.success) {
        setCourses(courses.filter(c => c.id !== courseToDelete));
        addToast({
          type: 'success',
          title: 'تم حذف الكورس',
          description: 'تم حذف الكورس بنجاح',
        });
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في حذف الكورس',
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setValue('title', course.title);
    setValue('description', course.description);
    setValue('level', course.level);
    setValue('price', course.price);
    setValue('category', course.category || '');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setCourseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelBadge = (level: string) => {
    const levels = {
      beginner: { label: 'مبتدئ', variant: 'success' as const },
      intermediate: { label: 'متوسط', variant: 'warning' as const },
      advanced: { label: 'متقدم', variant: 'destructive' as const },
    };
    return levels[level as keyof typeof levels] || levels.beginner;
  };

  if (!isTeacher) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="heading-3 mb-2">غير مصرح به</h2>
        <p className="text-muted-foreground">هذه الصفحة مخصصة للمدرسين فقط</p>
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
          <h1 className="heading-3">الكورسات</h1>
          <p className="text-muted-foreground">إدارة جميع الكورسات التعليمية</p>
        </div>
        <Button onClick={() => {
          setEditingCourse(null);
          reset();
          setIsDialogOpen(true);
        }} className="min-h-[44px]">
          <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          إضافة كورس جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-3 rtl:right-auto" />
          <Input
            placeholder="بحث عن كورس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="min-h-[44px] sm:w-[180px]">
            <SelectValue placeholder="المستوى" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المستويات</SelectItem>
            <SelectItem value="beginner">مبتدئ</SelectItem>
            <SelectItem value="intermediate">متوسط</SelectItem>
            <SelectItem value="advanced">متقدم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">لا توجد كورسات</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'ابدأ بإضافة أول كورس لك'}
            </p>
            {!searchQuery && (
              <Button onClick={() => {
                setEditingCourse(null);
                reset();
                setIsDialogOpen(true);
              }}>
                <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                إضافة كورس
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const levelBadge = getLevelBadge(course.level);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-hover h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {course.studentsCount || 0} طالب
                          </span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/courses/${course.id}`}>
                              <Eye className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                              عرض التفاصيل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(course)}>
                            <Edit className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(course.id)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="font-semibold">
                      {course.price === 0 ? 'مجاني' : `${course.price} ر.س`}
                    </span>
                    <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                      <Link to={`/courses/${course.id}`}>
                        عرض التفاصيل
                        <ChevronLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'تعديل الكورس' : 'إضافة كورس جديد'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'قم بتحديث معلومات الكورس' : 'أدخل معلومات الكورس الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(editingCourse ? handleUpdateCourse : handleCreateCourse)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الكورس</Label>
                <Input
                  id="title"
                  placeholder="أدخل عنوان الكورس"
                  className="min-h-[44px]"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-danger">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  placeholder="وصف الكورس"
                  className="min-h-[100px] resize-y"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-danger">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">المستوى</Label>
                  <Select
                    defaultValue="beginner"
                    onValueChange={(value) => setValue('level', value as any)}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-danger">{errors.level.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ر.س)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    className="min-h-[44px]"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-danger">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">التصنيف (اختياري)</Label>
                <Input
                  id="category"
                  placeholder="مثال: برمجة، تصميم، تسويق"
                  className="min-h-[44px]"
                  {...register('category')}
                />
                {errors.category && (
                  <p className="text-sm text-danger">{errors.category.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setEditingCourse(null);
                reset();
              }} className="min-h-[44px]">
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
                {isSubmitting ? 'جاري الحفظ...' : (editingCourse ? 'تحديث' : 'إضافة')}
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
              هل أنت متأكد من حذف هذا الكورس؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteCourse} className="min-h-[44px]">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CoursesPage;
