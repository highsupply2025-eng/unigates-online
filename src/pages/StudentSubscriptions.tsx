import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, GraduationCap,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, RefreshCw,
  CreditCard, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { useToast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";

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

function isFreePlanTrialActive(s: StudentRecord): boolean {
  return new Date(s.created_at).getTime() + 30 * 86_400_000 > Date.now();
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
  const { toast } = useToast();
  const abortRef = useRef(0);

  const subscriptionPlan = identity?.subscriptionPlan ?? "free";

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

  // Reset page on search change
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

  const isActive = (s: StudentRecord) =>
    subscriptionPlan === "free" ? isFreePlanTrialActive(s) : s.subscription_active;

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
                {identity?.institutionType === "institute" ? (isRtl ? "لوحة إدارة المعهد" : "Institute Administration") : (isRtl ? "لوحة إدارة الكلية" : "College Administration")}
                {subscriptionPlan && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20 ms-2 align-middle">
                    {isRtl
                      ? (subscriptionPlan === "free" ? "المجانية" : subscriptionPlan === "monthly" ? "الشهرية" : "السنوية")
                      : (subscriptionPlan === "free" ? "Free" : subscriptionPlan === "monthly" ? "Monthly" : "Annual")}
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold truncate">
                {isRtl ? "اشتراك الطلاب" : "Student Subscriptions"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!error && !loading && (
              <Badge variant="secondary" className="shrink-0 text-sm hidden sm:inline-flex">
                {total} {isRtl ? "طالب" : "students"}
              </Badge>
            )}
            <DashboardMenuDropdown
              title={identity?.institutionType === "institute" ? (isRtl ? "لوحة المعهد" : "Institute Panel") : (isRtl ? "لوحة الكلية" : "College Panel")}
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 w-full">
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
        ) : !loading && data.length === 0 && !debouncedSearch ? (
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
        ) : !loading && data.length === 0 && debouncedSearch ? (
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
                      {loading && data.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <TableRow key={`skel-${i}`}>
                            <TableCell><Skeleton className="h-5 w-5 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
                            <TableCell className="text-center hidden sm:table-cell"><Skeleton className="h-7 w-16 rounded-md mx-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : loading && data.length > 0 ? (
                        sorted.map((s) => (
                          <TableRow key={s.id} className="opacity-60">
                            <TableCell><input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} /></TableCell>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{s.email || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{s.department_name}</Badge></TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{s.phone || "—"}</TableCell>
                            <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">{new Date(s.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={`text-xs ${isActive(s) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {isActive(s) ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {isActive(s) ? (
                                <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-xs">
                                  <Clock className="w-3 h-3 me-1 inline" />
                                  {isRtl ? "مدفوع" : "Paid"}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                                  {isRtl ? "مطلوب الدفع" : "Payment Required"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Skeleton className="h-7 w-16 rounded-md mx-auto" />
                            </TableCell>
                          </TableRow>
                        ))
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
                              <Badge variant="secondary" className={`text-xs ${isActive(s) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {isActive(s) ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {isActive(s) ? (
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
                              {subscriptionPlan === "free" && isActive(s) ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                  {isRtl ? "مجاناً" : "Free"}
                                </Badge>
                              ) : subscriptionPlan === "annual" && isActive(s) ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                  <CreditCard className="w-3 h-3 me-1 inline" />
                                  {isRtl ? "سنوي" : "Annual"}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={isActive(s) ? "outline" : "default"}
                                  className={`text-xs gap-1 ${isActive(s) ? "border-teal-300 text-teal-700 hover:bg-teal-50" : "bg-teal-500 hover:bg-teal-600 text-white"}`}
                                  onClick={() => {
                                    const months = subscriptionPlan === "annual" ? 12 : 1;
                                    const params = new URLSearchParams({
                                      studentIds: s.id,
                                      studentNames: s.full_name,
                                      plan: subscriptionPlan,
                                      months: String(months),
                                      count: "1",
                                    });
                                    navigate(`/institution/payment?${params.toString()}`);
                                  }}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {isActive(s) ? (isRtl ? "تجديد" : "Renew") : (isRtl ? "دفع" : "Pay")}
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
                  {loading ? <span className="inline-block w-4 h-4" /> : `${safePage} / ${totalPages}`}
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

            {selectedIds.size > 0 && (
              <div className={`flex flex-wrap items-center gap-3 pt-3 border-t ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-sm text-muted-foreground font-medium">
                  {isRtl ? `تم تحديد ${selectedIds.size} طالب` : `${selectedIds.size} student(s) selected`}
                </span>
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
                  onClick={() => {
                    const inactiveStudents = sorted.filter((s) => selectedIds.has(s.id) && !isActive(s));
                    if (inactiveStudents.length === 0) {
                      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى تحديد طلاب غير نشطين" : "Please select inactive students", variant: "destructive" });
                      return;
                    }
                    const months = subscriptionPlan === "annual" ? 12 : 1;
                    const params = new URLSearchParams({
                      studentIds: inactiveStudents.map((s) => s.id).join(","),
                      studentNames: inactiveStudents.map((s) => s.full_name).join(","),
                      plan: subscriptionPlan,
                      months: String(months),
                      count: String(inactiveStudents.length),
                    });
                    navigate(`/institution/payment?${params.toString()}`);
                  }}
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
    </div>
  );
};

export default StudentSubscriptions;
