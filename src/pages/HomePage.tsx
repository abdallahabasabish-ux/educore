import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Award, 
  BarChart3, 
  Shield,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: 'إدارة الكورسات',
    description: 'أنشئ كورساتك بسهولة مع فصول ودروس منظمة، وأضف فيديوهات من YouTube أو Vimeo.',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'إدارة الطلاب',
    description: 'استقبل طلبات الانضمام، وادِر الطلاب المسجلين، وتابع تقدمهم.',
  },
  {
    icon: <GraduationCap className="h-8 w-8" />,
    title: 'امتحانات احترافية',
    description: 'أنشئ امتحانات اختيار من متعدد مع تصحيح تلقائي وعرض النتائج فوراً.',
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: 'شهادات معتمدة',
    description: 'امنح طلابك شهادات إتمام معتمدة عند اجتيازهم للكورسات.',
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'تحليلات متقدمة',
    description: 'تابع أداء طلابك وتحليلات الكورسات بشكل دقيق ومبسط.',
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'أمان كامل',
    description: 'بياناتك محمية بأحدث تقنيات الأمان من Firebase وGoogle Cloud.',
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              نظام تشغيل متكامل للأكاديميات التعليمية
            </div>

            <h1 className="heading-1 mb-6">
              منصة تعليمية متكاملة
              <br />
              <span className="text-primary">لإدارة أكاديميتك</span>
            </h1>

            <p className="body-large text-muted-foreground mb-8 max-w-2xl mx-auto">
              EduCore هو نظام تشغيل متكامل للأكاديميات التعليمية، يسهل عليك إدارة الكورسات،
              الطلاب، الامتحانات، والمزيد في مكان واحد.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="min-h-[48px]">
                  <Link to="/dashboard">
                    الذهاب إلى لوحة التحكم
                    <ArrowLeft className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="min-h-[48px]">
                    <Link to="/register">
                      ابدأ الآن مجاناً
                      <ArrowLeft className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-h-[48px]">
                    <Link to="/login">
                      تسجيل الدخول
                      <ArrowLeft className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                مجاني للاستخدام
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                سحابة كاملة
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                دعم عربي
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="heading-2 mb-4">مميزات المنصة</h2>
            <p className="body-large text-muted-foreground">
              كل ما تحتاجه لإدارة أكاديميتك التعليمية بنجاح
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="card-hover h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            
            <div className="relative">
              <h2 className="heading-2 text-primary-foreground mb-4">
                جاهز لبدء رحلتك التعليمية؟
              </h2>
              <p className="body-large text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                انضم إلى آلاف الأكاديميات التي تثق في EduCore لإدارة عملياتها التعليمية
              </p>
              {!isAuthenticated && (
                <Button asChild size="lg" variant="secondary" className="min-h-[48px]">
                  <Link to="/register">
                    إنشاء حساب مجاني
                    <ArrowLeft className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
