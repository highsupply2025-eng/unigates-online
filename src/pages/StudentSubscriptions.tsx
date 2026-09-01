import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, GraduationCap, ChevronLeft, ChevronRight, ArrowUpDown,
  ArrowUp, ArrowDown, AlertTriangle, RefreshCw, CreditCard, Clock,
  Sparkles, CheckCircle2, ShieldCheck, Zap, Lock, AlertCircle,
  HelpCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { useToast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import { StudentSubscriptionCheckoutDialog } from "@/components/subscriptions/StudentSubscriptionCheckoutDialog";

export const FREE_TIER_LIMIT = 100;

interface StudentRecord {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string;
  department_name: string;
  user_id: string | null;
  created_at: string;
  photo_url: string | null;
  subscription_expires_at: string | null;
  subscription_active: boolean;
  payment_required: boolean;
}

interface RpcResponse {
  error: string | null;
  data: StudentRecord[];
  total: number;
  institution_type?: "college" | "institute";
  institution_name?: string;
  subscription_plan?: "free" | "monthly" | "annual";
}

type SortKey = "full_name" | "email" | "department_name" | "created_at";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

const arCollator = typeof Intl !== "undefined" ? new Intl.Collator("ar") : undefined;

function safeCompare(a: string, b: string, dir: SortDir): number {
  const cmp = arCollator ? arCollator.compare(a, b) : a.localeCompare(b);
  return dir === "asc" ? cmp : -cmp;
}

export function getTrialDaysRemaining(createdAt: string): number {
  const regDate = new Date(createdAt).getTime();
  const elapsedDays = Math.floor((Date.now() - regDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, 30 - elapsedDays);
}

export function isStudentSubscriptionActive(
  student: StudentRecord,
  totalStudents: number,
  plan: string = "free"
): boolean {
  if (student.subscription_active) return true;
  if (student.subscription_expires_at && new Date(student.subscription_expires_at).getTime() > Date.now()) {
    return true;
  }

  // Free Tier rules: up to 100 students and within 30-day trial
  if (totalStudents <= FREE_TIER_LIMIT && plan === "free") {
    return getTrialDaysRemaining(student.created_at) > 0;
  }

  return false;
}

interface SubsSnapshot { data: StudentRecord[]; total: number; fetchedAt: number; }
let __subsCache: SubsSnapshot | null = null;

const StudentSubscriptions = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const { identity } = useInstitutionIdentity({ redirectOnMissing: false });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Checkout Dialog state
  const [checkoutStudents, setCheckoutStudents] = useState<StudentRecord[]>([]);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  const { toast } = useToast();
  const abortRef = useRef(0);

  const subscriptionPlan = identity?.subscriptionPlan ?? "free";
  const isCapacityExceeded = total > FREE_TIER_LIMIT;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const fetchId = ++abortRef.current;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_institution_student_subscriptions",
        {
          p_page: page,
          p_page_size: PAGE_SIZE,
          p_search: debouncedSearch.trim(),
          p_sort_by: sortKey,
          p_sort_dir: sortDir,
        },
      );

      if (fetchId !== abortRef.current) return;

      if (rpcError) {
        if (rpcError.code === "PGRST301" || rpcError.code === "42501") {
          setError(isRtl ? "ليس لديك صلاحية الوصول إلى هذه الصفحة" : "You do not have permission to access this page");
        } else if (rpcError.code === "401" || rpcError.message?.includes("JWT")) {
          navigate("/login");
          return;
        } else {
          setError(isRtl ? "حدث خطأ في تحميل البيانات" : "Failed to load data");
        }
        return;
      }

      const result = rpcData as unknown as RpcResponse;
      if (result.error === "unauthorized") {
        navigate("/login");
        return;
      }
      if (result.error === "forbidden") {
        setError(isRtl ? "ليس لديك صلاحية الوصول إلى هذه الصفحة" : "You do not have permission to access this page");
        return;
      }

      setData(result.data || []);
      setTotal(result.total || 0);
      __subsCache = { data: result.data || [], total: result.total || 0, fetchedAt: Date.now() };
    } catch {
      if (fetchId !== abortRef.current) return;
      setError(isRtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      if (fetchId === abortRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, sortKey, sortDir, navigate, isRtl]);

  // Hydrate from cache instantly on mount
  useEffect(() => {
    if (__subsCache && __subsCache.data.length > 0) {
      setData(__subsCache.data);
      setTotal(__subsCache.total);
      setLoading(false);
    }
  }, []);

  // Fetch only after identity is loaded
  useEffect(() => {
    if (!identity) return;
    fetchStudents();
  }, [fetchStudents, identity]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString();
      const bv = (b[sortKey] ?? "").toString();
      return safeCompare(av, bv, sortDir);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  // Calculate active and inactive counts
  const activeCount = useMemo(() => {
    return data.filter((s) => isStudentSubscriptionActive(s, total, subscriptionPlan)).length;
  }, [data, total, subscriptionPlan]);

  const inactiveStudents = useMemo(() => {
    return data.filter((s) => !isStudentSubscriptionActive(s, total, subscriptionPlan));
  }, [data, total, subscriptionPlan]);

  const inactiveCount = data.length - activeCount;

  const openCheckoutForStudents = (studentsList: StudentRecord[]) => {
    if (studentsList.length === 0) {
      toast({
        title: isRtl ? "تنبيه" : "Notice",
        description: isRtl ? "يرجى تحديد طلاب للسداد والتفعيل" : "Please select students to activate",
      });
      return;
    }
    setCheckoutStudents(studentsList);
    setShowCheckoutDialog(true);
  };

  const handlePaymentSuccess = (paidIds: string[]) => {
    setData((prev) =>
      prev.map((s) => {
        if (paidIds.includes(s.id)) {
          const nextExpiry = new Date();
          nextExpiry.setMonth(nextExpiry.getMonth() + 12);
          return {
            ...s,
            subscription_active: true,
            subscription_expires_at: nextExpiry.toISOString(),
          };
        }
        return s;
      })
    );
    setSelectedIds(new Set());
    fetchStudents();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Header */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/25 shrink-0">
            <GraduationCap className="w-7 h-7" strokeWidth={2.3} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-white">
                {identity?.institutionType === "institute"
                  ? isRtl ? "لوحة إدارة المعهد — اشتراكات الطلاب" : "Institute Student Subscriptions"
                  : isRtl ? "لوحة إدارة الكلية — اشتراكات الطلاب" : "College Student Subscriptions"}
              </h1>
              <Badge className={`text-[10px] font-black px-2.5 py-0.5 ${
                isCapacityExceeded
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
              }`}>
                {isCapacityExceeded
                  ? isRtl ? "⚠️ تجاوزت السعة المجانية (100)" : "Capacity Exceeded (>100)"
                  : isRtl ? "🟢 الباقة المجانية (100 طالب)" : "Free Tier (100 Students)"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRtl
                ? "متابعة حالة تفعيل حسابات الطلاب، وتجديد الاشتراكات عبر Stripe و Paddle"
                : "Manage student activation status, renewals & checkout via Stripe and Paddle"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DashboardMenuDropdown
            title={identity?.institutionType === "institute" ? (isRtl ? "لوحة المعهد" : "Institute Panel") : (isRtl ? "لوحة الكلية" : "College Panel")}
            onLanguageToggle={toggleLanguage}
            showNotifications={false}
            onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
            items={getInstitutionMenuItems({
              isRtl,
              activeKey: "subscriptions",
              onTabChange: (tab) => navigate(`/institution/dashboard?tab=${tab}`),
              onNavigate: (path) => navigate(path),
            })}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 w-full flex-1">
        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plan & Capacity Card */}
          <Card className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{isRtl ? "سعة الباقة المجانية" : "Free Plan Capacity"}</span>
                <span className="font-mono text-teal-300 font-black">{total} / {FREE_TIER_LIMIT}</span>
              </div>
              <Progress
                value={Math.min(100, (total / FREE_TIER_LIMIT) * 100)}
                className="h-2 bg-white/10"
              />
              <p className="text-[11px] font-semibold text-slate-400">
                {isCapacityExceeded
                  ? isRtl ? "تجاوزت الحد المجاني. يلزم سداد الاشتراكات لتفعيل الطلاب الإضافيين." : "Limit exceeded. Payment required to activate additional students."
                  : isRtl ? `متبقي سعة لـ ${Math.max(0, FREE_TIER_LIMIT - total)} طالب مجاناً لمدة شهر.` : `${Math.max(0, FREE_TIER_LIMIT - total)} free slots remaining.`}
              </p>
            </div>
          </Card>

          {/* Active Students Card */}
          <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400">{isRtl ? "الطلاب المفعلون" : "Active Students"}</span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono text-white">{activeCount}</h3>
                <span className="text-[10px] text-emerald-300 font-bold block">{isRtl ? "يستطيعون الدخول فوراً" : "Can log in now"}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Inactive / Pending Payment Card */}
          <Card className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-400">{isRtl ? "بانتظار سداد الاشتراك" : "Pending Payment"}</span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono text-white">{inactiveCount}</h3>
                <span className="text-[10px] text-rose-300 font-bold block">{isRtl ? "حساب معلق حتى السداد" : "Suspended till paid"}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Payment Action Summary Card */}
          <Card className="rounded-3xl border border-teal-500/40 bg-gradient-to-br from-teal-950/40 to-slate-900 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-300 block">{isRtl ? "مستحقات التفعيل" : "Total Due"}</span>
                <span className="text-2xl font-black font-mono text-white">${inactiveCount * 6} USD</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                {isRtl ? "أو $48 سنوي" : "Or $48/yr"}
              </Badge>
            </div>

            <Button
              onClick={() => openCheckoutForStudents(inactiveStudents)}
              disabled={inactiveCount === 0}
              className="mt-3 w-full h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-teal-500/25"
            >
              <CreditCard className="w-3.5 h-3.5 me-1.5" />
              <span>{isRtl ? "سداد وتفعيل الكل الآن" : "Pay & Activate All"}</span>
            </Button>
          </Card>
        </div>

        {/* 3. Pricing Plan Highlights Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-start">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isRtl ? "باقات اشتراك الطلاب المعتمدة (Paddle & Stripe)" : "Approved Student Subscription Plans"}
                </h3>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-black">
                  {isRtl ? "خصم 33% على الباقة السنوية" : "33% Annual Discount"}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                {isRtl
                  ? "الباقة الشهرية: $6 / طالب / شهر | الباقة السنوية: $48 / طالب / سنة ($4 شهرياً بدلاً من $6 - وفر $24 سنوياً لكل طالب)"
                  : "Monthly: $6/student/mo | Annual: $48/student/yr ($4/mo instead of $6 - Save $24/yr per student)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs font-bold border-white/20 bg-white/5 text-slate-300 py-1.5 px-3">
              <ShieldCheck className="w-3.5 h-3.5 me-1 text-teal-400 inline" />
              Stripe & Paddle
            </Badge>
          </div>
        </div>

        {/* 4. Search and Multi-Select Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? "بحث باسم الطالب أو القسم أو البريد الإلكتروني..." : "Search by student name, department or email..."}
              className="ps-10 h-11 rounded-2xl bg-slate-900 border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto animate-scale-in">
              <Button
                onClick={() => {
                  const selectedStudents = sorted.filter((s) => selectedIds.has(s.id));
                  openCheckoutForStudents(selectedStudents);
                }}
                className="flex-1 sm:flex-none h-11 px-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isRtl ? `دفع اشتراك المحدد (${selectedIds.size} طالب)` : `Pay for Selected (${selectedIds.size})`}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
                className="h-11 rounded-2xl border-white/20 bg-white/5 text-white font-bold text-xs"
              >
                {isRtl ? "إلغاء" : "Clear"}
              </Button>
            </div>
          )}
        </div>

        {/* 5. Main Students Subscriptions Table */}
        <Card className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              <span>{isRtl ? "بيانات واشتراكات الطلاب" : "Student Subscription Directory"}</span>
              <Badge variant="secondary" className="bg-white/10 text-slate-300 border-0 text-xs font-mono font-bold">
                {total}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {error ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 mx-auto text-rose-400" />
                <p className="text-xs font-bold text-rose-300">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchStudents} className="rounded-xl border-white/20 text-white">
                  <RefreshCw className="w-4 h-4 me-1.5" />
                  {isRtl ? "إعادة المحاولة" : "Retry"}
                </Button>
              </div>
            ) : !loading && data.length === 0 ? (
              <div className="p-16 text-center space-y-3 text-slate-500">
                <Users className="w-12 h-12 mx-auto opacity-40" />
                <p className="text-xs sm:text-sm font-bold">
                  {search ? (isRtl ? "لا توجد نتائج مطابقة للبحث" : "No matching results") : (isRtl ? "لا يوجد طلاب مسجلون بعد" : "No registered students yet")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/60 border-b border-white/10">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                          checked={sorted.length > 0 && selectedIds.size === sorted.length}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer font-black text-xs text-slate-300" onClick={() => toggleSort("full_name")}>
                        <span className="inline-flex items-center gap-1">
                          {isRtl ? "اسم الطالب" : "Student Name"} <SortIcon col="full_name" />
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer font-black text-xs text-slate-300 hidden sm:table-cell" onClick={() => toggleSort("department_name")}>
                        <span className="inline-flex items-center gap-1">
                          {isRtl ? "القسم الأكاديمي" : "Department"} <SortIcon col="department_name" />
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-xs text-slate-300 hidden md:table-cell">
                        {isRtl ? "البريد الإلكتروني" : "Email"}
                      </TableHead>
                      <TableHead className="cursor-pointer font-black text-xs text-slate-300 hidden lg:table-cell" onClick={() => toggleSort("created_at")}>
                        <span className="inline-flex items-center gap-1">
                          {isRtl ? "تاريخ التسجيل" : "Registered"} <SortIcon col="created_at" />
                        </span>
                      </TableHead>
                      <TableHead className="font-black text-xs text-slate-300 text-center">
                        {isRtl ? "فترة الاشتراك" : "Trial / Validity"}
                      </TableHead>
                      <TableHead className="font-black text-xs text-slate-300 text-center">
                        {isRtl ? "حالة الحساب" : "Account Status"}
                      </TableHead>
                      <TableHead className="font-black text-xs text-slate-300 text-center">
                        {isRtl ? "إجراء السداد" : "Action"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && data.length === 0 ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell><Skeleton className="h-4 w-4 rounded mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-20 rounded-full mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-8 w-20 rounded-xl mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      sorted.map((s) => {
                        const active = isStudentSubscriptionActive(s, total, subscriptionPlan);
                        const daysLeft = getTrialDaysRemaining(s.created_at);
                        const isSelected = selectedIds.has(s.id);

                        return (
                          <TableRow
                            key={s.id}
                            className={`border-white/5 transition-colors ${
                              isSelected ? "bg-teal-500/10" : "hover:bg-white/5"
                            }`}
                          >
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleSelect(s.id)}
                              />
                            </TableCell>

                            {/* Name & Avatar */}
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-black text-xs shrink-0 overflow-hidden">
                                  {s.photo_url ? (
                                    <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    s.full_name.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-xs sm:text-sm text-white">{s.full_name}</p>
                                  {s.phone && (
                                    <span className="text-[10px] text-slate-500 font-mono block">{s.phone}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Department */}
                            <TableCell className="hidden sm:table-cell">
                              <span className="text-xs font-semibold text-slate-300">
                                {s.department_name || "—"}
                              </span>
                            </TableCell>

                            {/* Email */}
                            <TableCell className="hidden md:table-cell">
                              <span className="text-xs font-mono text-slate-400">{s.email || "—"}</span>
                            </TableCell>

                            {/* Registration Date */}
                            <TableCell className="hidden lg:table-cell text-xs font-mono text-slate-400">
                              {new Date(s.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </TableCell>

                            {/* Validity / Trial Badge */}
                            <TableCell className="text-center">
                              {s.subscription_active ? (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                                  {isRtl ? "اشتراك مدفوع نشط" : "Active Paid"}
                                </Badge>
                              ) : total <= FREE_TIER_LIMIT && daysLeft > 0 ? (
                                <div className="inline-flex flex-col items-center">
                                  <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black">
                                    <Clock className="w-3 h-3 me-1 inline" />
                                    {isRtl ? `تجربة مجانية: باقي ${daysLeft} يوم` : `${daysLeft} days left`}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                                  {isRtl ? "انتهت الفترة (مطلوب الدفع)" : "Expired (Payment Due)"}
                                </Badge>
                              )}
                            </TableCell>

                            {/* Account Status Badge */}
                            <TableCell className="text-center">
                              <Badge className={`text-[10px] font-black px-2 py-0.5 ${
                                active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              }`}>
                                {active ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "معلق" : "Suspended")}
                              </Badge>
                            </TableCell>

                            {/* Action Button */}
                            <TableCell className="text-center">
                              {active && s.subscription_active ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCheckoutForStudents([s])}
                                  className="h-8 px-2.5 rounded-xl text-teal-400 hover:bg-teal-500/10 font-black text-xs gap-1"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "تجديد" : "Renew"}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openCheckoutForStudents([s])}
                                  className="h-8 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs gap-1.5 shadow-md shadow-teal-500/20"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "سداد وتفعيل ($6 / $48)" : "Pay & Activate"}</span>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>
                  {isRtl ? `صفحة ${safePage} من ${totalPages}` : `Page ${safePage} of ${totalPages}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={safePage <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 rounded-lg text-white"
                  >
                    {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={safePage >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 rounded-lg text-white"
                  >
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Checkout Modal for Stripe and Paddle */}
      <StudentSubscriptionCheckoutDialog
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
        students={checkoutStudents}
        institutionId={identity?.institutionId}
        institutionName={identity?.institutionName}
        isRtl={isRtl}
        onSuccessPayment={handlePaymentSuccess}
      />
    </div>
  );
};

export default StudentSubscriptions;
