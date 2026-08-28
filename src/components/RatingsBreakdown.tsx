import { useEffect, useMemo, useState } from "react";
import { Star, BookOpen, Radio, ClipboardList, Calendar, ClipboardCheck, MessageSquare, UserCheck, Sparkles, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  course_id?: string | null;
  item_title?: string | null;
};

interface Props {
  /** When provided, scope all queries to ratings whose items belong to this lecturer/faculty member. */
  lecturerId?: string | null;
  /** When provided, scope to department */
  departmentId?: string | null;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-3.5 h-3.5 ${n <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const Section = ({ rows, emptyAr, emptyEn, isRtl }: { rows: Row[]; emptyAr: string; emptyEn: string; isRtl: boolean }) => {
  const count = rows.length;
  const avg = count > 0 ? rows.reduce((a, r) => a + (r.rating || 0), 0) / count : 0;
  const positiveCount = rows.filter((r) => r.rating >= 4).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-2 border-border shadow-xs bg-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-1">{isRtl ? "عدد التقييمات" : "Total ratings"}</p>
            <p className="text-2xl sm:text-3xl font-black text-primary">{count}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-amber-500/20 shadow-xs bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-1">{isRtl ? "المتوسط العام" : "Average Score"}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{avg.toFixed(1)}</p>
              <Stars value={Math.round(avg)} />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1 rounded-2xl border-2 border-emerald-500/20 shadow-xs bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-1">{isRtl ? "تقييمات إيجابية (4-5 نجوم)" : "Positive (4-5★)"}</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {positiveCount} <span className="text-xs font-bold opacity-75">({count > 0 ? Math.round((positiveCount / count) * 100) : 0}%)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden bg-card">
        <CardContent className="p-0 divide-y divide-border">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              <p>{isRtl ? emptyAr : emptyEn}</p>
            </div>
          ) : (
            rows.slice(0, 50).map((r, idx) => (
              <div key={r.id || idx} className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors flex-wrap">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} />
                    <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/30 bg-muted/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-muted-foreground" />
                      <span>{isRtl ? "طالب مسجل (تقييم سري)" : "Enrolled Student (Anonymous)"}</span>
                    </Badge>
                  </div>
                  {r.comment ? (
                    <p className="text-sm font-medium text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{isRtl ? "تقييم بالنجوم بدون تعليق مكتوب." : "Star rating without written note."}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-[11px] font-mono shrink-0">
                  {new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const RatingsBreakdown = ({ lecturerId, departmentId }: Props) => {
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
            setLectures([]); setStreams([]); setQuizzes([]); setSchedules([]); setAssignments([]);
            setLoading(false);
            return;
          }
        }

        const scope = <T extends { select: any }>(q: T) =>
          courseIds ? (q as any).in("course_id", courseIds) : q;

        // 1) Lectures
        const lr = await scope(supabase.from("lecture_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
        setLectures((lr.data as Row[]) || []);

        // 2) Live Streams
        const streamQuery = supabase.from("live_stream_ratings").select("id,rating,comment,created_at,stream_id").order("created_at", { ascending: false }).limit(200);
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
        setStreams(sRows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at })));

        // 3) Quizzes
        const qr = await scope(supabase.from("quiz_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
        setQuizzes((qr.data as Row[]) || []);

        // 4) Schedules
        const sr = await scope(supabase.from("schedule_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
        setSchedules((sr.data as Row[]) || []);

        // 5) Assignments
        try {
          const ar = await scope(supabase.from("assignment_ratings" as any).select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
          setAssignments((ar.data as Row[]) || []);
        } catch (err) {
          console.warn("assignment_ratings not populated yet:", err);
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error loading ratings breakdown:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [lecturerId, departmentId]);

  const tabs = useMemo(() => ([
    {
      key: "lectures",
      labelAr: "تقييم المحاضرات",
      labelEn: "Lectures",
      Icon: BookOpen,
      rows: lectures,
      emptyAr: "لا توجد تقييمات للدروس والمحاضرات بعد.",
      emptyEn: "No lecture ratings yet.",
      activeGrad: "data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600",
      iconColor: "text-violet-600",
    },
    {
      key: "streams",
      labelAr: "تقييم البث",
      labelEn: "Live Streams",
      Icon: Radio,
      rows: streams,
      emptyAr: "لا توجد تقييمات للبث المباشر بعد.",
      emptyEn: "No stream ratings yet.",
      activeGrad: "data-[state=active]:from-rose-500 data-[state=active]:via-red-500 data-[state=active]:to-orange-500",
      iconColor: "text-rose-600",
    },
    {
      key: "quizzes",
      labelAr: "تقييم الاختبارات",
      labelEn: "Quizzes",
      Icon: ClipboardList,
      rows: quizzes,
      emptyAr: "لا توجد تقييمات للاختبارات بعد.",
      emptyEn: "No quiz ratings yet.",
      activeGrad: "data-[state=active]:from-amber-500 data-[state=active]:via-orange-500 data-[state=active]:to-yellow-500",
      iconColor: "text-amber-600",
    },
    {
      key: "schedules",
      labelAr: "تقييم الجداول",
      labelEn: "Schedules",
      Icon: Calendar,
      rows: schedules,
      emptyAr: "لا توجد تقييمات للجداول بعد.",
      emptyEn: "No schedule ratings yet.",
      activeGrad: "data-[state=active]:from-teal-500 data-[state=active]:via-cyan-500 data-[state=active]:to-emerald-500",
      iconColor: "text-teal-600",
    },
    {
      key: "assignments",
      labelAr: "تقييم التكليفات",
      labelEn: "Assignments",
      Icon: ClipboardCheck,
      rows: assignments,
      emptyAr: "لا توجد تقييمات للتكليفات بعد.",
      emptyEn: "No assignment ratings yet.",
      activeGrad: "data-[state=active]:from-blue-600 data-[state=active]:via-indigo-600 data-[state=active]:to-violet-600",
      iconColor: "text-blue-600",
    },
  ]), [lectures, streams, quizzes, schedules, assignments]);

  return (
    <Tabs defaultValue="lectures" className="w-full" dir={isRtl ? "rtl" : "ltr"}>
      <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto gap-2 p-2 bg-muted/40 rounded-2xl border-2 border-border mb-4">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className={`gap-2 text-xs sm:text-sm font-black py-2.5 sm:py-3 rounded-xl bg-gradient-to-br ${t.activeGrad} data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] transition-all`}
          >
            <t.Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${t.iconColor} data-[state=active]:text-white`} strokeWidth={2.4} />
            <span className="truncate">{isRtl ? t.labelAr : t.labelEn}</span>
            <Badge variant="secondary" className="ms-1 px-1.5 py-0.2 text-[10px] font-black">{t.rows.length}</Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="mt-2">
          <Section rows={t.rows} emptyAr={t.emptyAr} emptyEn={t.emptyEn} isRtl={isRtl} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RatingsBreakdown;
