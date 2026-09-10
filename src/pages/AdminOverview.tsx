import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, GraduationCap, School, Building2, BookOpen, PlayCircle,
  ShoppingCart, CreditCard, Radio, Eye, Layers, RefreshCw, LayoutDashboard,
  Check, X, ClipboardList, ArrowRight, ShieldCheck, Landmark, MessageSquare, ExternalLink, Send
} from "lucide-react";
import { getWhatsAppDirectUrl, sendWhatsAppNotification, ADMIN_WHATSAPP_NUMBER } from "@/utils/whatsappNotifications";

type PendingKind = "lecturer" | "college" | "institute" | "school" | "department" | "payment_request";

interface PendingRow {
  kind: PendingKind;
  id: string;
  title: string;
  subtitle?: string;
  createdAt?: string;
}

interface PaymentRequestRow {
  id: string;
  institution_type: string;
  institution_name: string;
  student_names: string[];
  plan_type: string;
  months: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const kindMeta: Record<PendingKind, { ar: string; en: string; icon: typeof Users }> = {
  lecturer: { ar: "أعضاء هيئة تدريس", en: "Faculty", icon: GraduationCap },
  college: { ar: "كليات", en: "Colleges", icon: Building2 },
  institute: { ar: "معاهد", en: "Institutes", icon: School },
  school: { ar: "مدارس", en: "Schools", icon: School },
  department: { ar: "أقسام", en: "Departments", icon: Layers },
  payment_request: { ar: "طلبات الدفع", en: "Payment Requests", icon: CreditCard },
};

export default function AdminOverview() {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [stats, setStats] = useState({
    users: 0, lecturers: 0, students: 0, courses: 0, views: 0, books: 0,
    orders: 0, subscriptions: 0, streams: 0, colleges: 0, institutes: 0,
    schools: 0, departments: 0, quizzes: 0,
  });

  const notify = (msg: string, bad = false) =>
    toast({ title: bad ? ar("خطأ", "Error") : ar("تم", "Done"), description: msg, variant: bad ? "destructive" : undefined });

  const loadStats = async () => {
    const count = (table: string, build?: (q: any) => any) => {
      const q = (supabase.from(table as any) as any).select("*", { count: "exact", head: true });
      return build ? build(q) : q;
    };
    const [
      users, lecturers, students, courses, views, books, orders, subs, streams,
      colleges, institutes, schools, departments, quizzes,
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
    ]);
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
    });
  };

  const loadPending = async () => {
    const [roles, colleges, institutes, schools, departments, paymentReqs] = await Promise.all([
      supabase.from("user_roles").select("id,user_id,created_at").eq("role", "lecturer").eq("approved", false),
      supabase.from("college_registrations").select("id,college_name,city,created_at").eq("status", "pending").eq("email_confirmed", true),
      supabase.from("institute_registrations" as any).select("id,institute_name,city,created_at").eq("status", "pending").eq("email_confirmed", true),
      supabase.from("school_registrations").select("id,school_name,city,created_at").eq("status", "pending"),
      supabase.from("departments" as any).select("id,department_name,student_count,created_at").eq("payment_status", "unpaid"),
      supabase.from("payment_requests" as any).select("id,institution_type,institution_name,student_names,plan_type,months,total_amount,status,created_at").eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    const rows: PendingRow[] = [];

    const roleRows = roles.data || [];
    if (roleRows.length) {
      const { data: profiles } = await supabase
        .from("profiles").select("user_id,full_name,email")
        .in("user_id", roleRows.map((r) => r.user_id));
      const byUser = new Map((profiles || []).map((p) => [p.user_id, p]));
      roleRows.forEach((r) => {
        const p = byUser.get(r.user_id);
        rows.push({ kind: "lecturer", id: r.id, title: p?.full_name || ar("مستخدم", "User"), subtitle: p?.email, createdAt: r.created_at });
      });
    }

    (colleges.data || []).forEach((c: any) =>
      rows.push({ kind: "college", id: c.id, title: c.college_name, subtitle: c.city, createdAt: c.created_at }));
    (institutes.data as any[] || []).forEach((i: any) =>
      rows.push({ kind: "institute", id: i.id, title: i.institute_name, subtitle: i.city, createdAt: i.created_at }));
    (schools.data || []).forEach((s: any) =>
      rows.push({ kind: "school", id: s.id, title: s.school_name, subtitle: s.city, createdAt: s.created_at }));
    (departments.data as any[] || []).forEach((d: any) =>
      rows.push({
        kind: "department", id: d.id, title: d.department_name,
        subtitle: `${d.student_count ?? 0} ${ar("طالب", "students")}`, createdAt: d.created_at,
      }));
    (paymentReqs.data as any[] || []).forEach((pr: any) =>
      rows.push({
        kind: "payment_request", id: pr.id,
        title: `${pr.institution_name} — ${pr.total_amount} ${ar("ج.م", "EGP")}`,
        subtitle: `${pr.student_names?.length ?? 0} ${ar("طالب", "students")} · ${pr.plan_type === "annual" ? ar("سنوي", "Annual") : ar("شهري", "Monthly")} · ${pr.months} ${ar("شهر", "mo")}`,
        createdAt: pr.created_at,
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
      notify(approve ? ar("تمت الموافقة", "Approved") : ar("تم الرفض", "Rejected"));
      await refresh();
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (e) {
      console.error("Decision failed:", e);
      notify(ar("تعذر تنفيذ العملية", "Action failed"), true);
    } finally {
      setBusyId(null);
    }
  };

  const groups = useMemo(() => {
    const map: Record<PendingKind, PendingRow[]> = { lecturer: [], college: [], institute: [], school: [], department: [], payment_request: [] };
    pending.forEach((r) => map[r.kind].push(r));
    return map;
  }, [pending]);

  const statCards = [
    { label: ar("المستخدمون", "Users"), value: stats.users, icon: Users },
    { label: ar("الطلاب", "Students"), value: stats.students, icon: GraduationCap },
    { label: ar("أعضاء هيئة التدريس", "Faculty"), value: stats.lecturers, icon: ClipboardList },
    { label: ar("الكليات", "Colleges"), value: stats.colleges, icon: Building2 },
    { label: ar("المعاهد", "Institutes"), value: stats.institutes, icon: School },
    { label: ar("المدارس", "Schools"), value: stats.schools, icon: School },
    { label: ar("الأقسام", "Departments"), value: stats.departments, icon: Layers },
    { label: ar("الكورسات", "Courses"), value: stats.courses, icon: PlayCircle },
    { label: ar("المشاهدات", "Views"), value: stats.views, icon: Eye },
    { label: ar("الكتب", "Books"), value: stats.books, icon: BookOpen },
    { label: ar("الطلبات", "Orders"), value: stats.orders, icon: ShoppingCart },
    { label: ar("الاشتراكات", "Subscriptions"), value: stats.subscriptions, icon: CreditCard },
    { label: ar("البث المباشر", "Live streams"), value: stats.streams, icon: Radio },
    { label: ar("الاختبارات", "Quizzes"), value: stats.quizzes, icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-background p-4 sm:p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!authorized) return null;

  const renderList = (rows: PendingRow[]) => {
    if (rows.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {ar("لا توجد طلبات بانتظار المراجعة", "Nothing pending review")}
        </div>
      );
    }
    return (
      <div className="divide-y">
        {rows.map((row) => {
          const Icon = kindMeta[row.kind].icon;
          return (
            <div key={`${row.kind}-${row.id}`} className="flex flex-wrap items-center gap-3 py-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{row.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.subtitle} · {ar(kindMeta[row.kind].ar, kindMeta[row.kind].en)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  onClick={() => {
                    sendWhatsAppNotification({
                      type: row.kind === "payment_request" ? "payment" : "registration",
                      title: row.title,
                      details: {
                        "النوع": ar(kindMeta[row.kind].ar, kindMeta[row.kind].en),
                        "التفاصيل": row.subtitle,
                        "رقم المعرّف": row.id,
                        "الحالة": "بانتظار المراجعة والاعتماد",
                      },
                      timestamp: row.createdAt ? new Date(row.createdAt).toLocaleString("ar-SA") : undefined,
                    });
                  }}
                  title={ar("إرسال تنبيه بالطلب إلى واتساب", "Send WhatsApp Alert")}
                >
                  <MessageSquare className="h-3.5 w-3.5 me-1 text-emerald-600" />
                  <span className="hidden sm:inline">{ar("تنبيه واتساب", "WhatsApp")}</span>
                </Button>
                <Button size="sm" disabled={busyId === row.id} onClick={() => decide(row, true)}>
                  <Check className="h-4 w-4 me-1" />{ar("موافقة", "Approve")}
                </Button>
                <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => decide(row, false)}>
                  <X className="h-4 w-4 me-1" />{ar("رفض", "Reject")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{ar("لوحة الأدمن", "Admin panel")}</h1>
            <p className="text-sm text-muted-foreground">
              {ar("نظرة شاملة على الموقع ومركز موافقات موحّد", "Site-wide overview and unified approvals center")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"
              title={ar("فتح واتساب الإشعارات المباشر", "Open Admin WhatsApp Alerts")}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{ar("واتساب الأدمن: 00966563057356", "Admin WhatsApp: 00966563057356")}</span>
            </a>
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 me-1 ${refreshing ? "animate-spin" : ""}`} />
              {ar("تحديث", "Refresh")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/security-center")}>
              <ShieldCheck className="h-4 w-4 me-1" />
              {ar("مركز الأمان الدفاعي", "Security Center")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/payment-settings")}>
              <Landmark className="h-4 w-4 me-1" />
              {ar("بيانات الدفع", "Payment Settings")}
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/dashboard")}>
              <LayoutDashboard className="h-4 w-4 me-1" />
              {ar("اللوحة التفصيلية", "Full dashboard")}
              <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.label}</p>
                  <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <p className="mt-2 text-2xl font-black tabular-nums">{s.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {ar("مركز الموافقات", "Approvals center")}
              {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="all">
                  {ar("الكل", "All")} ({pending.length})
                </TabsTrigger>
                {(Object.keys(kindMeta) as PendingKind[]).map((k) => (
                  <TabsTrigger key={k} value={k}>
                    {ar(kindMeta[k].ar, kindMeta[k].en)} ({groups[k].length})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all">{renderList(pending)}</TabsContent>
              {(Object.keys(kindMeta) as PendingKind[]).map((k) => (
                <TabsContent key={k} value={k}>{renderList(groups[k])}</TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
