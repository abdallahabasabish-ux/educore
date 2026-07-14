import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  PlayCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Video,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useFirestore } from '@/hooks/useFirestore';
import { Course, Chapter, Lesson } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const ChapterPage = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { getDocument } = useFirestore<Course>();
  const { addToast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (courseId && chapterId) {
      loadData();
    }
  }, [courseId, chapterId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getDocument('courses', courseId!);
      if (result.success && result.data) {
        setCourse(result.data);
        const foundChapter = result.data.chapters?.find(c => c.id === chapterId);
        if (foundChapter) {
          setChapter(foundChapter);
          if (foundChapter.lessons?.length > 0) {
            setSelectedLesson(foundChapter.lessons[0]);
          }
        } else {
          addToast({
            type: 'error',
            title: 'خطأ',
            description: 'الفصل غير موجود',
          });
          navigate(`/courses/${courseId}`);
        }
      } else {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'الكورس غير موجود',
        });
        navigate('/courses');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل في تحميل البيانات',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoEmbedUrl = (url: string, source: string) => {
    if (source === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (source === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!course || !chapter) {
    return (
      <div className="text-center py-12">
        <h2 className="heading-3 mb-4">البيانات غير موجودة</h2>
        <Button asChild>
          <Link to="/courses">العودة إلى الكورسات</Link>
        </Button>
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
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/courses" className="hover:text-foreground">الكورسات</Link>
          <span>/</span>
          <Link to={`/courses/${course.id}`} className="hover:text-foreground">
            {course.title}
          </Link>
          <span>/</span>
          <span>{chapter.title}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="heading-3">{chapter.title}</h1>
            {chapter.description && (
              <p className="text-muted-foreground mt-1">{chapter.description}</p>
            )}
          </div>
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link to={`/courses/${course.id}`}>
              <ArrowRight className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              العودة للكورس
            </Link>
          </Button>
        </div>
      </div>

      {/* Video Player & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              {selectedLesson ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <iframe
                      src={getVideoEmbedUrl(selectedLesson.videoUrl, selectedLesson.videoSource)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={selectedLesson.title}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedLesson.title}</h3>
                    {selectedLesson.description && (
                      <p className="text-muted-foreground mt-1">{selectedLesson.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Badge variant="outline">
                        <Video className="h-3 w-3 ml-1" />
                        {selectedLesson.videoSource === 'youtube' && 'YouTube'}
                        {selectedLesson.videoSource === 'vimeo' && 'Vimeo'}
                        {selectedLesson.videoSource === 'upload' && 'رفع مباشر'}
                      </Badge>
                      {selectedLesson.isFree && (
                        <Badge variant="success">مجاني</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">اختر درساً للبدء</h3>
                  <p className="text-muted-foreground">اختر درساً من القائمة الجانبية</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lessons List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">دروس الفصل</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {chapter.lessons?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد دروس في هذا الفصل
                </p>
              ) : (
                chapter.lessons?.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={cn(
                      "w-full text-right p-3 rounded-lg transition-colors flex items-start gap-3 min-h-[60px]",
                      selectedLesson?.id === lesson.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {index + 1}. {lesson.title}
                      </p>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    {lesson.isFree && (
                      <Badge variant="success" className="shrink-0 text-xs">مجاني</Badge>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ChapterPage;
