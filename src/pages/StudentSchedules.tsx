import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, BookOpen, FileQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StudentSchedules = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("status", "active");
    const courseIds = (subs || []).map((s: any) => s.course_id);
    if (courseIds.length === 0) { setLoading(false); return; }
    const { data } = await supabase
      .from("lecture_schedules")
      .select("*")
      .in("course_id", courseIds)
      .order("scheduled_date", { ascending: true });
    setItems(data || []);
    setLoading(false);
  })(); }, [navigate]);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="الجداول" titleEn="Schedules" icon={<Calendar className="w-3.5 h-3.5" />} />
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لا توجد مواعيد حالياً" : "No scheduled events"}</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(s => {
              const isTest = s.schedule_type === "test";
              return (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-md ${isTest ? "from-purple-500 to-fuchsia-600 shadow-purple-500/25" : "from-emerald-500 to-teal-600 shadow-emerald-500/25"}`}>
                      {isTest ? <FileQuestion className="w-5 h-5 text-white" strokeWidth={2.5} /> : <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-sm sm:text-base">{isRtl ? s.title_ar : s.title_en}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.scheduled_date}</span>
                        {(s.start_time || s.end_time) && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time || "-"} - {s.end_time || "-"}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={isTest ? "default" : "secondary"} className="shrink-0 text-[10px] sm:text-xs">
                      {isTest ? (isRtl ? "اختبار" : "Test") : (isRtl ? "محاضرة" : "Lecture")}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentSchedules;
