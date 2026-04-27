import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Download, BookOpen, Radio, ClipboardList, Users } from "lucide-react";
import { useSmartBack } from "@/hooks/use-smart-back";

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

  const handlePrint = (section: "lectures" | "streams" | "tests") => {
    setActiveTab(section);
    setTimeout(() => window.print(), 100);
  };

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
        <Button size="sm" variant="outline" onClick={() => handlePrint(section)} className="gap-1.5 h-9 px-3 shrink-0 no-print font-semibold">
          <Download className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-xs sm:text-sm">{isRtl ? "تصدير PDF" : "Export PDF"}</span>
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
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            {isRtl ? "رجوع" : "Back"}
          </Button>
          <h1 className="text-base sm:text-xl font-bold truncate flex-1 text-center" dir={dir}>
            {isRtl ? "سجل الحضور" : "Attendance Log"}
          </h1>
          <div className="w-[80px] shrink-0" />
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {/* Course title + read-only notice */}
        <Card className="mb-6 shadow-sm border-2 border-primary/10">
          <CardContent className={`p-4 sm:p-6 flex items-start gap-3 sm:gap-5 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 ring-2 ring-primary/40 flex items-center justify-center shadow-md">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold truncate">{courseTitle || (isRtl ? "حضور المادة" : "Course Attendance")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                {isRtl
                  ? "يتم احتساب الحضور تلقائياً لحظياً — للعرض فقط، لا يمكن التعديل"
                  : "Attendance auto-calculated in real time — read-only, cannot be edited"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Print header */}
        <div className="print-only mb-6">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{courseTitle}</h1>
          <p style={{ fontSize: 14 }}>{tabLabel} — {new Date().toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{isRtl ? "جارٍ التحميل..." : "Loading..."}</div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4 no-print h-auto p-1.5 gap-1">
              <TabsTrigger value="lectures" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-semibold">
                <BookOpen className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[11px] sm:text-sm">{isRtl ? "المحاضرات" : "Lectures"}</span>
                <span className="text-[10px] opacity-70 hidden sm:inline">({lectureRows.length})</span>
              </TabsTrigger>
              <TabsTrigger value="streams" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 font-semibold">
                <Radio className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[11px] sm:text-sm">{isRtl ? "البث" : "Streams"}</span>
                <span className="text-[10px] opacity-70 hidden sm:inline">({streamRows.length})</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 font-semibold">
                <ClipboardList className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-[11px] sm:text-sm">{isRtl ? "الاختبارات" : "Tests"}</span>
                <span className="text-[10px] opacity-70 hidden sm:inline">({testRows.length})</span>
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
                        <VRow label={isRtl ? "اسم المحاضرة" : "Lecture"} value={sch ? (isRtl ? sch.title_ar : sch.title_en) : "—"} isRtl={isRtl} />
                        <VRow label={isRtl ? "المادة" : "Course"} value={courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")} isRtl={isRtl} />
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
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم المحاضرة" : "Lecture"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المادة" : "Course"}</TableHead>
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
                            <TableCell>{sch ? (isRtl ? sch.title_ar : sch.title_en) : "—"}</TableCell>
                            <TableCell>{courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")}</TableCell>
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
                        <VRow label={isRtl ? "اسم البث المباشر" : "Live Stream"} value={st ? (isRtl ? st.title_ar : st.title_en) : "—"} isRtl={isRtl} />
                        <VRow label={isRtl ? "المادة" : "Course"} value={courseTitle || (isRtl ? "مادة تجريبية" : "Demo course")} isRtl={isRtl} />
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
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "اسم البث المباشر" : "Live Stream"}</TableHead>
                        <TableHead className="font-bold text-foreground whitespace-nowrap">{isRtl ? "المادة" : "Course"}</TableHead>
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
    <span className="text-xs text-muted-foreground font-medium shrink-0 pt-0.5">{label}</span>
    <span className={`text-sm ${bold ? "font-bold" : "font-medium"} text-foreground text-end break-words`}>{value}</span>
  </div>
);

export default CourseAttendance;
