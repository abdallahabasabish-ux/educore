import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getInitials } from '@/lib/utils';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        displayName: data.displayName,
        email: data.email,
      });
      addToast({
        type: 'success',
        title: 'تم تحديث الملف الشخصي',
        description: 'تم حفظ التغييرات بنجاح',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'فشل تحديث الملف الشخصي',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="heading-3">الملف الشخصي</h1>
        <p className="text-muted-foreground">إدارة معلومات حسابك الشخصية</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{user.role === 'teacher' ? 'مدرس' : 'طالب'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>انضم في {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>تعديل المعلومات</CardTitle>
            <CardDescription>تحديث بيانات حسابك الشخصية</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">الاسم الكامل</Label>
                <Input
                  id="displayName"
                  type="text"
                  className="min-h-[44px]"
                  {...register('displayName')}
                />
                {errors.displayName && (
                  <p className="text-sm text-danger">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  className="min-h-[44px]"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-danger">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="min-h-[44px]" disabled={isLoading}>
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
