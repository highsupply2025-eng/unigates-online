import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, Play, Lock, CheckCircle, Clock,
  ArrowLeft, ArrowRight, Crown, BarChart3, Award, Radio, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const StudentDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);

    const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(profileData);

    await Promise.all([
      loadSubscriptions(user.id),
      loadProgress(user.id),
      loadLiveStreams(),
      loadSubmissions(user.id),
    ]);
    setLoading(false);
  };

  const loadSubscriptions = async (userId: string) => {
    const { data: subs } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId).eq("status", "active");
    setSubscriptions(subs || []);
    
    if (subs && subs.length > 0) {
      const courseIds = [...new Set(subs.map(s => s.course_id))];
      const { data: coursesData } = await supabase.from("courses").select("*").in("id", courseIds);
      setCourses(coursesData || []);
    }

    // Also load all available courses
    const { data: allCourses } = await supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(20);
    if (!subs || subs.length === 0) {
      setCourses(allCourses || []);
    }
  };

  const loadProgress = async (userId: string) => {
    const { data } = await supabase.from("student_progress").select("*").eq("user_id", userId);
    setProgress(data || []);
  };

  const loadLiveStreams = async () => {
    const { data } = await supabase.from("live_streams").select("*").in("status", ["live", "scheduled"]).order("scheduled_at", { ascending: true }).limit(10);
    setLiveStreams(data || []);
  };

  const loadSubmissions = async (userId: string) => {
    const { data } = await supabase.from("assignment_submissions").select("*").eq("student_id", userId).order("submitted_at", { ascending: false });
    setSubmissions(data || []);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? (isRtl ? course.title_ar : course.title_en) : "—";
  };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || course.episode_count === 0) return 0;
    const completed = progress.filter(p => p.course_id === courseId && p.completed).length;
    return Math.round((completed / course.episode_count) * 100);
  };

  const subscribedCourseIds = subscriptions.map(s => s.course_id);
  const subscribedCourses = courses.filter(c => subscribedCourseIds.includes(c.id));
  const availableCourses = courses.filter(c => !subscribedCourseIds.includes(c.id));

  const totalCompleted = progress.filter(p => p.completed).length;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-2">
              <BookOpen className="w-3 h-3 me-1" />{isRtl ? "لوحة الطالب" : "Student"}
            </Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="font-semibold gap-1.5">
                <User className="w-4 h-4" />{isRtl ? "الملف" : "Profile"}
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground mb-1">
            {isRtl ? `مرحباً ${profile?.full_name || ""}! 👋` : `Welcome ${profile?.full_name || ""}! 👋`}
          </h1>
          <p className="text-muted-foreground">
            {isRtl ? "تابع تقدمك في الدورات واستمر في التعلّم" : "Track your progress and keep learning"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center">
            <BookOpen className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{subscriptions.length}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "دورات مشترك بها" : "Subscribed Courses"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <CheckCircle className="w-7 h-7 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "حلقات مكتملة" : "Completed Episodes"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Award className="w-7 h-7 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{submissions.filter(s => s.grade).length}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "تكليفات مُقيّمة" : "Graded Assignments"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Radio className="w-7 h-7 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{liveStreams.filter(s => s.status === "live").length}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "بث مباشر الآن" : "Live Now"}</p>
          </CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="courses" className="gap-1.5">
              <BookOpen className="w-4 h-4" />{isRtl ? "دوراتي" : "My Courses"}
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />{isRtl ? "تصفّح الدورات" : "Browse Courses"}
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5">
              <Radio className="w-4 h-4" />{isRtl ? "بث مباشر" : "Live Streams"}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5">
              <Award className="w-4 h-4" />{isRtl ? "التكليفات" : "Assignments"}
            </TabsTrigger>
          </TabsList>

          {/* My Courses */}
          <TabsContent value="courses">
            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{isRtl ? "لا توجد اشتراكات حالياً" : "No subscriptions yet"}</h3>
                <p className="text-muted-foreground mb-4">{isRtl ? "تصفّح الدورات واشترك في المستوى المناسب لك" : "Browse courses and subscribe to a level"}</p>
                <Button onClick={() => setActiveTab("browse")}>{isRtl ? "تصفّح الدورات" : "Browse Courses"}</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscribedCourses.map(course => {
                  const prog = getCourseProgress(course.id);
                  const sub = subscriptions.find(s => s.course_id === course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Crown className="w-3 h-3 me-1" />
                            {isRtl ? `المستوى ${sub?.level_number}` : `Level ${sub?.level_number}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={prog} className="flex-1 h-2" />
                          <span className="text-sm font-bold text-foreground">{prog}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {progress.filter(p => p.course_id === course.id && p.completed).length}/{course.episode_count} {isRtl ? "حلقة" : "episodes"}
                          </span>
                          <Button size="sm" variant="default" className="gap-1.5">
                            <Play className="w-3.5 h-3.5" />{isRtl ? "متابعة" : "Continue"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Browse Courses */}
          <TabsContent value="browse">
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{isRtl ? "لا توجد دورات متاحة" : "No courses available"}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => {
                  const isSubscribed = subscribedCourseIds.includes(course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden card-hover">
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/80 to-primary relative flex items-center justify-center">
                        {course.thumbnail_url && (
                          <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <Badge className="absolute top-3 start-3 bg-background/80 text-foreground backdrop-blur-sm">
                          {isRtl ? course.category_ar : course.category_en}
                        </Badge>
                        {isSubscribed && (
                          <Badge className="absolute top-3 end-3 bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 me-1" />{isRtl ? "مشترك" : "Subscribed"}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-foreground mb-1">{isRtl ? course.title_ar : course.title_en}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{course.episode_count} {isRtl ? "حلقة" : "ep"}
                          </span>
                          {!isSubscribed && (
                            <Link to="/choose-plan">
                              <Button size="sm" variant="default">{isRtl ? "اشترك الآن" : "Subscribe"}</Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Live Streams */}
          <TabsContent value="live">
            {liveStreams.length === 0 ? (
              <div className="text-center py-16">
                <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد بثوث حالياً" : "No live streams right now"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {liveStreams.map(stream => (
                  <Card key={stream.id} className="card-hover">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stream.status === "live" ? "bg-red-100" : "bg-muted"}`}>
                          <Radio className={`w-6 h-6 ${stream.status === "live" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{isRtl ? stream.title_ar : stream.title_en}</p>
                          {stream.scheduled_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={stream.status === "live" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}>
                          {stream.status === "live" ? (isRtl ? "مباشر" : "LIVE") : (isRtl ? "قادم" : "Upcoming")}
                        </Badge>
                        {stream.status === "live" && (
                          <Link to={`/stream/${stream.id}`}>
                            <Button size="sm">{isRtl ? "انضم" : "Join"}</Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            {submissions.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد تكليفات مُسلّمة" : "No submitted assignments"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {submissions.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{sub.file_name || (isRtl ? "تكليف" : "Assignment")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.grade ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">{sub.grade}</Badge>
                        ) : (
                          <Badge variant="secondary">{isRtl ? "قيد التقييم" : "Pending"}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
