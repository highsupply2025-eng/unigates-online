import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, BookOpen, FileText, ClipboardList, Radio, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { computeStudentRatings, exportRatingsPdf, type Period, type StudentRatingsSummary } from "@/lib/student-ratings";

const ICONS: Record<string, any> = {
  quizzes: FileText,
  live: Radio,
  lectures: BookOpen,
  assignments: ClipboardList,
};
const COLORS: Record<string, string> = {
  quizzes: "from-purple-500 to-purple-600",
  live: "from-red-500 to-rose-600",
  lectures: "from-indigo-500 to-indigo-600",
  assignments: "from-amber-500 to-amber-600",
};

const StudentRatings = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const [params] = useSearchParams();
  const targetStudentId = params.get("student");

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [summary, setSummary] = useState<StudentRatingsSummary | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      let sid = user.id;
      let viewing = false;
      if (targetStudentId && targetStudentId !== user.id) {
        // Verify the current user is allowed to view another student
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role, approved")
          .eq("user_id", user.id);
        const allowed = (roles || []).some((r: any) =>
          r.approved && ["admin", "lecturer", "department_head", "vice_dean", "dean"].includes(r.role)
        );
        if (!allowed) {
          toast({
            title: isRtl ? "غير مصرح" : "Forbidden",
            description: isRtl ? "ليس لديك صلاحية لعرض هذا التقرير" : "You cannot view this report",
            variant: "destructive",
          });
          navigate(-1);
          return;
        }
        sid = targetStudentId;
        viewing = true;
      }
      setReadOnly(viewing);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", sid)
        .maybeSingle();
      setStudentName(prof?.full_name || prof?.email || sid);

      const s = await computeStudentRatings(sid, period);
      setSummary(s);
      setLoading(false);
    })();
  }, [navigate, period, targetStudentId, isRtl]);

  const periodOptions: { value: Period; ar: string; en: string }[] = [
    { value: "week", ar: "أسبوعي", en: "Weekly" },
    { value: "month", ar: "شهري", en: "Monthly" },
    { value: "year", ar: "سنوي", en: "Yearly" },
  ];

  const handleExport = async () => {
    if (!summary) return;
    try {
      await exportRatingsPdf({ summary, studentName, isRtl });
    } catch (e) {
      toast({ title: isRtl ? "تعذر إنشاء PDF" : "Failed to create PDF", variant: "destructive" });
    }
  };

  const overall = summary?.overallPct;
  const overallStars = summary?.overallStars ?? 0;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr={readOnly ? "تقييمات الطالب" : "التقييمات"}
        titleEn={readOnly ? "Student Ratings" : "Ratings"}
        icon={<Star className="w-3.5 h-3.5" />}
      />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8 space-y-4">
        <StudentHero
          titleAr="التقييمات"
          titleEn="Ratings"
          subtitleAr="آراؤك وتقييماتك للمحاضرين والمحتوى"
          subtitleEn="Your ratings and feedback on lecturers and content"
          Icon={Star}
          gradient="from-yellow-500 via-amber-600 to-orange-600"
          shadow="shadow-amber-500/30"
        />
        {readOnly && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold">{isRtl ? "عرض فقط" : "View only"}</span>
            <span className="text-muted-foreground">• {studentName}</span>
          </div>
        )}

        {/* Period + Export */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
            {periodOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                  period === p.value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isRtl ? p.ar : p.en}
              </button>
            ))}
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={!summary}>
            <Download className="w-4 h-4" />
            {isRtl ? "تحميل PDF" : "Download PDF"}
          </Button>
        </div>

        {/* Overall card */}
        <Card className="border-s-4 border-s-yellow-500 bg-gradient-to-l from-yellow-500/10 via-amber-500/5 to-transparent shadow-lg">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">
              {isRtl ? "التقييم العام" : "Overall Rating"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/40">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-4xl font-black bg-gradient-to-br from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {overall !== null && overall !== undefined ? overall.toFixed(1) + "%" : "—"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i + 0.5 < overallStars
                      ? "fill-yellow-500 text-yellow-500"
                      : i < overallStars
                      ? "fill-yellow-500/60 text-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-semibold">
              {isRtl ? "يحسب تلقائياً من كافة الأنشطة" : "Auto-calculated from all activities"}
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {summary?.categories.map((c) => {
              const Icon = ICONS[c.key];
              return (
                <Card key={c.key} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${COLORS[c.key]} shadow-md`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-extrabold text-sm truncate">{isRtl ? c.labelAr : c.labelEn}</h3>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i + 0.5 < c.stars
                                  ? "fill-yellow-500 text-yellow-500"
                                  : i < c.stars
                                  ? "fill-yellow-500/60 text-yellow-500"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-amber-700 mt-0.5">
                          {c.pct !== null ? `${c.pct.toFixed(0)}%` : (isRtl ? "لا يوجد" : "N/A")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/40 p-2.5">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">
                          {isRtl ? c.primaryLabelAr : c.primaryLabelEn}
                        </p>
                        <p className="text-sm font-extrabold">{c.primary.toFixed(0)}%</p>
                      </div>
                      {c.secondary !== undefined ? (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">
                            {isRtl ? c.secondaryLabelAr : c.secondaryLabelEn}
                          </p>
                          <p className="text-sm font-extrabold">{c.secondary.toFixed(0)}%</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted/40 p-2.5">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">
                            {isRtl ? "العدد" : "Count"}
                          </p>
                          <p className="text-sm font-extrabold">{c.count}</p>
                        </div>
                      )}
                    </div>
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

export default StudentRatings;
