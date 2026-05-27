import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";

type ApprovalType = "quizzes" | "schedules";
type ApprovalStatus = "approved" | "pending";

const LeadershipApprovals = () => {
  const { type, status } = useParams<{ type: ApprovalType; status: ApprovalStatus }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const isQuizzes = type === "quizzes";
  const isApproved = status === "approved";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("");
  const [subRole, setSubRole] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("approved", true)
        .in("role", ["department_head", "vice_dean", "dean"])
        .maybeSingle();
      const role = roleRow?.role || "";

      const { data: sub } = await supabase.rpc("get_user_sub_role", { _user_id: user.id });
      const sr = (sub as any) || "";

      const [coursesRes, listRes] = await Promise.all([
        supabase.from("courses").select("*").limit(200),
        isQuizzes
          ? supabase.from("quizzes").select("*").order("created_at", { ascending: false }).limit(200)
          : supabase.from("lecture_schedules").select("*").order("created_at", { ascending: false }).limit(200),
      ]);

      if (cancelled) return;
      setCourses(coursesRes.data || []);
      setUserRole(role);
      setSubRole(sr);
      setItems(listRes.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [type, isQuizzes, navigate]);

  const vdColumn =
    subRole === "vice_dean_students" ? "students"
    : subRole === "vice_dean_postgrad" ? "postgrad"
    : subRole === "vice_dean_environment" ? "environment"
    : "";

  const quizFullyApproved = (q: any) =>
    q.approved_by_lecturer && q.approved_by_head &&
    q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment &&
    q.approved_by_dean;

  const schedFullyApproved = (s: any) =>
    s.approved_by_head && s.approved_by_vice_dean && s.approved_by_dean;

  const canActOnQuiz = (q: any) => {
    if (q.rejected_by) return false;
    if (userRole === "department_head") return q.approved_by_lecturer && !q.approved_by_head;
    if (userRole === "vice_dean" && vdColumn) {
      if (!q.approved_by_head) return false;
      return !q[`approved_by_vice_dean_${vdColumn}`];
    }
    if (userRole === "dean") {
      const vdAll = q.approved_by_vice_dean_students && q.approved_by_vice_dean_postgrad && q.approved_by_vice_dean_environment;
      return vdAll && !q.approved_by_dean;
    }
    return false;
  };

  const canActOnSched = (s: any) => {
    if (s.rejected_by) return false;
    if (userRole === "department_head") return !s.approved_by_head;
    if (userRole === "vice_dean") return s.approved_by_head && !s.approved_by_vice_dean;
    if (userRole === "dean") return s.approved_by_vice_dean && !s.approved_by_dean;
    return false;
  };

  const filtered = isQuizzes
    ? isApproved
      ? items.filter(quizFullyApproved)
      : items.filter((q) => !q.rejected_by && !quizFullyApproved(q))
    : isApproved
      ? items.filter(schedFullyApproved)
      : items.filter((s) => !s.rejected_by && !schedFullyApproved(s));

  const title = isQuizzes
    ? isApproved ? (isRtl ? "الاختبارات المعتمدة" : "Approved Quizzes") : (isRtl ? "الاختبارات غير المعتمدة" : "Pending Quizzes")
    : isApproved ? (isRtl ? "الجداول المعتمدة" : "Approved Schedules") : (isRtl ? "الجداول غير المعتمدة" : "Pending Schedules");

  const HeaderIcon = isApproved ? CheckCircle : Clock;
  const headerGradient = isApproved ? "from-emerald-500 to-green-600" : "from-amber-500 to-orange-600";
  const itemIcon = isQuizzes ? ShieldCheck : Calendar;
  const ItemIcon = itemIcon;

  const goTo = (row: any) => {
    if (isQuizzes) {
      navigate(`/quiz-results/${row.id}`);
    } else {
      const slug = (isRtl ? row.title_ar : row.title_en) || "schedule";
      const safe = String(slug).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "");
      navigate(`/schedule/${safe}-${row.id}`);
    }
  };

  const actionLabel = (row: any) => {
    if (isApproved) return isRtl ? "عرض" : "View";
    const act = isQuizzes ? canActOnQuiz(row) : canActOnSched(row);
    if (act) return isRtl ? "عرض ثم الاعتماد" : "Review & Approve";
    return isRtl ? "عرض" : "View";
  };

  const isMyTurn = (row: any) => !isApproved && (isQuizzes ? canActOnQuiz(row) : canActOnSched(row));

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${headerGradient} shadow-lg flex items-center justify-center shrink-0`}>
              <HeaderIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{title}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold">
                {isRtl ? `العدد: ${filtered.length}` : `Count: ${filtered.length}`}
              </p>
            </div>
          </div>
          <BackButton />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {isApproved
              ? (isQuizzes ? (isRtl ? "لا توجد اختبارات معتمدة" : "No approved quizzes") : (isRtl ? "لا توجد جداول معتمدة" : "No approved schedules"))
              : (isQuizzes ? (isRtl ? "لا توجد اختبارات غير معتمدة" : "No pending quizzes") : (isRtl ? "لا توجد جداول غير معتمدة" : "No pending schedules"))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? (isQuizzes ? "الاختبار" : "العنوان") : (isQuizzes ? "Quiz" : "Title")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{isRtl ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row: any) => {
                  const course = courses.find((c: any) => c.id === row.course_id);
                  const act = isMyTurn(row);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <ItemIcon className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span>{isRtl ? row.title_ar : row.title_en}</span>
                            {course && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {isRtl ? course.title_ar : course.title_en}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {(() => {
                          const d = row.scheduled_date || row.created_at;
                          return d ? new Date(d).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "-";
                        })()}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="sm"
                          onClick={() => goTo(row)}
                          className={act ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold shadow hover:shadow-lg" : ""}
                          variant={act ? "default" : "outline"}
                        >
                          {actionLabel(row)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeadershipApprovals;
