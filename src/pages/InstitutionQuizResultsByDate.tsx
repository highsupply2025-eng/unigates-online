import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, Loader2, GraduationCap, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface ResultRow {
  id: string;
  student_name: string;
  department_name: string;
  academic_degree: string;
  grade: number | null;
  rating: string;
  notes: string | null;
  created_at: string;
}

const degreeLabels: Record<string, { ar: string; en: string }> = {
  bachelor: { ar: "بكالوريوس", en: "Bachelor" },
  master: { ar: "ماجستير", en: "Master" },
  phd: { ar: "دكتوراه", en: "PhD" },
  diploma: { ar: "دبلوم", en: "Diploma" },
  high_diploma: { ar: "دبلوم عالي", en: "High Diploma" },
};
const ratingLabels: Record<string, { ar: string; en: string }> = {
  excellent: { ar: "ممتاز", en: "Excellent" },
  very_good: { ar: "جيد جداً", en: "Very Good" },
  good: { ar: "جيد", en: "Good" },
  acceptable: { ar: "مقبول", en: "Acceptable" },
  fail: { ar: "راسب", en: "Fail" },
};

const InstitutionQuizResultsByDate = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [institutionName, setInstitutionName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !date) { navigate("/login"); return; }

        // Find institution by email (college or institute)
        const email = user.email || "";
        let instId = "";
        let instName = "";
        const { data: col } = await supabase
          .from("college_registrations")
          .select("id, college_name")
          .eq("email", email)
          .eq("status", "approved")
          .maybeSingle();
        if (col) { instId = col.id; instName = col.college_name; }
        else {
          const { data: inst } = await supabase
            .from("institute_registrations")
            .select("id, institute_name")
            .eq("email", email)
            .eq("status", "approved")
            .maybeSingle();
          if (inst) { instId = inst.id; instName = inst.institute_name; }
        }
        setInstitutionName(instName);

        if (!instId) { setLoading(false); return; }

        // Day window [date, date+1)
        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(dayStart.getTime() + 86400000);

        const { data } = await supabase
          .from("student_results")
          .select("id, student_name, department_name, academic_degree, grade, rating, notes, created_at")
          .eq("institution_id", instId)
          .gte("created_at", dayStart.toISOString())
          .lt("created_at", dayEnd.toISOString())
          .order("created_at", { ascending: true });

        setRows((data as ResultRow[]) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [date, navigate]);

  const stats = useMemo(() => ({
    total: rows.length,
    top: rows.filter(r => r.rating === "excellent" || r.rating === "very_good").length,
    pass: rows.filter(r => r.rating === "good" || r.rating === "acceptable").length,
    fail: rows.filter(r => r.rating === "fail").length,
  }), [rows]);

  const ratingLabel = (r: string) => ratingLabels[r]?.[isRtl ? "ar" : "en"] ?? r;
  const degreeLabel = (d: string) => degreeLabels[d]?.[isRtl ? "ar" : "en"] ?? d;
  const ratingBadge = (r: string) => {
    if (r === "excellent" || r === "very_good") return "bg-emerald-100 text-emerald-700";
    if (r === "good" || r === "acceptable") return "bg-amber-100 text-amber-700";
    if (r === "fail") return "bg-red-100 text-red-700";
    return "bg-muted text-foreground";
  };

  const titleAr = `نتائج اختبار ${new Date(date || Date.now()).toLocaleDateString("ar-EG")}`;
  const titleEn = `Quiz Results — ${new Date(date || Date.now()).toLocaleDateString("en-US")}`;

  const downloadPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const html = `<!doctype html><html lang="${isRtl ? "ar" : "en"}" dir="${dir}"><head><meta charset="utf-8"/>
<title>${esc(isRtl ? titleAr : titleEn)}</title>
<style>
  *{box-sizing:border-box} body{font-family:'Cairo','Segoe UI',sans-serif;margin:24px;color:#0f172a}
  h1{margin:0 0 6px;font-size:22px} .sub{color:#64748b;font-size:13px;margin-bottom:18px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .stat{border:1px solid #e2e8f0;border-radius:10px;padding:10px;text-align:center}
  .stat b{display:block;font-size:20px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:10px;text-align:${isRtl ? "right" : "left"}}
  td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .b{font-weight:700}
</style></head><body>
<h1>${esc(isRtl ? titleAr : titleEn)}</h1>
<div class="sub">${esc(institutionName || "")}</div>
<div class="stats">
  <div class="stat"><b>${stats.total}</b>${isRtl ? "إجمالي" : "Total"}</div>
  <div class="stat" style="color:#059669"><b>${stats.top}</b>${isRtl ? "متفوق" : "Top"}</div>
  <div class="stat" style="color:#d97706"><b>${stats.pass}</b>${isRtl ? "ناجح" : "Passed"}</div>
  <div class="stat" style="color:#dc2626"><b>${stats.fail}</b>${isRtl ? "راسب" : "Failed"}</div>
</div>
<table>
  <thead><tr>
    <th>#</th>
    <th>${isRtl ? "اسم الطالب" : "Student"}</th>
    <th>${isRtl ? "القسم" : "Department"}</th>
    <th>${isRtl ? "الدرجة العلمية" : "Degree"}</th>
    <th>${isRtl ? "الدرجة" : "Grade"}</th>
    <th>${isRtl ? "التقدير" : "Rating"}</th>
  </tr></thead>
  <tbody>
    ${rows.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td class="b">${esc(r.student_name)}</td>
      <td>${esc(r.department_name)}</td>
      <td>${esc(degreeLabel(r.academic_degree))}</td>
      <td class="b">${esc(r.grade ?? "—")}</td>
      <td>${esc(ratingLabel(r.rating))}</td>
    </tr>`).join("")}
  </tbody>
</table>
<script>setTimeout(()=>window.print(),300)</script>
</body></html>`;

    w.document.write(html);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20 shrink-0">
              <ArrowLeft className={isRtl ? "w-5 h-5 rotate-180" : "w-5 h-5"} />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold truncate">{isRtl ? titleAr : titleEn}</h1>
              <p className="text-xs text-white/80 truncate">{institutionName}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => window.print()}>
              <Eye className="w-4 h-4" /> {isRtl ? "اطلاع" : "View"}
            </Button>
            <Button size="sm" className="gap-1.5 bg-white text-emerald-700 hover:bg-white/90" onClick={downloadPDF}>
              <Download className="w-4 h-4" /> {isRtl ? "تحميل PDF" : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-primary/20"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-primary">{stats.total}</p><p className="text-xs text-muted-foreground">{isRtl ? "إجمالي" : "Total"}</p></CardContent></Card>
          <Card className="border-emerald-500/20"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-emerald-600">{stats.top}</p><p className="text-xs text-muted-foreground">{isRtl ? "متفوق" : "Top"}</p></CardContent></Card>
          <Card className="border-amber-500/20"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-amber-600">{stats.pass}</p><p className="text-xs text-muted-foreground">{isRtl ? "ناجح" : "Passed"}</p></CardContent></Card>
          <Card className="border-red-500/20"><CardContent className="p-4 text-center"><p className="text-2xl font-black text-red-600">{stats.fail}</p><p className="text-xs text-muted-foreground">{isRtl ? "راسب" : "Failed"}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">{isRtl ? "اسم الطالب" : "Student Name"}</TableHead>
                    <TableHead className="text-xs">{isRtl ? "القسم" : "Department"}</TableHead>
                    <TableHead className="text-xs">{isRtl ? "الدرجة العلمية" : "Degree"}</TableHead>
                    <TableHead className="text-xs">{isRtl ? "الدرجة" : "Grade"}</TableHead>
                    <TableHead className="text-xs">{isRtl ? "التقدير" : "Rating"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{isRtl ? "لا توجد نتائج لهذا الاختبار" : "No results for this quiz"}</p>
                      </TableCell>
                    </TableRow>
                  ) : rows.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">{i + 1}</TableCell>
                      <TableCell className="text-sm font-semibold">{r.student_name}</TableCell>
                      <TableCell className="text-sm">{r.department_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{degreeLabel(r.academic_degree)}</Badge></TableCell>
                      <TableCell className="text-sm font-bold">{r.grade ?? "—"}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${ratingBadge(r.rating)}`}>{ratingLabel(r.rating)}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {isRtl ? "يمكنك الاطلاع أو تحميل الجدول كملف PDF من الأزرار أعلى الصفحة." : "View or download the table as a PDF using the buttons above."}
        </p>
      </main>
    </div>
  );
};

export default InstitutionQuizResultsByDate;
