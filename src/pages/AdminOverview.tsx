import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Users, GraduationCap, School, Building2, BookOpen, PlayCircle,
  ShoppingCart, CreditCard, Radio, Eye, Layers, RefreshCw, LayoutDashboard,
  Check, X, ClipboardList, ArrowRight, ShieldCheck, Landmark, MessageSquare,
  TrendingUp, BarChart3, PieChart, Activity, CheckCircle2, AlertCircle,
  FileCheck, Calendar, DollarSign, ArrowUpRight, Search, Award, Sparkles
} from "lucide-react";
import { getWhatsAppDirectUrl, sendWhatsAppNotification, ADMIN_WHATSAPP_NUMBER } from "@/utils/whatsappNotifications";
import { StudentPillActivityChart } from "@/components/StudentPillActivityChart";
import { LiveActivityTrends } from "@/components/LiveActivityTrends";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import type { SectionDatum } from "@/components/SectionsActivityChart";

type PendingKind = "lecturer" | "college" | "institute" | "school" | "department" | "payment_request";

interface PendingRow {
  kind: PendingKind;
  id: string;
  title: string;
  subtitle?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  raw?: any;
}

const kindMeta: Record<PendingKind, { ar: string; en: string; icon: typeof Users; color: string }> = {
  lecturer: { ar: "أعضاء هيئة تدريس", en: "Faculty", icon: GraduationCap, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200" },
  college: { ar: "كليات جامعية", en: "Colleges", icon: Building2, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200" },
  institute: { ar: "معاهد تخصصية", en: "Institutes", icon: School, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200" },
  school: { ar: "مدارس تعليمية", en: "Schools", icon: School, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200" },
  department: { ar: "أقسام أكاديمية", en: "Departments", icon: Layers, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200" },
  payment_request: { ar: "طلبات الدفع والتحويل", en: "Payment Requests", icon: CreditCard, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200" },
};

export default function AdminOverview() {
  const { language, dir, isRtl } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mainSection, setMainSection] = useState<"approvals" | "analytics" | "statistics">("approvals");
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [searchPending, setSearchPending] = useState("");

  const [pending, setPending] = useState<PendingRow[]>([]);
  const [stats, setStats] = useState({
    users: 0, lecturers: 0, students: 0, courses: 0, views: 0, books: 0,
    orders: 0, subscriptions: 0, streams: 0, colleges: 0, institutes: 0,
    schools: 0, departments: 0, quizzes: 0, totalRevenue: 0,
  });

  // Timestamps for activity trends
  const [activitySections, setActivitySections] = useState<SectionDatum[]>([]);

  const notify = (msg: string, bad = false) =>
    toast({ title: bad ? ar("خطأ", "Error") : ar("تم", "Done"), description: msg, variant: bad ? "destructive" : undefined });

  const loadStats = async () => {
    const count = (table: string, build?: (q: any) => any) => {
      const q = (supabase.from(table as any) as any).select("*", { count: "exact", head: true });
      return build ? build(q) : q;
    };
    const [
      users, lecturers, students, courses, views, books, orders, subs, streams,
      colleges, institutes, schools, departments, quizzes, subData, orderData, deptData
    ] = await Promise.all([
      supabase.rpc("get_profile_count"),
      count("user_roles", (q) => q.eq("role", "lecturer").eq("approved", true)),
      count("user_roles", (q) => q.eq("role", "student")),
      count("courses"),
      count("course_views"),
      count("books"),
      count("book_orders"),
      count("user_subscriptions"),
      count("live_streams"),
      count("college_registrations", (q) => q.eq("email_confirmed", true)),
      count("institute_registrations", (q) => q.eq("email_confirmed", true)),
      count("school_registrations"),
      count("departments"),
      count("quizzes"),
      supabase.from("user_subscriptions" as any).select("amount_paid, created_at"),
      supabase.from("book_orders" as any).select("amount, created_at"),
      supabase.from("departments" as any).select("payment_amount, created_at").eq("payment_status", "paid"),
    ]);

    const revSubs = ((subData.data as any[]) || []).reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
    const revOrders = ((orderData.data as any[]) || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const revDepts = ((deptData.data as any[]) || []).reduce((acc, curr) => acc + (Number(curr.payment_amount) || 0), 0);
    const totalRev = revSubs + revOrders + revDepts;

    setStats({
      users: Number((users as any)?.data) || 0,
      lecturers: (lecturers as any)?.count || 0,
      students: (students as any)?.count || 0,
      courses: (courses as any)?.count || 0,
      views: (views as any)?.count || 0,
      books: (books as any)?.count || 0,
      orders: (orders as any)?.count || 0,
      subscriptions: (subs as any)?.count || 0,
      streams: (streams as any)?.count || 0,
      colleges: (colleges as any)?.count || 0,
      institutes: (institutes as any)?.count || 0,
      schools: (schools as any)?.count || 0,
      departments: (departments as any)?.count || 0,
      quizzes: (quizzes as any)?.count || 0,
      totalRevenue: totalRev,
    });

    // Build Activity sections for charts
    const subTimestamps = ((subData.data as any[]) || []).map((x) => x.created_at).filter(Boolean);
    const orderTimestamps = ((orderData.data as any[]) || []).map((x) => x.created_at).filter(Boolean);
    const deptTimestamps = ((deptData.data as any[]) || []).map((x) => x.created_at).filter(Boolean);

    setActivitySections([
      {
        label: ar("الاشتراكات والدورات", "Subscriptions & Courses"),
        timestamps: subTimestamps,
      },
      {
        label: ar("طلبات الكتب والعقود", "Book Orders & Store"),
        timestamps: orderTimestamps,
      },
      {
        label: ar("تسجيل واعتماد المؤسسات", "Institutions & Depts"),
        timestamps: deptTimestamps,
      },
    ]);
  };

  const loadPending = async () => {
    const [roles, colleges, institutes, schools, departments, paymentReqs] = await Promise.all([
      supabase.from("user_roles").select("id,user_id,created_at").eq("role", "lecturer").eq("approved", false),
      supabase.from("college_registrations").select("id,college_name,city,phone,email,created_at").eq("status", "pending").eq("email_confirmed", true),
      supabase.from("institute_registrations" as any).select("id,institute_name,city,phone,email,created_at").eq("status", "pending").eq("email_confirmed", true),
      supabase.from("school_registrations").select("id,school_name,city,phone,email,created_at").eq("status", "pending"),
      supabase.from("departments" as any).select("id,department_name,student_count,created_at").eq("payment_status", "unpaid"),
      supabase.from("payment_requests" as any).select("id,institution_type,institution_name,student_names,plan_type,months,total_amount,status,created_at").eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    const rows: PendingRow[] = [];

    const roleRows = roles.data || [];
    if (roleRows.length) {
      const { data: profiles } = await supabase
        .from("profiles").select("user_id,full_name,email,phone")
        .in("user_id", roleRows.map((r) => r.user_id));
      const byUser = new Map((profiles || []).map((p) => [p.user_id, p]));
      roleRows.forEach((r) => {
        const p = byUser.get(r.user_id);
        rows.push({
          kind: "lecturer",
          id: r.id,
          title: p?.full_name || ar("عضو هيئة تدريس", "Faculty Member"),
          subtitle: p?.email || ar("طلب اعتماد تدريس جديد", "New Faculty Approval Request"),
          phone: p?.phone,
          email: p?.email,
          createdAt: r.created_at,
          raw: r,
        });
      });
    }

    (colleges.data || []).forEach((c: any) =>
      rows.push({
        kind: "college",
        id: c.id,
        title: c.college_name,
        subtitle: `${c.city || ar("غير محدد", "Unspecified")} · ${ar("كلية جامعية", "College")}`,
        phone: c.phone,
        email: c.email,
        createdAt: c.created_at,
        raw: c,
      }));

    (institutes.data as any[] || []).forEach((i: any) =>
      rows.push({
        kind: "institute",
        id: i.id,
        title: i.institute_name,
        subtitle: `${i.city || ar("غير محدد", "Unspecified")} · ${ar("معهد تخصصي", "Institute")}`,
        phone: i.phone,
        email: i.email,
        createdAt: i.created_at,
        raw: i,
      }));

    (schools.data || []).forEach((s: any) =>
      rows.push({
        kind: "school",
        id: s.id,
        title: s.school_name,
        subtitle: `${s.city || ar("غير محدد", "Unspecified")} · ${ar("مدرسة تعليمية", "School")}`,
        phone: s.phone,
        email: s.email,
        createdAt: s.created_at,
        raw: s,
      }));

    (departments.data as any[] || []).forEach((d: any) =>
      rows.push({
        kind: "department",
        id: d.id,
        title: d.department_name,
        subtitle: `${d.student_count ?? 0} ${ar("طالب مسجل", "enrolled students")} · ${ar("بانتظار تأكيد الدفع", "Pending Payment")}`,
        createdAt: d.created_at,
        raw: d,
      }));

    (paymentReqs.data as any[] || []).forEach((pr: any) =>
      rows.push({
        kind: "payment_request",
        id: pr.id,
        title: `${pr.institution_name} — ${pr.total_amount?.toLocaleString()} ${ar("ريال / ج.م", "SAR/EGP")}`,
        subtitle: `${pr.student_names?.length ?? 0} ${ar("طالب", "students")} · ${pr.plan_type === "annual" ? ar("اشتراك سنوي", "Annual Plan") : ar("اشتراك شهري", "Monthly Plan")} (${pr.months} ${ar("شهر", "mo")})`,
        createdAt: pr.created_at,
        raw: pr,
      }));

    rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    setPending(rows);
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadStats(), loadPending()]);
    } catch (e) {
      console.error("Admin overview load failed:", e);
      notify(ar("تعذر تحميل البيانات", "Failed to load data"), true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("id")
        .eq("user_id", user.id).eq("role", "admin").eq("approved", true);
      if (!roles || roles.length === 0) { navigate("/"); return; }
      setAuthorized(true);
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (row: PendingRow, approve: boolean) => {
    setBusyId(row.id);
    try {
      let error: any = null;
      if (row.kind === "lecturer") {
        const res = approve
          ? await supabase.from("user_roles").update({ approved: true }).eq("id", row.id)
          : await supabase.from("user_roles").delete().eq("id", row.id);
        error = res.error;
      } else if (row.kind === "payment_request") {
        const rpcName = approve ? "approve_payment_request" : "reject_payment_request";
        const res = await supabase.rpc(rpcName as any, { _request_id: row.id });
        error = res.error;
      } else if (row.kind === "department") {
        const res = approve
          ? await (supabase.from("departments" as any) as any).update({ payment_status: "paid", status: "active" }).eq("id", row.id)
          : await (supabase.from("departments" as any) as any).update({ status: "rejected" }).eq("id", row.id);
        error = res.error;
      } else if (row.kind === "college") {
        const res = await supabase.rpc("review_college_registration" as any, {
          _registration_id: row.id,
          _decision: approve ? "approved" : "rejected",
        });
        error = res.error;
      } else {
        const table =
          row.kind === "institute" ? "institute_registrations"
          : "school_registrations";
        const res = await (supabase.from(table as any) as any)
          .update({ status: approve ? "approved" : "rejected" }).eq("id", row.id);
        error = res.error;
      }
      if (error) throw error;
      notify(approve ? ar("تمت الموافقة بنجاح", "Approved successfully") : ar("تم الرفض بنجاح", "Rejected successfully"));
      await refresh();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (e) {
      console.error("Decision failed:", e);
      notify(ar("تعذر تنفيذ العملية", "Action failed"), true);
    } finally {
      setBusyId(null);
    }
  };

  const filteredPending = useMemo(() => {
    if (!searchPending.trim()) return pending;
    const q = searchPending.toLowerCase();
    return pending.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle && r.subtitle.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
    );
  }, [pending, searchPending]);

  const groups = useMemo(() => {
    const map: Record<PendingKind, PendingRow[]> = { lecturer: [], college: [], institute: [], school: [], department: [], payment_request: [] };
    filteredPending.forEach((r) => map[r.kind].push(r));
    return map;
  }, [filteredPending]);

  // High-level statistics calculation
  const totalInstitutions = stats.colleges + stats.institutes + stats.schools;
  const studentRatio = stats.users > 0 ? Math.round((stats.students / stats.users) * 100) : 0;
  const lecturerRatio = stats.users > 0 ? Math.round((stats.lecturers / stats.users) * 100) : 0;

  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!authorized) return null;

  const renderList = (rows: PendingRow[]) => {
    if (rows.length === 0) {
      return (
        <div className="py-16 text-center text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <p className="text-base font-semibold">{ar("لا توجد طلبات معلقة بانتظار المراجعة", "No pending requests")}</p>
          <p className="text-xs text-muted-foreground mt-1">{ar("تمت معالجة كافة الطلبات الواردة بنجاح", "All incoming requests have been reviewed")}</p>
        </div>
      );
    }
    return (
      <div className="divide-y divide-border/60">
        {rows.map((row) => {
          const meta = kindMeta[row.kind];
          const Icon = meta.icon;
          return (
            <div key={`${row.kind}-${row.id}`} className="flex flex-wrap items-center justify-between gap-4 py-4 hover:bg-muted/30 px-3 rounded-xl transition-colors">
              <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base leading-tight text-foreground truncate">{row.title}</p>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                      {ar(meta.ar, meta.en)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {row.subtitle}
                    {row.createdAt && ` · ${new Date(row.createdAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors text-xs font-semibold shadow-sm"
                  onClick={() => {
                    sendWhatsAppNotification({
                      type: row.kind === "payment_request" ? "payment" : "registration",
                      title: row.title,
                      details: {
                        "القسم": ar(meta.ar, meta.en),
                        "التفاصيل": row.subtitle || "-",
                        "رقم الهاتف": row.phone || "غير متوفر",
                        "البريد الإلكتروني": row.email || "غير متوفر",
                        "المعرّف ID": row.id,
                        "الحالة": "طلب بانتظار الاعتماد الفوري",
                      },
                      timestamp: row.createdAt ? new Date(row.createdAt).toLocaleString("ar-SA") : undefined,
                    });
                  }}
                  title={ar("إرسال تنبيه فوري بالطلب إلى واتساب الإدارة", "Send WhatsApp Alert to Admin")}
                >
                  <MessageSquare className="h-4 w-4 me-1.5 text-emerald-600" />
                  <span>{ar("واتساب", "WhatsApp")}</span>
                </Button>
                <Button
                  size="sm"
                  disabled={busyId === row.id}
                  onClick={() => decide(row, true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold"
                >
                  <Check className="h-4 w-4 me-1" />
                  {ar("موافقة واعتماد", "Approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === row.id}
                  onClick={() => decide(row, false)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                >
                  <X className="h-4 w-4 me-1" />
                  {ar("رفض", "Reject")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Futuristic Background Ambient Glows & Cyber Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950/90 to-[#04060a] pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#06b6d405_1px,transparent_1px),linear-gradient(to_bottom,#06b6d405_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Cyber Telemetry Status Ribbon */}
      <div className="w-full bg-slate-950/80 border-b border-cyan-500/20 px-3 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            UNIGATES QUANTUM MATRIX v5.2
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            DEFENSE SHIELD: 100% SECURE
          </span>
          <span className="hidden lg:inline text-slate-600">|</span>
          <span className="hidden lg:inline-flex items-center gap-1 text-amber-400">
            <Radio className="w-3 h-3 animate-pulse" />
            DISPATCH RADAR: 00966563057356
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-400">LATENCY: <strong className="text-emerald-400">9ms</strong></span>
          <span className="text-cyan-300">RIYADH NODE: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-[1px] shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950/90 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  {ar("لوحة الإدارة الموحدة", "Unified Admin Dashboard")}
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </h1>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                  QUANTUM CORE
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {ar("مركز إدارة الموافقات، التحليلات البيانية، والإحصائيات الشاملة لمنصة UNIGATES", "Approvals center, live analytics, and comprehensive statistics for UNIGATES platform")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/80 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              title={ar("فتح واتساب الإدارة المباشر", "Open Admin WhatsApp")}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>00966563057356</span>
            </a>

            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="rounded-xl border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400">
              <RefreshCw className={`h-4 w-4 me-1.5 ${refreshing ? "animate-spin" : ""}`} />
              {ar("تحديث", "Refresh")}
            </Button>

            <Button size="sm" variant="outline" onClick={() => navigate("/admin/security-center")} className="rounded-xl border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400">
              <ShieldCheck className="h-4 w-4 me-1.5 text-cyan-400" />
              {ar("الأمان الدفاعي", "Security")}
            </Button>

            <Button size="sm" onClick={() => navigate("/admin/dashboard")} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <LayoutDashboard className="h-4 w-4 me-1.5" />
              {ar("لوحة التفاصيل", "Detailed View")}
              <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        </header>

        {/* 3 Main Pillars Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => setMainSection("approvals")}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-start backdrop-blur-xl ${
              mainSection === "approvals"
                ? "bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-white border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.01]"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${mainSection === "approvals" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-slate-800 text-cyan-400"}`}>
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-400">{ar("الركن الأول", "PILLAR 1")}</p>
                <h3 className="text-base font-black leading-tight text-white">{ar("الموافقات والطلبات", "Approvals & Requests")}</h3>
              </div>
            </div>
            <Badge className={`font-mono text-xs ${mainSection === "approvals" ? "bg-cyan-500 text-black font-black" : "bg-slate-800 text-cyan-300"}`}>
              {pending.length}
            </Badge>
          </button>

          <button
            onClick={() => setMainSection("analytics")}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-start backdrop-blur-xl ${
              mainSection === "analytics"
                ? "bg-gradient-to-r from-purple-950/90 to-indigo-950/90 text-white border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)] scale-[1.01]"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${mainSection === "analytics" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "bg-slate-800 text-purple-400"}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-400">{ar("الركن الثاني", "PILLAR 2")}</p>
                <h3 className="text-base font-black leading-tight text-white">{ar("التحليلات ومعدلات النمو", "Analytics & Trends")}</h3>
              </div>
            </div>
            <Activity className="w-4 h-4 text-purple-400 opacity-80" />
          </button>

          <button
            onClick={() => setMainSection("statistics")}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-start backdrop-blur-xl ${
              mainSection === "statistics"
                ? "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-white border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/90"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${mainSection === "statistics" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-800 text-emerald-400"}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">{ar("الركن الثالث", "PILLAR 3")}</p>
                <h3 className="text-base font-black leading-tight text-white">{ar("الإحصائيات والأرقام", "Statistics & Metrics")}</h3>
              </div>
            </div>
            <PieChart className="w-4 h-4 text-emerald-400 opacity-80" />
          </button>
        </div>

        {/* ── SECTION 1: APPROVALS & REQUESTS ── */}
        {mainSection === "approvals" && (
          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    {ar("مركز إدارة واعتماد الطلبات المعلقة", "Pending Approvals & Verification Center")}
                  </CardTitle>
                  <CardDescription>
                    {ar("مراجعة واعتماد طلبات الانضمام، الكليات، المدارس، المحاضرين وتأكيد الحوالات والمدفوعات", "Review and approve pending registrations, institutions, and payment verifications")}
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={ar("بحث في الطلبات المعلقة...", "Search pending requests...")}
                    value={searchPending}
                    onChange={(e) => setSearchPending(e.target.value)}
                    className="ps-9 rounded-xl text-xs h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="all">
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1.5 rounded-xl mb-4">
                    <TabsTrigger value="all" className="rounded-lg text-xs font-semibold py-1.5">
                      {ar("جميع الطلبات", "All Requests")} ({filteredPending.length})
                    </TabsTrigger>
                    {(Object.keys(kindMeta) as PendingKind[]).map((k) => (
                      <TabsTrigger key={k} value={k} className="rounded-lg text-xs font-semibold py-1.5">
                        {ar(kindMeta[k].ar, kindMeta[k].en)} ({groups[k].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="all">{renderList(filteredPending)}</TabsContent>
                  {(Object.keys(kindMeta) as PendingKind[]).map((k) => (
                    <TabsContent key={k} value={k}>{renderList(groups[k])}</TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── SECTION 2: ANALYTICS & GROWTH TRENDS ── */}
        {mainSection === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-card p-4 rounded-2xl border border-border/70">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black text-foreground">{ar("معدلات النشاط والتفاعل الحي", "Live Activity & Engagement Trends")}</h2>
              </div>
              <TimeRangeToggle
                value={rangeDays}
                onChange={setRangeDays}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Trend Chart */}
              <LiveActivityTrends
                sections={activitySections}
                days={rangeDays}
                className="shadow-sm rounded-2xl border-border/70"
              />

              {/* Pill Equalizer Activity Chart */}
              <StudentPillActivityChart
                sections={activitySections}
                days={rangeDays}
                title={ar("مؤشرات التفاعل بحسب القطاعات", "Sector Engagement Indicators")}
                className="shadow-sm rounded-2xl border-border/70"
              />
            </div>

            {/* Conversion & Health Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-border/70 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{ar("معدل اكتمال الطلاب", "Student Ratio")}</span>
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{studentRatio}%</span>
                  <span className="text-xs text-muted-foreground">{ar("من إجمالي المستخدمين", "of total users")}</span>
                </div>
                <Progress value={studentRatio} className="h-2 bg-blue-100 dark:bg-blue-950" />
              </Card>

              <Card className="rounded-2xl border-border/70 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{ar("تغطية المحاضرين وهيئة التدريس", "Faculty Ratio")}</span>
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{lecturerRatio}%</span>
                  <span className="text-xs text-muted-foreground">{ar("كادر أكاديمي معتمد", "approved faculty")}</span>
                </div>
                <Progress value={lecturerRatio} className="h-2 bg-purple-100 dark:bg-purple-950" />
              </Card>

              <Card className="rounded-2xl border-border/70 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{ar("إجمالي المؤسسات المعتمدة", "Approved Institutions")}</span>
                  <Building2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{totalInstitutions}</span>
                  <span className="text-xs text-muted-foreground">{ar("كلية ومعهد ومدرسة", "colleges, institutes & schools")}</span>
                </div>
                <Progress value={Math.min(100, totalInstitutions * 10)} className="h-2 bg-emerald-100 dark:bg-emerald-950" />
              </Card>
            </div>
          </div>
        )}

        {/* ── SECTION 3: COMPREHENSIVE STATISTICS ── */}
        {mainSection === "statistics" && (
          <div className="space-y-6">
            {/* Key KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
              <Card className="border-border/70 shadow-sm rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{ar("إجمالي المستخدمين", "Total Users")}</p>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums">{stats.users.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stats.students} {ar("طالب", "students")} · {stats.lecturers} {ar("محاضر", "lecturers")}</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{ar("إجمالي الإيرادات", "Total Revenue")}</p>
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    {stats.totalRevenue.toLocaleString()} <span className="text-xs font-bold">{ar("ريال / ج.م", "SAR/EGP")}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stats.subscriptions} {ar("اشتراك نشط", "active subs")}</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{ar("المؤسسات والجهات", "Institutions")}</p>
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums">{totalInstitutions}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stats.colleges} {ar("كلية", "colleges")} · {stats.institutes} {ar("معهد", "inst.")} · {stats.schools} {ar("مدرسة", "schools")}</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">{ar("المحتوى والمقررات", "Courses & Content")}</p>
                    <PlayCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="mt-3 text-3xl font-black tabular-nums">{stats.courses}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stats.views.toLocaleString()} {ar("مشاهدة مسجلة", "views recorded")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Category Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border/70 shadow-sm rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-500" />
                  {ar("تفصيل المؤسسات الأكاديمية", "Academic Institutions Breakdown")}
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("الكليات الجامعية", "Colleges")}</span>
                    <span className="font-bold">{stats.colleges}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("المعاهد المتخصصة", "Institutes")}</span>
                    <span className="font-bold">{stats.institutes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("المدارس التعليمية", "Schools")}</span>
                    <span className="font-bold">{stats.schools}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("الأقسام النشطة", "Departments")}</span>
                    <span className="font-bold">{stats.departments}</span>
                  </div>
                </div>
              </Card>

              <Card className="border-border/70 shadow-sm rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  {ar("متجر الكتب والمقررات", "Book Store & Digital Assets")}
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("الكتب والعقود المعروضة", "Listed Books")}</span>
                    <span className="font-bold">{stats.books}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("طلبات الشراء المكتملة", "Completed Orders")}</span>
                    <span className="font-bold">{stats.orders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("جلسات البث المباشر", "Live Streams")}</span>
                    <span className="font-bold">{stats.streams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("الاختبارات والتكليفات", "Quizzes & Exams")}</span>
                    <span className="font-bold">{stats.quizzes}</span>
                  </div>
                </div>
              </Card>

              <Card className="border-border/70 shadow-sm rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  {ar("الاعتماد الرقمي والأمان", "Digital Verification & Security")}
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("حالة جدار الحماية Defense", "Defense Firewall")}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                      {ar("نشط ومحمى", "Active")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("تنبيهات الواتساب الفورية", "WhatsApp Alerts")}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                      00966563057356
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{ar("سلاسل الاعتماد الرقمي", "Digital Blockchain Certs")}</span>
                    <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200">
                      {ar("مفعل", "Enabled")}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
