import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";
import { Card, CardContent } from "@/components/ui/card";

const StudentAttendance = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, last7: 0, totalMinutes: 0 });

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data } = await supabase
      .from("stream_attendance")
      .select("id, stream_id, joined_at, left_at, duration_seconds")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(100);
    const list = data || [];
    const streamIds = Array.from(new Set(list.map((r: any) => r.stream_id)));
    let streamsById: Record<string, any> = {};
    if (streamIds.length > 0) {
      const { data: ss } = await supabase.from("live_streams").select("id, title_ar, title_en").in("id", streamIds);
      (ss || []).forEach((s: any) => { streamsById[s.id] = s; });
    }
    const enriched = list.map((r: any) => ({ ...r, stream: streamsById[r.stream_id] }));
    setRows(enriched);
    const now = Date.now();
    const last7 = enriched.filter((r: any) => now - new Date(r.joined_at).getTime() <= 7 * 24 * 3600 * 1000).length;
    const totalSec = enriched.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0);
    setStats({ total: enriched.length, last7, totalMinutes: Math.round(totalSec / 60) });
    setLoading(false);
  })(); }, [navigate]);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="الحضور" titleEn="Attendance" icon={<Users className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8">
        <StudentHero
          titleAr="الحضور"
          titleEn="Attendance"
          subtitleAr="سجل حضورك للبث المباشر"
          subtitleEn="Your live stream attendance record"
          Icon={Users}
          gradient="from-green-500 via-emerald-600 to-teal-700"
          shadow="shadow-emerald-500/30"
        />
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[
            { Icon: Eye, value: stats.total, label: isRtl ? "إجمالي الحضور" : "Total", color: "from-green-500 to-emerald-600" },
            { Icon: Clock, value: stats.last7, label: isRtl ? "آخر 7 أيام" : "Last 7 days", color: "from-blue-500 to-indigo-600" },
            { Icon: Clock, value: stats.totalMinutes, label: isRtl ? "دقائق المشاهدة" : "Watch min", color: "from-amber-500 to-orange-600" },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow"><CardContent className="p-3 sm:p-4 text-center">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center bg-gradient-to-br ${s.color} shadow-md shadow-black/5`}>
                <s.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-xl sm:text-2xl font-black">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
            </CardContent></Card>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لم تحضر أي بث بعد" : "No attendance yet"}</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {rows.map(r => (
              <Card key={r.id} className="border-s-4 border-s-emerald-500/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25">
                      <Eye className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold truncate text-sm tracking-tight">{isRtl ? (r.stream?.title_ar || "—") : (r.stream?.title_en || "—")}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(r.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                  </div>
                  {r.duration_seconds != null && (
                    <span className="text-xs font-bold text-emerald-600 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-md">{Math.round(r.duration_seconds / 60)} {isRtl ? "د" : "min"}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentAttendance;
