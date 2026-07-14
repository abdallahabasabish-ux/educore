import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  Users,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { Course } from '@/types';
import { FIREBASE_COLLECTIONS, COURSE_LEVELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const CoursesPage = () => {
  const { user } = useAuth();
  const { getDocuments, deleteDocument } = useFirestore();
  const { addToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getDocuments(FIREBASE_COLLECTIONS.COURSES);
      if (res.success && res.data) {
        setCourses(res.data.items as Course[]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteDocument(FIREBASE_COLLECTIONS.COURSES, courseToDelete.id);
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      addToast({
        type: 'success',
        title: 'تم حذف الكورس',
        description: `تم حذف "${courseToDelete.title}" بنجاح`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'فشل حذف الكورس',
        description: (error as Error).message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelBadge = (level: string) => {
    const levels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      beginner: { label: 'مبتدئ', variant: 'default' },
      intermediate: { label: 'متوسط', variant: 'secondary' },
      advanced: { label: 'متقدم', variant: 'destructive' },
    };
    return levels[level] || { label: level, variant: 'default' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-3">الكورسات</h1>
          <p className="text-muted-foreground">إدارة جميع الكورسات التعليمية</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link to="/courses/new">
            <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
            إنشاء كورس جديد
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
          <Input
            placeholder="بحث عن كورس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 min-h-[44px]"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-h-[44px]">
                <Filter className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                المستوى
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterLevel('all')}>
                الكل
              </DropdownMenuItem>
              {COURSE_LEVELS.map((level) => (
                <DropdownMenuItem key={level.value} onClick={() => setFilterLevel(level.value)}>
                  {level.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const levelBadge = getLevelBadge(course.level);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="card-hover h-full flex flex-col">
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                        {course.isPublished ? 'منشور' : 'مسودة'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'لا يوجد وصف'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.studentsCount || 0} طالب
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration || 0} دقيقة
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm" className="min-h-[36px]">
                        <Link to={`/courses/${course.id}`}>
                          <Eye className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0" />
                          عرض
                        </Link>
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/courses/${course.id}/edit`}>
                            <Edit className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                            تعديل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger"
                          onClick={() => handleDelete(course)}
                        >
                          <Trash2 className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد كورسات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول كورس لك الآن</p>
            <Button asChild>
              <Link to="/courses/new">
                <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                إنشاء كورس جديد
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">تأكيد الحذف</h3>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من حذف الكورس "{courseToDelete.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CoursesPage;
