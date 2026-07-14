import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  DollarSign
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
import { StudentEnrollment, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StudentsPage = () => {
  const { user } = useAuth();
  const { getDocuments, updateDocument } = useFirestore<StudentEnrollment>();
  const { addToast } = useToast();
  
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [students, setStudents] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid' | 'pending'>('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all enrollments
      const enrollmentsResult = await getDocuments('enrollments', [], 100);
      if (enrollmentsResult.success && enrollmentsResult.data) {
        const items = enrollmentsResult.data.items;
        setEnrollments(items);

        // Fetch student details
        const studentIds = [...new Set(items.map(e => e.studentId))];
        const studentsData: Record<string, User> = {};
        for (const id of studentIds) {
          // In a real app, you'd fetch from users collection
          // For now, we'll use mock data
          studentsData[id] = {
            id,
            displayName: `طالب ${id.slice(0, 6)}`,
            email: `student${id.slice(0, 4)}@example.com`,
            role: 'student',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        setStudents(studentsData);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحميل الطلاب',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const student = students[enrollment.studentId];
    const matchesSearch = student?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || enrollment.paymentStatus === filterPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleUpdateStatus = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    try {
      const result = await updateDocument('enrollments', enrollmentId, {
        status,
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم التحديث',
          description: `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطالب بنجاح`,
        });
        loadData();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحديث حالة الطالب',
      });
    }
  };

  const handleUpdatePayment = async (enrollmentId: string, paymentStatus: 'paid' | 'unpaid') => {
    setIsSubmitting(true);
    try {
      const result = await updateDocument('enrollments', enrollmentId, {
        paymentStatus,
        updatedAt: new Date(),
      });
      if (result.success) {
        addToast({
          type: 'success',
          title: 'تم التحديث',
          description: `تم تحديث حالة الدفع بنجاح`,
        });
        setIsPaymentDialogOpen(false);
        loadData();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحديث حالة الدفع',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const approvedCount = enrollments.filter(e => e.status === 'approved').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-3">الطلاب</h1>
          <p className="text-muted-foreground">إدارة الطلاب المسجلين وطلبات الانضمام</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الطلاب المسجلين</p>
              <p className="text-2xl font-bold">{approvedCount}</p>
            </div>
            <Users className="h-8 w-8 text-primary/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">طلبات الانتظار</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-warning/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المدفوعات المعلقة</p>
              <p className="text-2xl font-bold text-danger">
                {enrollments.filter(e => e.paymentStatus === 'pending').length}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-danger/30" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">الجميع</TabsTrigger>
          <TabsTrigger value="pending">
            قيد الانتظار
            {pendingCount > 0 && (
              <Badge variant="warning" className="mr-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">المقبولين</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <StudentsTable 
            enrollments={filteredEnrollments}
            students={students}
            onUpdateStatus={handleUpdateStatus}
            onOpenPaymentDialog={(enrollment) => {
              setSelectedEnrollment(enrollment);
              setIsPaymentDialogOpen(true);
            }}
            filterStatus={filterStatus}
            filterPayment={filterPayment}
            setFilterStatus={setFilterStatus}
            setFilterPayment={setFilterPayment}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <StudentsTable 
            enrollments={filteredEnrollments.filter(e => e.status === 'pending')}
            students={students}
            onUpdateStatus={handleUpdateStatus}
            onOpenPaymentDialog={(enrollment) => {
              setSelectedEnrollment(enrollment);
              setIsPaymentDialogOpen(true);
            }}
            filterStatus={filterStatus}
            filterPayment={filterPayment}
            setFilterStatus={setFilterStatus}
            setFilterPayment={setFilterPayment}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showPendingOnly
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <StudentsTable 
            enrollments={filteredEnrollments.filter(e => e.status === 'approved')}
            students={students}
            onUpdateStatus={handleUpdateStatus}
            onOpenPaymentDialog={(enrollment) => {
              setSelectedEnrollment(enrollment);
              setIsPaymentDialogOpen(true);
            }}
            filterStatus={filterStatus}
            filterPayment={filterPayment}
            setFilterStatus={setFilterStatus}
            setFilterPayment={setFilterPayment}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              تحديث حالة الدفع للطالب: {selectedEnrollment && students[selectedEnrollment.studentId]?.displayName}
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 min-h-[44px]"
                onClick={() => selectedEnrollment && handleUpdatePayment(selectedEnrollment.id, 'paid')}
                disabled={isSubmitting}
              >
                <CheckCircle className="ml-2 h-4 w-4" />
                مدفوع
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() => selectedEnrollment && handleUpdatePayment(selectedEnrollment.id, 'unpaid')}
                disabled={isSubmitting}
              >
                <XCircle className="ml-2 h-4 w-4" />
                غير مدفوع
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Students Table Component
interface StudentsTableProps {
  enrollments: StudentEnrollment[];
  students: Record<string, User>;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
  onOpenPaymentDialog: (enrollment: StudentEnrollment) => void;
  filterStatus: string;
  filterPayment: string;
  setFilterStatus: (value: any) => void;
  setFilterPayment: (value: any) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showPendingOnly?: boolean;
}

const StudentsTable = ({
  enrollments,
  students,
  onUpdateStatus,
  onOpenPaymentDialog,
  filterStatus,
  filterPayment,
  setFilterStatus,
  setFilterPayment,
  searchTerm,
  setSearchTerm,
  showPendingOnly = false,
}: StudentsTableProps) => {
  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 min-h-[44px]"
              />
            </div>
            {!showPendingOnly && (
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الجميع</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="approved">مقبول</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select
              value={filterPayment}
              onValueChange={(value) => setFilterPayment(value as any)}
            >
              <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
                <SelectValue placeholder="الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الجميع</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="unpaid">غير مدفوع</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد طلاب</h3>
              <p className="text-muted-foreground">لم يتم تسجيل أي طالب بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الدفع</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const student = students[enrollment.studentId];
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student?.photoURL || undefined} />
                              <AvatarFallback>
                                {getInitials(student?.displayName || 'طالب')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student?.displayName || 'طالب غير معروف'}</div>
                              <div className="text-sm text-muted-foreground">ID: {enrollment.studentId.slice(0, 8)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student?.email || 'غير متوفر'}</TableCell>
                        <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.status === 'approved' ? 'success' :
                              enrollment.status === 'pending' ? 'warning' : 'destructive'
                            }
                          >
                            {enrollment.status === 'approved' && 'مقبول'}
                            {enrollment.status === 'pending' && 'قيد الانتظار'}
                            {enrollment.status === 'rejected' && 'مرفوض'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.paymentStatus === 'paid' ? 'success' :
                              enrollment.paymentStatus === 'pending' ? 'warning' : 'destructive'
                            }
                          >
                            {enrollment.paymentStatus === 'paid' && 'مدفوع'}
                            {enrollment.paymentStatus === 'pending' && 'معلق'}
                            {enrollment.paymentStatus === 'unpaid' && 'غير مدفوع'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {enrollment.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => onUpdateStatus(enrollment.id, 'approved')}
                                  className="min-h-[36px]"
                                >
                                  <CheckCircle className="ml-1 h-3 w-3" />
                                  قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => onUpdateStatus(enrollment.id, 'rejected')}
                                  className="min-h-[36px]"
                                >
                                  <XCircle className="ml-1 h-3 w-3" />
                                  رفض
                                </Button>
                              </>
                            )}
                            {enrollment.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenPaymentDialog(enrollment)}
                                className="min-h-[36px]"
                              >
                                <DollarSign className="ml-1 h-3 w-3" />
                                تحديث الدفع
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default StudentsPage;
