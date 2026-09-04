import { useEffect, useMemo, useState } from "react";
import { Star, BookOpen, Radio, ClipboardList, Calendar, ClipboardCheck, MessageSquare, UserCheck, Sparkles, Download, Layers, TrendingUp, ThumbsUp, ShieldCheck, Filter, Search, Printer, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  course_id?: string | null;
  stream_id?: string | null;
  item_title?: string | null;
  categoryKey?: "lectures" | "streams" | "quizzes" | "schedules" | "assignments";
  categoryLabelAr?: string;
  categoryLabelEn?: string;
  categoryColor?: string;
};

interface Props {
  /** When provided, scope all queries to ratings whose items belong to this lecturer/faculty member. */
  lecturerId?: string | null;
  /** When provided, scope to department */
  departmentId?: string | null;
  institutionType?: "faculty" | "institute" | string;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-3.5 h-3.5 ${n <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const Section = ({
  rows,
  emptyAr,
  emptyEn,
  isRtl,
  showCategoryTag = false,
  tabTitleAr,
  tabTitleEn,
}: {
  rows: Row[];
  emptyAr: string;
  emptyEn: string;
  isRtl: boolean;
  showCategoryTag?: boolean;
  tabTitleAr: string;
  tabTitleEn: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchStar = starFilter === "all" || r.rating === starFilter;
      const matchSearch =
        !searchTerm.trim() ||
        (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.categoryLabelAr && r.categoryLabelAr.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStar && matchSearch;
    });
  }, [rows, starFilter, searchTerm]);

  const count = rows.length;
  const avg = count > 0 ? rows.reduce((a, r) => a + (r.rating || 0), 0) / count : 0;
  const positiveCount = rows.filter((r) => r.rating >= 4).length;
  const excellentCount = rows.filter((r) => r.rating === 5).length;
  const withCommentsCount = rows.filter((r) => r.comment && r.comment.trim().length > 0).length;

  const exportCurrentTabPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const escHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const html = `<!DOCTYPE html>
<html dir="${isRtl ? "rtl" : "ltr"}" lang="${isRtl ? "ar" : "en"}">
<head>
  <meta charset="utf-8"/>
  <title>${isRtl ? `تقرير ${tabTitleAr}` : `${tabTitleEn} Report`}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', system-ui, sans-serif; padding: 32px; background: #fff; color: #1e293b; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px; }
    .title-box h1 { font-size: 22px; font-weight: 900; color: #0f172a; }
    .title-box p { font-size: 12px; color: #64748b; font-weight: 600; }
    .date-badge { font-size: 11px; background: #f1f5f9; padding: 6px 14px; border-radius: 9999px; font-weight: 700; color: #334155; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
    .stat-lbl { font-size: 11px; font-weight: 700; color: #64748b; }
    .table-container { border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; text-align: ${isRtl ? "right" : "left"}; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; padding: 10px 14px; font-weight: 800; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .stars { color: #f59e0b; font-size: 14px; letter-spacing: 2px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
    .badge-anon { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .comment-quote { background: #f8fafc; padding: 6px 10px; border-radius: 6px; border-left: 3px solid #f59e0b; font-style: italic; color: #334155; margin-top: 4px; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; text-align: center; color: #94a3b8; font-weight: 600; }
    @media print {
      body { padding: 12mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-box">
      <h1>${isRtl ? `تقرير ${tabTitleAr}` : `${tabTitleEn} Ratings Report`}</h1>
      <p>${isRtl ? "تقييمات الطلاب الأكاديمية الرسمية - سرية ومجهولة الهوية" : "Official Student Academic Evaluations - Anonymous & Confidential"}</p>
    </div>
    <div class="date-badge">
      ${new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val" style="color: #d97706;">⭐ ${avg.toFixed(1)} / 5</div>
      <div class="stat-lbl">${isRtl ? "المتوسط العام" : "Average Rating"}</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #2563eb;">${count}</div>
      <div class="stat-lbl">${isRtl ? "إجمالي التقييمات" : "Total Evaluations"}</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #059669;">${positiveCount} (${count > 0 ? Math.round((positiveCount / count) * 100) : 0}%)</div>
      <div class="stat-lbl">${isRtl ? "التقييمات الإيجابية (4-5★)" : "Positive (4-5★)"}</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #7c3aed;">${withCommentsCount}</div>
      <div class="stat-lbl">${isRtl ? "تعليقات وملاحظات مكتوبة" : "Written Feedbacks"}</div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 140px;">${isRtl ? "التقييم بالنجوم" : "Score"}</th>
          ${showCategoryTag ? `<th style="width: 130px;">${isRtl ? "الفئة" : "Category"}</th>` : ""}
          <th>${isRtl ? "ملاحظات الطالب والتعليق" : "Student Comments"}</th>
          <th style="width: 120px;">${isRtl ? "التاريخ" : "Date"}</th>
        </tr>
      </thead>
      <tbody>
        ${
          filteredRows.length === 0
            ? `<tr><td colspan="${showCategoryTag ? 4 : 3}" style="text-align: center; padding: 24px; color: #64748b;">${isRtl ? emptyAr : emptyEn}</td></tr>`
            : filteredRows
                .map(
                  (r) => `
          <tr>
            <td>
              <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
              <strong style="font-size: 11px;">(${r.rating} / 5)</strong>
            </td>
            ${
              showCategoryTag
                ? `<td><span class="badge" style="background:#e0e7ff; color:#3730a3;">${escHtml(isRtl ? r.categoryLabelAr || "" : r.categoryLabelEn || "")}</span></td>`
                : ""
            }
            <td>
              <div><span class="badge badge-anon">${isRtl ? "طالب مسجل (سري)" : "Enrolled Student"}</span></div>
              ${r.comment ? `<div class="comment-quote">"${escHtml(r.comment)}"</div>` : `<div style="color: #94a3b8; font-size: 11px; margin-top: 3px;">${isRtl ? "تقييم رقمي فقط بدون تعليق" : "Rating only without written feedback"}</div>`}
            </td>
            <td>${new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</td>
          </tr>`
                )
                .join("")
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    ${isRtl ? "تم استخراج هذا التقرير آلياً عبر منصة UniGates الأكاديمية المعتمدة" : "Generated automatically via UniGates Academic Platform"}
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-2 border-border shadow-xs bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-muted-foreground">{isRtl ? "إجمالي التقييمات" : "Total Ratings"}</p>
              <Layers className="w-4 h-4 text-primary opacity-70" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-primary">{count}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{isRtl ? "تقييم معتمد مسجل" : "Verified records"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-amber-500/25 shadow-xs bg-amber-500/5 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-amber-700 dark:text-amber-400">{isRtl ? "المتوسط العام" : "Average Score"}</p>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{avg.toFixed(1)}</p>
              <span className="text-xs font-black text-muted-foreground">/ 5.0</span>
            </div>
            <div className="mt-1">
              <Stars value={Math.round(avg)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-emerald-500/25 shadow-xs bg-emerald-500/5 hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{isRtl ? "نسبة الرضا (4-5★)" : "Satisfaction (4-5★)"}</p>
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {count > 0 ? Math.round((positiveCount / count) * 100) : 0}%
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
              {positiveCount} {isRtl ? "تقييم إيجابي" : "positive reviews"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-purple-500/25 shadow-xs bg-purple-500/5 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-purple-700 dark:text-purple-400">{isRtl ? "ملاحظات تفصيلية" : "Written Notes"}</p>
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{withCommentsCount}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
              {isRtl ? "تعليق من الطلاب" : "student comments"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border-2 border-border shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? "بحث في تعليقات الطلاب وملاحظاتهم..." : "Search student comments..."}
              className="ps-9 h-10 rounded-xl text-xs font-bold bg-muted/30 border-border"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
            <Button
              size="sm"
              variant={starFilter === "all" ? "default" : "outline"}
              onClick={() => setStarFilter("all")}
              className="h-10 rounded-xl text-xs font-black px-3"
            >
              {isRtl ? "الكل" : "All"} ({rows.length})
            </Button>
            {[5, 4, 3, 2, 1].map((star) => {
              const c = rows.filter((r) => r.rating === star).length;
              return (
                <Button
                  key={star}
                  size="sm"
                  variant={starFilter === star ? "default" : "outline"}
                  onClick={() => setStarFilter(starFilter === star ? "all" : star)}
                  className={`h-10 rounded-xl text-xs font-black px-2.5 gap-1 ${
                    starFilter === star
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] opacity-75">({c})</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={exportCurrentTabPDF}
          className="h-10 rounded-xl font-black text-xs gap-1.5 border-2 border-primary/20 hover:border-primary text-primary hover:bg-primary/5 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>{isRtl ? "طباعة / تصدير PDF" : "Print / Export PDF"}</span>
        </Button>
      </div>

      {/* Reviews List */}
      <Card className="rounded-3xl border-2 border-border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0 divide-y divide-border">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary animate-pulse" />
              <p className="text-base font-black text-foreground mb-1">{isRtl ? "لا توجد تقييمات مطابقة" : "No matching evaluations"}</p>
              <p className="text-xs">{isRtl ? emptyAr : emptyEn}</p>
            </div>
          ) : (
            filteredRows.slice(0, 100).map((r, idx) => (
              <div
                key={r.id || idx}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-muted/20 transition-all flex-wrap group"
              >
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/30">
                      <Stars value={r.rating} />
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400">{r.rating} / 5</span>
                    </div>

                    {showCategoryTag && r.categoryLabelAr && (
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border shadow-2xs ${
                          r.categoryColor || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isRtl ? r.categoryLabelAr : r.categoryLabelEn}
                      </Badge>
                    )}

                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold border-muted-foreground/30 bg-muted/40 flex items-center gap-1 text-muted-foreground rounded-lg"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{isRtl ? "طالب مسجل (تقييم سري ومجهول)" : "Enrolled Student (Anonymous & Confidential)"}</span>
                    </Badge>
                  </div>

                  {r.comment ? (
                    <div className="relative bg-muted/30 dark:bg-muted/15 p-3.5 rounded-2xl border border-border/60 text-sm font-medium text-foreground leading-relaxed">
                      <span className="text-primary/40 font-serif text-lg leading-none select-none">“</span>
                      <span className="mx-1">{r.comment}</span>
                      <span className="text-primary/40 font-serif text-lg leading-none select-none">”</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/80 italic ps-1">
                      {isRtl ? "✨ تم تقديم تقييم رقمي بالنجوم فقط بدون تعليق مكتوب." : "✨ Star rating provided without extra written notes."}
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="text-[11px] font-mono shrink-0 rounded-lg px-2.5 py-1 border border-border/60">
                  {new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const RatingsBreakdown = ({ lecturerId, departmentId, institutionType = "faculty" }: Props) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [lectures, setLectures] = useState<Row[]>([]);
  const [streams, setStreams] = useState<Row[]>([]);
  const [quizzes, setQuizzes] = useState<Row[]>([]);
  const [schedules, setSchedules] = useState<Row[]>([]);
  const [assignments, setAssignments] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let courseIds: string[] | null = null;
        if (lecturerId) {
          const { data: cs } = await supabase.from("courses").select("id").eq("creator_id", lecturerId);
          courseIds = (cs || []).map((c: any) => c.id);
          if (courseIds.length === 0) {
            setLectures([]);
            setStreams([]);
            setQuizzes([]);
            setSchedules([]);
            setAssignments([]);
            setLoading(false);
            return;
          }
        }

        const scope = <T extends { select: any }>(q: T) =>
          courseIds ? (q as any).in("course_id", courseIds) : q;

        // 1) Lectures
        const lr = await scope(
          supabase.from("lecture_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(250)
        );
        const lRows: Row[] = (lr.data || []).map((r: any) => ({
          ...r,
          categoryKey: "lectures",
          categoryLabelAr: "محاضرة 📚",
          categoryLabelEn: "Lecture 📚",
          categoryColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        }));
        setLectures(lRows);

        // 2) Live Streams
        const streamQuery = supabase
          .from("live_stream_ratings")
          .select("id,rating,comment,created_at,stream_id")
          .order("created_at", { ascending: false })
          .limit(250);
        const streamRes = await streamQuery;
        let sRows = (streamRes.data as any[]) || [];
        if (lecturerId && sRows.length) {
          const streamIds = Array.from(new Set(sRows.map((r) => r.stream_id))).filter(Boolean);
          if (streamIds.length) {
            const { data: ls } = await supabase.from("live_streams").select("id,creator_id").in("id", streamIds);
            const allowed = new Set((ls || []).filter((s: any) => s.creator_id === lecturerId).map((s: any) => s.id));
            sRows = sRows.filter((r) => allowed.has(r.stream_id));
          } else {
            sRows = [];
          }
        }
        const mappedStreams: Row[] = sRows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          categoryKey: "streams",
          categoryLabelAr: "بث مباشر 🔴",
          categoryLabelEn: "Live Stream 🔴",
          categoryColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        }));
        setStreams(mappedStreams);

        // 3) Quizzes
        const qr = await scope(
          supabase.from("quiz_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(250)
        );
        const qRows: Row[] = (qr.data || []).map((r: any) => ({
          ...r,
          categoryKey: "quizzes",
          categoryLabelAr: "اختبار 📝",
          categoryLabelEn: "Quiz 📝",
          categoryColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        }));
        setQuizzes(qRows);

        // 4) Schedules
        const sr = await scope(
          supabase.from("schedule_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(250)
        );
        const schedRows: Row[] = (sr.data || []).map((r: any) => ({
          ...r,
          categoryKey: "schedules",
          categoryLabelAr: "جدول 📅",
          categoryLabelEn: "Schedule 📅",
          categoryColor: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
        }));
        setSchedules(schedRows);

        // 5) Assignments
        try {
          const ar = await scope(
            supabase
              .from("assignment_ratings" as any)
              .select("id,rating,comment,created_at,course_id")
              .order("created_at", { ascending: false })
              .limit(250)
          );
          const aRows: Row[] = (ar.data || []).map((r: any) => ({
            ...r,
            categoryKey: "assignments",
            categoryLabelAr: "تكليف 📋",
            categoryLabelEn: "Assignment 📋",
            categoryColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
          }));
          setAssignments(aRows);
        } catch (err) {
          console.warn("assignment_ratings table check:", err);
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error loading ratings breakdown:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [lecturerId, departmentId]);

  const allRatings = useMemo(() => {
    return [...lectures, ...streams, ...quizzes, ...schedules, ...assignments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [lectures, streams, quizzes, schedules, assignments]);

  const tabs = useMemo(
    () => [
      {
        key: "all",
        labelAr: "جميع التقييمات",
        labelEn: "All Ratings",
        Icon: Sparkles,
        rows: allRatings,
        emptyAr: "لا توجد أي تقييمات مسجلة حتى الآن في النظام.",
        emptyEn: "No ratings recorded yet in the system.",
        activeGrad: "data-[state=active]:from-amber-500 data-[state=active]:via-orange-500 data-[state=active]:to-rose-600",
        iconColor: "text-amber-500",
        showCategoryTag: true,
      },
      {
        key: "streams",
        labelAr: "تقييم البث 🔴",
        labelEn: "Live Streams",
        Icon: Radio,
        rows: streams,
        emptyAr: "لا توجد تقييمات للبث المباشر حتى الآن.",
        emptyEn: "No live stream ratings yet.",
        activeGrad: "data-[state=active]:from-rose-500 data-[state=active]:via-red-500 data-[state=active]:to-orange-500",
        iconColor: "text-rose-600",
        showCategoryTag: false,
      },
      {
        key: "lectures",
        labelAr: "تقييم المحاضرات 📚",
        labelEn: "Lectures",
        Icon: BookOpen,
        rows: lectures,
        emptyAr: "لا توجد تقييمات للدروس والمحاضرات حتى الآن.",
        emptyEn: "No lecture ratings yet.",
        activeGrad: "data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600",
        iconColor: "text-indigo-600",
        showCategoryTag: false,
      },
      {
        key: "schedules",
        labelAr: "تقييم الجداول 📅",
        labelEn: "Schedules",
        Icon: Calendar,
        rows: schedules,
        emptyAr: "لا توجد تقييمات للجداول الدراسية حتى الآن.",
        emptyEn: "No schedule ratings yet.",
        activeGrad: "data-[state=active]:from-teal-500 data-[state=active]:via-cyan-500 data-[state=active]:to-emerald-500",
        iconColor: "text-teal-600",
        showCategoryTag: false,
      },
      {
        key: "quizzes",
        labelAr: "تقييم الاختبارات 📝",
        labelEn: "Quizzes",
        Icon: ClipboardList,
        rows: quizzes,
        emptyAr: "لا توجد تقييمات للاختبارات حتى الآن.",
        emptyEn: "No quiz ratings yet.",
        activeGrad: "data-[state=active]:from-amber-500 data-[state=active]:via-orange-500 data-[state=active]:to-yellow-500",
        iconColor: "text-amber-600",
        showCategoryTag: false,
      },
      {
        key: "assignments",
        labelAr: "تقييم التكليفات 📋",
        labelEn: "Assignments",
        Icon: ClipboardCheck,
        rows: assignments,
        emptyAr: "لا توجد تقييمات للتكليفات حتى الآن.",
        emptyEn: "No assignment ratings yet.",
        activeGrad: "data-[state=active]:from-blue-600 data-[state=active]:via-indigo-600 data-[state=active]:to-violet-600",
        iconColor: "text-blue-600",
        showCategoryTag: false,
      },
    ],
    [allRatings, lectures, streams, quizzes, schedules, assignments]
  );

  return (
    <Tabs defaultValue="all" className="w-full" dir={isRtl ? "rtl" : "ltr"}>
      <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full h-auto gap-2 p-2 bg-muted/40 rounded-2xl border-2 border-border mb-4">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className={`gap-1.5 text-xs sm:text-sm font-black py-2.5 sm:py-3 rounded-xl bg-gradient-to-br ${t.activeGrad} data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] transition-all`}
          >
            <t.Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${t.iconColor} data-[state=active]:text-white`} strokeWidth={2.4} />
            <span className="truncate">{isRtl ? t.labelAr : t.labelEn}</span>
            <Badge variant="secondary" className="ms-1 px-1.5 py-0.2 text-[10px] font-black">
              {t.rows.length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="mt-2">
          <Section
            rows={t.rows}
            emptyAr={t.emptyAr}
            emptyEn={t.emptyEn}
            isRtl={isRtl}
            showCategoryTag={t.showCategoryTag}
            tabTitleAr={t.labelAr}
            tabTitleEn={t.labelEn}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RatingsBreakdown;

