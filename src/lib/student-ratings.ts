import { supabase } from "@/integrations/supabase/client";

export type Period = "week" | "month" | "year";

export type CategoryScore = {
  key: "quizzes" | "live" | "lectures" | "assignments";
  labelAr: string;
  labelEn: string;
  pct: number | null; // 0-100
  stars: number; // 0-5
  primary: number; // primary metric (e.g. avg score % or attendance %)
  primaryLabelAr: string;
  primaryLabelEn: string;
  secondary?: number; // secondary metric (e.g. interaction)
  secondaryLabelAr?: string;
  secondaryLabelEn?: string;
  count: number;
};

export type StudentRatingsSummary = {
  period: Period;
  since: Date;
  categories: CategoryScore[];
  overallPct: number | null;
  overallStars: number;
};

const periodStart = (p: Period): Date => {
  const d = new Date();
  if (p === "week") d.setDate(d.getDate() - 7);
  else if (p === "month") d.setMonth(d.getMonth() - 1);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
};

const parseGrade = (g: string | null | undefined): number | null => {
  if (!g) return null;
  const s = String(g).trim();
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) {
    const letter: Record<string, number> = { "A+": 100, A: 95, "A-": 90, "B+": 87, B: 83, "B-": 80, "C+": 77, C: 73, "C-": 70, D: 65, F: 50 };
    return letter[s.toUpperCase()] ?? null;
  }
  let n = parseFloat(m[0]);
  if (s.includes("/")) {
    const parts = s.split("/").map((p) => parseFloat(p));
    if (parts.length === 2 && parts[1] > 0) n = (parts[0] / parts[1]) * 100;
  } else if (n <= 5) n = (n / 5) * 100;
  else if (n <= 10) n = (n / 10) * 100;
  else if (n <= 20) n = (n / 20) * 100;
  return Math.max(0, Math.min(100, n));
};

const pctToStars = (pct: number) => Math.max(0, Math.min(5, Math.round((pct / 100) * 5 * 2) / 2));

export async function computeStudentRatings(studentId: string, period: Period): Promise<StudentRatingsSummary> {
  const since = periodStart(period);
  const sinceIso = since.toISOString();

  // Enrolled courses
  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("course_id")
    .eq("user_id", studentId)
    .eq("status", "active");
  const courseIds = Array.from(new Set((subs || []).map((s: any) => s.course_id))).filter(Boolean);

  // 1) Quizzes
  let quizPct: number | null = null;
  let quizCount = 0;
  if (courseIds.length) {
    const { data: quizzes } = await supabase.from("quizzes").select("id, course_id").in("course_id", courseIds);
    const quizIds = (quizzes || []).map((q: any) => q.id);
    if (quizIds.length) {
      const { data: qs } = await supabase
        .from("quiz_submissions")
        .select("score, total_points, submitted_at")
        .eq("student_id", studentId)
        .in("quiz_id", quizIds)
        .gte("submitted_at", sinceIso);
      const pcts = (qs || []).filter((r: any) => r.total_points > 0).map((r: any) => (Number(r.score) / Number(r.total_points)) * 100);
      quizCount = pcts.length;
      if (pcts.length) quizPct = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    }
  }

  // 2) Assignments
  let assignPct: number | null = null;
  let assignCount = 0;
  if (courseIds.length) {
    const { data: assignments } = await supabase.from("assignments").select("id, course_id").in("course_id", courseIds);
    const aIds = (assignments || []).map((a: any) => a.id);
    if (aIds.length) {
      const { data: asubs } = await supabase
        .from("assignment_submissions")
        .select("grade, submitted_at")
        .eq("student_id", studentId)
        .in("assignment_id", aIds)
        .gte("submitted_at", sinceIso);
      const vals = (asubs || []).map((r: any) => parseGrade(r.grade)).filter((v): v is number => v !== null);
      assignCount = vals.length;
      if (vals.length) assignPct = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  // 3) Live streams (attendance + interaction)
  let liveAttendancePct = 0;
  let liveInteractionPct = 0;
  let livePct: number | null = null;
  let liveCount = 0;
  if (courseIds.length) {
    const { data: streams } = await supabase
      .from("live_streams")
      .select("id, scheduled_at, created_at")
      .in("course_id", courseIds)
      .gte("created_at", sinceIso);
    const streamIds = (streams || []).map((s: any) => s.id);
    if (streamIds.length) {
      const { data: att } = await supabase
        .from("stream_attendance")
        .select("stream_id, duration_minutes")
        .eq("user_id", studentId)
        .in("stream_id", streamIds);
      const attended = (att || []).length;
      liveAttendancePct = Math.min(100, (attended / streamIds.length) * 100);

      const { data: rat } = await supabase
        .from("live_stream_ratings")
        .select("rating")
        .eq("user_id", studentId)
        .in("stream_id", streamIds);
      const interactionCount = (rat || []).length;
      // Interaction = ratio of streams the student engaged with (rated) — proxy for interactivity
      liveInteractionPct = Math.min(100, (interactionCount / streamIds.length) * 100);

      liveCount = streamIds.length;
      livePct = liveAttendancePct * 0.6 + liveInteractionPct * 0.4;
    }
  }

  // 4) Lectures (attendance + interaction). Use lecture_schedules + schedule_views + lecture_ratings.
  let lecAttendancePct = 0;
  let lecInteractionPct = 0;
  let lecPct: number | null = null;
  let lecCount = 0;
  if (courseIds.length) {
    const { data: schedules } = await supabase
      .from("lecture_schedules")
      .select("id, scheduled_date, course_id")
      .in("course_id", courseIds)
      .gte("scheduled_date", since.toISOString().slice(0, 10));
    const schedIds = (schedules || []).map((s: any) => s.id);
    if (schedIds.length) {
      const { data: views } = await supabase
        .from("schedule_views")
        .select("schedule_id")
        .eq("user_id", studentId)
        .in("schedule_id", schedIds);
      const viewed = new Set((views || []).map((v: any) => v.schedule_id)).size;
      lecAttendancePct = Math.min(100, (viewed / schedIds.length) * 100);

      const { data: lrat } = await supabase
        .from("lecture_ratings")
        .select("lecture_id")
        .eq("user_id", studentId)
        .in("lecture_id", schedIds);
      const rated = new Set((lrat || []).map((v: any) => v.lecture_id)).size;
      lecInteractionPct = Math.min(100, (rated / schedIds.length) * 100);

      lecCount = schedIds.length;
      lecPct = lecAttendancePct * 0.6 + lecInteractionPct * 0.4;
    }
  }

  const categories: CategoryScore[] = [
    {
      key: "quizzes",
      labelAr: "الاختبارات",
      labelEn: "Quizzes",
      pct: quizPct,
      stars: quizPct !== null ? pctToStars(quizPct) : 0,
      primary: quizPct ?? 0,
      primaryLabelAr: "متوسط النتيجة",
      primaryLabelEn: "Avg score",
      count: quizCount,
    },
    {
      key: "live",
      labelAr: "البث المباشر",
      labelEn: "Live Streams",
      pct: livePct,
      stars: livePct !== null ? pctToStars(livePct) : 0,
      primary: liveAttendancePct,
      primaryLabelAr: "الحضور",
      primaryLabelEn: "Attendance",
      secondary: liveInteractionPct,
      secondaryLabelAr: "التفاعل",
      secondaryLabelEn: "Interaction",
      count: liveCount,
    },
    {
      key: "lectures",
      labelAr: "المحاضرات",
      labelEn: "Lectures",
      pct: lecPct,
      stars: lecPct !== null ? pctToStars(lecPct) : 0,
      primary: lecAttendancePct,
      primaryLabelAr: "الحضور",
      primaryLabelEn: "Attendance",
      secondary: lecInteractionPct,
      secondaryLabelAr: "التفاعل",
      secondaryLabelEn: "Interaction",
      count: lecCount,
    },
    {
      key: "assignments",
      labelAr: "التكليفات",
      labelEn: "Assignments",
      pct: assignPct,
      stars: assignPct !== null ? pctToStars(assignPct) : 0,
      primary: assignPct ?? 0,
      primaryLabelAr: "متوسط الدرجة",
      primaryLabelEn: "Avg grade",
      count: assignCount,
    },
  ];

  const rated = categories.filter((c) => c.pct !== null);
  const overallPct = rated.length ? rated.reduce((s, c) => s + (c.pct || 0), 0) / rated.length : null;
  const overallStars = overallPct !== null ? pctToStars(overallPct) : 0;

  return { period, since, categories, overallPct, overallStars };
}

export async function exportRatingsPdf(opts: {
  summary: StudentRatingsSummary;
  studentName: string;
  isRtl: boolean;
}) {
  const { summary, studentName, isRtl } = opts;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFontSize(18);
  doc.text(isRtl ? "تقرير تقييمات الطالب" : "Student Ratings Report", w / 2, y, { align: "center" });
  y += 28;

  doc.setFontSize(12);
  doc.text(`${isRtl ? "الطالب" : "Student"}: ${studentName}`, 50, y); y += 18;
  const periodLabel = isRtl
    ? (summary.period === "week" ? "أسبوعي" : summary.period === "month" ? "شهري" : "سنوي")
    : (summary.period === "week" ? "Weekly" : summary.period === "month" ? "Monthly" : "Yearly");
  doc.text(`${isRtl ? "الفترة" : "Period"}: ${periodLabel}`, 50, y); y += 18;
  doc.text(`${isRtl ? "من" : "Since"}: ${summary.since.toISOString().slice(0, 10)}`, 50, y); y += 18;
  doc.text(`${isRtl ? "التقييم العام" : "Overall"}: ${summary.overallPct !== null ? summary.overallPct.toFixed(1) + "%" : "N/A"} (${summary.overallStars}/5)`, 50, y);
  y += 26;

  doc.setFontSize(13);
  doc.text(isRtl ? "التفاصيل" : "Details", 50, y);
  y += 18;
  doc.setFontSize(11);

  summary.categories.forEach((c) => {
    const label = isRtl ? c.labelAr : c.labelEn;
    const pct = c.pct !== null ? c.pct.toFixed(1) + "%" : "N/A";
    doc.text(`• ${label}: ${pct} — ${c.stars}/5 (${c.count})`, 60, y);
    y += 16;
    if (c.secondary !== undefined) {
      doc.setFontSize(9);
      doc.text(
        `    ${isRtl ? c.primaryLabelAr : c.primaryLabelEn}: ${c.primary.toFixed(0)}%   ${isRtl ? c.secondaryLabelAr : c.secondaryLabelEn}: ${c.secondary.toFixed(0)}%`,
        60,
        y
      );
      y += 14;
      doc.setFontSize(11);
    }
    y += 4;
    if (y > 760) { doc.addPage(); y = 50; }
  });

  doc.save(`ratings-${summary.period}-${Date.now()}.pdf`);
}
