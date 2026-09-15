import { useState, useEffect, useMemo, useRef, memo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  Globe, ArrowLeft, ArrowRight, Loader2, Users, BookOpen, Calendar,
  Video, FileText, Download, BarChart3, Clock, CheckCircle, AlertCircle,
  GraduationCap, Star, ClipboardList, Radio, Eye, LogOut, Menu, Home,
  Award, ShieldCheck, User, RefreshCw, Plus, Upload, X, Play, Film,
  Trash2, Paperclip, Sparkles, TrendingUp, Cpu, Flame, ArrowUpRight,
  CheckCircle2, Building2, Languages, BookOpenCheck, MessageSquare,
  FileQuestion, Search, Filter, HelpCircle, Share2, Copy, Check,
  SlidersHorizontal, Lock, DollarSign, Layers, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardMenuDropdown, { type DashboardMenuItem } from "@/components/DashboardMenuDropdown";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { MiniBars } from "@/components/MiniBars";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
import LiveStreamRoom from "@/components/LiveStreamRoom";

export type CourseProviderRole = "lecturer" | "teacher" | "training_center" | "language_center";

interface RoleTerminology {
  roleNameAr: string;
  roleNameEn: string;
  dashboardTitleAr: string;
  dashboardTitleEn: string;
  badgeGradient: string;
  themeColor: string;
  items: {
    contentAr: string;
    contentEn: string;
    contentSingularAr: string;
    contentSingularEn: string;
    liveAr: string;
    liveEn: string;
    quizzesAr: string;
    quizzesEn: string;
    schedulesAr: string;
    schedulesEn: string;
    assignmentsAr: string;
    assignmentsEn: string;
    assignmentResultsAr: string;
    assignmentResultsEn: string;
    quizResultsAr: string;
    quizResultsEn: string;
    ratingsAr: string;
    ratingsEn: string;
    traineesAr: string;
    traineesEn: string;
    traineeSingularAr: string;
    traineeSingularEn: string;
    profileAr: string;
    profileEn: string;
  };
}

const ROLE_CONFIGS: Record<CourseProviderRole, RoleTerminology> = {
  lecturer: {
    roleNameAr: "محاضر ومدرب مستقل",
    roleNameEn: "Independent Instructor & Lecturer",
    dashboardTitleAr: "لوحة المحاضر والمدرب المستقل",
    dashboardTitleEn: "Instructor & Lecturer Dashboard",
    badgeGradient: "from-purple-600 to-indigo-600",
    themeColor: "purple",
    items: {
      contentAr: "الدورات والمحاضرات",
      contentEn: "Courses & Lectures",
      contentSingularAr: "دورة تدريبية",
      contentSingularEn: "Course",
      liveAr: "البث المباشر",
      liveEn: "Live Streams",
      quizzesAr: "الاختبارات التدريبية",
      quizzesEn: "Training Quizzes",
      schedulesAr: "الجداول الزمنية",
      schedulesEn: "Schedules",
      assignmentsAr: "التكليفات العملية",
      assignmentsEn: "Practical Assignments",
      assignmentResultsAr: "نتائج التكليفات",
      assignmentResultsEn: "Assignment Results",
      quizResultsAr: "نتائج الاختبارات",
      quizResultsEn: "Quiz Results",
      ratingsAr: "تقييمات المتدربين",
      ratingsEn: "Trainee Ratings",
      traineesAr: "المتدربين",
      traineesEn: "Trainees",
      traineeSingularAr: "متدرب",
      traineeSingularEn: "Trainee",
      profileAr: "بيانات الحساب والمدرب",
      profileEn: "Account & Profile",
    },
  },
  teacher: {
    roleNameAr: "معلّم متميز",
    roleNameEn: "Distinguished Teacher",
    dashboardTitleAr: "لوحة المعلّم المتميز",
    dashboardTitleEn: "Distinguished Teacher Dashboard",
    badgeGradient: "from-emerald-600 to-teal-600",
    themeColor: "emerald",
    items: {
      contentAr: "الدروس والحصص",
      contentEn: "Lessons & Classes",
      contentSingularAr: "درس تعليمي",
      contentSingularEn: "Lesson",
      liveAr: "البث المباشر للفصول",
      liveEn: "Live Virtual Classes",
      quizzesAr: "الاختبارات والتقويم",
      quizzesEn: "Quizzes & Assessments",
      schedulesAr: "الجداول المدرسية والحصص",
      schedulesEn: "School Timetable",
      assignmentsAr: "الواجبات والتكليفات",
      assignmentsEn: "Homework & Assignments",
      assignmentResultsAr: "نتائج الواجبات",
      assignmentResultsEn: "Homework Results",
      quizResultsAr: "نتائج الاختبارات والتقويم",
      quizResultsEn: "Assessment Results",
      ratingsAr: "تقييمات الطلاب",
      ratingsEn: "Student Ratings",
      traineesAr: "الطلاب",
      traineesEn: "Students",
      traineeSingularAr: "طالب",
      traineeSingularEn: "Student",
      profileAr: "بيانات المعلّم والحساب",
      profileEn: "Teacher Profile",
    },
  },
  training_center: {
    roleNameAr: "مركز تدريب وأكاديمية",
    roleNameEn: "Training Center & Academy",
    dashboardTitleAr: "لوحة مركز التدريب والأكاديمية",
    dashboardTitleEn: "Training Center & Academy Dashboard",
    badgeGradient: "from-amber-500 to-orange-600",
    themeColor: "amber",
    items: {
      contentAr: "الدبلومات والبرامج التدريبية",
      contentEn: "Diplomas & Programs",
      contentSingularAr: "برنامج تدريبي",
      contentSingularEn: "Program",
      liveAr: "قاعات البث المباشر",
      liveEn: "Live Training Rooms",
      quizzesAr: "الاختبارات المعتمدة",
      quizzesEn: "Certified Exams",
      schedulesAr: "جداول البرامج التدريبية",
      schedulesEn: "Program Schedules",
      assignmentsAr: "المشاريع والتكليفات",
      assignmentsEn: "Projects & Tasks",
      assignmentResultsAr: "نتائج المشاريع والتكليفات",
      assignmentResultsEn: "Project Results",
      quizResultsAr: "نتائج الاختبارات المعتمدة",
      quizResultsEn: "Certified Exam Results",
      ratingsAr: "تقييمات المتدربين والعملاء",
      ratingsEn: "Trainee & Client Ratings",
      traineesAr: "المتدربين والملتحقين",
      traineesEn: "Enrolled Trainees",
      traineeSingularAr: "متدرب",
      traineeSingularEn: "Trainee",
      profileAr: "بيانات المركز والأكاديمية",
      profileEn: "Academy Profile",
    },
  },
  language_center: {
    roleNameAr: "مركز لغات وترجمة",
    roleNameEn: "Language & Translation Center",
    dashboardTitleAr: "لوحة مركز اللغات والترجمة",
    dashboardTitleEn: "Language & Translation Center Dashboard",
    badgeGradient: "from-rose-500 to-pink-600",
    themeColor: "rose",
    items: {
      contentAr: "دورات وبرامج اللغات",
      contentEn: "Language Courses & Tracks",
      contentSingularAr: "دورة لغة",
      contentSingularEn: "Language Track",
      liveAr: "جلسات المحادثة الحية",
      liveEn: "Live Speaking Sessions",
      quizzesAr: "اختبارات الكفاءة والمستوى",
      quizzesEn: "Proficiency & Level Tests",
      schedulesAr: "جداول المستويات والورش",
      schedulesEn: "Level Schedules & Workshops",
      assignmentsAr: "التطبيقات اللغوية",
      assignmentsEn: "Language Assignments",
      assignmentResultsAr: "نتائج التطبيقات اللغوية",
      assignmentResultsEn: "Assignment Results",
      quizResultsAr: "نتائج اختبارات المستوى",
      quizResultsEn: "Proficiency Test Results",
      ratingsAr: "تقييمات الدارسين",
      ratingsEn: "Learner Ratings",
      traineesAr: "الدارسين والمتدربين",
      traineesEn: "Language Learners",
      traineeSingularAr: "دارس",
      traineeSingularEn: "Learner",
      profileAr: "بيانات مركز اللغات",
      profileEn: "Center Profile",
    },
  },
};

interface Props {
  fixedRole?: CourseProviderRole;
}

export default function CourseProviderDashboard({ fixedRole }: Props) {
  const { role: routeRole } = useParams<{ role?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  // Role resolution
  const activeRole: CourseProviderRole = useMemo(() => {
    if (fixedRole) return fixedRole;
    if (routeRole && Object.keys(ROLE_CONFIGS).includes(routeRole)) {
      return routeRole as CourseProviderRole;
    }
    const path = window.location.pathname;
    if (path.includes("teacher")) return "teacher";
    if (path.includes("training-center")) return "training_center";
    if (path.includes("language-center")) return "language_center";
    return "lecturer";
  }, [fixedRole, routeRole]);

  const cfg = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.lecturer;

  // Tabs management
  const normalizeTab = (tabStr: string | null) => {
    if (!tabStr) return "overview";
    if (["courses", "lectures", "lessons", "programs"].includes(tabStr)) return "content";
    if (["live", "livestreams", "rooms", "speaking"].includes(tabStr)) return "livestreams";
    if (["quizzes", "exams", "tests"].includes(tabStr)) return "quizzes";
    if (["schedules", "timetable"].includes(tabStr)) return "schedules";
    if (["assignments", "homework", "projects"].includes(tabStr)) return "assignments";
    if (["assignment-results", "assignmentresults", "project-results"].includes(tabStr)) return "assignmentresults";
    if (["quiz-results", "quizresults", "exam-results"].includes(tabStr)) return "quizresults";
    if (["ratings", "reviews"].includes(tabStr)) return "ratings";
    if (["messages", "inbox"].includes(tabStr)) return "messages";
    if (["profile", "account", "settings"].includes(tabStr)) return "profile";
    return tabStr;
  };

  const [activeTab, setActiveTabState] = useState(() => normalizeTab(searchParams.get("tab")));
  const setActiveTab = (tab: string) => {
    const normalized = normalizeTab(tab);
    setActiveTabState(normalized);
    setSearchParams(normalized === "overview" ? {} : { tab: normalized }, { replace: true });
  };

  useEffect(() => {
    const t = normalizeTab(searchParams.get("tab"));
    if (t && t !== activeTab) setActiveTabState(t);
  }, [searchParams]);

  // Auth & Profile Data
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Live Stream room state
  const [activeLiveRoom, setActiveLiveRoom] = useState<{ id: string; title: string } | null>(null);

  // Core Data States
  const [courses, setCourses] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Dialog / Modal States
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [createStreamOpen, setCreateStreamOpen] = useState(false);
  const [createQuizOpen, setCreateQuizOpen] = useState(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  // Forms
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    isFree: false,
    level: "all",
    drmProtected: true,
  });

  const [newStream, setNewStream] = useState({
    title: "",
    description: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    durationMins: 60,
  });

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    durationMins: 30,
    passingScore: 60,
    questionsCount: 5,
    instructions: "",
  });

  const [newSchedule, setNewSchedule] = useState({
    day: "الأحد",
    timeStart: "10:00",
    timeEnd: "12:00",
    subject: "",
    locationOrLink: "قاعة تفاعلية 1",
  });

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    maxGrade: 100,
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    specialty: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Load Initial Data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          // If in preview without auth, show rich demo state
          setUser({ id: "demo-user", email: "provider@unigates.online" });
          setProfile({
            full_name: isRtl ? (cfg.roleNameAr) : cfg.roleNameEn,
            email: "provider@unigates.online",
            role: activeRole,
          });
          setProfileForm({
            fullName: isRtl ? cfg.roleNameAr : cfg.roleNameEn,
            email: "provider@unigates.online",
            phone: "+966500000000",
            bio: isRtl ? "مدرب ومحاضر معتمد لدى أكاديمية يونيجيتس للتعليم والتدريب المستمر." : "Accredited Instructor at UNIGATES Academy.",
            specialty: isRtl ? "علوم الحاسب والذكاء الاصطناعي" : "Computer Science & AI",
          });
          populateSampleData();
          setLoading(false);
          return;
        }

        setUser(authUser);
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).maybeSingle();
        if (prof) {
          setProfile(prof);
          setProfileForm({
            fullName: prof.full_name || "",
            email: authUser.email || "",
            phone: prof.phone || "",
            bio: prof.bio || (isRtl ? "عضو معتمد في المنصة" : "Accredited platform member"),
            specialty: prof.specialty || "",
          });
        }

        // Fetch user courses
        const { data: userCourses } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (userCourses && userCourses.length > 0) {
          setCourses(userCourses);
        } else {
          populateSampleData();
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        populateSampleData();
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [activeRole, isRtl]);

  const populateSampleData = () => {
    setCourses([
      { id: "1", title: isRtl ? `${cfg.items.contentSingularAr}: المسار المتقدم الاحترافي` : `${cfg.items.contentSingularEn}: Professional Masterclass`, category: "Technology & AI", studentsCount: 142, rating: 4.9, isFree: false, price: 299, views: 1850, drm: true, created_at: "2026-03-01" },
      { id: "2", title: isRtl ? `${cfg.items.contentSingularAr}: الأساسيات والتطبيقات العملية` : `${cfg.items.contentSingularEn}: Fundamentals & Hands-on`, category: "Foundations", studentsCount: 89, rating: 4.8, isFree: true, price: 0, views: 920, drm: true, created_at: "2026-03-05" },
      { id: "3", title: isRtl ? `${cfg.items.contentSingularAr}: ورش العمل المكثفة والشهادات` : `${cfg.items.contentSingularEn}: Intensive Workshop & Cert`, category: "Certification", studentsCount: 215, rating: 5.0, isFree: false, price: 450, views: 3410, drm: true, created_at: "2026-03-10" },
    ]);

    setLiveStreams([
      { id: "ls-1", title: isRtl ? `جلسة بث تفاعلية: مناقشة المشاريع وحل التكليفات` : `Live Interactive Session: Projects & Review`, scheduled_at: "اليوم 08:00 م", viewers_count: 76, status: "scheduled" },
      { id: "ls-2", title: isRtl ? `بث مباشر: المحاضرة الافتتاحية للمستوى المتقدم` : `Live Stream: Advanced Level Kickoff`, scheduled_at: "غداً 06:00 م", viewers_count: 110, status: "scheduled" },
    ]);

    setQuizzes([
      { id: "q-1", title: isRtl ? `الاختبار النصفي الشامل (المستوى الأول)` : `Midterm Assessment (Level 1)`, duration_mins: 45, passing_score: 60, submissions_count: 88, avg_score: 84 },
      { id: "q-2", title: isRtl ? `اختبار تحديد المستوى والكفاءة` : `Proficiency & Level Benchmark Test`, duration_mins: 30, passing_score: 70, submissions_count: 132, avg_score: 79 },
    ]);

    setSchedules([
      { id: "s-1", day: isRtl ? "الأحد" : "Sunday", time_start: "10:00", time_end: "12:00", subject: isRtl ? "المحاضرة النظرية الأولى" : "Theoretical Module 1", hall: "Room A-101" },
      { id: "s-2", day: isRtl ? "الثلاثاء" : "Tuesday", time_start: "14:00", time_end: "16:00", subject: isRtl ? "التطبيقات العملية والمختبر" : "Hands-on Lab Session", hall: "Lab B-204" },
      { id: "s-3", day: isRtl ? "الخميس" : "Thursday", time_start: "18:00", time_end: "19:30", subject: isRtl ? "جلسة المراجعة والأسئلة" : "Q&A Office Hours", hall: "Virtual Hall 1" },
    ]);

    setAssignments([
      { id: "a-1", title: isRtl ? `مشروع التخرج والتطبيق النهائي` : `Final Capstone Project`, due_date: "2026-09-30", max_grade: 100, submissions_count: 64 },
      { id: "a-2", title: isRtl ? `التكليف العملي الثاني: التحليل والتطبيق` : `Assignment 2: Case Study & Analysis`, due_date: "2026-09-22", max_grade: 50, submissions_count: 105 },
    ]);

    setAssignmentSubmissions([
      { id: "sub-1", student_name: "أحمد عبد الله العتيبي", assignment_title: isRtl ? "مشروع التخرج والتطبيق النهائي" : "Final Capstone Project", submitted_at: "2026-09-14", score: 95, status: "graded", feedback: "عمل متقن ومتميز جداً" },
      { id: "sub-2", student_name: "سارة محمد الشمري", assignment_title: isRtl ? "مشروع التخرج والتطبيق النهائي" : "Final Capstone Project", submitted_at: "2026-09-14", score: null, status: "pending", feedback: "" },
      { id: "sub-3", student_name: "خالد بن فيصل القحطاني", assignment_title: isRtl ? "التكليف العملي الثاني" : "Assignment 2", submitted_at: "2026-09-13", score: 48, status: "graded", feedback: "إجابات نموذجية وتحليل عميق" },
      { id: "sub-4", student_name: "مريم حسن الزهراني", assignment_title: isRtl ? "التكليف العملي الثاني" : "Assignment 2", submitted_at: "2026-09-13", score: null, status: "pending", feedback: "" },
    ]);

    setQuizSubmissions([
      { id: "qs-1", student_name: "عبد العزيز فهد الدوسري", quiz_title: isRtl ? "الاختبار النصفي الشامل" : "Midterm Assessment", score: 92, percentage: 92, passed: true, completed_at: "2026-09-14 14:30" },
      { id: "qs-2", student_name: "نورة سعود الغامدي", quiz_title: isRtl ? "الاختبار النصفي الشامل" : "Midterm Assessment", score: 88, percentage: 88, passed: true, completed_at: "2026-09-14 15:10" },
      { id: "qs-3", student_name: "عمر يوسف السالم", quiz_title: isRtl ? "اختبار تحديد المستوى والكفاءة" : "Proficiency Test", score: 55, percentage: 55, passed: false, completed_at: "2026-09-13 11:20" },
      { id: "qs-4", student_name: "ريم طلال العنزي", quiz_title: isRtl ? "اختبار تحديد المستوى والكفاءة" : "Proficiency Test", score: 96, percentage: 96, passed: true, completed_at: "2026-09-13 16:45" },
    ]);

    setRatings([
      { id: "r-1", student_name: "فيصل عبد الرحمن", rating: 5, comment: isRtl ? "شرح وافي ومحتوى متقدم جداً استفدت منه كثيراً في عملي." : "Excellent explanations and high quality content.", date: "2026-09-12" },
      { id: "r-2", student_name: "فاطمة إبراهيم", rating: 5, comment: isRtl ? "تنظيم رائع ودعم مستمر في قنوات التواصل." : "Great organization and constant support.", date: "2026-09-10" },
      { id: "r-3", student_name: "محمد بدر العوضي", rating: 4, comment: isRtl ? "دورة ممتازة والتطبيقات العملية أضافت لي مهارات حقيقية." : "Very practical and helped build real skills.", date: "2026-09-08" },
    ]);

    setMessages([
      { id: "m-1", sender: "إدارة منصة الدورات", title: "اعتماد دورتك الجديدة بنجاح", date: "اليوم 10:15 ص", unread: true },
      { id: "m-2", sender: "أحمد عبد الله (طالب)", title: "استفسار حول موعد تسليم المشروع", date: "أمس 04:30 م", unread: false },
      { id: "m-3", sender: "نظام الإشعارات", title: "تم تسجيل 12 متدرب جديد في الدورة", date: "منذ يومين", unread: false },
    ]);
  };

  // Analytics Sparkline Data
  const sparkData = [24, 38, 45, 62, 58, 75, 92, 115, 140, 168, 195, 230];
  const chartData = [
    { name: isRtl ? "السبت" : "Sat", views: 420, active: 85, completions: 34 },
    { name: isRtl ? "الأحد" : "Sun", views: 680, active: 140, completions: 52 },
    { name: isRtl ? "الإثنين" : "Mon", views: 890, active: 190, completions: 78 },
    { name: isRtl ? "الثلاثاء" : "Tue", views: 1120, active: 240, completions: 95 },
    { name: isRtl ? "الأربعاء" : "Wed", views: 1050, active: 220, completions: 88 },
    { name: isRtl ? "الخميس" : "Thu", views: 980, active: 210, completions: 82 },
    { name: isRtl ? "الجمعة" : "Fri", views: 750, active: 160, completions: 64 },
  ];

  // Actions
  const handleCreateCourse = () => {
    if (!newCourse.title) {
      toast({ title: isRtl ? "يرجى كتابة عنوان الدورة" : "Please enter course title", variant: "destructive" });
      return;
    }
    const created = {
      id: String(Date.now()),
      title: newCourse.title,
      category: newCourse.category || (isRtl ? "تدريب عام" : "General"),
      studentsCount: 0,
      rating: 5.0,
      isFree: newCourse.isFree,
      price: newCourse.isFree ? 0 : newCourse.price,
      views: 0,
      drm: newCourse.drmProtected,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setCourses([created, ...courses]);
    setCreateCourseOpen(false);
    setNewCourse({ title: "", description: "", category: "", price: 0, isFree: false, level: "all", drmProtected: true });
    toast({ title: isRtl ? "تمت إضافة المادة التدريبية بنجاح" : "Course created successfully!" });
  };

  const handleCreateStream = () => {
    if (!newStream.title) {
      toast({ title: isRtl ? "يرجى كتابة عنوان البث" : "Please enter stream title", variant: "destructive" });
      return;
    }
    const created = {
      id: `ls-${Date.now()}`,
      title: newStream.title,
      scheduled_at: newStream.scheduledAt,
      viewers_count: 0,
      status: "scheduled",
    };
    setLiveStreams([created, ...liveStreams]);
    setCreateStreamOpen(false);
    setNewStream({ title: "", description: "", scheduledAt: new Date().toISOString().slice(0, 16), durationMins: 60 });
    toast({ title: isRtl ? "تم جدولة البث المباشر بنجاح" : "Live stream scheduled!" });
  };

  const handleCreateQuiz = () => {
    if (!newQuiz.title) {
      toast({ title: isRtl ? "يرجى إدخال عنوان الاختبار" : "Please enter quiz title", variant: "destructive" });
      return;
    }
    const created = {
      id: `q-${Date.now()}`,
      title: newQuiz.title,
      duration_mins: newQuiz.durationMins,
      passing_score: newQuiz.passingScore,
      submissions_count: 0,
      avg_score: 0,
    };
    setQuizzes([created, ...quizzes]);
    setCreateQuizOpen(false);
    setNewQuiz({ title: "", durationMins: 30, passingScore: 60, questionsCount: 5, instructions: "" });
    toast({ title: isRtl ? "تم نشر الاختبار بنجاح" : "Quiz created!" });
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.subject) {
      toast({ title: isRtl ? "يرجى كتابة اسم المحاضرة / المادة" : "Please enter subject", variant: "destructive" });
      return;
    }
    const created = {
      id: `s-${Date.now()}`,
      day: newSchedule.day,
      time_start: newSchedule.timeStart,
      time_end: newSchedule.timeEnd,
      subject: newSchedule.subject,
      hall: newSchedule.locationOrLink,
    };
    setSchedules([...schedules, created]);
    setCreateScheduleOpen(false);
    setNewSchedule({ day: "الأحد", timeStart: "10:00", timeEnd: "12:00", subject: "", locationOrLink: "قاعة تفاعلية 1" });
    toast({ title: isRtl ? "تمت إضافة الموعد إلى الجدول" : "Schedule added!" });
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.title) {
      toast({ title: isRtl ? "يرجى كتابة عنوان التكليف" : "Please enter assignment title", variant: "destructive" });
      return;
    }
    const created = {
      id: `a-${Date.now()}`,
      title: newAssignment.title,
      due_date: newAssignment.dueDate,
      max_grade: newAssignment.maxGrade,
      submissions_count: 0,
    };
    setAssignments([created, ...assignments]);
    setCreateAssignmentOpen(false);
    setNewAssignment({ title: "", description: "", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), maxGrade: 100 });
    toast({ title: isRtl ? "تم نشر التكليف بنجاح" : "Assignment published!" });
  };

  const handleGradeSubmission = () => {
    if (!selectedSubmission) return;
    setAssignmentSubmissions(prev =>
      prev.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, score: gradeScore, feedback: gradeFeedback, status: "graded" }
          : sub
      )
    );
    setGradeModalOpen(false);
    setSelectedSubmission(null);
    toast({ title: isRtl ? "تم رصد الدرجة وإرسال الملاحظات للمتدرب" : "Grade and feedback submitted!" });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast({ title: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match", variant: "destructive" });
        setSavingProfile(false);
        return;
      }
      try {
        await supabase.auth.updateUser({ password: newPassword });
        toast({ title: isRtl ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully" });
      } catch (e: any) {
        toast({ title: isRtl ? "خطأ في تحديث كلمة المرور" : "Password update failed", description: e?.message, variant: "destructive" });
      }
    }
    toast({ title: isRtl ? "تم حفظ بيانات الحساب بنجاح" : "Profile saved successfully" });
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/courses/login");
  };

  // Menu Items strictly ordered matching Department Head Screenshot
  const menuItems: DashboardMenuItem[] = useMemo(() => [
    {
      key: "overview",
      label: isRtl ? "الرئيسية" : "Home",
      Icon: Home,
      color: "from-indigo-500 to-violet-600",
      onClick: () => setActiveTab("overview"),
      active: activeTab === "overview",
    },
    {
      key: "content",
      label: isRtl ? cfg.items.contentAr : cfg.items.contentEn,
      Icon: BookOpen,
      color: "from-cyan-500 to-blue-600",
      onClick: () => setActiveTab("content"),
      active: activeTab === "content",
    },
    {
      key: "livestreams",
      label: isRtl ? cfg.items.liveAr : cfg.items.liveEn,
      Icon: Radio,
      color: "from-red-500 to-rose-600",
      onClick: () => setActiveTab("livestreams"),
      active: activeTab === "livestreams",
    },
    {
      key: "quizzes",
      label: isRtl ? cfg.items.quizzesAr : cfg.items.quizzesEn,
      Icon: FileQuestion,
      color: "from-emerald-500 to-teal-600",
      onClick: () => setActiveTab("quizzes"),
      active: activeTab === "quizzes",
    },
    {
      key: "schedules",
      label: isRtl ? cfg.items.schedulesAr : cfg.items.schedulesEn,
      Icon: Calendar,
      color: "from-purple-500 to-fuchsia-600",
      onClick: () => setActiveTab("schedules"),
      active: activeTab === "schedules",
    },
    {
      key: "assignments",
      label: isRtl ? cfg.items.assignmentsAr : cfg.items.assignmentsEn,
      Icon: ClipboardList,
      color: "from-amber-500 to-orange-600",
      onClick: () => setActiveTab("assignments"),
      active: activeTab === "assignments",
    },
    {
      key: "assignmentresults",
      label: isRtl ? cfg.items.assignmentResultsAr : cfg.items.assignmentResultsEn,
      Icon: ClipboardList,
      color: "from-blue-500 to-indigo-600",
      onClick: () => setActiveTab("assignmentresults"),
      active: activeTab === "assignmentresults",
    },
    {
      key: "quizresults",
      label: isRtl ? cfg.items.quizResultsAr : cfg.items.quizResultsEn,
      Icon: Award,
      color: "from-indigo-500 to-purple-600",
      onClick: () => setActiveTab("quizresults"),
      active: activeTab === "quizresults",
    },
    {
      key: "ratings",
      label: isRtl ? cfg.items.ratingsAr : cfg.items.ratingsEn,
      Icon: Star,
      color: "from-yellow-500 to-amber-600",
      onClick: () => setActiveTab("ratings"),
      active: activeTab === "ratings",
    },
    {
      key: "messages",
      label: isRtl ? "التواصل والمراسلات" : "Messages",
      Icon: MessageSquare,
      color: "from-teal-500 to-emerald-600",
      onClick: () => setActiveTab("messages"),
      active: activeTab === "messages",
    },
    {
      key: "profile",
      label: isRtl ? cfg.items.profileAr : cfg.items.profileEn,
      Icon: User,
      color: "from-cyan-500 to-cyan-600",
      onClick: () => setActiveTab("profile"),
      active: activeTab === "profile",
    },
  ], [isRtl, cfg, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <p className="text-sm font-bold text-slate-400">
          {isRtl ? "جاري تجهيز لوحة التحكم..." : "Loading dashboard..."}
        </p>
      </div>
    );
  }

  // Full Screen Live Stream Room Modal
  if (activeLiveRoom) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col" dir={dir}>
        <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-slate-950/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-white text-sm sm:text-base">{activeLiveRoom.title}</span>
            <Badge variant="destructive" className="animate-pulse">{isRtl ? "مباشر الآن" : "LIVE"}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveLiveRoom(null)} className="gap-2">
            <X className="w-4 h-4" />
            <span>{isRtl ? "إنهاء / مغادرة الغرفة" : "Leave Room"}</span>
          </Button>
        </div>
        <div className="flex-1 relative">
          <LiveStreamRoom streamId={activeLiveRoom.id} isHost={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* Background Lighting & Glows */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 start-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 end-10 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-30 sticky top-0 border-b border-white/10 backdrop-blur-xl bg-slate-950/75 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/courses" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  UNIGATES
                </span>
                <Badge className={`bg-gradient-to-r ${cfg.badgeGradient} text-white font-bold border-0 text-[10px]`}>
                  {isRtl ? cfg.roleNameAr : cfg.roleNameEn}
                </Badge>
              </div>
              <p className="text-[11px] font-semibold text-purple-300 hidden sm:block">
                {isRtl ? cfg.dashboardTitleAr : cfg.dashboardTitleEn}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={() => {
              if (activeTab === "livestreams") setCreateStreamOpen(true);
              else if (activeTab === "quizzes") setCreateQuizOpen(true);
              else if (activeTab === "schedules") setCreateScheduleOpen(true);
              else if (activeTab === "assignments") setCreateAssignmentOpen(true);
              else setCreateCourseOpen(true);
            }}
            className="hidden sm:inline-flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "livestreams"
                ? (isRtl ? "بدء بث جديد" : "New Live Stream")
                : activeTab === "quizzes"
                ? (isRtl ? "إنشاء اختبار" : "New Quiz")
                : activeTab === "schedules"
                ? (isRtl ? "إضافة موعد" : "Add Schedule")
                : activeTab === "assignments"
                ? (isRtl ? "نشر تكليف" : "New Assignment")
                : (isRtl ? `إضافة ${cfg.items.contentSingularAr}` : `Add ${cfg.items.contentSingularEn}`)}
            </span>
          </Button>

          <LanguageSelectorDropdown />
          <ThemeToggle />

          {/* Dedicated Menu Dropdown matching Department Head Layout */}
          <DashboardMenuDropdown
            title={isRtl ? cfg.dashboardTitleAr : cfg.dashboardTitleEn}
            onLogout={handleLogout}
            items={menuItems}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">

        {/* 1. TAB: OVERVIEW (HOME) */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-300 text-xs font-semibold backdrop-blur">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isRtl ? "أهلاً بك في استوديو التعليم الذكي" : "Welcome to Smart Learning Studio"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                    {profile?.full_name || (isRtl ? cfg.roleNameAr : cfg.roleNameEn)}
                  </h1>
                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {isRtl
                      ? `يمكنك هنا إدارة ${cfg.items.contentAr}، ومتابعة ${cfg.items.traineesAr}، وإطلاق ${cfg.items.liveAr} مع تقارير وإحصائيات تفصيلية لحظية.`
                      : `Manage your ${cfg.items.contentEn}, track ${cfg.items.traineesEn}, launch ${cfg.items.liveEn}, and analyze real-time engagement.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => setCreateCourseOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold shadow-lg shadow-purple-500/30 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isRtl ? `إضافة ${cfg.items.contentSingularAr}` : `New ${cfg.items.contentSingularEn}`}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("livestreams")}
                    className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold gap-2"
                  >
                    <Radio className="w-4 h-4 text-red-400" />
                    <span>{isRtl ? cfg.items.liveAr : cfg.items.liveEn}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="bg-slate-900/60 border-white/10 hover:border-purple-500/40 transition-all cursor-pointer group"
                onClick={() => setActiveTab("content")}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300 font-bold text-xs">
                      +12%
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{courses.length}</div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {isRtl ? cfg.items.contentAr : cfg.items.contentEn}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900/60 border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group"
                onClick={() => setActiveTab("assignmentresults")}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-300 font-bold text-xs">
                      {isRtl ? "نشط" : "Active"}
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">446</div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {isRtl ? cfg.items.traineesAr : cfg.items.traineesEn}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900/60 border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
                onClick={() => setActiveTab("quizresults")}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Award className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 font-bold text-xs">
                      89%
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{quizzes.length}</div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {isRtl ? cfg.items.quizzesAr : cfg.items.quizzesEn}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="bg-slate-900/60 border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group"
                onClick={() => setActiveTab("ratings")}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 fill-amber-400" />
                    </div>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-300 font-bold text-xs">
                      5.0 ★
                    </Badge>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5.0</div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {isRtl ? cfg.items.ratingsAr : cfg.items.ratingsEn}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Charts & Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Engagement Chart */}
              <Card className="lg:col-span-2 bg-slate-900/60 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span>{isRtl ? "معدلات المشاهدة والتفاعل الأسبوعية" : "Weekly Views & Engagement"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                        <Area type="monotone" dataKey="views" name={isRtl ? "المشاهدات" : "Views"} stroke="#a855f7" fillOpacity={1} fill="url(#colorViews)" />
                        <Area type="monotone" dataKey="active" name={isRtl ? "المتفاعلون" : "Active"} stroke="#06b6d4" fillOpacity={1} fill="url(#colorActive)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Schedules Preview */}
              <Card className="bg-slate-900/60 border-white/10 flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-black text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      {isRtl ? "المواعيد القادمة" : "Upcoming Sessions"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("schedules")} className="text-xs text-purple-400 p-0 h-auto">
                      {isRtl ? "عرض الكل" : "View All"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schedules.slice(0, 3).map((sched, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">{sched.subject}</p>
                        <p className="text-[11px] text-slate-400">{sched.day} • {sched.time_start} - {sched.time_end}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-indigo-500/20 text-indigo-300 border-0">
                        {sched.hall}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 border-t border-white/5">
                  <Button
                    onClick={() => setCreateScheduleOpen(true)}
                    variant="outline"
                    className="w-full border-dashed border-white/20 text-xs font-bold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? "إضافة موعد جديد" : "Add New Schedule"}</span>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. TAB: CONTENT / COURSES / LECTURES */}
        {activeTab === "content" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  <span>{isRtl ? cfg.items.contentAr : cfg.items.contentEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? `إدارة ونشر وتعديل ${cfg.items.contentAr} وحماية الفيديوهات بتقنية DRM` : `Manage and publish ${cfg.items.contentEn} with DRM video protection`}
                </p>
              </div>
              <Button
                onClick={() => setCreateCourseOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? `إضافة ${cfg.items.contentSingularAr}` : `Add ${cfg.items.contentSingularEn}`}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <Card key={c.id} className="bg-slate-900/60 border-white/10 overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="h-40 bg-gradient-to-br from-purple-900/50 via-indigo-950/60 to-slate-950 relative p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                          {c.category}
                        </Badge>
                        {c.drm && (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>DRM Encrypted</span>
                          </Badge>
                        )}
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white mx-auto group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-white" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>{c.isFree ? (isRtl ? "محتوى مجاني" : "Free") : `${c.price} SAR`}</span>
                        <span>{c.views} {isRtl ? "مشاهدة" : "views"}</span>
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{c.studentsCount} {isRtl ? cfg.items.traineeSingularAr : cfg.items.traineeSingularEn}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{c.rating}</span>
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/courses/browse`)}
                      className="flex-1 border-white/15 text-xs font-bold gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? "معاينة المحتوى" : "Preview"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({ title: isRtl ? "تم نسخ رابط المشاركة" : "Share link copied!" });
                      }}
                      className="border-white/15 text-xs px-2.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3. TAB: LIVE STREAMS */}
        {activeTab === "livestreams" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                  <span>{isRtl ? cfg.items.liveAr : cfg.items.liveEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "إطلاق قاعات البث المباشر التفاعلية مع الدردشة والتسجيل التلقائي" : "Launch live interactive classrooms with instant chat and auto-recording"}
                </p>
              </div>
              <Button
                onClick={() => setCreateStreamOpen(true)}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? "جدولة بث جديد" : "Schedule Live"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveStreams.map((ls) => (
                <Card key={ls.id} className="bg-slate-900/60 border-white/10 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        <span>{ls.scheduled_at}</span>
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{ls.viewers_count} {isRtl ? "مشترك متوقع" : "expected"}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{ls.title}</h3>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={() => setActiveLiveRoom({ id: ls.id, title: ls.title })}
                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 font-bold gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>{isRtl ? "دخول قاعة البث المباشر" : "Enter Live Studio"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 4. TAB: QUIZZES */}
        {activeTab === "quizzes" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <FileQuestion className="w-6 h-6 text-emerald-400" />
                  <span>{isRtl ? cfg.items.quizzesAr : cfg.items.quizzesEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "إنشاء وتصحيح الاختبارات التفاعلية وبنوك الأسئلة" : "Create and manage auto-graded quizzes and question banks"}
                </p>
              </div>
              <Button
                onClick={() => setCreateQuizOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? "إنشاء اختبار جديد" : "New Quiz"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => (
                <Card key={q.id} className="bg-slate-900/60 border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">
                        {q.duration_mins} {isRtl ? "دقيقة" : "mins"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {isRtl ? "درجة النجاح:" : "Pass score:"} {q.passing_score}%
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{q.title}</h3>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 text-center text-xs">
                      <div>
                        <p className="text-slate-400">{isRtl ? "المحاولات" : "Attempts"}</p>
                        <p className="text-base font-bold text-white mt-0.5">{q.submissions_count}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">{isRtl ? "متوسط الدرجات" : "Average Score"}</p>
                        <p className="text-base font-bold text-emerald-400 mt-0.5">{q.avg_score}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("quizresults")}
                        className="w-full border-white/15 text-xs font-bold gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isRtl ? "عرض نتائج المختبرين" : "View Results"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 5. TAB: SCHEDULES */}
        {activeTab === "schedules" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Calendar className="w-6 h-6 text-purple-400" />
                  <span>{isRtl ? cfg.items.schedulesAr : cfg.items.schedulesEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "تنظيم وإدارة الجداول والمواعيد الأسبوعية" : "Organize and manage weekly schedules and meeting hours"}
                </p>
              </div>
              <Button
                onClick={() => setCreateScheduleOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? "إضافة موعد جديد" : "Add Schedule"}</span>
              </Button>
            </div>

            <Card className="bg-slate-900/60 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-300">{isRtl ? "اليوم" : "Day"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "المادة / المحاضرة" : "Subject"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "التوقيت" : "Time"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "القاعة / الرابط" : "Room / Link"}</TableHead>
                      <TableHead className="text-end text-slate-300">{isRtl ? "الإجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((s) => (
                      <TableRow key={s.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold text-white">{s.day}</TableCell>
                        <TableCell className="font-medium text-slate-200">{s.subject}</TableCell>
                        <TableCell className="text-slate-400">{s.time_start} - {s.time_end}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-0">
                            {s.hall}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast({ title: isRtl ? "تم إرسال تذكير للمتدربين" : "Reminder sent to trainees" })}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            {isRtl ? "إرسال تذكير" : "Remind"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 6. TAB: ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <ClipboardList className="w-6 h-6 text-amber-400" />
                  <span>{isRtl ? cfg.items.assignmentsAr : cfg.items.assignmentsEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "نشر التكليفات والمشاريع وتحديد مواعيد التسليم النهائية" : "Publish assignments and define project submission deadlines"}
                </p>
              </div>
              <Button
                onClick={() => setCreateAssignmentOpen(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? "نشر تكليف جديد" : "New Assignment"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((a) => (
                <Card key={a.id} className="bg-slate-900/60 border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">
                        {isRtl ? "أقصى درجة:" : "Max grade:"} {a.max_grade}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {isRtl ? "تاريخ التسليم:" : "Due:"} {a.due_date}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{a.title}</h3>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 text-xs">
                      <span className="text-slate-400">{isRtl ? "عدد التسليمات:" : "Submissions:"}</span>
                      <span className="font-bold text-white">{a.submissions_count} {isRtl ? cfg.items.traineeSingularAr : cfg.items.traineeSingularEn}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("assignmentresults")}
                        className="w-full border-white/15 text-xs font-bold gap-1.5"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isRtl ? "مراجعة ورصد الدرجات" : "Grade Submissions"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 7. TAB: ASSIGNMENT RESULTS */}
        {activeTab === "assignmentresults" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <ClipboardList className="w-6 h-6 text-blue-400" />
                  <span>{isRtl ? cfg.items.assignmentResultsAr : cfg.items.assignmentResultsEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? `كشف تسليمات ${cfg.items.traineesAr} ورصد الدرجات والملاحظات التوجيهية` : `Roster of submissions, grading studio, and student feedback`}
                </p>
              </div>
            </div>

            <Card className="bg-slate-900/60 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-300">{isRtl ? "اسم المتدرب / الطالب" : "Learner Name"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "التكليف" : "Assignment"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "تاريخ التسليم" : "Submitted"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "الدرجة" : "Score"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="text-end text-slate-300">{isRtl ? "الإجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold text-white">{sub.student_name}</TableCell>
                        <TableCell className="text-slate-300 text-xs">{sub.assignment_title}</TableCell>
                        <TableCell className="text-slate-400 text-xs">{sub.submitted_at}</TableCell>
                        <TableCell className="font-black text-white">
                          {sub.score !== null ? `${sub.score}` : "—"}
                        </TableCell>
                        <TableCell>
                          {sub.status === "graded" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[11px]">
                              {isRtl ? "تم التصحيح" : "Graded"}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[11px]">
                              {isRtl ? "بانتظار التصحيح" : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setGradeScore(sub.score || 0);
                              setGradeFeedback(sub.feedback || "");
                              setGradeModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                          >
                            {sub.status === "graded" ? (isRtl ? "تعديل الدرجة" : "Edit Grade") : (isRtl ? "تصحيح ورصد" : "Grade")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 8. TAB: QUIZ RESULTS */}
        {activeTab === "quizresults" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-indigo-400" />
                  <span>{isRtl ? cfg.items.quizResultsAr : cfg.items.quizResultsEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "نتائج الاختبارات التلقائية ومعدلات النجاح والتفوق" : "Quiz completion analytics, passing rates, and student scorecards"}
                </p>
              </div>
            </div>

            <Card className="bg-slate-900/60 border-white/10">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-300">{isRtl ? "المتدرب / الطالب" : "Learner"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "عنوان الاختبار" : "Quiz Title"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "النسبة المئوية" : "Percentage"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "النتيجة" : "Result"}</TableHead>
                      <TableHead className="text-slate-300">{isRtl ? "وقت الإتمام" : "Completed At"}</TableHead>
                      <TableHead className="text-end text-slate-300">{isRtl ? "شهادة الإتمام" : "Certificate"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizSubmissions.map((qs) => (
                      <TableRow key={qs.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold text-white">{qs.student_name}</TableCell>
                        <TableCell className="text-slate-300 text-xs">{qs.quiz_title}</TableCell>
                        <TableCell className="font-black text-white">{qs.percentage}%</TableCell>
                        <TableCell>
                          {qs.passed ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[11px] gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isRtl ? "ناجح ومؤهل" : "Passed"}</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/20 text-rose-300 border-0 text-[11px]">
                              {isRtl ? "لم يجتز" : "Failed"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">{qs.completed_at}</TableCell>
                        <TableCell className="text-end">
                          {qs.passed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: isRtl ? "تم إصدار شهادة الإتمام الإلكترونية" : "Certificate issued" })}
                              className="text-xs border-white/15 text-indigo-300 hover:text-white"
                            >
                              <Download className="w-3.5 h-3.5 me-1" />
                              <span>{isRtl ? "الشهادة" : "Cert"}</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 9. TAB: RATINGS */}
        {activeTab === "ratings" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  <span>{isRtl ? cfg.items.ratingsAr : cfg.items.ratingsEn}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? `آراء وتقييمات ${cfg.items.traineesAr} وملاحظات الجودة` : `Learner reviews, feedback, and 5-star quality ratings`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ratings.map((r) => (
                <Card key={r.id} className="bg-slate-900/60 border-white/10">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{r.student_name}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-2xl">
                      "{r.comment}"
                    </p>
                    <p className="text-[10px] text-slate-500 text-end">{r.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 10. TAB: MESSAGES */}
        {activeTab === "messages" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <MessageSquare className="w-6 h-6 text-teal-400" />
                  <span>{isRtl ? "التواصل والمراسلات" : "Messages & Communications"}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isRtl ? "التواصل المباشر مع الطلاب والمتدربين وإدارة المنصة" : "Direct messaging with learners and academy administration"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                {messages.map((m) => (
                  <Card key={m.id} className="bg-slate-900/60 border-white/10 hover:border-teal-500/40 transition-all cursor-pointer">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.sender}</span>
                        <span className="text-[10px] text-slate-400">{m.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{m.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="md:col-span-2 bg-slate-900/60 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base text-white">{isRtl ? "إرسال تعميم أو رسالة جديدة" : "Compose Message or Broadcast"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "المستلم" : "Recipient"}</Label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="all">{isRtl ? `جميع ${cfg.items.traineesAr} المسجلين` : "All Enrolled Trainees"}</SelectItem>
                        <SelectItem value="course-1">{isRtl ? "متدربي المسار المتقدم" : "Advanced Track Only"}</SelectItem>
                        <SelectItem value="admin">{isRtl ? "إدارة المنصة" : "Platform Support"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "عنوان الرسالة" : "Subject"}</Label>
                    <Input placeholder={isRtl ? "مثال: تحديث مواعيد البث المباشر" : "e.g. Schedule Update"} className="bg-slate-950 border-white/15 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "نص الرسالة" : "Message Body"}</Label>
                    <Textarea rows={4} placeholder={isRtl ? "اكتب رسالتك هنا..." : "Write message here..."} className="bg-slate-950 border-white/15 text-white" />
                  </div>
                  <Button
                    onClick={() => toast({ title: isRtl ? "تم إرسال الرسالة بنجاح" : "Message broadcasted!" })}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 font-bold"
                  >
                    {isRtl ? "إرسال الآن" : "Send Broadcast"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 11. TAB: PROFILE & SETTINGS */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <User className="w-6 h-6 text-cyan-400" />
                <span>{isRtl ? cfg.items.profileAr : cfg.items.profileEn}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isRtl ? "تعديل البيانات الشخصية، النبذة التعريفية، وكلمة المرور" : "Update personal profile, biography, and credentials"}
              </p>
            </div>

            <Card className="bg-slate-900/60 border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "الاسم الكامل / اسم المركز" : "Full Name / Center Name"}</Label>
                    <Input
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="bg-slate-950 border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      value={profileForm.email}
                      disabled
                      className="bg-slate-950/50 border-white/10 text-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "رقم الجوال" : "Phone Number"}</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="bg-slate-950 border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "التخصص / المجال التدريبي" : "Specialty / Domain"}</Label>
                    <Input
                      value={profileForm.specialty}
                      onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                      className="bg-slate-950 border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">{isRtl ? "النبذة التعريفية" : "Bio / About"}</Label>
                  <Textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="bg-slate-950 border-white/15 text-white"
                  />
                </div>

                <Separator className="bg-white/10 my-4" />

                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>{isRtl ? "تغيير كلمة المرور" : "Change Password"}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950 border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950 border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 font-bold"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      isRtl ? "حفظ التغييرات" : "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* CREATE COURSE / LECTURE MODAL */}
      <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>{isRtl ? `إضافة ${cfg.items.contentSingularAr} جديدة` : `New ${cfg.items.contentSingularEn}`}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {isRtl ? "أدخل تفاصيل الدورة، السعر، وتفعيل حماية الفيديو بنظام DRM" : "Fill course details, price, and DRM protection options"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "عنوان المحتوى" : "Title"}</Label>
              <Input
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder={isRtl ? "مثال: دبلوم الذكاء الاصطناعي التوليدي" : "e.g. AI Masterclass"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "التصنيف / المسار" : "Category"}</Label>
              <Input
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                placeholder={isRtl ? "مثال: برمجة وعلوم حاسب" : "e.g. Computer Science"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
              <div className="space-y-0.5">
                <Label className="text-xs text-white font-bold">{isRtl ? "محتوى مجاني" : "Free Content"}</Label>
                <p className="text-[11px] text-slate-400">{isRtl ? "إتاحة المحتوى لجميع المسجلين مجاناً" : "Make available to all without payment"}</p>
              </div>
              <Switch
                checked={newCourse.isFree}
                onCheckedChange={(checked) => setNewCourse({ ...newCourse, isFree: checked })}
              />
            </div>

            {!newCourse.isFree && (
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "سعر الاشتراك (ريال سعودي)" : "Price (SAR)"}</Label>
                <Input
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="space-y-0.5">
                <Label className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? "حماية الفيديو بنظام DRM" : "DRM Video Protection"}</span>
                </Label>
                <p className="text-[11px] text-slate-400">{isRtl ? "منع التسجيل وتشفير البث مع علامة مائية ديناميكية" : "Prevent screen recording with dynamic watermark"}</p>
              </div>
              <Switch
                checked={newCourse.drmProtected}
                onCheckedChange={(checked) => setNewCourse({ ...newCourse, drmProtected: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateCourseOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateCourse} className="bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
              {isRtl ? "نشر المحتوى" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE STREAM MODAL */}
      <Dialog open={createStreamOpen} onOpenChange={setCreateStreamOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <span>{isRtl ? "جدولة بث مباشر تفاعلي" : "Schedule Live Stream"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "عنوان الجلسة" : "Session Title"}</Label>
              <Input
                value={newStream.title}
                onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                placeholder={isRtl ? "مثال: مراجعة نهائية وشرح عملي" : "e.g. Final Review"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "موعد البث" : "Scheduled Time"}</Label>
              <Input
                type="datetime-local"
                value={newStream.scheduledAt}
                onChange={(e) => setNewStream({ ...newStream, scheduledAt: e.target.value })}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateStreamOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateStream} className="bg-red-600 hover:bg-red-500 font-bold">
              {isRtl ? "حفظ وجدولة" : "Save Stream"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE QUIZ MODAL */}
      <Dialog open={createQuizOpen} onOpenChange={setCreateQuizOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-emerald-400" />
              <span>{isRtl ? "إنشاء اختبار تقويمي جديد" : "Create New Quiz"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "عنوان الاختبار" : "Quiz Title"}</Label>
              <Input
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                placeholder={isRtl ? "مثال: الاختبار النصفي للمستوى الأول" : "e.g. Midterm Quiz"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "المدة (بالدقائق)" : "Duration (Mins)"}</Label>
                <Input
                  type="number"
                  value={newQuiz.durationMins}
                  onChange={(e) => setNewQuiz({ ...newQuiz, durationMins: Number(e.target.value) })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "درجة النجاح (%)" : "Pass Score (%)"}</Label>
                <Input
                  type="number"
                  value={newQuiz.passingScore}
                  onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: Number(e.target.value) })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateQuizOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateQuiz} className="bg-emerald-600 hover:bg-emerald-500 font-bold">
              {isRtl ? "حفظ ونشر" : "Publish Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE SCHEDULE MODAL */}
      <Dialog open={createScheduleOpen} onOpenChange={setCreateScheduleOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>{isRtl ? "إضافة موعد إلى الجدول" : "Add to Timetable"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "اليوم" : "Day"}</Label>
              <Select value={newSchedule.day} onValueChange={(val) => setNewSchedule({ ...newSchedule, day: val })}>
                <SelectTrigger className="bg-slate-950 border-white/15 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "المادة / المحاضرة" : "Subject"}</Label>
              <Input
                value={newSchedule.subject}
                onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                placeholder={isRtl ? "مثال: ورشة العمل التطبيقية" : "e.g. Practical Lab"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "من الساعة" : "From"}</Label>
                <Input
                  type="time"
                  value={newSchedule.timeStart}
                  onChange={(e) => setNewSchedule({ ...newSchedule, timeStart: e.target.value })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "إلى الساعة" : "To"}</Label>
                <Input
                  type="time"
                  value={newSchedule.timeEnd}
                  onChange={(e) => setNewSchedule({ ...newSchedule, timeEnd: e.target.value })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateScheduleOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateSchedule} className="bg-purple-600 hover:bg-purple-500 font-bold">
              {isRtl ? "إضافة" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE ASSIGNMENT MODAL */}
      <Dialog open={createAssignmentOpen} onOpenChange={setCreateAssignmentOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              <span>{isRtl ? "نشر تكليف / واجب جديد" : "Publish Assignment"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "عنوان التكليف" : "Title"}</Label>
              <Input
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder={isRtl ? "مثال: تحليل الحالة الدراسية الثالثة" : "e.g. Case Study 3"}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "أقصى درجة" : "Max Grade"}</Label>
                <Input
                  type="number"
                  value={newAssignment.maxGrade}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxGrade: Number(e.target.value) })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">{isRtl ? "تاريخ التسليم" : "Due Date"}</Label>
                <Input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateAssignmentOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateAssignment} className="bg-amber-600 hover:bg-amber-500 font-bold">
              {isRtl ? "نشر التكليف" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRADE SUBMISSION MODAL */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="bg-slate-900 border-white/15 text-white max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span>{isRtl ? "رصد الدرجة والملاحظات" : "Grade Submission"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {selectedSubmission?.student_name} — {selectedSubmission?.assignment_title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "الدرجة المستحقة" : "Score"}</Label>
              <Input
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(Number(e.target.value))}
                className="bg-slate-950 border-white/15 text-white font-black text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">{isRtl ? "الملاحظات والتقييم التوجيهي" : "Feedback"}</Label>
              <Textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder={isRtl ? "اكتب ملاحظاتك للمتدرب هنا..." : "Write constructive feedback..."}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGradeModalOpen(false)} className="border-white/15">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleGradeSubmission} className="bg-blue-600 hover:bg-blue-500 font-bold">
              {isRtl ? "حفظ ورصد" : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
