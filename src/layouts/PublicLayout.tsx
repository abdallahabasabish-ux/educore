import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/ModeToggle';

export const PublicLayout = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <Logo />
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">لوحة التحكم</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">إنشاء حساب</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EduCore. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                الشروط والأحكام
              </Link>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                سياسة الخصوصية
              </Link>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
