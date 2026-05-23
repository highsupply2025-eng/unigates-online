import { useEffect, useMemo, useState } from "react";
import { Star, BookOpen, Radio, ClipboardList, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; rating: number; comment: string | null; created_at: string; course_id?: string | null };

interface Props {
  /** When provided, scope all queries to ratings whose course belongs to this lecturer. */
  lecturerId?: string | null;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-3.5 h-3.5 ${n <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40"}`}
      />
    ))}
  </div>
);

const Section = ({ rows, emptyAr, emptyEn, isRtl }: { rows: Row[]; emptyAr: string; emptyEn: string; isRtl: boolean }) => {
  const count = rows.length;
  const avg = count > 0 ? rows.reduce((a, r) => a + (r.rating || 0), 0) / count : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? "عدد التقييمات" : "Total ratings"}</p>
            <p className="text-2xl font-black text-primary">{count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? "المتوسط" : "Average"}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-amber-500">{avg.toFixed(1)}</p>
              <Stars value={Math.round(avg)} />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? "تقييمات إيجابية (4+)" : "Positive (4+)"}</p>
            <p className="text-2xl font-black text-emerald-500">{rows.filter(r => r.rating >= 4).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {isRtl ? emptyAr : emptyEn}
            </div>
          ) : (
            rows.slice(0, 50).map((r) => (
              <div key={r.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <Stars value={r.rating} />
                  {r.comment && <p className="text-sm text-foreground/80">{r.comment}</p>}
                </div>
                <Badge variant="secondary" className="text-xs">
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

const RatingsBreakdown = ({ lecturerId }: Props) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [lectures, setLectures] = useState<Row[]>([]);
  const [streams, setStreams] = useState<Row[]>([]);
  const [quizzes, setQuizzes] = useState<Row[]>([]);
  const [schedules, setSchedules] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      let courseIds: string[] | null = null;
      if (lecturerId) {
        const { data: cs } = await supabase.from("courses").select("id").eq("creator_id", lecturerId);
        courseIds = (cs || []).map((c: any) => c.id);
        if (courseIds.length === 0) {
          setLectures([]); setStreams([]); setQuizzes([]); setSchedules([]);
          return;
        }
      }

      const scope = <T extends { select: any }>(q: T) =>
        courseIds ? (q as any).in("course_id", courseIds) : q;

      // lectures
      const lr = await scope(supabase.from("lecture_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
      setLectures((lr.data as Row[]) || []);

      // schedules
      const sr = await scope(supabase.from("schedule_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
      setSchedules((sr.data as Row[]) || []);

      // quizzes
      const qr = await scope(supabase.from("quiz_ratings").select("id,rating,comment,created_at,course_id").order("created_at", { ascending: false }).limit(200));
      setQuizzes((qr.data as Row[]) || []);

      // streams — table doesn't have course_id; scope by stream lecturer if any
      let streamQuery = supabase.from("live_stream_ratings").select("id,rating,comment,created_at,stream_id").order("created_at", { ascending: false }).limit(200);
      const streamRes = await streamQuery;
      let rows = (streamRes.data as any[]) || [];
      if (lecturerId && rows.length) {
        const streamIds = Array.from(new Set(rows.map((r) => r.stream_id))).filter(Boolean);
        if (streamIds.length) {
          const { data: ls } = await supabase.from("live_streams").select("id,creator_id").in("id", streamIds);
          const allowed = new Set((ls || []).filter((s: any) => s.creator_id === lecturerId).map((s: any) => s.id));
          rows = rows.filter((r) => allowed.has(r.stream_id));
        } else {
          rows = [];
        }
      }
      setStreams(rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at })));
    })();
  }, [lecturerId]);

  const tabs = useMemo(() => ([
    { key: "lectures", labelAr: "تقييم المحاضرات", labelEn: "Lectures", Icon: BookOpen, rows: lectures, emptyAr: "لا توجد تقييمات للمحاضرات بعد", emptyEn: "No lecture ratings yet" },
    { key: "streams", labelAr: "تقييم البث", labelEn: "Live Streams", Icon: Radio, rows: streams, emptyAr: "لا توجد تقييمات للبث بعد", emptyEn: "No stream ratings yet" },
    { key: "quizzes", labelAr: "تقييم الاختبارات", labelEn: "Quizzes", Icon: ClipboardList, rows: quizzes, emptyAr: "لا توجد تقييمات للاختبارات بعد", emptyEn: "No quiz ratings yet" },
    { key: "schedules", labelAr: "تقييم الجداول", labelEn: "Schedules", Icon: Calendar, rows: schedules, emptyAr: "لا توجد تقييمات للجداول بعد", emptyEn: "No schedule ratings yet" },
  ]), [lectures, streams, quizzes, schedules]);

  return (
    <Tabs defaultValue="lectures" className="w-full" dir={isRtl ? "rtl" : "ltr"}>
      <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-1 p-1">
        {tabs.map((t) => (
          <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs sm:text-sm py-2">
            <t.Icon className="w-3.5 h-3.5" />
            <span>{isRtl ? t.labelAr : t.labelEn}</span>
            <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-[10px]">{t.rows.length}</Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="mt-4">
          <Section rows={t.rows} emptyAr={t.emptyAr} emptyEn={t.emptyEn} isRtl={isRtl} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RatingsBreakdown;
