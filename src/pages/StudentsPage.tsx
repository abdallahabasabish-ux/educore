import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Eye
} from 'lucide-react';
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
import { StudentEnrollment, StudentProfile } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StudentsPage = () => {
  const { user, isTeacher } = useAuth();
  const { getDocuments, updateDocument } = useFirestore<StudentEnrollment>();
  const { addToast } = useToast();

  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        // Load enrollments
        const enrollmentsResult = await getDocuments('enrollments', [], 50);
        if (enrollmentsResult.success && enrollmentsResult.data) {
          setEnrollments(enrollmentsResult.data.items);
        }

        // Load student profiles
        const studentsResult = await getDocuments('users', [], 50);
        if (studentsResult.success && studentsResult.data) {
          const studentUsers = studentsResult.data.items.filter(
            (u: any) => u.role === 'student'
          ) as StudentProfile[];
          setStudents(studentUsers);
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'فشل تحميل بيانات الطلاب',
        });
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const student = students.find((s) => s.id === enrollment.studentId);
    const searchLower = searchQuery.toLowerCase();
    return (
      student?.displayName.toLowerCase().includes(searchLower) ||
      student?.email.toLowerCase().includes(searchLower) ||
      enrollment.status.includes(searchLower) ||
      enrollment.paymentStatus.includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', variant: 'warning' as const },
      approved: { label: 'مقبول', variant: 'success' as const },
      rejected: { label: 'مرفوض', variant: 'destructive' as const },
    };
    const info = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const statusMap = {
      paid: { label: 'مدفوع', variant: 'success' as const },
      unpaid: { label: 'غير مدفوع', variant: 'destructive' as const },
      pending: { label: 'قيد الانتظار', variant: 'warning' as const },
    };
    const info = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedEnrollment) return;
    setIsSubmitting(true);
    try {
      const result = await updateDocument('enrollments', selectedEnrollment.id, {
        status,
        updatedAt: new Date(),
      });
      if (result.success) {
        setEnrollments(
          enrollments.map((e) =>
            e.id === selectedEnrollment.id ? { ...e, status } : e
          )
        );
        addToast({
          type: 'success',
          title: 'تم تحديث الحالة',
          description: `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطالب بنجاح`,
        });
        setIsStatusDialogOpen(false);
        setSelectedEnrollment(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل تحديث الحالة',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePayment = async (paymentStatus: 'paid' | 'unpaid') => {
    if (!selectedEnrollment) return;
    setIsSubmitting(true);
    try {
      const result = await updateDocument('enrollments', selectedEnrollment.id, {
        paymentStatus,
        updatedAt: new Date(),
      });
      if (result.success) {
        setEnrollments(
          enrollments.map((e) =>
            e.id === selectedEnrollment.id ? { ...e, paymentStatus } : e
          )
        );
        addToast({
          type: 'success',
          title: 'تم تحديث حالة الدفع',
          description: `تم تحديث حالة الدفع بنجاح`,
        });
        setIsPaymentDialogOpen(false);
        setSelectedEnrollment(null);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل تحديث حالة الدفع',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
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
          <h1 className="heading-3">الطلاب</h1>
          <p className="text-muted-foreground">إدارة الطلاب وطلبات الانضمام</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {enrollments.filter(e => e.status === 'pending').length} طلبات pending
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
          <TabsTrigger value="approved">مقبول</TabsTrigger>
          <TabsTrigger value="rejected">مرفوض</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <StudentTable
            enrollments={filteredEnrollments}
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedEnrollment={setSelectedEnrollment}
            setIsStatusDialogOpen={setIsStatusDialogOpen}
            setIsPaymentDialogOpen={setIsPaymentDialogOpen}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <StudentTable
            enrollments={filteredEnrollments.filter(e => e.status === 'pending')}
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedEnrollment={setSelectedEnrollment}
            setIsStatusDialogOpen={setIsStatusDialogOpen}
            setIsPaymentDialogOpen={setIsPaymentDialogOpen}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <StudentTable
            enrollments={filteredEnrollments.filter(e => e.status === 'approved')}
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedEnrollment={setSelectedEnrollment}
            setIsStatusDialogOpen={setIsStatusDialogOpen}
            setIsPaymentDialogOpen={setIsPaymentDialogOpen}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <StudentTable
            enrollments={filteredEnrollments.filter(e => e.status === 'rejected')}
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedEnrollment={setSelectedEnrollment}
            setIsStatusDialogOpen={setIsStatusDialogOpen}
            setIsPaymentDialogOpen={setIsPaymentDialogOpen}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الطالب</DialogTitle>
            <DialogDescription>
              اختر الإجراء المناسب لهذا الطالب
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="success"
              onClick={() => handleUpdateStatus('approved')}
              disabled={isSubmitting}
              className="min-h-[48px] min-w-[100px]"
            >
              <CheckCircle className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              قبول
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateStatus('rejected')}
              disabled={isSubmitting}
              className="min-h-[48px] min-w-[100px]"
            >
              <XCircle className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              رفض
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الدفع</DialogTitle>
            <DialogDescription>
              تحديث حالة الدفع للطالب
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="success"
              onClick={() => handleUpdatePayment('paid')}
              disabled={isSubmitting}
              className="min-h-[48px] min-w-[100px]"
            >
              مدفوع
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdatePayment('unpaid')}
              disabled={isSubmitting}
              className="min-h-[48px] min-w-[100px]"
            >
              غير مدفوع
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Helper component for student table
const StudentTable = ({
  enrollments,
  students,
  searchQuery,
  setSearchQuery,
  setSelectedEnrollment,
  setIsStatusDialogOpen,
  setIsPaymentDialogOpen,
  getStatusBadge,
  getPaymentBadge,
}: any) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن طالب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 min-h-[44px]"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الدفع</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا يوجد طلاب
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment: StudentEnrollment) => {
                    const student = students.find(
                      (s: StudentProfile) => s.id === enrollment.studentId
                    );
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student?.photoURL || undefined} />
                              <AvatarFallback>
                                {student?.displayName?.charAt(0) || 'ط'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {student?.displayName || 'غير معروف'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{student?.email || 'غير معروف'}</TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell>{getPaymentBadge(enrollment.paymentStatus)}</TableCell>
                        <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {enrollment.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setIsStatusDialogOpen(true);
                                }}
                              >
                                معالجة
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              الدفع
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="min-h-[36px] min-w-[36px]"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsPage;
