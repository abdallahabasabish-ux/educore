import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  Clock,
  Users,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const courseSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().optional(),
  price: z.number().min(0, 'السعر يجب أن يكون 0 أو أكثر'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().optional(),
});

type CourseForm = z.infer<typeof courseSchema>;

const CoursesPage = () => {
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { getDocuments, createDocument, updateDocument, deleteDocument } = useFirestore<Course>();
  const { addToast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      price: 0,
      level: 'beginner',
    },
  });

  // Load courses
  useEffect(() => {
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
          description: 'فشل تحميل الكورسات',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: CourseForm) => {
    setIsSubmitting(true);
    try {
      const courseData: Partial<Course> = {
        ...data,
        academyId: 'default', // In real app, get from user
        isPublished: false,
        studentsCount: 0,
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await createDocument('courses', courseData);
      if (result.success && result.data) {
        setCourses([result.data, ...courses]);
        addToast({
          type: 'success',
          title: 'تم إنشاء الكورس',
          description: 'تم إنشاء الكورس بنجاح',
        });
        setIsCreateDialogOpen(false);
        reset();
        navigate(`/courses/${result.data.id}`);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل إنشاء الكورس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    try {
      const result = await deleteDocument('courses', selectedCourse.id);
      if (result.success) {
        setCourses(courses.filter(c => c.id !== selectedCourse.id));
        addToast({
          type: 'success',
          title: 'تم الحذف',
          description: 'تم حذف الكورس بنجاح',
        });
        setIsDeleteDialogOpen(false);
        setSelectedCourse(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حذف الكورس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelBadge = (level: string) => {
    const levels = {
      beginner: { label: 'مبتدئ', variant: 'success' as const },
      intermediate: { label: 'متوسط', variant: 'warning' as const },
      advanced: { label: 'متقدم', variant: 'destructive' as const },
    };
    const levelInfo = levels[level as keyof typeof levels] || levels.beginner;
    return <Badge variant={levelInfo.variant}>{levelInfo.label}</Badge>;
  };

  const getStatusBadge = (isPublished: boolean) => {
    return isPublished ? (
      <Badge variant="success">منشور</Badge>
    ) : (
      <Badge variant="warning">مسودة</Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
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
          <p className="text-muted-foreground">إدارة الكورسات والفصول والدروس</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]">
              <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              إنشاء كورس جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء كورس جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الكورس الجديد. يمكنك إضافة الفصول والدروس لاحقاً.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الكورس</Label>
                  <Input
                    id="title"
                    placeholder="مثال: دورة تعلم React"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-danger">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Input
                    id="description"
                    placeholder="وصف الكورس"
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">السعر (ريال)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="text-sm text-danger">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">المستوى</Label>
                    <Select
                      onValueChange={(value) => setValue('level', value as 'beginner' | 'intermediate' | 'advanced')}
                      defaultValue="beginner"
                    >
                      <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف (اختياري)</Label>
                  <Input
                    id="category"
                    placeholder="مثال: برمجة، تصميم، تسويق"
                    {...register('category')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الكورسات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الطلاب</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد كورسات. قم بإنشاء كورس جديد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {truncateText(course.title, 30)}
                      </TableCell>
                      <TableCell>{getLevelBadge(course.level)}</TableCell>
                      <TableCell>{course.price === 0 ? 'مجاني' : `${course.price} ريال`}</TableCell>
                      <TableCell>{getStatusBadge(course.isPublished)}</TableCell>
                      <TableCell>{course.studentsCount || 0}</TableCell>
                      <TableCell>{formatDate(course.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="min-h-[44px] min-w-[44px] text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الكورس؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CoursesPage;
