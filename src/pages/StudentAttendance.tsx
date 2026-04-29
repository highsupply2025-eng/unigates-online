import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import SiteFooter from "@/components/SiteFooter";
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
    <div className="min-h-screen bg-background flex flex-col">
      <StudentPageHeader titleAr="الحضور" titleEn="Attendance" icon={<Users className="w-3 h-3" />} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-6">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          {isRtl ? "سجل الحضور" : "Attendance Log"}
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "إجمالي الحضور" : "Total"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-black">{stats.last7}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "آخر 7 أيام" : "Last 7 days"}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-black">{stats.totalMinutes}</p>
            <p className="text-xs text-muted-foreground">{isRtl ? "دقائق المشاهدة" : "Watch minutes"}</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لم تحضر أي بث بعد" : "No attendance yet"}</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {rows.map(r => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate text-sm">{isRtl ? (r.stream?.title_ar || "—") : (r.stream?.title_en || "—")}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                    </p>
                  </div>
                  {r.duration_seconds != null && (
                    <span className="text-xs text-muted-foreground shrink-0">{Math.round(r.duration_seconds / 60)} {isRtl ? "د" : "min"}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default StudentAttendance;
