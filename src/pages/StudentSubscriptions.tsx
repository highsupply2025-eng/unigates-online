import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Loader2, Users, GraduationCap,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import BackButton from "@/components/BackButton";

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
}

interface RpcResponse {
  error: string | null;
  data: StudentRecord[];
  total: number;
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
  const { language } = useLanguage();
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
    } catch (err: any) {
      setError(isRtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortKey, sortDir, navigate, isRtl]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <BackButton to="/institution/dashboard" />
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-lg sm:text-xl truncate">
              {isRtl ? "اشتراكات الطلاب" : "Student Subscriptions"}
            </h1>
          </div>
          {!error && (
            <Badge variant="secondary" className="shrink-0 text-sm">
              {total} {isRtl ? "طالب" : "students"}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
          <Input
            placeholder={isRtl ? "بحث بالاسم أو البريد الإلكتروني..." : "Search by name or email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isRtl ? "pe-9" : "ps-9"}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        sorted.map((s) => (
                          <TableRow key={s.id}>
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
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                {isRtl ? "نشط" : "Active"}
                              </Badge>
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
          </>
        )}
      </main>
    </div>
  );
};

export default StudentSubscriptions;
