import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Search, Loader2, Users, GraduationCap,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
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

type SortKey = "full_name" | "email" | "department_name" | "created_at";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

const StudentSubscriptions = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute" | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const loadStudents = useCallback(async (instId: string) => {
    const { data: depts } = await supabase
      .from("departments")
      .select("id, department_name")
      .eq("institution_id", instId);

    if (!depts || depts.length === 0) {
      setStudents([]);
      return;
    }

    const deptMap = new Map(depts.map((d) => [d.id, d.department_name]));
    const deptIds = depts.map((d) => d.id);

    let allMembers: any[] = [];
    const batchSize = 1000;
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: batch } = await supabase
        .from("department_members")
        .select("*")
        .eq("role", "student")
        .not("user_id", "is", null)
        .in("department_id", deptIds)
        .range(from, from + batchSize - 1);
      const rows = batch || [];
      allMembers = allMembers.concat(rows);
      hasMore = rows.length === batchSize;
      from += batchSize;
    }

    const mapped: StudentRecord[] = allMembers.map((m: any) => ({
      id: m.id,
      full_name: m.full_name || "",
      email: m.email || null,
      phone: m.phone || null,
      department_id: m.department_id,
      department_name: deptMap.get(m.department_id) || m.department_id,
      user_id: m.user_id,
      created_at: m.created_at,
      photo_url: m.photo_url || null,
    }));

    setStudents(mapped);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) { navigate("/login"); return; }

        let instId = "";
        let instType: "college" | "institute" | null = null;
        let instName = "";

        const { data: college } = await supabase
          .from("college_registrations")
          .select("id, college_name")
          .eq("email", user.email)
          .eq("status", "approved")
          .maybeSingle();
        if (college) {
          instId = college.id;
          instType = "college";
          instName = college.college_name;
        } else {
          const { data: inst } = await supabase
            .from("institute_registrations")
            .select("id, institute_name")
            .eq("email", user.email)
            .eq("status", "approved")
            .maybeSingle();
          if (inst) {
            instId = inst.id;
            instType = "institute";
            instName = inst.institute_name;
          }
        }

        if (!instId || !instType) {
          navigate("/login");
          return;
        }

        setInstitutionId(instId);
        setInstitutionType(instType);
        setInstitutionName(instName);
        await loadStudents(instId);
      } catch (err) {
        console.error("Failed to load student subscriptions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, loadStudents]);

  useRealtimeRefresh(
    ["department_members"],
    () => { if (institutionId) loadStudents(institutionId); },
    Boolean(institutionId),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = students;
    if (q) {
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          s.department_name.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [students, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  if (loading) {
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
            <p className="text-xs text-muted-foreground truncate">{institutionName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-sm">
            {filtered.length} {isRtl ? "طالب" : "students"}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
          <Input
            placeholder={isRtl ? "بحث بالاسم أو القسم أو البريد..." : "Search by name, department or email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isRtl ? "pe-9" : "ps-9"}
          />
        </div>

        {students.length === 0 ? (
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
        ) : filtered.length === 0 ? (
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
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("email")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "البريد" : "Email"} <SortIcon col="email" />
                          </span>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort("department_name")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "القسم" : "Department"} <SortIcon col="department_name" />
                          </span>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">{isRtl ? "الهاتف" : "Phone"}</TableHead>
                        <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort("created_at")}>
                          <span className="inline-flex items-center gap-1">
                            {isRtl ? "تاريخ التسجيل" : "Registered"} <SortIcon col="created_at" />
                          </span>
                        </TableHead>
                        <TableHead className="text-center">{isRtl ? "الحالة" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.full_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{s.email || "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">{s.department_name}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{s.phone || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {new Date(s.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              {isRtl ? "نشط" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
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
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage >= totalPages}
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
