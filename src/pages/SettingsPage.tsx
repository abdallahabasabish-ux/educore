import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  Palette, 
  Globe, 
  Users, 
  Bell, 
  Shield,
  Image,
  Link2,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { Academy, AcademySettings } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const settingsSchema = z.object({
  name: z.string().min(2, 'اسم الأكاديمية مطلوب'),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'لون غير صالح'),
  website: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  facebook: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  twitter: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  instagram: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  youtube: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  enableExams: z.boolean(),
  enableCertificates: z.boolean(),
  enableDiscussions: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const { user } = useAuth();
  const { getDocument, updateDocument } = useFirestore<Academy>();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      enableExams: true,
      enableCertificates: true,
      enableDiscussions: false,
    },
  });

  const primaryColor = watch('primaryColor');

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // In a real app, we'd fetch the academy by user's academyId
        // For now, we'll simulate with a mock or basic query
        const result = await getDocument('academies', 'default');
        if (result.success && result.data) {
          setAcademy(result.data);
          setValue('name', result.data.name);
          setValue('description', result.data.description || '');
          setValue('primaryColor', result.data.primaryColor || '#4B5563');
          setValue('website', result.data.website || '');
          setValue('facebook', result.data.socialLinks?.facebook || '');
          setValue('twitter', result.data.socialLinks?.twitter || '');
          setValue('instagram', result.data.socialLinks?.instagram || '');
          setValue('youtube', result.data.socialLinks?.youtube || '');
          setLogoPreview(result.data.logo || null);
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'فشل تحميل الإعدادات',
        });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    if (!academy) return;
    setIsSubmitting(true);
    try {
      const updates: Partial<Academy> = {
        name: data.name,
        description: data.description,
        primaryColor: data.primaryColor,
        website: data.website,
        socialLinks: {
          facebook: data.facebook || undefined,
          twitter: data.twitter || undefined,
          instagram: data.instagram || undefined,
          youtube: data.youtube || undefined,
        },
        updatedAt: new Date(),
      };

      // In a real app, we'd upload the logo to Firebase Storage
      if (logoFile) {
        // upload logic here
        updates.logo = logoPreview || undefined;
      }

      const result = await updateDocument('academies', academy.id, updates);
      if (result.success) {
        setAcademy({ ...academy, ...updates });
        addToast({
          type: 'success',
          title: 'تم حفظ الإعدادات',
          description: 'تم تحديث إعدادات الأكاديمية بنجاح',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حفظ الإعدادات',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
      <div>
        <h1 className="heading-3">إعدادات الأكاديمية</h1>
        <p className="text-muted-foreground">إدارة إعدادات وتخصيصات أكاديميتك</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="appearance">المظهر</TabsTrigger>
            <TabsTrigger value="social">وسائل التواصل</TabsTrigger>
            <TabsTrigger value="features">المميزات</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
                <CardDescription>
                  إدارة المعلومات الأساسية للأكاديمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الأكاديمية</Label>
                  <Input
                    id="name"
                    placeholder="اسم الأكاديمية"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-danger">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Input
                    id="description"
                    placeholder="وصف الأكاديمية"
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className="text-sm text-danger">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>شعار الأكاديمية</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="شعار الأكاديمية"
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>تخصيص المظهر</CardTitle>
                <CardDescription>
                  تخصيص ألوان ومظهر الأكاديمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="primaryColor"
                      type="color"
                      className="w-20 h-12 p-1 min-h-[44px]"
                      {...register('primaryColor')}
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setValue('primaryColor', e.target.value)}
                      className="flex-1 min-h-[44px]"
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-sm text-danger">{errors.primaryColor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>معاينة اللون</Label>
                  <div
                    className="w-full h-20 rounded-lg border"
                    style={{ backgroundColor: primaryColor || '#4B5563' }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>وسائل التواصل الاجتماعي</CardTitle>
                <CardDescription>
                  إضافة روابط وسائل التواصل الاجتماعي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">
                    <Facebook className="inline ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                    فيسبوك
                  </Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/your-page"
                    {...register('facebook')}
                  />
                  {errors.facebook && (
                    <p className="text-sm text-danger">{errors.facebook.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">
                    <Twitter className="inline ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                    تويتر
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/your-handle"
                    {...register('twitter')}
                  />
                  {errors.twitter && (
                    <p className="text-sm text-danger">{errors.twitter.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">
                    <Instagram className="inline ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                    انستغرام
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/your-handle"
                    {...register('instagram')}
                  />
                  {errors.instagram && (
                    <p className="text-sm text-danger">{errors.instagram.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">
                    <Youtube className="inline ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                    يوتيوب
                  </Label>
                  <Input
                    id="youtube"
                    placeholder="https://youtube.com/your-channel"
                    {...register('youtube')}
                  />
                  {errors.youtube && (
                    <p className="text-sm text-danger">{errors.youtube.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المميزات</CardTitle>
                <CardDescription>
                  تفعيل أو تعطيل المميزات في الأكاديمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableExams">الامتحانات</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل نظام الامتحانات في الأكاديمية
                    </p>
                  </div>
                  <Switch
                    id="enableExams"
                    {...register('enableExams')}
                    defaultChecked={true}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCertificates">الشهادات</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل نظام الشهادات المعتمدة
                    </p>
                  </div>
                  <Switch
                    id="enableCertificates"
                    {...register('enableCertificates')}
                    defaultChecked={true}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableDiscussions">المناقشات</Label>
                    <p className="text-sm text-muted-foreground">
                      تفعيل نظام المناقشات بين الطلاب
                    </p>
                  </div>
                  <Switch
                    id="enableDiscussions"
                    {...register('enableDiscussions')}
                    defaultChecked={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" className="min-h-[48px] min-w-[120px]" disabled={isSubmitting}>
            <Save className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default SettingsPage;
