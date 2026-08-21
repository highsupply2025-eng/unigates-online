import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Calendar, CheckCircle, Clock, Loader2, Download, Eye } from "lucide-react";
import SubPageHeader from "@/components/SubPageHeader";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

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
  const [refreshTick, setRefreshTick] = useState(0);

  // Auto-refresh for both college & institute approval boards
  useRealtimeRefresh(
    ["quizzes", "lecture_schedules", "courses", "user_roles"],
    () => setRefreshTick((n) => n + 1)
  );

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
      let sr = (sub as any) || "";
      // Faculty-flow vice deans carry the specific role in institution_faculty_members;
      // prefer it when the RPC returns a generic/empty value.
      if (!["vice_dean_students", "vice_dean_postgrad", "vice_dean_environment", "vice_dean_community"].includes(sr)) {
        try {
          const { data: ifm } = await supabase.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle();
          if (ifm?.specific_role && ["vice_dean_students", "vice_dean_postgrad", "vice_dean_environment", "vice_dean_community"].includes(ifm.specific_role)) {
            sr = ifm.specific_role;
          }
        } catch { /* noop */ }
      }

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
  }, [type, isQuizzes, navigate, refreshTick]);

  const vdColumn =
    subRole === "vice_dean_students" ? "students"
    : subRole === "vice_dean_postgrad" ? "postgrad"
    : subRole === "vice_dean_environment" || subRole === "vice_dean_community" ? "environment"
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

  const escHtml = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const buildPrintHtml = (rows: any[]) => {
    const headerCols = isRtl
      ? [isQuizzes ? "الاختبار" : "العنوان", "الدورة", "التاريخ", "الحالة"]
      : [isQuizzes ? "Quiz" : "Title", "Course", "Date", "Status"];
    const body = rows.map((row: any) => {
      const course = courses.find((c: any) => c.id === row.course_id);
      const d = row.scheduled_date || row.created_at;
      const dateStr = d ? new Date(d).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "-";
      const statusStr = isRtl ? "معتمد بالكامل" : "Fully Approved";
      return `<tr>
        <td>${escHtml(isRtl ? row.title_ar : row.title_en)}</td>
        <td>${escHtml(course ? (isRtl ? course.title_ar : course.title_en) : "-")}</td>
        <td>${escHtml(dateStr)}</td>
        <td><span class="badge">${escHtml(statusStr)}</span></td>
      </tr>`;
    }).join("");
    return `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><title>${escHtml(title)}</title>
      <style>
        body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 32px; direction: ${dir}; }
        h1 { color: #4338ca; margin: 0 0 6px; }
        .meta { color: #64748b; margin-bottom: 24px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: ${isRtl ? "right" : "left"}; font-size: 13px; }
        th { background: linear-gradient(90deg,#10b981,#059669); color: #fff; font-weight: 800; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #d1fae5; color: #065f46; font-weight: 700; font-size: 11px; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <h1>${escHtml(title)}</h1>
      <div class="meta">${isRtl ? "العدد" : "Count"}: ${rows.length} · ${new Date().toLocaleString(isRtl ? "ar-EG" : "en-US")}</div>
      <table><thead><tr>${headerCols.map(c => `<th>${escHtml(c)}</th>`).join("")}</tr></thead>
      <tbody>${body || `<tr><td colspan="${headerCols.length}" style="text-align:center;color:#94a3b8;padding:24px;">${isRtl ? "لا توجد بيانات" : "No data"}</td></tr>`}</tbody></table>
      <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
      </body></html>`;
  };

  const downloadAll = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildPrintHtml(filtered));
    w.document.close();
  };

  const downloadOne = (row: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildPrintHtml([row]));
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <SubPageHeader
        titleAr={title}
        titleEn={title}
        icon={<HeaderIcon className="w-5 h-5" />}
        backTo={`/leadership/dashboard?tab=${type === "quizzes" ? "quizzesonline" : "schedulesapproval"}`}
      />


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
          <>
            {isApproved && (
              <div className="flex items-center justify-end mb-3">
                <Button
                  size="sm"
                  onClick={downloadAll}
                  className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold shadow hover:shadow-lg"
                >
                  <Download className="w-4 h-4" strokeWidth={2.6} />
                  {isRtl ? `تحميل الكل (${filtered.length})` : `Download all (${filtered.length})`}
                </Button>
              </div>
            )}
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
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => goTo(row)}
                              className={act ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold shadow hover:shadow-lg gap-1" : "gap-1"}
                              variant={act ? "default" : "outline"}
                            >
                              {act ? null : <Eye className="w-3.5 h-3.5" />}
                              {actionLabel(row)}
                            </Button>
                            {isApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadOne(row)}
                                className="gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isRtl ? "تحميل" : "Download"}</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LeadershipApprovals;
