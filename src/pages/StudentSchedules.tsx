import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, BookOpen, FileQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import SiteFooter from "@/components/SiteFooter";
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
    <div className="min-h-screen bg-background flex flex-col">
      <StudentPageHeader titleAr="الجداول" titleEn="Schedules" icon={<Calendar className="w-3 h-3" />} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-6">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          {isRtl ? "جداول المحاضرات والاختبارات" : "Lectures & Tests Schedule"}
        </h1>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لا توجد مواعيد حالياً" : "No scheduled events"}</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(s => {
              const isTest = s.schedule_type === "test";
              return (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTest ? "bg-purple-500/10 text-purple-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                      {isTest ? <FileQuestion className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{isRtl ? s.title_ar : s.title_en}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.scheduled_date}</span>
                        {(s.start_time || s.end_time) && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time || "-"} - {s.end_time || "-"}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={isTest ? "default" : "secondary"}>
                      {isTest ? (isRtl ? "اختبار" : "Test") : (isRtl ? "محاضرة" : "Lecture")}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default StudentSchedules;
