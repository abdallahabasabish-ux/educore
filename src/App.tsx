import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/toast';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { TeacherLayout } from '@/layouts/TeacherLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import ChapterPage from '@/pages/ChapterPage';
import StudentsPage from '@/pages/StudentsPage';
import ExamsPage from '@/pages/ExamsPage';
import ExamPage from '@/pages/ExamPage';
import SettingsPage from '@/pages/SettingsPage';
import TeacherPage from '@/pages/TeacherPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { isTeacher, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!isTeacher) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="edukore-theme">
      <ToastProvider>
        {/* ✅ basename مضبوط على اسم المستودع */}
        <BrowserRouter basename="/educore">
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/@:username" element={<TeacherPage />} />
            </Route>
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route element={<ProtectedRoute><TeacherRoute><TeacherLayout /></TeacherRoute></ProtectedRoute>}>
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/courses/:courseId/chapters/:chapterId" element={<ChapterPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/exams/:id" element={<ExamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
