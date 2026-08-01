import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck, ShieldAlert, RefreshCw, Download, Search, Clock,
  KeyRound, Sparkles, Lock,
} from "lucide-react";
import {
  SEVERITY_LABELS, SEVERITY_ORDER, STATUS_LABELS, computeScore, countBySeverity,
  maskSensitive, scoreBand, type FindingStatus, type Severity,
} from "@/lib/security/scoring";

interface Finding {
  id: string;
  title_ar: string;
  title_en: string;
  severity: Severity;
  category: string;
  component: string | null;
  evidence: string | null;
  owasp_category: string | null;
  impact_ar: string | null;
  impact_en: string | null;
  remediation_ar: string | null;
  remediation_en: string | null;
  confidence: string;
  status: FindingStatus;
  scanner: string;
  ai_analysis: any;
  first_detected_at: string;
  last_detected_at: string;
}

interface Scan {
  id: string;
  scan_type: string;
  source: string;
  status: string;
  score: number | null;
  counts: any;
  started_at: string;
  finished_at: string | null;
  read_only: boolean;
}

const severityTone: Record<Severity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/70 text-destructive-foreground",
  medium: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
  informational: "bg-muted text-muted-foreground",
};

export default function AdminSecurityCenter() {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewDecision, setReviewDecision] = useState<FindingStatus>("reviewing");
  const [savingReview, setSavingReview] = useState(false);

  const notify = (msg: string, bad = false) =>
    toast({
      title: bad ? ar("خطأ", "Error") : ar("تم", "Done"),
      description: msg,
      variant: bad ? "destructive" : undefined,
    });

  const loadData = useCallback(async () => {
    const [{ data: f }, { data: s }] = await Promise.all([
      supabase.from("security_findings").select("*").order("last_detected_at", { ascending: false }).limit(1000),
      supabase.from("security_scans").select("*").order("started_at", { ascending: false }).limit(15),
    ]);
    setFindings((f as unknown as Finding[]) || []);
    setScans((s as unknown as Scan[]) || []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      // Authoritative server-side check — the client never asserts its own role.
      const { data: ok } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      if (ok !== true) { navigate("/"); return; }
      setAuthorized(true);
      await loadData();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-scan", { body: {} });
      if (error) throw error;
      notify(
        ar(
          `اكتمل الفحص للقراءة فقط — ${data?.total ?? 0} نتيجة`,
          `Read-only scan completed — ${data?.total ?? 0} findings`,
        ),
      );
      await loadData();
    } catch (e) {
      console.error("scan failed", e);
      notify(ar("تعذر تشغيل الفحص", "Could not run the scan"), true);
    } finally {
      setScanning(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-report", { body: {} });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unigates-security-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify(ar("تم تصدير التقرير", "Report exported"));
    } catch (e) {
      console.error("export failed", e);
      notify(ar("تعذر تصدير التقرير", "Could not export the report"), true);
    } finally {
      setExporting(false);
    }
  };

  const saveReview = async () => {
    if (!selected) return;
    setSavingReview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no session");
      const { error: reviewErr } = await supabase.from("security_remediation_reviews").insert({
        finding_id: selected.id,
        reviewer_id: user.id,
        decision: reviewDecision,
        notes: reviewNotes.trim() || null,
      });
      if (reviewErr) throw reviewErr;
      const { error: statusErr } = await supabase
        .from("security_findings")
        .update({ status: reviewDecision === "reopened" ? "open" : reviewDecision })
        .eq("id", selected.id);
      if (statusErr) throw statusErr;
      notify(ar("تم تسجيل المراجعة", "Review recorded"));
      setSelected(null);
      setReviewNotes("");
      await loadData();
    } catch (e) {
      console.error("review failed", e);
      notify(ar("تعذر حفظ المراجعة", "Could not save the review"), true);
    } finally {
      setSavingReview(false);
    }
  };

  const counts = useMemo(() => countBySeverity(findings), [findings]);
  const score = useMemo(() => computeScore(findings), [findings]);
  const band = scoreBand(score);
  const lastScan = scans[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings.filter((f) => {
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (!q) return true;
      return [f.title_ar, f.title_en, f.component, f.category, f.owasp_category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [findings, query, severityFilter, statusFilter]);

  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-background p-4 sm:p-6 space-y-4">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {ar("مركز الأمان الذكي", "AI Security Center")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {ar(
                  "فحص دفاعي للقراءة فقط — لا يعدّل أي بيانات إنتاجية",
                  "Defensive read-only auditing — never modifies production data",
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={runScan} disabled={scanning}>
              <RefreshCw className={`h-4 w-4 me-1 ${scanning ? "animate-spin" : ""}`} />
              {ar("تشغيل فحص للقراءة فقط", "Run read-only scan")}
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={exporting}>
              <Download className="h-4 w-4 me-1" />
              {ar("تصدير تقرير الأمان", "Export security report")}
            </Button>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ar("درجة الأمان العامة", "Overall security score")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tabular-nums">{score}</span>
                <span className="text-muted-foreground mb-2">/ 100</span>
              </div>
              <Progress value={score} />
              <p className="text-xs text-muted-foreground">
                {band === "good"
                  ? ar("وضع أمني جيد مع نقاط تحسين", "Good posture with room to improve")
                  : band === "fair"
                  ? ar("يحتاج معالجة نقاط مهمة", "Important items need attention")
                  : ar("يوجد مخاطر حرجة تحتاج معالجة عاجلة", "Critical risks need urgent attention")}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {lastScan
                  ? `${ar("آخر فحص", "Last scan")}: ${new Date(lastScan.started_at).toLocaleString()}`
                  : ar("لم يتم تشغيل أي فحص بعد", "No scan has run yet")}
              </div>
              <div className="rounded-lg border border-dashed p-3 text-xs space-y-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <KeyRound className="h-3.5 w-3.5" />
                  {ar("توصية", "Recommendation")}
                </p>
                <p className="text-muted-foreground">
                  {ar(
                    "فعّل المصادقة الثنائية (MFA) لكل حسابات الأدمن العام.",
                    "Enable MFA on every super admin account.",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SEVERITY_ORDER.map((sev) => (
                <Card key={sev}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      {ar(SEVERITY_LABELS[sev].ar, SEVERITY_LABELS[sev].en)}
                    </p>
                    <p className="mt-1 text-3xl font-black tabular-nums">{counts[sev]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ar("سجل الفحوصات", "Scan history")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scans.length === 0 && (
                  <p className="text-sm text-muted-foreground">{ar("لا يوجد سجل بعد", "No history yet")}</p>
                )}
                {scans.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 text-sm border-b pb-2 last:border-0">
                    <Badge variant="outline">{s.source}</Badge>
                    <Badge variant={s.status === "completed" ? "secondary" : "outline"}>{s.status}</Badge>
                    {s.read_only && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />{ar("قراءة فقط", "read-only")}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(s.started_at).toLocaleString()}
                    </span>
                    {s.score !== null && (
                      <span className="ms-auto font-semibold tabular-nums">{s.score}/100</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4" />
              {ar("النتائج", "Findings")}
              <Badge variant="secondary">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={ar("بحث في النتائج…", "Search findings…")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={ar("الخطورة", "Severity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar("كل الخطورات", "All severities")}</SelectItem>
                  {SEVERITY_ORDER.map((sev) => (
                    <SelectItem key={sev} value={sev}>
                      {ar(SEVERITY_LABELS[sev].ar, SEVERITY_LABELS[sev].en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder={ar("الحالة", "Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar("كل الحالات", "All statuses")}</SelectItem>
                  {(Object.keys(STATUS_LABELS) as FindingStatus[]).map((st) => (
                    <SelectItem key={st} value={st}>
                      {ar(STATUS_LABELS[st].ar, STATUS_LABELS[st].en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {ar("لا توجد نتائج مطابقة", "No matching findings")}
              </p>
            ) : (
              <div className="divide-y">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setSelected(f); setReviewDecision(f.status); setReviewNotes(""); }}
                    className="w-full text-start py-3 flex flex-wrap items-center gap-2 hover:bg-muted/40 rounded-md px-2 transition-colors"
                  >
                    <Badge className={severityTone[f.severity]}>
                      {ar(SEVERITY_LABELS[f.severity].ar, SEVERITY_LABELS[f.severity].en)}
                    </Badge>
                    <span className="font-semibold min-w-0 flex-1 truncate">
                      {ar(f.title_ar, f.title_en)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                      {f.component}
                    </span>
                    <Badge variant="outline">{ar(STATUS_LABELS[f.status].ar, STATUS_LABELS[f.status].en)}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent dir={dir} className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-start">{ar(selected.title_ar, selected.title_en)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge className={severityTone[selected.severity]}>
                    {ar(SEVERITY_LABELS[selected.severity].ar, SEVERITY_LABELS[selected.severity].en)}
                  </Badge>
                  <Badge variant="outline">{selected.category}</Badge>
                  <Badge variant="outline">{selected.scanner}</Badge>
                  <Badge variant="outline">
                    {ar("الثقة", "Confidence")}: {selected.confidence}
                  </Badge>
                  <Badge variant="outline">
                    {ar(STATUS_LABELS[selected.status].ar, STATUS_LABELS[selected.status].en)}
                  </Badge>
                </div>

                <Field label={ar("المكوّن المتأثر", "Affected component")} value={selected.component} />
                <Field label={ar("تصنيف OWASP", "OWASP category")} value={selected.owasp_category} />
                <Field
                  label={ar("الدليل (مُقنّع)", "Evidence (masked)")}
                  value={maskSensitive(selected.evidence)}
                  mono
                />
                <Field label={ar("الأثر", "Impact")} value={ar(selected.impact_ar || "", selected.impact_en || "")} />
                <Field
                  label={ar("المعالجة الآمنة المقترحة", "Suggested safe remediation")}
                  value={ar(selected.remediation_ar || "", selected.remediation_en || "")}
                />
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{ar("أول اكتشاف", "First detected")}: {new Date(selected.first_detected_at).toLocaleString()}</span>
                  <span>{ar("آخر اكتشاف", "Last detected")}: {new Date(selected.last_detected_at).toLocaleString()}</span>
                </div>

                {selected.ai_analysis?.explanation && (
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="flex items-center gap-1.5 font-semibold text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      {ar("تحليل الذكاء الاصطناعي — توصية تحتاج مراجعة بشرية", "AI analysis — recommendation, requires human review")}
                    </p>
                    <p className="text-muted-foreground">{String(selected.ai_analysis.explanation)}</p>
                  </div>
                )}

                <div className="space-y-2 border-t pt-3">
                  <p className="font-semibold text-xs">{ar("تسجيل مراجعة", "Record a review")}</p>
                  <Select value={reviewDecision} onValueChange={(v) => setReviewDecision(v as FindingStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as FindingStatus[]).map((st) => (
                        <SelectItem key={st} value={st}>
                          {ar(STATUS_LABELS[st].ar, STATUS_LABELS[st].en)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder={ar("ملاحظات المراجعة (اختياري)", "Review notes (optional)")}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    maxLength={1000}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  {ar("إغلاق", "Close")}
                </Button>
                <Button onClick={saveReview} disabled={savingReview}>
                  {ar("حفظ المراجعة", "Save review")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`break-words ${mono ? "font-mono text-xs bg-muted rounded p-2 mt-1" : ""}`}>{value}</p>
    </div>
  );
}
