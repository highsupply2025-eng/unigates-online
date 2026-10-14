import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  DollarSign, 
  PlayCircle, 
  PlusCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Building2, 
  Sparkles, 
  LayoutDashboard,
  ArrowRight,
  ArrowLeft,
  Award,
  Video,
  FileCheck,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { supabase } from "@/integrations/supabase/client";

interface AdminCourseItem {
  id: string;
  title_ar: string;
  title_en?: string;
  instructor_ar: string;
  instructor_en?: string;
  creator_id?: string;
  category?: string;
  price?: number;
  duration?: string;
  episode_count?: number;
  rating?: number;
  created_at?: string;
  status?: "approved" | "pending" | "rejected";
}

interface AdminInstructorItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  platform?: string;
  coursesCount: number;
  approved: boolean;
  createdAt: string;
}

export const CoursesAdminStudio: React.FC = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);

  // Data states
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [instructors, setInstructors] = useState<AdminInstructorItem[]>([]);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCategoryFilter, setCourseCategoryFilter] = useState("all");
  const [instructorSearch, setInstructorSearch] = useState("");

  // Modals
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseItem | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseStatusToUpdate, setCourseStatusToUpdate] = useState<"approved" | "pending" | "rejected">("approved");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [coursesRes, subsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("user_subscriptions" as any).select("amount_paid, created_at"),
        supabase.from("profiles").select("user_id, full_name, email, phone, role, platform, created_at").in("role", ["lecturer", "teacher", "training_center", "language_center"]),
        supabase.from("user_roles").select("user_id, role, approved").in("role", ["lecturer", "teacher"])
      ]);

      const loadedCourses: AdminCourseItem[] = (coursesRes.data || []).map((c: any) => ({
        id: c.id,
        title_ar: c.title_ar || c.title || "دورة تعليمية غير معنونة",
        title_en: c.title_en || c.title_ar,
        instructor_ar: c.instructor_ar || c.instructor || "محاضر معتمد",
        instructor_en: c.instructor_en,
        creator_id: c.creator_id,
        category: c.category || "عام",
        price: Number(c.price) || 0,
        duration: c.duration || "4 أسابيع",
        episode_count: Number(c.episode_count) || 1,
        rating: Number(c.rating) || 4.9,
        created_at: c.created_at,
        status: "approved"
      }));

      // Calculate subscriptions & revenue
      const subs = (subsRes.data as any[]) || [];
      const totalRev = subs.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
      setTotalSubscriptions(subs.length);
      setTotalRevenue(totalRev);

      // Instructors map
      const rolesMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r]));
      const courseCountByCreator = new Map<string, number>();
      loadedCourses.forEach(c => {
        if (c.creator_id) {
          courseCountByCreator.set(c.creator_id, (courseCountByCreator.get(c.creator_id) || 0) + 1);
        }
      });

      const loadedInstructors: AdminInstructorItem[] = (profilesRes.data || []).map((p: any) => {
        const roleRow = rolesMap.get(p.user_id);
        return {
          id: p.user_id,
          fullName: p.full_name || "مقدم دورة مسجل",
          email: p.email || "",
          phone: p.phone,
          role: p.role,
          platform: p.platform,
          coursesCount: courseCountByCreator.get(p.user_id) || 0,
          approved: roleRow ? Boolean(roleRow.approved) : true,
          createdAt: p.created_at || new Date().toISOString()
        };
      });

      setCourses(loadedCourses);
      setInstructors(loadedInstructors);
    } catch (err) {
      console.error("[CoursesAdminStudio] loadAllData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdateCourseStatus = (c: AdminCourseItem, newStatus: "approved" | "pending" | "rejected") => {
    setCourses(prev => prev.map(item => item.id === c.id ? { ...item, status: newStatus } : item));
    setShowCourseModal(false);
    toast({
      title: isRtl ? "تم تحديث حالة الدورة" : "Course Status Updated",
      description: isRtl ? `تم تحديث حالة دورة "${c.title_ar}" بنجاح.` : `Course status set to ${newStatus}.`
    });
  };

  const handleToggleInstructorApproval = async (inst: AdminInstructorItem) => {
    const nextApproved = !inst.approved;
    try {
      await supabase.from("user_roles").update({ approved: nextApproved }).eq("user_id", inst.id);
      setInstructors(prev => prev.map(it => it.id === inst.id ? { ...it, approved: nextApproved } : it));
      toast({
        title: nextApproved 
          ? (isRtl ? "✅ تم اعتماد مقدم الدورة بنجاح" : "Instructor Approved") 
          : (isRtl ? "تم إيقاف اعتماد مقدم الدورة" : "Instructor Disabled"),
        description: inst.fullName
      });
    } catch (e) {
      toast({ title: isRtl ? "تعذر التحديث" : "Update failed", variant: "destructive" });
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const q = courseSearch.trim().toLowerCase();
      const matchesSearch = !q || c.title_ar.toLowerCase().includes(q) || c.instructor_ar.toLowerCase().includes(q);
      const matchesCat = courseCategoryFilter === "all" || c.category === courseCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [courses, courseSearch, courseCategoryFilter]);

  const filteredInstructors = useMemo(() => {
    return instructors.filter(i => {
      const q = instructorSearch.trim().toLowerCase();
      return !q || i.fullName.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
    });
  }, [instructors, instructorSearch]);

  const categories = useMemo(() => {
    return Array.from(new Set(courses.map(c => c.category || "عام")));
  }, [courses]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-border/70 px-4 sm:px-8 py-3.5 bg-card/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-0.5 shadow-md flex items-center justify-center text-white font-black text-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-foreground">UNIGATES</span>
              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-black px-2 py-0.5">
                {isRtl ? "استوديو إدارة منصة الدورات التعليمية" : "Courses Management Studio"}
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                {isRtl ? "وحدة إدارة مستقلة" : "Standalone Module"}
              </Badge>
            </div>
            <span className="text-[11px] block text-muted-foreground font-semibold">
              {isRtl ? "إدارة وتدقيق الحقائب والدورات الأكاديمية والمهنية المعتمدة" : "Accredited Academic & Professional Courses Management"}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Decoupled Navigation: Return to Central Hub */}
          <Link to="/admin/overview">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isRtl ? "المنظومة المركزية 🏛️" : "Central Hub 🏛️"}</span>
            </Button>
          </Link>

          {/* Direct link to View Live Courses Platform */}
          <Link to="/courses" target="_blank" rel="noopener noreferrer">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">{isRtl ? "عرض منصة الدورات" : "Live Courses"}</span>
            </Button>
          </Link>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllData}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>

          <ThemeToggle />
          <LanguageSelectorDropdown />
        </div>
      </header>

      {/* ── Main Dashboard Workspace ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 pb-20">
        
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border-2 border-purple-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {isRtl ? "استوديو إدارة منصة الدورات التعليمية" : "Courses Management Studio"}
              </h1>
              <Badge className="bg-purple-600 text-white font-black text-xs px-2 py-0.5">
                {isRtl ? "إشراف وتدقيق الدورات" : "Course Auditing"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {isRtl 
                ? "إدارة المنظومة التدريبية المستقلة: فحص واعتماد الدورات التدريبية الجديدة، إدارة صلاحيات المحاضرين ومراكز التدريب، ومتابعة الاشتراكات والتحصيل المالي."
                : "Manage courses catalog, verify and onboard instructors, inspect course modules, and audit enrollment payments."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 rounded-xl border-purple-500/40 bg-card text-xs font-bold gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>{isRtl ? "وحدة تحكم مستقلة بالكامل" : "Independent Management Unit"}</span>
            </Badge>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-border/80 bg-card p-4">
            <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "إجمالي الدورات المعتمدة" : "Active Courses"}</span>
            <span className="text-2xl font-black text-foreground mt-1 block">{courses.length}</span>
          </Card>
          <Card className="rounded-2xl border border-border/80 bg-card p-4">
            <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "مقدمو الدورات والمراكز" : "Course Instructors"}</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{instructors.length}</span>
          </Card>
          <Card className="rounded-2xl border border-border/80 bg-card p-4">
            <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "الاشتراكات والمسجلين" : "Enrollments"}</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{totalSubscriptions}</span>
          </Card>
          <Card className="rounded-2xl border border-border/80 bg-card p-4">
            <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "العوائد المالية المحصلة" : "Total Revenue"}</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{totalRevenue.toLocaleString()} EGP</span>
          </Card>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-1.5 rounded-2xl bg-muted/40 border border-border/80 gap-2">
            <TabsTrigger 
              value="courses"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>{isRtl ? "1. دليل وفحص الدورات" : "1. Course Catalog & Auditing"}</span>
            </TabsTrigger>

            <TabsTrigger 
              value="instructors"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>{isRtl ? "2. المحاضرون ومراكز التدريب" : "2. Instructors & Centers"}</span>
            </TabsTrigger>

            <TabsTrigger 
              value="subscriptions"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "3. الاشتراكات والتحصيل المالي" : "3. Enrollments & Revenue"}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Courses Catalog */}
          <TabsContent value="courses" className="space-y-4">
            <Card className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground start-3" />
                  <Input 
                    placeholder={isRtl ? "ابحث باسم الدورة أو المحاضر..." : "Search course or instructor..."}
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="h-10 text-xs rounded-xl ps-9"
                  />
                </div>
                <Select value={courseCategoryFilter} onValueChange={setCourseCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-56 h-10 rounded-xl text-xs font-bold">
                    <SelectValue placeholder={isRtl ? "جميع التخصصات" : "All Categories"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع التخصصات" : "All Categories"}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.length === 0 ? (
                <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                  <BookOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-muted-foreground">{isRtl ? "لا توجد دورات تدريبية مطابقة لمعايير البحث" : "No courses found"}</p>
                </div>
              ) : (
                filteredCourses.map((c) => (
                  <Card key={c.id} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                        {isRtl ? "معتمدة ونشطة ✅" : "Active"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-foreground leading-snug line-clamp-2">{c.title_ar}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>{c.instructor_ar}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-lg bg-muted text-[11px] font-bold">{c.category}</span>
                      <span className="font-black text-foreground">{c.price ? `${c.price} EGP` : (isRtl ? "مجانياً" : "Free")}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link to={`/lecturer/course/${c.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isRtl ? "معاينة المحتوى" : "Preview"}</span>
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: Instructors */}
          <TabsContent value="instructors" className="space-y-4">
            <Card className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground start-3" />
                <Input 
                  placeholder={isRtl ? "ابحث باسم المحاضر أو البريد الإلكتروني..." : "Search instructor or email..."}
                  value={instructorSearch}
                  onChange={(e) => setInstructorSearch(e.target.value)}
                  className="h-10 text-xs rounded-xl ps-9"
                />
              </div>
            </Card>

            <div className="space-y-3">
              {filteredInstructors.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                  <Users className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-sm font-bold text-muted-foreground">{isRtl ? "لا يوجد محاضرون مطابقون لمعايير البحث" : "No instructors found"}</p>
                </div>
              ) : (
                filteredInstructors.map((inst) => (
                  <Card key={inst.id} className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-foreground">{inst.fullName}</span>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {inst.role === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : inst.role}
                          </Badge>
                          {inst.approved ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              {isRtl ? "معتمد ومفعل ✅" : "Active"}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              {isRtl ? "قيد المراجعة ⏳" : "Pending"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{inst.email} {inst.phone && `· ${inst.phone}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                        {inst.coursesCount} {isRtl ? "دورات منشورة" : "Courses"}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant={inst.approved ? "outline" : "default"}
                        onClick={() => handleToggleInstructorApproval(inst)}
                        className="rounded-xl text-xs font-bold"
                      >
                        {inst.approved ? (isRtl ? "تعطيل الصلاحية" : "Disable") : (isRtl ? "اعتماد الصلاحية ✅" : "Approve")}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Enrollments & Subscriptions */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="rounded-2xl border border-border/80 bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg text-foreground">{isRtl ? "تقارير الاشتراكات والتحصيل" : "Enrollment & Revenue Report"}</h3>
                  <p className="text-xs text-muted-foreground">{isRtl ? "سجل التحصيل المالي ومبيعات الدورات في منصة الدورات التعليمية" : "Live record of course enrollments and subscription revenue"}</p>
                </div>
                <Badge className="bg-emerald-500 text-white font-black text-sm px-3 py-1">
                  {totalRevenue.toLocaleString()} EGP
                </Badge>
              </div>

              <div className="rounded-2xl border border-border/80 overflow-hidden">
                <div className="p-4 bg-muted/40 text-xs font-bold text-muted-foreground grid grid-cols-3">
                  <span>{isRtl ? "البيان الإحصائي" : "Metric"}</span>
                  <span className="text-center">{isRtl ? "القيمة العددية" : "Value"}</span>
                  <span className="text-end">{isRtl ? "الحالة التشغيلية" : "Operational Status"}</span>
                </div>
                <div className="divide-y divide-border/60 text-xs font-semibold">
                  <div className="p-4 grid grid-cols-3 items-center">
                    <span>{isRtl ? "إجمالي الاشتراكات المسجلة" : "Total Subscriptions"}</span>
                    <span className="text-center font-bold text-foreground">{totalSubscriptions}</span>
                    <span className="text-end text-emerald-600 font-bold">100% {isRtl ? "مكتمل" : "Completed"}</span>
                  </div>
                  <div className="p-4 grid grid-cols-3 items-center">
                    <span>{isRtl ? "إجمالي الدورات النشطة في المنظومة" : "Active Platform Courses"}</span>
                    <span className="text-center font-bold text-foreground">{courses.length}</span>
                    <span className="text-end text-blue-600 font-bold">{isRtl ? "مباشر بالمتجر" : "Live"}</span>
                  </div>
                  <div className="p-4 grid grid-cols-3 items-center">
                    <span>{isRtl ? "معدل الرضا الأكاديمي والتقييم" : "Average Course Rating"}</span>
                    <span className="text-center font-bold text-foreground">4.9 / 5.0 ⭐</span>
                    <span className="text-end text-amber-600 font-bold">{isRtl ? "ممتاز" : "Excellent"}</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CoursesAdminStudio;
