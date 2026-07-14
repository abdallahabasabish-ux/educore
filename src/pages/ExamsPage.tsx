import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical
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
import { Exam, Question } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const examSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().optional(),
  courseId: z.string().min(1, 'يرجى اختيار الكورس'),
  passingScore: z.number().min(0, 'درجة النجاح يجب أن تكون 0 أو أكثر').max(100, 'درجة النجاح يجب أن تكون 100 أو أقل'),
  timeLimit: z.number().optional(),
});

type ExamForm = z.infer<typeof examSchema>;

const ExamsPage = () => {
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { getDocuments, createDocument, updateDocument, deleteDocument } = useFirestore<Exam>();
  const { addToast } = useToast();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
  });

  // Load exams
  useEffect(() => {
    const loadExams = async () => {
      setLoading(true);
      try {
        const result = await getDocuments('exams', [], 50);
        if (result.success && result.data) {
          setExams(result.data.items);
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'فشل تحميل الامتحانات',
        });
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  // Load courses for dropdown
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const result = await getDocuments('courses', [], 100);
        if (result.success && result.data) {
          setCourses(result.data.items.map(c => ({ id: c.id, title: c.title })));
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadCourses();
  }, []);

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: ExamForm) => {
    setIsSubmitting(true);
    try {
      const examData: Partial<Exam> = {
        ...data,
        courseId: data.courseId,
        questions: [],
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await createDocument('exams', examData);
      if (result.success && result.data) {
        setExams([result.data, ...exams]);
        addToast({
          type: 'success',
          title: 'تم إنشاء الامتحان',
          description: 'تم إنشاء الامتحان بنجاح',
        });
        setIsCreateDialogOpen(false);
        reset();
        navigate(`/exams/${result.data.id}`);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل إنشاء الامتحان',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    setIsSubmitting(true);
    try {
      const result = await deleteDocument('exams', selectedExam.id);
      if (result.success) {
        setExams(exams.filter(e => e.id !== selectedExam.id));
        addToast({
          type: 'success',
          title: 'تم الحذف',
          description: 'تم حذف الامتحان بنجاح',
        });
        setIsDeleteDialogOpen(false);
        setSelectedExam(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حذف الامتحان',
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="heading-3">الامتحانات</h1>
          <p className="text-muted-foreground">إدارة الامتحانات والأسئلة</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]">
              <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              إنشاء امتحان جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء امتحان جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الامتحان الجديد. يمكنك إضافة الأسئلة لاحقاً.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الامتحان</Label>
                  <Input
                    id="title"
                    placeholder="مثال: امتحان منتصف الفصل"
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
                    placeholder="وصف الامتحان"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId">الكورس</Label>
                  <Select
                    onValueChange={(value) => setValue('courseId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكورس" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.courseId && (
                    <p className="text-sm text-danger">{errors.courseId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">درجة النجاح</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      placeholder="50"
                      {...register('passingScore', { valueAsNumber: true })}
                    />
                    {errors.passingScore && (
                      <p className="text-sm text-danger">{errors.passingScore.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">الوقت المحدد (دقائق)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      placeholder="30"
                      {...register('timeLimit', { valueAsNumber: true })}
                    />
                  </div>
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
            placeholder="بحث في الامتحانات..."
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
                  <TableHead>الكورس</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأسئلة</TableHead>
                  <TableHead>درجة النجاح</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد امتحانات. قم بإنشاء امتحان جديد.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {truncateText(exam.title, 30)}
                      </TableCell>
                      <TableCell>
                        {courses.find(c => c.id === exam.courseId)?.title || 'غير محدد'}
                      </TableCell>
                      <TableCell>{getStatusBadge(exam.isPublished)}</TableCell>
                      <TableCell>{exam.questions?.length || 0}</TableCell>
                      <TableCell>{exam.passingScore}%</TableCell>
                      <TableCell>{formatDate(exam.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/exams/${exam.id}`)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedExam(exam);
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
              هل أنت متأكد من حذف هذا الامتحان؟ هذا الإجراء لا يمكن التراجع عنه.
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

export default ExamsPage;
