import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <h1 className="text-8xl font-bold text-primary/20 mb-4">404</h1>
        <h2 className="heading-3 mb-4">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link to="/">
              <Home className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              الرئيسية
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
