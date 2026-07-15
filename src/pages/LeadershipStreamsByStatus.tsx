import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Eye, Loader2, Radio, Calendar, CheckCircle, ArrowLeft, ArrowRight, Users, Lock } from "lucide-react";
import SubPageHeader from "@/components/SubPageHeader";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

type StatusKey = "live" | "scheduled" | "ended";

const STATUS_META: Record<StatusKey, { ar: string; en: string; Icon: any; color: string; bg: string; gradient: string; ring: string; shadow: string; action: { ar: string; en: string } }> = {
  live:      { ar: "البث الحالي",  en: "Live Now",   Icon: Radio,        color: "text-red-600",   bg: "bg-red-50 dark:bg-red-950/20 border-red-200",   gradient: "from-red-500 via-rose-500 to-red-600",      ring: "ring-red-300/50",    shadow: "shadow-red-500/40",   action: { ar: "دخول وتفاعل",   en: "Join & Chat" } },
  scheduled: { ar: "البث المجدول", en: "Scheduled",  Icon: Calendar,     color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200", gradient: "from-blue-500 via-sky-500 to-indigo-600",   ring: "ring-blue-300/50",   shadow: "shadow-blue-500/30",  action: { ar: "دخول وتعليق",   en: "Enter & Comment" } },
  ended:     { ar: "البث المنتهي", en: "Ended",      Icon: CheckCircle,  color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/20 border-slate-300", gradient: "from-slate-600 via-slate-700 to-slate-800", ring: "ring-slate-300/50",  shadow: "shadow-slate-700/30", action: { ar: "مشاهدة وتعليق", en: "Replay & Comment" } },
};

const LeadershipStreamsByStatus = () => {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const key = (status as StatusKey) in STATUS_META ? (status as StatusKey) : "live";
  const meta = STATUS_META[key];
  const Icon = meta.Icon;

  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, number>>({});
  const [refreshTick, setRefreshTick] = useState(0);

  // Auto-refresh on live changes (mirrors college & institute dashboards)
  useRealtimeRefresh(["live_streams", "stream_attendance"], () => setRefreshTick((n) => n + 1));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("live_streams")
        .select("*")
        .eq("status", key)
        .order("scheduled_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const list = data || [];
      setStreams(list);

      if (list.length) {
        const ids = list.map((s: any) => s.id);
        const { data: att } = await supabase
          .from("stream_attendance")
          .select("stream_id, student_id")
          .in("stream_id", ids);
        const counts: Record<string, Set<string>> = {};
        (att || []).forEach((row: any) => {
          counts[row.stream_id] = counts[row.stream_id] || new Set();
          counts[row.stream_id].add(row.student_id);
        });
        const map: Record<string, number> = {};
        Object.entries(counts).forEach(([sid, set]) => { map[sid] = set.size; });
        setAttendance(map);
      } else {
        setAttendance({});
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [key, refreshTick]);

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const title = isRtl ? `تقرير ${meta.ar}` : `${meta.en} Report`;
    const rows = streams.map(s => `
      <tr>
        <td>${esc(isRtl ? s.title_ar : s.title_en)}</td>
        <td>${esc(isRtl ? (s.instructor_ar || "-") : (s.instructor_en || "-"))}</td>
        <td>${esc(isRtl ? (s.category_ar || "-") : (s.category_en || "-"))}</td>
        <td>${attendance[s.id] || 0}</td>
        <td>${s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}</td>
      </tr>
    `).join("");
    w.document.write(`
      <!DOCTYPE html><html dir="${dir}"><head><title>${esc(title)}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 32px; direction: ${dir}; }
        h1 { color: #1a365d; margin: 0 0 8px; }
        .meta { color: #666; margin-bottom: 24px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: ${isRtl ? "right" : "left"}; font-size: 13px; }
        th { background: #f5f5f5; }
        .stat { display: inline-block; margin: 6px 14px 18px 0; padding: 12px 18px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #1a365d; }
        .stat-label { font-size: 12px; color: #718096; }
      </style></head><body>
        <h1>${esc(title)}</h1>
        <div class="meta">${new Date().toLocaleString(isRtl ? "ar-EG" : "en-US")}</div>
        <div class="stat"><div class="stat-value">${streams.length}</div><div class="stat-label">${isRtl ? "إجمالي البثوث" : "Total Streams"}</div></div>
        <table>
          <thead><tr>
            <th>${isRtl ? "العنوان" : "Title"}</th>
            <th>${isRtl ? "المحاضر" : "Instructor"}</th>
            <th>${isRtl ? "التصنيف" : "Category"}</th>
            <th>${isRtl ? "عدد الطلاب" : "Students"}</th>
            <th>${isRtl ? "الموعد" : "Scheduled"}</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#999;padding:24px">${isRtl ? "لا توجد بيانات" : "No data"}</td></tr>`}</tbody>
        </table>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SubPageHeader
        titleAr={meta.ar}
        titleEn={meta.en}
        icon={<Icon className="w-5 h-5" />}
        backTo="/leadership/dashboard?tab=livestreams"
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <h2 className={`text-xl sm:text-2xl font-black ${meta.color}`}>{isRtl ? meta.ar : meta.en}</h2>
          <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1.5 font-bold" disabled={!streams.length}>
            <Download className="w-4 h-4" />
            {isRtl ? "تحميل PDF" : "Export PDF"}
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                    <TableHead className="hidden sm:table-cell">{isRtl ? "المحاضر" : "Instructor"}</TableHead>
                    <TableHead>{isRtl ? "عدد الطلاب" : "Students"}</TableHead>
                    <TableHead className="hidden md:table-cell">{isRtl ? "الموعد" : "Scheduled"}</TableHead>
                    <TableHead>{isRtl ? "إجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        {isRtl ? "لا توجد بيانات" : "No data"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    streams.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{isRtl ? s.title_ar : s.title_en}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {isRtl ? (s.instructor_ar || "-") : (s.instructor_en || "-")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold">{attendance[s.id] || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "-"}
                        </TableCell>
                        <TableCell>
                          {key === "ended" ? (
                            <Button size="sm" disabled className="font-extrabold cursor-not-allowed opacity-70">
                              <Lock className="w-4 h-4 me-1" strokeWidth={2.6} />
                              {isRtl ? "البث منتهي" : "Stream ended"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className={`bg-gradient-to-r ${meta.gradient} hover:opacity-90 text-white font-extrabold shadow-md ${meta.shadow} ${key === "live" ? `ring-2 ${meta.ring}` : ""}`}
                              onClick={() => navigate(`/stream/${s.id}`)}
                            >
                              <Eye className="w-4 h-4 me-1" strokeWidth={2.6} />
                              {isRtl ? meta.action.ar : meta.action.en}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default LeadershipStreamsByStatus;
