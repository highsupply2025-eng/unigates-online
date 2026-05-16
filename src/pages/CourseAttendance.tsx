import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Download, BookOpen, Radio, ClipboardList, Users, Loader2 } from "lucide-react";
import { useSmartBack } from "@/hooks/use-smart-back";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const CourseAttendance = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const handleBack = useSmartBack("/");

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"lectures" | "streams" | "tests">("lectures");

  useEffect(() => {
    if (courseId) loadAll(courseId);
  }, [courseId]);

  const loadAll = async (cid: string) => {
    setLoading(true);
    const userIds = new Set<string>();

    // Course info
    const { data: c } = await supabase.from("courses").select("*").eq("id", cid).maybeSingle();
    setCourse(c);

    // Lecture schedules → schedule_views
    const { data: schedules } = await supabase
      .from("lecture_schedules")
      .select("id, title_ar, title_en, schedule_type, scheduled_date")
      .eq("course_id", cid)
      .eq("schedule_type", "lecture");
    if (schedules && schedules.length > 0) {
      const ids = schedules.map((s) => s.id);
      const { data: views } = await supabase
        .from("schedule_views")
        .select("*")
        .in("schedule_id", ids)
        .order("viewed_at", { ascending: false });
      const enriched = (views || []).map((v: any) => {
        const sch = schedules.find((s) => s.id === v.schedule_id);
        userIds.add(v.user_id);
        return { ...v, _schedule: sch };
      });
      setLectures(enriched);
    } else {
      setLectures([]);
    }

    // Live streams → stream_attendance
    const { data: liveStreams } = await supabase
      .from("live_streams")
      .select("id, title_ar, title_en")
      .eq("course_id", cid);
    if (liveStreams && liveStreams.length > 0) {
      const ids = liveStreams.map((s) => s.id);
      const { data: att } = await supabase
        .from("stream_attendance")
        .select("*")
        .in("stream_id", ids)
        .order("joined_at", { ascending: false });
      const enriched = (att || []).map((a: any) => {
        const st = liveStreams.find((s) => s.id === a.stream_id);
        userIds.add(a.user_id);
        return { ...a, _stream: st };
      });
      setStreams(enriched);
    } else {
      setStreams([]);
    }

    // Quizzes → quiz_submissions
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, title_ar, title_en")
      .eq("course_id", cid);
    if (quizzes && quizzes.length > 0) {
      const ids = quizzes.map((q) => q.id);
      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select("*")
        .in("quiz_id", ids)
        .order("submitted_at", { ascending: false });
      const enriched = (subs || []).map((s: any) => {
        const qz = quizzes.find((q) => q.id === s.quiz_id);
        userIds.add(s.student_id);
        return { ...s, _quiz: qz };
      });
      setTests(enriched);
    } else {
      setTests([]);
    }

    if (userIds.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => {
        map[p.user_id] = p.full_name;
      });
      setProfilesMap(map);
    }

    setLoading(false);
  };

  const [exporting, setExporting] = useState<string | null>(null);

  const exportPDF = async (section: "lectures" | "streams" | "tests") => {
    setExporting(section);
    try {
      // Build offscreen table HTML
      const title = section === "lectures"
        ? (isRtl ? "حضور المحاضرات" : "Lecture Attendance")
        : section === "streams"
          ? (isRtl ? "حضور البث المباشر" : "Stream Attendance")
          : (isRtl ? "حضور الاختبارات" : "Test Attendance");

      let headers: string[] = [];
      let rows: string[][] = [];
      const courseName = courseTitle || (isRtl ? "مادة تجريبية" : "Demo course");

      if (section === "lectures") {
        headers = isRtl
          ? ["اسم الطالب", "اسم المحاضرة", "المادة", "وقت الحضور"]
          : ["Student", "Lecture", "Course", "Attended at"];
        rows = lectureRows.map((a) => [
          studentName(a.user_id, a._demo) + (a._demo ? (isRtl ? " (تجريبي)" : " (DEMO)") : ""),
          a._schedule ? (isRtl ? a._schedule.title_ar : a._schedule.title_en) : "—",
          courseName,
          new Date(a.viewed_at).toLocaleString(isRtl ? "ar-EG" : "en-US"),
        ]);
      } else if (section === "streams") {
        headers = isRtl
          ? ["اسم الطالب", "اسم البث المباشر", "المادة", "وقت الانضمام", "المدة"]
          : ["Student", "Live Stream", "Course", "Joined", "Duration"];
        rows = streamRows.map((a) => [
          studentName(a.user_id, a._demo) + (a._demo ? (isRtl ? " (تجريبي)" : " (DEMO)") : ""),
          a._stream ? (isRtl ? a._stream.title_ar : a._stream.title_en) : "—",
          courseName,
          new Date(a.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US"),
          `${a.duration_minutes || 0} ${isRtl ? "د" : "min"}`,
        ]);
      } else {
        headers = isRtl
          ? ["اسم الطالب", "اسم الاختبار", "المادة", "الدرجة", "وقت التسليم"]
          : ["Student", "Test", "Course", "Score", "Submitted"];
        rows = testRows.map((a) => [
          studentName(a.student_id, a._demo) + (a._demo ? (isRtl ? " (تجريبي)" : " (DEMO)") : ""),
          a._quiz ? (isRtl ? a._quiz.title_ar : a._quiz.title_en) : "—",
          courseName,
          `${a.score ?? "—"}${a.total_points ? ` / ${a.total_points}` : ""}`,
          new Date(a.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US"),
        ]);
      }

      const container = document.createElement("div");
      container.style.cssText = `position:fixed;left:-99999px;top:0;width:900px;background:#fff;padding:32px;font-family:'Cairo','Tajawal',Arial,sans-serif;direction:${isRtl ? "rtl" : "ltr"};color:#111;`;
      container.innerHTML = `
        <div style="border-bottom:3px solid #0d9488;padding-bottom:12px;margin-bottom:20px;">
          <h1 style="font-size:22px;font-weight:800;margin:0 0 6px 0;">${escapeHtml(courseName)}</h1>
          <h2 style="font-size:16px;font-weight:600;margin:0;color:#0d9488;">${escapeHtml(title)}</h2>
          <p style="font-size:11px;color:#666;margin:6px 0 0 0;">${new Date().toLocaleString(isRtl ? "ar-EG" : "en-US")} — ${rows.length} ${isRtl ? "سجل" : "records"}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#0d9488;color:#fff;">
              ${headers.map(h => `<th style="padding:10px 8px;text-align:${isRtl ? "right" : "left"};font-weight:700;border:1px solid #0d9488;">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
              ? `<tr><td colspan="${headers.length}" style="padding:20px;text-align:center;color:#999;border:1px solid #ddd;">${isRtl ? "لا توجد سجلات" : "No records"}</td></tr>`
              : rows.map((r, i) => `
                <tr style="background:${i % 2 ? "#f9fafb" : "#fff"};">
                  ${r.map(c => `<td style="padding:8px;border:1px solid #e5e7eb;text-align:${isRtl ? "right" : "left"};">${escapeHtml(c)}</td>`).join("")}
                </tr>`).join("")}
          </tbody>
        </table>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      document.body.removeChild(container);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
      while (heightLeft > 0) {
        position = 10 - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      const fname = `${courseName}-${title}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fname);
      toast.success(isRtl ? "تم تصدير الملف بنجاح" : "PDF exported successfully");
    } catch (e: any) {
      console.error("PDF export error:", e);
      toast.error(isRtl ? "فشل التصدير: " + (e?.message || "") : "Export failed: " + (e?.message || ""));
    } finally {
      setExporting(null);
    }
  };

  const escapeHtml = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

  const courseTitle = course ? (isRtl ? course.title_ar : course.title_en) : "";
  const tabLabel =
    activeTab === "lectures"
      ? isRtl
        ? "حضور المحاضرات"
        : "Lecture Attendance"
      : activeTab === "streams"
        ? isRtl
          ? "حضور البث المباشر"
          : "Stream Attendance"
        : isRtl
          ? "حضور الاختبارات"
          : "Test Attendance";

  // Demo example rows shown alongside live data so admins can preview the format
  const demoLectures = [
    { id: "demo-l1", _schedule: { title_ar: "محاضرة تجريبية — مقدمة", title_en: "Demo lecture — Intro" }, user_id: "demo-student-1", viewed_at: new Date().toISOString(), _demo: true },
    { id: "demo-l2", _schedule: { title_ar: "محاضرة تجريبية — الفصل ٢", title_en: "Demo lecture — Chapter 2" }, user_id: "demo-student-2", viewed_at: new Date(Date.now() - 86400000).toISOString(), _demo: true },
  ];
  const demoStreams = [
    { id: "demo-s1", _stream: { title_ar: "بث تجريبي مباشر", title_en: "Demo live stream" }, user_id: "demo-student-1", joined_at: new Date().toISOString(), duration_minutes: 45, _demo: true },
  ];
  const demoTests = [
    { id: "demo-t1", _quiz: { title_ar: "اختبار تجريبي ١", title_en: "Demo quiz 1" }, student_id: "demo-student-1", score: 18, total_points: 20, submitted_at: new Date().toISOString(), _demo: true },
    { id: "demo-t2", _quiz: { title_ar: "اختبار تجريبي ٢", title_en: "Demo quiz 2" }, student_id: "demo-student-2", score: 15, total_points: 20, submitted_at: new Date(Date.now() - 172800000).toISOString(), _demo: true },
  ];

  const lectureRows = [...lectures, ...demoLectures];
  const streamRows = [...streams, ...demoStreams];
  const testRows = [...tests, ...demoTests];

  const studentName = (id: string, isDemo?: boolean) => {
    if (isDemo) {
      return id === "demo-student-1"
        ? (isRtl ? "طالب تجريبي ١" : "Demo Student 1")
        : (isRtl ? "طالب تجريبي ٢" : "Demo Student 2");
    }
    return profilesMap[id] || id.slice(0, 8);
  };

  const TableToolbar = ({ section, count }: { section: "lectures" | "streams" | "tests"; count: number }) => {
    const iconConfig = {
      lectures: { Icon: BookOpen, color: "text-primary", bg: "from-primary/20 to-primary/5", ring: "ring-primary/30" },
      streams: { Icon: Radio, color: "text-red-500", bg: "from-red-500/20 to-red-500/5", ring: "ring-red-500/30" },
      tests: { Icon: ClipboardList, color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5", ring: "ring-amber-500/30" },
    }[section];
    const { Icon } = iconConfig;
    return (
      <div className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-border bg-muted/30 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-2.5 min-w-0 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br ${iconConfig.bg} ring-2 ${iconConfig.ring} flex items-center justify-center shadow-sm`}>
            <Icon className={`w-5 h-5 ${iconConfig.color}`} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">{tabLabel}</div>
            <div className="text-[11px] text-muted-foreground">{count} {isRtl ? "سجل" : "records"}</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => exportPDF(section)} disabled={exporting === section} className="gap-1.5 h-9 px-3 shrink-0 no-print font-semibold">
          {exporting === section ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" strokeWidth={2.5} />}
          <span className="text-xs sm:text-sm">{exporting === section ? (isRtl ? "جارٍ التصدير..." : "Exporting...") : (isRtl ? "تصدير PDF" : "Export PDF")}</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header — Back button always on the LEFT, title on the right */}
      <div className="bg-card border-b border-border no-print">
        <div className="container mx-auto px-3 sm:px-6 py-4 flex items-center gap-3" dir="ltr">
          <Button size="sm" onClick={handleBack} className="gap-2 shrink-0 bg-gradient-to-l from-primary to-primary/80 text-white font-extrabold text-base px-5 py-2.5 shadow-lg hover:shadow-xl border-2 border-primary/30 transition-all">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.75} />
            {isRtl ? "رجوع" : "Back"}
          </Button>
          <h1 className="text-base sm:text-xl font-bold truncate flex-1 text-center" dir={dir}>
            {isRtl ? "سجل الحضور" : "Attendance Log"}
          </h1>
          <div className="w-[80px] shrink-0" />
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-6xl">

        {/* Print header */}
        <div className="print-only mb-6">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{courseTitle}</h1>
          <p style={{ fontSize: 14 }}>{tabLabel} — {new Date().toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{isRtl ? "جارٍ التحميل..." : "Loading..."}</div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4 no-print h-auto p-2 gap-1.5 bg-muted/60 border-2 border-border/60">
              <TabsTrigger value="lectures" className="flex-col sm:flex-row gap-1.5 sm:gap-2 py-3 font-extrabold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <BookOpen className="w-6 h-6" strokeWidth={2.75} />
                <span className="text-xs sm:text-base">{isRtl ? "المحاضرات" : "Lectures"}</span>
                <span className="text-[11px] opacity-80 hidden sm:inline font-bold">({lectureRows.length})</span>
              </TabsTrigger>
              <TabsTrigger value="streams" className="flex-col sm:flex-row gap-1.5 sm:gap-2 py-3 font-extrabold data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Radio className="w-6 h-6" strokeWidth={2.75} />
                <span className="text-xs sm:text-base">{isRtl ? "البث" : "Streams"}</span>
                <span className="text-[11px] opacity-80 hidden sm:inline font-bold">({streamRows.length})</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex-col sm:flex-row gap-1.5 sm:gap-2 py-3 font-extrabold data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <ClipboardList className="w-6 h-6" strokeWidth={2.75} />
                <span className="text-xs sm:text-base">{isRtl ? "الاختبارات" : "Tests"}</span>
                <span className="text-[11px] opacity-80 hidden sm:inline font-bold">({testRows.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Helpers for vertical (mobile) view */}
            {(() => null)()}

            {/* Lectures */}
            <TabsContent value="lectures">
              <Card className="shadow-sm overflow-hidden">
                <TableToolbar section="lectures" count={lectureRows.length} />

                {/* Mobile: vertical cards */}
                <div className="md:hidden divide-y divide-border">
                  {lectureRows.map((a) => {
                    const sch = a._schedule;
                    return (
                      <div key={a.id} className={`p-4 space-y-2.5 ${a._demo ? "bg-amber-500/5" : ""}`}>
                        <VRow label={isRtl ? "اسم الطالب" : "Student"} value={
                          <>{studentName(a.user_id, a._demo)}{a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}</>
                        } isRtl={isRtl} bold />
                        <VRow label={isRtl ? "المادة" : "Course"} value={courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")} isRtl={isRtl} />
                        <VRow label={isRtl ? "اسم المحاضرة" : "Lecture"} value={sch ? (isRtl ? sch.title_ar : sch.title_en) : "—"} isRtl={isRtl} />
                        <VRow label={isRtl ? "وقت الحضور" : "Attended at"} value={new Date(a.viewed_at).toLocaleString(isRtl ? "ar-EG" : "en-US")} isRtl={isRtl} />
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <CardContent className="p-0 overflow-x-auto hidden md:block">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم المحاضرة" : "Lecture"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "وقت الحضور" : "Attended at"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lectureRows.map((a) => {
                        const sch = a._schedule;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {studentName(a.user_id, a._demo)}
                              {a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}
                            </TableCell>
                            <TableCell>{courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")}</TableCell>
                            <TableCell>{sch ? (isRtl ? sch.title_ar : sch.title_en) : "—"}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{new Date(a.viewed_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Streams */}
            <TabsContent value="streams">
              <Card className="shadow-sm overflow-hidden">
                <TableToolbar section="streams" count={streamRows.length} />

                <div className="md:hidden divide-y divide-border">
                  {streamRows.map((a) => {
                    const st = a._stream;
                    return (
                      <div key={a.id} className={`p-4 space-y-2.5 ${a._demo ? "bg-amber-500/5" : ""}`}>
                        <VRow label={isRtl ? "اسم الطالب" : "Student"} value={
                          <>{studentName(a.user_id, a._demo)}{a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}</>
                        } isRtl={isRtl} bold />
                        <VRow label={isRtl ? "المادة" : "Course"} value={courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")} isRtl={isRtl} />
                        <VRow label={isRtl ? "اسم البث المباشر" : "Live Stream"} value={st ? (isRtl ? st.title_ar : st.title_en) : "—"} isRtl={isRtl} />
                        <VRow label={isRtl ? "وقت الانضمام" : "Joined"} value={new Date(a.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US")} isRtl={isRtl} />
                        <VRow label={isRtl ? "المدة" : "Duration"} value={`${a.duration_minutes || 0} ${isRtl ? "د" : "min"}`} isRtl={isRtl} />
                      </div>
                    );
                  })}
                </div>

                <CardContent className="p-0 overflow-x-auto hidden md:block">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم البث المباشر" : "Live Stream"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "وقت الانضمام" : "Joined"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المدة" : "Duration"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {streamRows.map((a) => {
                        const st = a._stream;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {studentName(a.user_id, a._demo)}
                              {a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}
                            </TableCell>
                            <TableCell>{st ? (isRtl ? st.title_ar : st.title_en) : "—"}</TableCell>
                            <TableCell>{courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{new Date(a.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                            <TableCell>{a.duration_minutes || 0} {isRtl ? "د" : "min"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tests */}
            <TabsContent value="tests">
              <Card className="shadow-sm overflow-hidden">
                <TableToolbar section="tests" count={testRows.length} />

                <div className="md:hidden divide-y divide-border">
                  {testRows.map((a) => {
                    const qz = a._quiz;
                    return (
                      <div key={a.id} className={`p-4 space-y-2.5 ${a._demo ? "bg-amber-500/5" : ""}`}>
                        <VRow label={isRtl ? "اسم الطالب" : "Student"} value={
                          <>{studentName(a.student_id, a._demo)}{a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}</>
                        } isRtl={isRtl} bold />
                        <VRow label={isRtl ? "اسم الاختبار" : "Test"} value={qz ? (isRtl ? qz.title_ar : qz.title_en) : "—"} isRtl={isRtl} />
                        <VRow label={isRtl ? "المادة" : "Course"} value={courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")} isRtl={isRtl} />
                        <VRow label={isRtl ? "الدرجة" : "Score"} value={`${a.score ?? "—"}${a.total_points ? ` / ${a.total_points}` : ""}`} isRtl={isRtl} />
                        <VRow label={isRtl ? "وقت التسليم" : "Submitted"} value={new Date(a.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")} isRtl={isRtl} />
                      </div>
                    );
                  })}
                </div>

                <CardContent className="p-0 overflow-x-auto hidden md:block">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم الاختبار" : "Test"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "الدرجة" : "Score"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "وقت التسليم" : "Submitted"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testRows.map((a) => {
                        const qz = a._quiz;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {studentName(a.student_id, a._demo)}
                              {a._demo && <span className="ms-2 text-[10px] text-amber-600 font-bold">({isRtl ? "تجريبي" : "DEMO"})</span>}
                            </TableCell>
                            <TableCell>{qz ? (isRtl ? qz.title_ar : qz.title_en) : "—"}</TableCell>
                            <TableCell>{courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")}</TableCell>
                            <TableCell>{a.score ?? "—"}{a.total_points ? ` / ${a.total_points}` : ""}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{new Date(a.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const VRow = ({ label, value, isRtl, bold }: { label: string; value: React.ReactNode; isRtl: boolean; bold?: boolean }) => (
  <div className={`flex items-start justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
    <span className="text-sm text-primary font-extrabold shrink-0 pt-0.5">{label}</span>
    <span className={`text-sm ${bold ? "font-extrabold" : "font-bold"} text-foreground text-end break-words`}>{value}</span>
  </div>
);

export default CourseAttendance;
