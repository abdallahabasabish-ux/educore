import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Course, StudentEnrollment, Exam } from '@/types';
import { FIREBASE_COLLECTIONS } from '@/lib/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const { getDocuments } = useFirestore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalExams: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch courses
        const coursesRes = await getDocuments(FIREBASE_COLLECTIONS.COURSES);
        if (coursesRes.success && coursesRes.data) {
          setCourses(coursesRes.data.items as Course[]);
        }

        // Fetch enrollments
        const enrollmentsRes = await getDocuments(FIREBASE_COLLECTIONS.ENROLLMENTS);
        if (enrollmentsRes.success && enrollmentsRes.data) {
          setEnrollments(enrollmentsRes.data.items as StudentEnrollment[]);
        }

        // Fetch exams
        const examsRes = await getDocuments(FIREBASE_COLLECTIONS.EXAMS);
        if (examsRes.success && examsRes.data) {
          setExams(examsRes.data.items as Exam[]);
        }

        // Calculate stats
        const totalCourses = coursesRes.success ? coursesRes.data?.items?.length || 0 : 0;
        const totalStudents = enrollmentsRes.success
          ? new Set(enrollmentsRes.data?.items?.map((e: StudentEnrollment) => e.studentId)).size || 0
          : 0;
        const totalExams = examsRes.success ? examsRes.data?.items?.length || 0 : 0;
        const approvedEnrollments =
          enrollmentsRes.success
            ?.items?.filter((e: StudentEnrollment) => e.status === 'approved') || [];
        const completionRate =
          approvedEnrollments.length > 0
            ? Math.round(
                (approvedEnrollments.filter((e: StudentEnrollment) => e.progress?.overallProgress === 100)
                  .length /
                  approvedEnrollments.length) *
                  100
              )
            : 0;

        setStats({
          totalCourses,
          totalStudents,
          totalExams,
          completionRate,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'الكورسات',
      value: stats.totalCourses,
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'الطلاب',
      value: stats.totalStudents,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'الامتحانات',
      value: stats.totalExams,
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-warning/10 text-warning',
    },
    {
      title: 'نسبة الإنجاز',
      value: `${stats.completionRate}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-primary/10 text-primary',
    },
  ];

  const chartData = courses.map((course) => ({
    name: course.title.length > 15 ? course.title.slice(0, 15) + '...' : course.title,
    students: course.studentsCount || 0,
  }));

  const pieData = [
    { name: 'مكتمل', value: stats.completionRate },
    { name: 'غير مكتمل', value: 100 - stats.completionRate },
  ];

  const COLORS = ['#22C55E', '#EF4444'];

  const recentCourses = courses.slice(0, 5);

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
          <h1 className="heading-3">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بعودتك، {user?.displayName || 'مستخدم'}</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link to="/courses/new">
            <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
            إنشاء كورس جديد
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="heading-3 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>توزيع الطلاب في الكورسات</CardTitle>
            <CardDescription>عدد الطلاب المسجلين في كل كورس</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>نسبة الإنجاز</CardTitle>
            <CardDescription>نسبة الطلاب الذين أكملوا الكورسات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {stats.completionRate > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>لا توجد بيانات</p>
                  <p className="text-sm">قم بإضافة طلاب لبدء التتبع</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>أحدث الكورسات</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/courses">
                عرض الكل
                <ChevronLeft className="mr-1 h-4 w-4 rtl:ml-1 rtl:mr-0" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentCourses.length > 0 ? (
            <div className="divide-y divide-border">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-muted/50 rounded-lg px-3 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{course.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.studentsCount || 0} طالب
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(course.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد كورسات بعد</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/courses/new">أنشئ أول كورس لك</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardPage;
