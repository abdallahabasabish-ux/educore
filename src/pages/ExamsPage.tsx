import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Exam, Question } from '@/types';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const questionSchema = z.object({
  text: z.string().min(3, 'نص السؤال مطلوب'),
  options: z.array(z.string().min(1, 'الخيار مطلوب')).min(2, 'يجب إضافة خيارين على الأقل'),
  correctAnswer: z.number().min(0, 'يرجى اختيار الإجابة الصحيحة'),
  points: z.number().min(1, 'النقاط يجب أن تكون 1 على الأقل'),
  explanation: z.string().optional(),
});

type QuestionForm = z.infer<typeof questionSchema>;

const ExamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { getDocument, updateDocument, addSubCollection } = useFirestore<Exam>();
  const { addToast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [examCompleted, setExamCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      options: ['', ''],
      points: 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  useEffect(() => {
    const loadExam = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await getDocument('exams', id);
        if (result.success && result.data) {
          setExam(result.data);
          setAnswers(new Array(result.data.questions?.length || 0).fill(-1));
        } else {
          addToast({
            type: 'error',
            title: 'خطأ',
            description: 'الامتحان غير موجود',
          });
          navigate('/exams');
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'خطأ',
          description: 'فشل تحميل الامتحان',
        });
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [id]);

  const handleAddQuestion = async (data: QuestionForm) => {
    if (!exam) return;
    setIsSubmitting(true);
    try {
      const question: Question = {
        id: Math.random().toString(36).substring(2, 9),
        text: data.text,
        options: data.options,
        correctAnswer: data.correctAnswer,
        points: data.points,
        explanation: data.explanation,
      };

      const updatedQuestions = [...(exam.questions || []), question];
      const result = await updateDocument('exams', exam.id, {
        questions: updatedQuestions,
      });

      if (result.success && result.data) {
        setExam(result.data);
        addToast({
          type: 'success',
          title: 'تم إضافة السؤال',
          description: 'تمت إضافة السؤال بنجاح',
        });
        setIsAddingQuestion(false);
        reset({ options: ['', ''], points: 1 });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل إضافة السؤال',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!exam) return;
    try {
      const updatedQuestions = exam.questions?.filter(q => q.id !== questionId) || [];
      const result = await updateDocument('exams', exam.id, {
        questions: updatedQuestions,
      });
      if (result.success && result.data) {
        setExam(result.data);
        addToast({
          type: 'success',
          title: 'تم حذف السؤال',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'خطأ',
        description: 'فشل حذف السؤال',
      });
    }
  };

  const handleStartExam = () => {
    setIsTakingExam(true);
    setCurrentQuestionIndex(0);
    setAnswers(new Array(exam?.questions?.length || 0).fill(-1));
    setExamCompleted(false);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (exam?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitExam = () => {
    if (!exam) return;
    
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    exam.questions?.forEach((question, index) => {
      const answer = answers[index];
      totalPoints += question.points;
      if (answer === question.correctAnswer) {
        correctCount++;
        earnedPoints += question.points;
      }
    });

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = finalScore >= exam.passingScore;

    setScore(finalScore);
    setPassed(isPassed);
    setExamCompleted(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">الامتحان غير موجود</h2>
        <Button onClick={() => navigate('/exams')}>العودة إلى الامتحانات</Button>
      </div>
    );
  }

  if (examCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center py-12"
      >
        <div className="mb-8">
          {passed ? (
            <CheckCircle className="h-24 w-24 text-success mx-auto" />
          ) : (
            <XCircle className="h-24 w-24 text-danger mx-auto" />
          )}
        </div>
        <h2 className="heading-3 mb-4">
          {passed ? 'تهانينا! لقد اجتزت الامتحان' : 'للأسف، لم تجتز الامتحان'}
        </h2>
        <p className="text-muted-foreground mb-4">
          درجتك: {score}% (النجاح يتطلب {exam.passingScore}%)
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => setIsTakingExam(false)}>العودة إلى الامتحان</Button>
          <Button variant="outline" onClick={() => navigate('/exams')}>العودة إلى القائمة</Button>
        </div>
      </motion.div>
    );
  }

  if (isTakingExam) {
    const questions = exam.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد أسئلة في هذا الامتحان</p>
          <Button onClick={() => setIsTakingExam(false)}>العودة</Button>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-4">{exam.title}</h2>
          <Badge variant="secondary">
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.text}</CardTitle>
            <CardDescription>
              اختر الإجابة الصحيحة ( {currentQuestion.points} نقاط )
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={answers[currentQuestionIndex] === index ? 'default' : 'outline'}
                className="w-full justify-start text-right min-h-[48px]"
                onClick={() => handleAnswer(index)}
              >
                <span className="ml-2 rtl:mr-2 rtl:ml-0">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowRight className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                السابق
              </Button>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmitExam} variant="success">
                  إنهاء الامتحان
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  التالي
                  <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    answers[index] >= 0 ? 'bg-success' : 'bg-muted',
                    index === currentQuestionIndex && 'ring-2 ring-primary'
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/exams')}>
              <ArrowRight className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
              العودة
            </Button>
            <h1 className="heading-3">{exam.title}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{exam.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={exam.isPublished ? 'success' : 'warning'}>
            {exam.isPublished ? 'منشور' : 'مسودة'}
          </Badge>
          {!exam.isPublished && isTeacher && (
            <Button variant="outline" size="sm">
              نشر الامتحان
            </Button>
          )}
          {isTeacher && (
            <Button onClick={handleStartExam} variant="success">
              بدء الامتحان
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">الأسئلة</p>
            <p className="text-2xl font-bold">{exam.questions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">درجة النجاح</p>
            <p className="text-2xl font-bold">{exam.passingScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">المدة</p>
            <p className="text-2xl font-bold">{exam.timeLimit || 'غير محدد'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
            <p className="text-sm font-medium">{formatDate(exam.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Questions Management */}
      {isTeacher && (
        <Tabs defaultValue="questions" className="w-full">
          <TabsList>
            <TabsTrigger value="questions">الأسئلة</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">قائمة الأسئلة</h3>
              <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                    إضافة سؤال
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة سؤال جديد</DialogTitle>
                    <DialogDescription>
                      أدخل نص السؤال والخيارات والإجابة الصحيحة
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(handleAddQuestion)}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="text">نص السؤال</Label>
                        <Input
                          id="text"
                          placeholder="أدخل نص السؤال"
                          {...register('text')}
                        />
                        {errors.text && (
                          <p className="text-sm text-danger">{errors.text.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>الخيارات</Label>
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <span className="w-8 text-sm font-medium">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <Input
                              placeholder={`الخيار ${index + 1}`}
                              {...register(`options.${index}`)}
                            />
                            {fields.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-danger min-h-[44px] min-w-[44px]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append('')}
                        >
                          <Plus className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                          إضافة خيار
                        </Button>
                        {errors.options && (
                          <p className="text-sm text-danger">{errors.options.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="correctAnswer">الإجابة الصحيحة</Label>
                        <select
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 min-h-[44px]"
                          {...register('correctAnswer', { valueAsNumber: true })}
                        >
                          <option value="">اختر الإجابة الصحيحة</option>
                          {fields.map((_, index) => (
                            <option key={index} value={index}>
                              {String.fromCharCode(65 + index)}
                            </option>
                          ))}
                        </select>
                        {errors.correctAnswer && (
                          <p className="text-sm text-danger">{errors.correctAnswer.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="points">النقاط</Label>
                          <Input
                            id="points"
                            type="number"
                            {...register('points', { valueAsNumber: true })}
                          />
                          {errors.points && (
                            <p className="text-sm text-danger">{errors.points.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="explanation">شرح الإجابة (اختياري)</Label>
                          <Input
                            id="explanation"
                            placeholder="شرح الإجابة الصحيحة"
                            {...register('explanation')}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddingQuestion(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الإضافة...' : 'إضافة السؤال'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {exam.questions?.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">سؤال {index + 1}</Badge>
                          <Badge variant="outline">{question.points} نقاط</Badge>
                        </div>
                        <p className="mt-2 font-medium">{question.text}</p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={cn(
                                'text-sm p-2 rounded',
                                optIndex === question.correctAnswer
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted/50'
                              )}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {optIndex === question.correctAnswer && (
                                <CheckCircle className="inline ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-danger min-h-[44px] min-w-[44px]"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الامتحان</CardTitle>
                <CardDescription>تعديل إعدادات الامتحان</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>عنوان الامتحان</Label>
                    <Input defaultValue={exam.title} />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input defaultValue={exam.description || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>درجة النجاح</Label>
                    <Input type="number" defaultValue={exam.passingScore} />
                  </div>
                  <div className="space-y-2">
                    <Label>الوقت المحدد (دقائق)</Label>
                    <Input type="number" defaultValue={exam.timeLimit || ''} />
                  </div>
                  <Button>حفظ التغييرات</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
};

export default ExamPage;
