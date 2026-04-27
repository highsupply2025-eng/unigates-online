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

  const TableToolbar = ({ section, count }: { section: "lectures" | "streams" | "tests"; count: number }) => (
    <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30 ${isRtl ? "flex-row-reverse" : ""}`}>
      <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        {section === "lectures" && <BookOpen className="w-4 h-4 text-primary" strokeWidth={2.5} />}
        {section === "streams" && <Radio className="w-4 h-4 text-red-500" strokeWidth={2.5} />}
        {section === "tests" && <ClipboardList className="w-4 h-4 text-amber-500" strokeWidth={2.5} />}
        <span className="font-semibold text-sm">{tabLabel}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      <Button size="sm" variant="outline" onClick={() => handlePrint(section)} className="gap-1.5 h-8 no-print">
        <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="text-xs font-medium">{isRtl ? "تصدير PDF" : "Export PDF"}</span>
      </Button>
    </div>
  );

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
        <Card className="mb-6 shadow-sm">
          <CardContent className={`p-4 sm:p-6 flex items-start gap-4 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shadow-sm">
              <Users className="w-7 h-7 text-primary" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold truncate">{courseTitle || (isRtl ? "حضور المادة" : "Course Attendance")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
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
            <TabsList className="grid grid-cols-3 w-full mb-4 no-print">
              <TabsTrigger value="lectures" className="gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? "المحاضرات" : "Lectures"}</span>
                <span className="sm:hidden text-xs">{lectureRows.length}</span>
              </TabsTrigger>
              <TabsTrigger value="streams" className="gap-1.5">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? "البث" : "Streams"}</span>
                <span className="sm:hidden text-xs">{streamRows.length}</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? "الاختبارات" : "Tests"}</span>
                <span className="sm:hidden text-xs">{testRows.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* Lectures */}
            <TabsContent value="lectures">
              <Card className="shadow-sm overflow-hidden">
                <TableToolbar section="lectures" count={lectureRows.length} />
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead>{isRtl ? "اسم المحاضرة" : "Lecture"}</TableHead>
                        <TableHead>{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead>{isRtl ? "وقت الحضور" : "Attended at"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lectureRows.map((a) => {
                        const sch = a._schedule;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium">
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
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead>{isRtl ? "اسم البث المباشر" : "Live Stream"}</TableHead>
                        <TableHead>{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead>{isRtl ? "وقت الانضمام" : "Joined"}</TableHead>
                        <TableHead>{isRtl ? "المدة" : "Duration"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {streamRows.map((a) => {
                        const st = a._stream;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium">
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
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRtl ? "اسم الطالب" : "Student"}</TableHead>
                        <TableHead>{isRtl ? "اسم الاختبار" : "Test"}</TableHead>
                        <TableHead>{isRtl ? "المادة" : "Course"}</TableHead>
                        <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                        <TableHead>{isRtl ? "وقت التسليم" : "Submitted"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testRows.map((a) => {
                        const qz = a._quiz;
                        return (
                          <TableRow key={a.id} className={a._demo ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-medium">
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

export default CourseAttendance;
