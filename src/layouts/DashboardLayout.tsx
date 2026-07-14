import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowed?: ('teacher' | 'student')[];
}

const navItems: NavItem[] = [
  {
    label: 'لوحة التحكم',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    allowed: ['teacher', 'student'],
  },
  {
    label: 'الكورسات',
    href: '/courses',
    icon: <BookOpen className="h-5 w-5" />,
    allowed: ['teacher'],
  },
  {
    label: 'الطلاب',
    href: '/students',
    icon: <Users className="h-5 w-5" />,
    allowed: ['teacher'],
  },
  {
    label: 'الامتحانات',
    href: '/exams',
    icon: <FileText className="h-5 w-5" />,
    allowed: ['teacher'],
  },
  {
    label: 'الإعدادات',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    allowed: ['teacher', 'student'],
  },
];

export const DashboardLayout = () => {
  const { user, logout, isTeacher } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNavItems = navItems.filter(
    (item) => !item.allowed || item.allowed.includes(user?.role as 'teacher' | 'student')
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-background border border-border shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-72 bg-background border-l border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link to="/" className="flex items-center">
              <Logo />
            </Link>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-border" />

            {/* User Profile */}
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px]',
                location.pathname === '/profile'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="h-5 w-5" />
              <span className="font-medium">الملف الشخصي</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[48px] text-danger hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {user?.displayName || user?.email}
              </span>
              <ModeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="container-custom py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
