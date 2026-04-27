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

  const handlePrint = () => {
    window.print();
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

      {/* Header */}
      <div className="bg-card border-b border-border no-print">
        <div className="container mx-auto px-3 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? "رجوع" : "Back"}
          </Button>
          <h1 className="text-base sm:text-xl font-bold truncate flex-1 text-center">
            {isRtl ? "سجل الحضور" : "Attendance Log"}
          </h1>
          <Button size="sm" onClick={handlePrint} className="gap-2 shadow-md">
            <Download className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">{isRtl ? "تصدير PDF" : "Export PDF"}</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {/* Course title + read-only notice */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4 sm:p-6 flex items-start gap-4">
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
                <span className="sm:hidden text-xs">{lectures.length}</span>
              </TabsTrigger>
              <TabsTrigger value="streams" className="gap-1.5">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? "البث" : "Streams"}</span>
                <span className="sm:hidden text-xs">{streams.length}</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">{isRtl ? "الاختبارات" : "Tests"}</span>
                <span className="sm:hidden text-xs">{tests.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* Lectures */}
            <TabsContent value="lectures">
              {lectures.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا يوجد حضور للمحاضرات بعد" : "No lecture attendance yet"}</div>
              ) : (
                <Card className="shadow-sm">
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
                        {lectures.map((a) => {
                          const sch = a._schedule;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{profilesMap[a.user_id] || a.user_id.slice(0, 8)}</TableCell>
                              <TableCell>{sch ? (isRtl ? sch.title_ar : sch.title_en) : "—"}</TableCell>
                              <TableCell>{courseTitle}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{new Date(a.viewed_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Streams */}
            <TabsContent value="streams">
              {streams.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا يوجد حضور للبث بعد" : "No stream attendance yet"}</div>
              ) : (
                <Card className="shadow-sm">
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
                        {streams.map((a) => {
                          const st = a._stream;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{profilesMap[a.user_id] || a.user_id.slice(0, 8)}</TableCell>
                              <TableCell>{st ? (isRtl ? st.title_ar : st.title_en) : "—"}</TableCell>
                              <TableCell>{courseTitle}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{new Date(a.joined_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                              <TableCell>{a.duration_minutes || 0} {isRtl ? "د" : "min"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tests */}
            <TabsContent value="tests">
              {tests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">{isRtl ? "لا يوجد حضور للاختبارات بعد" : "No test attendance yet"}</div>
              ) : (
                <Card className="shadow-sm">
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
                        {tests.map((a) => {
                          const qz = a._quiz;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{profilesMap[a.student_id] || a.student_id.slice(0, 8)}</TableCell>
                              <TableCell>{qz ? (isRtl ? qz.title_ar : qz.title_en) : "—"}</TableCell>
                              <TableCell>{courseTitle}</TableCell>
                              <TableCell>{a.score ?? "—"}{a.total_points ? ` / ${a.total_points}` : ""}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{new Date(a.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CourseAttendance;
