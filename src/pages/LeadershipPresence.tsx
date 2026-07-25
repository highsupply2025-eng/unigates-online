import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Download, Calendar as CalendarIcon, Loader2, MapPin, Search, Users as UsersIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

type Row = {
  id: string;
  user_id: string;
  hall_code: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  selfie_url: string | null;
  created_at: string;
  student_name?: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function LeadershipPresence() {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>(todayStr());
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [institutionName, setInstitutionName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: mem } = await supabase
        .from("college_members")
        .select("college_id, college_registrations:college_id(college_name, institute_name)")
        .eq("user_id", user.id)
        .maybeSingle();
      const reg: any = (mem as any)?.college_registrations;
      setInstitutionName(reg?.college_name || reg?.institute_name || "");
    })();
  }, [navigate]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Live updates for both college & institute dashboards
  useRealtimeRefresh(["student_presence_checkins", "profiles"], () => load());

  const load = async () => {
    setLoading(true);
    try {
      const start = new Date(date + "T00:00:00").toISOString();
      const end = new Date(date + "T23:59:59.999").toISOString();
      const { data, error } = await supabase
        .from("student_presence_checkins")
        .select("id,user_id,hall_code,latitude,longitude,accuracy_m,selfie_url,created_at")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((data || []).map((r) => r.user_id)));
      const nameMap: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", ids);
        (profs || []).forEach((p: any) => {
          nameMap[p.user_id] = p.full_name || p.email || p.user_id;
        });
      }
      setRows((data || []).map((r) => ({ ...r, student_name: nameMap[r.user_id] || r.user_id })));
    } catch (e: any) {
      toast({ title: isRtl ? "فشل تحميل البيانات" : "Load failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.student_name || "").toLowerCase().includes(q) ||
      (r.hall_code || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const title = isRtl ? `تقرير إثبات الحضور — ${date}` : `Presence Report — ${date}`;
    const rowsHtml = filtered.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(r.student_name)}</td>
        <td>${esc(r.hall_code || "-")}</td>
        <td>${esc(new Date(r.created_at).toLocaleTimeString(isRtl ? "ar-EG" : "en-US"))}</td>
        <td>${r.latitude != null ? `${r.latitude.toFixed(5)}, ${r.longitude?.toFixed(5)}` : "-"}</td>
        <td>${r.accuracy_m != null ? `±${Math.round(r.accuracy_m)} m` : "-"}</td>
      </tr>`).join("");

    w.document.write(`<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        body{font-family:'Segoe UI',Tahoma,sans-serif;padding:32px;direction:${dir};color:#111}
        h1{color:#1a365d;margin:0 0 4px}
        .meta{color:#555;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
        th,td{border:1px solid #ddd;padding:8px;text-align:${isRtl ? "right" : "left"}}
        th{background:#f1f5f9;font-weight:700}
        tr:nth-child(even){background:#fafafa}
        @media print{body{padding:16px}}
      </style></head><body>
      <h1>${esc(title)}</h1>
      <div class="meta">${esc(institutionName)} — ${isRtl ? "عدد السجلات" : "Records"}: ${filtered.length}</div>
      <table><thead><tr>
        <th>#</th>
        <th>${isRtl ? "الطالب" : "Student"}</th>
        <th>${isRtl ? "رمز القاعة" : "Hall Code"}</th>
        <th>${isRtl ? "الوقت" : "Time"}</th>
        <th>${isRtl ? "الموقع" : "Location"}</th>
        <th>${isRtl ? "الدقة" : "Accuracy"}</th>
      </tr></thead><tbody>${rowsHtml || `<tr><td colspan="6" style="text-align:center;color:#888">${isRtl ? "لا توجد بيانات" : "No data"}</td></tr>`}</tbody></table>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="relative border-b-2 border-emerald-200/50 dark:border-emerald-900/50 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/60 dark:via-teal-950/60 dark:to-cyan-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-lg flex items-center justify-center shrink-0 ring-2 ring-white/40">
              <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black truncate bg-gradient-to-r from-emerald-700 to-cyan-700 dark:from-emerald-300 dark:to-cyan-300 bg-clip-text text-transparent">
                {isRtl ? "إثبات الحضور في القاعة" : "In-Hall Presence"}
              </h1>
              <p className="text-[11px] sm:text-sm font-bold text-foreground/70 truncate">{institutionName}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/leadership/dashboard")}
            className="shrink-0 gap-1.5 font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
          >
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            <span className="hidden xs:inline">{isRtl ? "رجوع" : "Back"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <Card className="border-2">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-[auto,1fr,auto] gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" /> {isRtl ? "اليوم" : "Day"}
              </label>
              <Input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="h-10 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> {isRtl ? "بحث" : "Search"}
              </label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? "اسم الطالب أو رمز القاعة" : "Student name or hall code"} className="h-10" />
            </div>
            <Button onClick={exportPDF} className="h-10 gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 text-white">
              <Download className="w-4 h-4" />
              {isRtl ? "تصدير PDF" : "Export PDF"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold opacity-90"><UsersIcon className="w-3.5 h-3.5" />{isRtl ? "إجمالي السجلات" : "Total"}</div>
              <div className="text-3xl font-black mt-1">{rows.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow">
            <CardContent className="p-4">
              <div className="text-xs font-bold opacity-90">{isRtl ? "طلاب مميزون" : "Unique Students"}</div>
              <div className="text-3xl font-black mt-1">{new Set(rows.map(r => r.user_id)).size}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow">
            <CardContent className="p-4">
              <div className="text-xs font-bold opacity-90">{isRtl ? "قاعات" : "Halls"}</div>
              <div className="text-3xl font-black mt-1">{new Set(rows.map(r => r.hall_code).filter(Boolean)).size}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow">
            <CardContent className="p-4">
              <div className="text-xs font-bold opacity-90">{isRtl ? "نتائج البحث" : "Filtered"}</div>
              <div className="text-3xl font-black mt-1">{filtered.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-semibold">
                {isRtl ? "لا توجد سجلات حضور في هذا اليوم" : "No presence records for this day"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-black">#</TableHead>
                      <TableHead className="font-black">{isRtl ? "الطالب" : "Student"}</TableHead>
                      <TableHead className="font-black">{isRtl ? "رمز القاعة" : "Hall Code"}</TableHead>
                      <TableHead className="font-black">{isRtl ? "الوقت" : "Time"}</TableHead>
                      <TableHead className="font-black">{isRtl ? "الموقع" : "Location"}</TableHead>
                      <TableHead className="font-black">{isRtl ? "الدقة" : "Accuracy"}</TableHead>
                      <TableHead className="font-black">{isRtl ? "صورة" : "Selfie"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-bold">{r.student_name}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono">{r.hall_code || "-"}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{new Date(r.created_at).toLocaleTimeString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.latitude != null ? (
                            <a className="inline-flex items-center gap-1 text-primary hover:underline" target="_blank" rel="noreferrer"
                              href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}>
                              <MapPin className="w-3 h-3" />{r.latitude.toFixed(4)}, {r.longitude?.toFixed(4)}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{r.accuracy_m != null ? <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">±{Math.round(r.accuracy_m)} m</Badge> : "-"}</TableCell>
                        <TableCell>{r.selfie_url ? <Badge variant="outline" className="text-xs">{isRtl ? "موجودة" : "Yes"}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          {isRtl ? "يتم الاحتفاظ بسجلات الحضور طوال العام الدراسي ويمكن استعراض أي يوم سابق." : "Presence records are kept for the entire academic year and any past day can be reviewed."}
        </p>
      </main>
    </div>
  );
}
