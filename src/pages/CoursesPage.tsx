import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  Filter,
  ChevronDown,
  MoreVertical,
  PlayCircle,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { Course } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, truncateText } from '@/lib/utils';

const CoursesPage = () => {
  const { user } = useAuth();
  const { getDocuments, createDocument, updateDocument, deleteDocument } = useFirestore<Course>();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    isPublished: false,
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

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'published' && course.isPublished) ||
                          (filterStatus === 'draft' && !course.isPublished);
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const result = await createDocument('courses', {
        ...formData,
        academyId: user?.academyId || '',
        studentsCount: 0,
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الإنشاء',
          description: 'تم إنشاء الكورس بنجاح',
        });
        setIsCreateDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          price: 0,
          level: 'beginner',
          category: '',
          isPublished: false,
        });
        loadCourses();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في إنشاء الكورس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;
    setIsSubmitting(true);
    try {
      const result = await updateDocument('courses', editingCourse.id, {
        ...formData,
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم التحديث',
          description: 'تم تحديث الكورس بنجاح',
        });
        setEditingCourse(null);
        setFormData({
          title: '',
          description: '',
          price: 0,
          level: 'beginner',
          category: '',
          isPublished: false,
        });
        loadCourses();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحديث الكورس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;
    try {
      const result = await deleteDocument('courses', id);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم الحذف',
          description: 'تم حذف الكورس بنجاح',
        });
        loadCourses();
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
    setFormData({
      title: course.title,
      description: course.description || '',
      price: course.price || 0,
      level: course.level || 'beginner',
      category: course.category || '',
      isPublished: course.isPublished || false,
    });
  };

  const closeEditDialog = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      price: 0,
      level: 'beginner',
      category: '',
      isPublished: false,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-3">الكورسات</h1>
          <p className="text-muted-foreground">إدارة الكورسات التعليمية الخاصة بك</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px]">
              <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              إضافة كورس جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة كورس جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الكورس</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الكورس"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل وصف الكورس"
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">المستوى</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value as any })}
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
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="مثال: برمجة، تصميم، تسويق"
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isPublished">نشر الكورس فوراً</Label>
              </div>
              <Button 
                onClick={handleCreate} 
                className="w-full min-h-[44px]"
                disabled={isSubmitting || !formData.title}
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الكورس'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن كورس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 min-h-[44px]"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as any)}
            >
              <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الكورسات</SelectItem>
                <SelectItem value="published">منشور</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardContent className="p-0">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد كورسات</h3>
              <p className="text-muted-foreground">ابدأ بإضافة أول كورس لك</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكورس</TableHead>
                    <TableHead>المستوى</TableHead>
                    <TableHead>الطلاب</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {truncateText(course.description || '', 50)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {course.level === 'beginner' && 'مبتدئ'}
                          {course.level === 'intermediate' && 'متوسط'}
                          {course.level === 'advanced' && 'متقدم'}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.studentsCount || 0}</TableCell>
                      <TableCell>{course.price === 0 ? 'مجاني' : `${course.price} ريال`}</TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'success' : 'warning'}>
                          {course.isPublished ? 'منشور' : 'مسودة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Link to={`/courses/${course.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(course)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(course.id)}
                            className="min-h-[44px] min-w-[44px] text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل الكورس</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">عنوان الكورس</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">السعر</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-level">المستوى</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value as any })}
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
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">التصنيف</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit-isPublished">نشر الكورس</Label>
            </div>
            <Button 
              onClick={handleUpdate} 
              className="w-full min-h-[44px]"
              disabled={isSubmitting || !formData.title}
            >
              {isSubmitting ? 'جاري التحديث...' : 'تحديث الكورس'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CoursesPage;
