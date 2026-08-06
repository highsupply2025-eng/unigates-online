import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Loader2, Users, GraduationCap,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, RefreshCw, Ticket,
  Layers, BookOpen, CheckCircle, Calendar, User as UserIcon, CreditCard, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

const StudentSubscriptions = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<StudentRecord | null>(null);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewing, setRenewing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("monthly");
  const [bulkPayDialogOpen, setBulkPayDialogOpen] = useState(false);
  const [bulkPaying, setBulkPaying] = useState(false);
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_institution_student_subscriptions",
        {
          p_page: page,
          p_page_size: PAGE_SIZE,
          p_search: search.trim(),
          p_sort_by: sortKey,
          p_sort_dir: sortDir,
        },
      );

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
      setInstitutionType(result.institution_type || null);
      setInstitutionName(result.institution_name || "");
      setSubscriptionPlan(result.subscription_plan || "monthly");
    } catch {
      setError(isRtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortKey, sortDir, navigate, isRtl]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleRenew = async () => {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      // For annual plan, convert months to months (the RPC handles 365-day calculation)
      // For monthly/free plan, pass months directly (30 days each)
      const monthsToSend = subscriptionPlan === "annual" ? renewMonths : renewMonths;
      const { data, error } = await supabase.rpc("renew_student_subscription", {
        _department_member_id: renewTarget.id,
        _months: monthsToSend,
      });
      if (error) throw error;
      const result = data as unknown as { error?: string } | null;
      if (result?.error) {
        toast({ title: isRtl ? "خطأ" : "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({
        title: isRtl ? "تم تجديد الاشتراك" : "Subscription Renewed",
        description: isRtl
          ? `تم تجديد اشتراك ${renewTarget.full_name} لمدة ${renewMonths} شهر`
          : `Renewed ${renewTarget.full_name}'s subscription for ${renewMonths} month(s)`,
      });
      setRenewDialogOpen(false);
      setRenewTarget(null);
      fetchStudents();
    } catch (e: unknown) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setRenewing(false);
    }
  };

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

  const handleBulkPay = async () => {
    const inactiveStudents = sorted.filter((s) => selectedIds.has(s.id) && !s.subscription_active);
    if (inactiveStudents.length === 0) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى تحديد طلاب غير نشطين" : "Please select inactive students", variant: "destructive" });
      return;
    }
    setBulkPaying(true);
    try {
      // For annual plan, activate for 12 months (365 days)
      // For monthly/free plan, activate for 1 month (30 days)
      const monthsToSend = subscriptionPlan === "annual" ? 12 : 1;
      for (const student of inactiveStudents) {
        await supabase.rpc("renew_student_subscription", {
          _department_member_id: student.id,
          _months: monthsToSend,
        });
      }
      toast({
        title: isRtl ? "تم الدفع بنجاح" : "Payment Successful",
        description: isRtl
          ? `تم تفعيل اشتراك ${inactiveStudents.length} طالب`
          : `Activated subscription for ${inactiveStudents.length} student(s)`,
      });
      setSelectedIds(new Set());
      setBulkPayDialogOpen(false);
      fetchStudents();
    } catch (e: unknown) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e instanceof Error ? e.message : "Payment failed", variant: "destructive" });
    } finally {
      setBulkPaying(false);
    }
  };

  const getDiscountedAmount = (baseAmount: number) => {
    if (subscriptionPlan === "annual") return Math.round(baseAmount * 0.9);
    return baseAmount;
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

  useEffect(() => { setPage(1); }, [search]);

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

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-md animate-pulse" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/40 ring-2 ring-teal-400/30 hover:scale-105 transition-transform">
                <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-md" strokeWidth={2.2} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-black text-foreground truncate tracking-tight">
                {isRtl
                  ? (institutionType === "college" ? "لوحة ادارة الكلية" : "لوحة ادارة المعهد")
                  : (institutionType === "college" ? "College Administration" : "Institute Administration")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold truncate">
                {isRtl ? "اشتراك الطلاب" : "Student Subscriptions"}{institutionName ? ` - ${institutionName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!error && (
              <Badge variant="secondary" className="shrink-0 text-sm hidden sm:inline-flex">
                {total} {isRtl ? "طالب" : "students"}
              </Badge>
            )}
            <DashboardMenuDropdown
              title={isRtl ? (institutionType === "college" ? "لوحة الكلية" : "لوحة المعهد") : (institutionType === "college" ? "College Panel" : "Institute Panel")}
              onLanguageToggle={toggleLanguage}
              onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
              items={getInstitutionMenuItems({
                isRtl,
                activeKey: "subscriptions",
                onTabChange: (tab) => navigate(`/institution/dashboard?tab=${tab}`),
                onNavigate: (path) => navigate(path),
              })}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="relative group">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500 group-focus-within:text-teal-600 transition-colors ${isRtl ? "right-4" : "left-4"}`} />
          <Input
            placeholder={isRtl ? "بحث بالاسم أو القسم أو البريد..." : "Search by name, department or email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${isRtl ? "pe-12" : "ps-12"} h-12 rounded-xl border-2 border-teal-200 bg-white shadow-sm focus:border-teal-400 focus:ring-teal-400/20 focus:shadow-md transition-all text-sm font-medium placeholder:text-muted-foreground/60`}
          />
        </div>

        {error ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 mx-auto text-destructive/60" />
              <p className="text-muted-foreground font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchStudents}>
                <RefreshCw className="w-4 h-4 ms-1" />
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        ) : !loading && data.length === 0 && !search ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {isRtl ? "لا يوجد طلاب مسجلون بعد" : "No registered students yet"}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate("/institution/dashboard?tab=students")}>
                {isRtl ? "الذهاب إلى تسجيل الطلاب" : "Go to Student Registration"}
              </Button>
            </CardContent>
          </Card>
        ) : !loading && data.length === 0 && search ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {isRtl ? "لا توجد نتائج مطابقة" : "No matching results"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {isRtl ? "قائمة الطلاب" : "Student List"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={sorted.length > 0 && selectedIds.size === sorted.length}
                            onChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("full_name")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "الاسم" : "Name"} <SortIcon col="full_name" />
                          </span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort("email")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "البريد" : "Email"} <SortIcon col="email" />
                          </span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort("department_name")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "القسم" : "Department"} <SortIcon col="department_name" />
                          </span>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">{isRtl ? "الهاتف" : "Phone"}</TableHead>
                        <TableHead className="cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort("created_at")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "تاريخ التسجيل" : "Registered"} <SortIcon col="created_at" />
                          </span>
                        </TableHead>
                        <TableHead className="text-center">{isRtl ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-center">{isRtl ? "الاشتراك" : "Subscription"}</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">{isRtl ? "دفع الاشتراك" : "Pay Subscription"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        sorted.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedIds.has(s.id)}
                                onChange={() => toggleSelect(s.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{s.email || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-xs">{s.department_name}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{s.phone || "—"}</TableCell>
                            <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                              {new Date(s.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={`text-xs ${s.subscription_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {s.subscription_active ? (isRtl ? "نشيط" : "Active") : (isRtl ? "غير نشيط" : "Inactive")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {s.subscription_active ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-xs">
                                    <Clock className="w-3 h-3 me-1 inline" />
                                    {isRtl ? "مدفوع" : "Paid"}
                                  </Badge>
                                  {s.subscription_expires_at && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(s.subscription_expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                                    {isRtl ? "مطلوب الدفع" : "Payment Required"}
                                  </Badge>
                                  {s.subscription_expires_at && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(s.subscription_expires_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {subscriptionPlan === "free" && s.subscription_active ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                  {isRtl ? "مجاناً" : "Free"}
                                </Badge>
                              ) : subscriptionPlan === "annual" && s.subscription_active ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                  <CreditCard className="w-3 h-3 me-1 inline" />
                                  {isRtl ? "سنوي" : "Annual"}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={s.subscription_active ? "outline" : "default"}
                                  className={`text-xs gap-1 ${s.subscription_active ? "border-teal-300 text-teal-700 hover:bg-teal-50" : "bg-teal-500 hover:bg-teal-600 text-white"}`}
                                  onClick={() => { setRenewTarget(s); setRenewMonths(subscriptionPlan === "annual" ? 12 : 1); setRenewDialogOpen(true); }}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {s.subscription_active ? (isRtl ? "تجديد" : "Renew") : (isRtl ? "دفع" : "Pay")}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className={`flex items-center justify-center gap-2 pt-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `${safePage} / ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {selectedIds.size > 0 && subscriptionPlan !== "free" && (
              <div className={`flex flex-wrap items-center gap-3 pt-3 border-t ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-sm text-muted-foreground font-medium">
                  {isRtl ? `تم تحديد ${selectedIds.size} طالب` : `${selectedIds.size} student(s) selected`}
                </span>
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
                  onClick={() => setBulkPayDialogOpen(true)}
                >
                  <CreditCard className="w-4 h-4" />
                  {isRtl ? "دفع الاشتراك" : "Pay Subscription"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  {isRtl ? "إلغاء التحديد" : "Clear Selection"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              {isRtl ? "دفع الاشتراك" : "Pay Subscription"}
            </DialogTitle>
          </DialogHeader>
          {renewTarget && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{renewTarget.full_name}</p>
                <p className="text-sm text-muted-foreground">{renewTarget.email}</p>
                <p className="text-sm text-muted-foreground">{renewTarget.department_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{isRtl ? "مدة الاشتراك" : "Subscription Duration"}</label>
                <div className="flex flex-wrap gap-2">
                  {(subscriptionPlan === "annual"
                    ? [1, 3, 6, 12]
                    : [1, 2, 3, 6, 12]
                  ).map((m) => (
                    <Button
                      key={m}
                      variant={renewMonths === m ? "default" : "outline"}
                      size="sm"
                      className={renewMonths === m ? "bg-teal-500 hover:bg-teal-600" : ""}
                      onClick={() => setRenewMonths(m)}
                    >
                      {m} {isRtl ? "شهر" : "mo"}
                    </Button>
                  ))}
                </div>
                {subscriptionPlan === "annual" && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {isRtl ? "كل شهر = 30 يوم (12 شهر = 365 يوم)" : "Each month = 30 days (12 months = 365 days)"}
                  </p>
                )}
              </div>
              {subscriptionPlan === "annual" && (
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    {isRtl ? "خصم 10% على البقة السنوية" : "10% discount on Annual plan"}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleRenew} disabled={renewing} className="bg-teal-500 hover:bg-teal-600">
              {renewing ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <CreditCard className="w-4 h-4 me-1" />}
              {isRtl ? `دفع الاشتراك لمدة ${renewMonths} شهر` : `Pay for ${renewMonths} month(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkPayDialogOpen} onOpenChange={setBulkPayDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              {isRtl ? "دفع الاشتراك لعدة طلاب" : "Bulk Pay Subscriptions"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? subscriptionPlan === "annual"
                  ? `سيتم تفعيل اشتراك ${selectedIds.size} طالب لمدة 12 شهر (365 يوم)`
                  : `سيتم تفعيل اشتراك ${selectedIds.size} طالب لمدة شهر واحد`
                : subscriptionPlan === "annual"
                  ? `Activate 12-month subscription (365 days) for ${selectedIds.size} student(s)`
                  : `Activate 1-month subscription for ${selectedIds.size} student(s)`}
            </p>
            {subscriptionPlan === "annual" && (
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {isRtl ? "خصم 10% على البقة السنوية" : "10% discount on Annual plan"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPayDialogOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleBulkPay} disabled={bulkPaying} className="bg-teal-500 hover:bg-teal-600">
              {bulkPaying ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <CreditCard className="w-4 h-4 me-1" />}
              {isRtl ? "دفع الاشتراك" : "Pay Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentSubscriptions;
