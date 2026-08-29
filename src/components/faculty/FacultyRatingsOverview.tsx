import React, { useState, useEffect, useMemo } from "react";
import {
  Star, Users, Award, TrendingUp, Search, Filter, Download,
  Sparkles, Calendar, BookOpen, Radio, ClipboardList, ShieldCheck,
  CheckCircle, ChevronRight, User, ArrowUpDown, Eye, MessageSquare,
  Building, RefreshCw, Layers, CheckCircle2, AlertCircle, Clock,
  FileText, ArrowRight, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import RatingsBreakdown from "@/components/RatingsBreakdown";

export interface FacultyMemberRating {
  id: string;
  fullName: string;
  role: string;
  subRole?: string;
  departmentId?: string;
  departmentNameAr?: string;
  departmentNameEn?: string;
  email?: string;
  avatarUrl?: string;
  monthlyRating: number; // 0-5
  monthlyCount: number;
  annualRating: number; // 0-5
  annualCount: number;
  lecturesAvg: number;
  lecturesCount: number;
  streamsAvg: number;
  streamsCount: number;
  quizzesAvg: number;
  quizzesCount: number;
  schedulesAvg: number;
  schedulesCount: number;
  assignmentsAvg: number;
  assignmentsCount: number;
}

interface FacultyRatingsOverviewProps {
  userId: string;
  userRole: string;
  institutionType: "college" | "institute";
  departments: any[];
  onRefresh?: () => void;
}

const Stars = ({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) => {
  const sz = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} ${n <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
};

export const FacultyRatingsOverview: React.FC<FacultyRatingsOverviewProps> = ({
  userId,
  userRole,
  institutionType,
  departments,
  onRefresh,
}) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [facultyMembers, setFacultyMembers] = useState<FacultyMemberRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "streams" | "lectures" | "schedules" | "quizzes" | "assignments">("all");
  const [sortBy, setSortBy] = useState<"monthly" | "annual" | "count" | "streams" | "lectures" | "schedules" | "name">("monthly");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  // Inspection dialog
  const [inspectedFaculty, setInspectedFaculty] = useState<FacultyMemberRating | null>(null);

  // Raw overall category metrics
  const [categoryStats, setCategoryStats] = useState({
    streams: { count: 0, avg: 0, positiveRate: 0 },
    lectures: { count: 0, avg: 0, positiveRate: 0 },
    schedules: { count: 0, avg: 0, positiveRate: 0 },
    quizzes: { count: 0, avg: 0, positiveRate: 0 },
    assignments: { count: 0, avg: 0, positiveRate: 0 },
  });

  const isInstitute = institutionType === "institute";

  const getRoleLabel = (role: string, subRole?: string) => {
    const raw = (subRole || role || "").toLowerCase();
    if (raw.includes("dean") && !raw.includes("vice")) return { ar: isInstitute ? "مدير المعهد" : "عميد الكلية", en: isInstitute ? "Director" : "Dean" };
    if (raw.includes("vice_dean") || raw.includes("vicedean")) {
      if (raw.includes("postgrad")) return { ar: isInstitute ? "وكيل المعهد للدراسات العليا" : "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate" };
      if (raw.includes("student")) return { ar: isInstitute ? "وكيل المعهد لشئون الطلاب" : "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Students" };
      if (raw.includes("community") || raw.includes("environment")) return { ar: isInstitute ? "وكيل المعهد لشئون البيئة" : "وكيل الكلية لشئون البيئة", en: "Vice Dean - Community" };
      return { ar: isInstitute ? "وكيل المعهد" : "وكيل الكلية", en: isInstitute ? "Vice Director" : "Vice Dean" };
    }
    if (raw.includes("head") || raw.includes("department_head")) return { ar: isInstitute ? "رئيس الشعبة / القسم" : "رئيس قسم", en: "Head of Department" };
    if (raw.includes("prof_dr") || raw.includes("professor")) return { ar: "أستاذ دكتور (أ.د)", en: "Professor" };
    if (raw.includes("dr") || raw.includes("doctor")) return { ar: "دكتور (د.)", en: "Doctor / Lecturer" };
    if (raw.includes("assistant_lecturer") || raw.includes("teaching_assistant")) return { ar: "مدرس مساعد", en: "Assistant Lecturer" };
    if (raw.includes("teacher") || raw.includes("lecturer")) return { ar: "مدرس / محاضر", en: "Lecturer" };
    if (raw.includes("demonstrator") || raw.includes("ta")) return { ar: "معيد", en: "Demonstrator" };
    return { ar: isInstitute ? "عضو هيئة تدريس بالمعهد" : "عضو هيئة تدريس", en: "Faculty Member" };
  };

  const fetchFacultyRatings = async () => {
    setLoading(true);
    try {
      // 1) Fetch all faculty members (exclude plain students)
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, role, sub_role, department_id, email, avatar_url")
        .neq("role", "student")
        .order("full_name", { ascending: true });

      if (pErr) throw pErr;

      // 2) Dates for monthly (past 30 days) and annual (past 365 days)
      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoIso = monthAgo.toISOString();

      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const yearAgoIso = yearAgo.toISOString();

      // 3) Fetch courses & streams to map creator_id
      const [{ data: courses }, { data: streamsData }] = await Promise.all([
        supabase.from("courses").select("id, creator_id, department_id"),
        supabase.from("live_streams").select("id, creator_id, department_id"),
      ]);

      const courseMap = new Map<string, string>(); // courseId -> creatorId
      (courses || []).forEach((c) => courseMap.set(c.id, c.creator_id));

      const streamMap = new Map<string, string>(); // streamId -> creatorId
      (streamsData || []).forEach((s) => streamMap.set(s.id, s.creator_id));

      // 4) Fetch all ratings across all 5 key academic areas + direct lecturer_ratings
      const [lrRes, qrRes, srRes, strRes, arRes, lecturerRatingsRes] = await Promise.all([
        supabase.from("lecture_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("quiz_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("schedule_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("live_stream_ratings").select("id, rating, created_at, stream_id").gte("created_at", yearAgoIso),
        supabase.from("assignment_ratings" as any).select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("lecturer_ratings").select("id, rating, created_at, lecturer_id, course_id").gte("created_at", yearAgoIso),
      ]);

      // Calculate global category stats
      const calcStats = (items: any[]) => {
        const count = items.length;
        if (count === 0) return { count: 0, avg: 0, positiveRate: 0 };
        const total = items.reduce((acc, it) => acc + (Number(it.rating) || 0), 0);
        const positive = items.filter((it) => (Number(it.rating) || 0) >= 4).length;
        return {
          count,
          avg: Math.round((total / count) * 10) / 10,
          positiveRate: Math.round((positive / count) * 100),
        };
      };

      setCategoryStats({
        streams: calcStats(strRes.data || []),
        lectures: calcStats(lrRes.data || []),
        schedules: calcStats(srRes.data || []),
        quizzes: calcStats(qrRes.data || []),
        assignments: calcStats(arRes.data || []),
      });

      // Map ratings to individual faculty members
      const facultyRatingBuckets = new Map<
        string,
        {
          monthlyScores: number[];
          annualScores: number[];
          lectures: number[];
          streams: number[];
          quizzes: number[];
          schedules: number[];
          assignments: number[];
        }
      >();

      const addRating = (creatorId: string | undefined, rating: number, createdAt: string, type: "lecture" | "stream" | "quiz" | "schedule" | "assignment" | "general") => {
        if (!creatorId) return;
        if (!facultyRatingBuckets.has(creatorId)) {
          facultyRatingBuckets.set(creatorId, {
            monthlyScores: [],
            annualScores: [],
            lectures: [],
            streams: [],
            quizzes: [],
            schedules: [],
            assignments: [],
          });
        }
        const b = facultyRatingBuckets.get(creatorId)!;
        b.annualScores.push(rating);
        if (new Date(createdAt) >= monthAgo) {
          b.monthlyScores.push(rating);
        }
        if (type === "lecture") b.lectures.push(rating);
        if (type === "stream") b.streams.push(rating);
        if (type === "quiz") b.quizzes.push(rating);
        if (type === "schedule") b.schedules.push(rating);
        if (type === "assignment") b.assignments.push(rating);
      };

      (lrRes.data || []).forEach((r: any) => addRating(courseMap.get(r.course_id), r.rating, r.created_at, "lecture"));
      (qrRes.data || []).forEach((r: any) => addRating(courseMap.get(r.course_id), r.rating, r.created_at, "quiz"));
      (srRes.data || []).forEach((r: any) => addRating(courseMap.get(r.course_id), r.rating, r.created_at, "schedule"));
      (strRes.data || []).forEach((r: any) => addRating(streamMap.get(r.stream_id), r.rating, r.created_at, "stream"));
      (arRes.data || []).forEach((r: any) => addRating(courseMap.get(r.course_id), r.rating, r.created_at, "assignment"));
      (lecturerRatingsRes.data || []).forEach((r: any) => {
        const lid = r.lecturer_id || courseMap.get(r.course_id);
        if (lid) addRating(lid, r.rating, r.created_at, "general");
      });

      const avg = (nums: number[]) => (nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

      const mappedFaculty: FacultyMemberRating[] = (profiles || []).map((p: any) => {
        const b = facultyRatingBuckets.get(p.id) || {
          monthlyScores: [],
          annualScores: [],
          lectures: [],
          streams: [],
          quizzes: [],
          schedules: [],
          assignments: [],
        };

        const dept = departments.find((d) => d.id === p.department_id);

        return {
          id: p.id,
          fullName: p.full_name || (isRtl ? "عضو هيئة تدريس" : "Faculty Member"),
          role: p.role,
          subRole: p.sub_role,
          departmentId: p.department_id,
          departmentNameAr: dept?.name_ar || (isRtl ? "القسم العام" : "General Department"),
          departmentNameEn: dept?.name_en || "General Department",
          email: p.email,
          avatarUrl: p.avatar_url,
          monthlyRating: Math.round(avg(b.monthlyScores) * 10) / 10,
          monthlyCount: b.monthlyScores.length,
          annualRating: Math.round(avg(b.annualScores) * 10) / 10,
          annualCount: b.annualScores.length,
          lecturesAvg: Math.round(avg(b.lectures) * 10) / 10,
          lecturesCount: b.lectures.length,
          streamsAvg: Math.round(avg(b.streams) * 10) / 10,
          streamsCount: b.streams.length,
          quizzesAvg: Math.round(avg(b.quizzes) * 10) / 10,
          quizzesCount: b.quizzes.length,
          schedulesAvg: Math.round(avg(b.schedules) * 10) / 10,
          schedulesCount: b.schedules.length,
          assignmentsAvg: Math.round(avg(b.assignments) * 10) / 10,
          assignmentsCount: b.assignments.length,
        };
      });

      setFacultyMembers(mappedFaculty);
    } catch (err) {
      console.error("Error loading faculty ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyRatings();
  }, [departments]);

  // Filter & Sort
  const filteredFaculty = useMemo(() => {
    return facultyMembers
      .filter((f) => {
        const matchesQuery =
          searchQuery.trim() === "" ||
          f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.email && f.email.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        if (selectedDepartment !== "all" && f.departmentId !== selectedDepartment) {
          return false;
        }

        if (selectedRole !== "all") {
          const r = (f.subRole || f.role || "").toLowerCase();
          if (selectedRole === "head" && !r.includes("head")) return false;
          if (selectedRole === "prof" && !r.includes("prof")) return false;
          if (selectedRole === "dr" && !r.includes("dr") && !r.includes("doctor")) return false;
          if (selectedRole === "assistant" && !r.includes("assistant") && !r.includes("teaching")) return false;
        }

        if (categoryFilter === "streams" && f.streamsCount === 0) return false;
        if (categoryFilter === "lectures" && f.lecturesCount === 0) return false;
        if (categoryFilter === "schedules" && f.schedulesCount === 0) return false;
        if (categoryFilter === "quizzes" && f.quizzesCount === 0) return false;
        if (categoryFilter === "assignments" && f.assignmentsCount === 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "monthly") return b.monthlyRating - a.monthlyRating || b.monthlyCount - a.monthlyCount;
        if (sortBy === "annual") return b.annualRating - a.annualRating || b.annualCount - a.annualCount;
        if (sortBy === "count") return b.annualCount - a.annualCount;
        if (sortBy === "streams") return b.streamsAvg - a.streamsAvg;
        if (sortBy === "lectures") return b.lecturesAvg - a.lecturesAvg;
        if (sortBy === "schedules") return b.schedulesAvg - a.schedulesAvg;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [facultyMembers, searchQuery, selectedDepartment, selectedRole, categoryFilter, sortBy]);

  const overallAvgAnnual = facultyMembers.filter(f => f.annualCount > 0).length > 0
    ? (facultyMembers.filter(f => f.annualCount > 0).reduce((a, b) => a + b.annualRating, 0) / facultyMembers.filter(f => f.annualCount > 0).length).toFixed(1)
    : "0.0";
  const totalReviewsCount = facultyMembers.reduce((a, b) => a + b.annualCount, 0);

  // PDF Export
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title = isRtl ? "كشف التقييم الشامل لأداء أعضاء هيئة التدريس (البث، المحاضرات، الجداول، الاختبارات، التكليفات)" : "Comprehensive Faculty Performance & Ratings Report";

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: ${isRtl ? "rtl" : "ltr"}; }
            h1 { font-size: 18px; margin-bottom: 4px; color: #1e1b4b; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${isRtl ? "right" : "left"}; }
            th { background: #f1f5f9; font-weight: bold; }
            .score { font-weight: bold; color: #d97706; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <span>${isRtl ? "إجمالي أعضاء هيئة التدريس:" : "Total Faculty:"} ${facultyMembers.length}</span> | 
            <span>${isRtl ? "المتوسط الشهري العام:" : "Overall Monthly Avg:"} ⭐ ${overallAvgMonthly} / 5</span> | 
            <span>${isRtl ? "المتوسط السنوي العام:" : "Overall Annual Avg:"} ⭐ ${overallAvgAnnual} / 5</span> | 
            <span>${isRtl ? "إجمالي التقييمات:" : "Total Reviews:"} ${totalReviewsCount}</span> | 
            <span>${isRtl ? "تاريخ التصدير:" : "Date:"} ${new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isRtl ? "عضو هيئة التدريس" : "Faculty"}</th>
                <th>${isRtl ? "الرتبة" : "Title"}</th>
                <th>${isRtl ? "القسم" : "Dept"}</th>
                <th>${isRtl ? "البث المباشر" : "Streams"}</th>
                <th>${isRtl ? "المحاضرات" : "Lectures"}</th>
                <th>${isRtl ? "الجداول" : "Schedules"}</th>
                <th>${isRtl ? "الاختبارات" : "Quizzes"}</th>
                <th>${isRtl ? "التكليفات" : "Assignments"}</th>
                <th>${isRtl ? "الشهري (30 يوم)" : "Monthly (30d)"}</th>
                <th>${isRtl ? "السنوي التراكمي" : "Annual (365d)"}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFaculty
                .map((f, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${f.fullName}</strong></td>
                    <td><span class="badge">${getRoleLabel(f.role, f.subRole).ar}</span></td>
                    <td>${isRtl ? f.departmentNameAr : f.departmentNameEn}</td>
                    <td class="score">⭐ ${f.streamsAvg > 0 ? f.streamsAvg : "-"}</td>
                    <td class="score">⭐ ${f.lecturesAvg > 0 ? f.lecturesAvg : "-"}</td>
                    <td class="score">⭐ ${f.schedulesAvg > 0 ? f.schedulesAvg : "-"}</td>
                    <td class="score">⭐ ${f.quizzesAvg > 0 ? f.quizzesAvg : "-"}</td>
                    <td class="score">⭐ ${f.assignmentsAvg > 0 ? f.assignmentsAvg : "-"}</td>
                    <td class="score">⭐ ${f.monthlyRating > 0 ? `${f.monthlyRating} (${f.monthlyCount})` : "-"}</td>
                    <td class="score">⭐ ${f.annualRating > 0 ? `${f.annualRating} (${f.annualCount})` : "-"}</td>
                  </tr>
                `)
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-md">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "تقييمات الطلاب الشاملة لأداء المحاضرين" : "Faculty Performance & Student Ratings"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `متابعة تقييمات الطلاب التفصيلية لكل من: البث المباشر 🔴، المحاضرات 📚، الجداول 📅، الاختبارات 📝، والتكليفات 📋.`
                : "Student ratings breakdown across Live Streams, Lectures, Schedules, Quizzes, and Assignments."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="rounded-2xl font-bold h-10 px-4 gap-2 border-2"
          >
            <Download className="w-4 h-4" />
            <span>{isRtl ? "تصدير كشف PDF" : "Export PDF"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchFacultyRatings();
              if (onRefresh) onRefresh();
            }}
            className="rounded-2xl font-bold gap-1.5 h-10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 5 Key Academic Pillars Highlight Cards (البث، المحاضرات، الجداول، الاختبارات، التكليفات) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Pillar 1: Live Streams */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "streams" ? "all" : "streams")}
          className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between shadow-md ${
            categoryFilter === "streams"
              ? "bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-300/40 shadow-rose-600/30 scale-102"
              : "bg-card hover:bg-muted/40 border-rose-500/30 text-foreground hover:border-rose-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
                  categoryFilter === "streams" ? "bg-white/20 text-white" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                }`}
              >
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <Badge
                className={
                  categoryFilter === "streams"
                    ? "bg-white/20 text-white text-[10px] font-black"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px] font-black"
                }
              >
                {categoryStats.streams.positiveRate}% {isRtl ? "رضا" : "positive"}
              </Badge>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className="text-[11px] font-bold opacity-80 block">{isRtl ? "محور البث المباشر" : "Live Streams"}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black">⭐ {categoryStats.streams.avg > 0 ? categoryStats.streams.avg : "-"}</span>
                <span className="text-[10px] font-bold opacity-75">/ 5</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-bold flex items-center justify-between">
            <span>{categoryStats.streams.count} {isRtl ? "تقييم للبث" : "ratings"}</span>
            <span>{categoryFilter === "streams" ? "✓" : "➔"}</span>
          </div>
        </div>

        {/* Pillar 2: Lectures */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "lectures" ? "all" : "lectures")}
          className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between shadow-md ${
            categoryFilter === "lectures"
              ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-300/40 shadow-indigo-600/30 scale-102"
              : "bg-card hover:bg-muted/40 border-indigo-500/30 text-foreground hover:border-indigo-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
                  categoryFilter === "lectures" ? "bg-white/20 text-white" : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <Badge
                className={
                  categoryFilter === "lectures"
                    ? "bg-white/20 text-white text-[10px] font-black"
                    : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-black"
                }
              >
                {categoryStats.lectures.positiveRate}% {isRtl ? "رضا" : "positive"}
              </Badge>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className="text-[11px] font-bold opacity-80 block">{isRtl ? "محور المحاضرات" : "Lectures"}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black">⭐ {categoryStats.lectures.avg > 0 ? categoryStats.lectures.avg : "-"}</span>
                <span className="text-[10px] font-bold opacity-75">/ 5</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-bold flex items-center justify-between">
            <span>{categoryStats.lectures.count} {isRtl ? "تقييم للمحاضرة" : "ratings"}</span>
            <span>{categoryFilter === "lectures" ? "✓" : "➔"}</span>
          </div>
        </div>

        {/* Pillar 3: Schedules */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "schedules" ? "all" : "schedules")}
          className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between shadow-md ${
            categoryFilter === "schedules"
              ? "bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-teal-300/40 shadow-teal-600/30 scale-102"
              : "bg-card hover:bg-muted/40 border-teal-500/30 text-foreground hover:border-teal-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
                  categoryFilter === "schedules" ? "bg-white/20 text-white" : "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <Badge
                className={
                  categoryFilter === "schedules"
                    ? "bg-white/20 text-white text-[10px] font-black"
                    : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 text-[10px] font-black"
                }
              >
                {categoryStats.schedules.positiveRate}% {isRtl ? "رضا" : "positive"}
              </Badge>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className="text-[11px] font-bold opacity-80 block">{isRtl ? "محور الجداول والمواعيد" : "Schedules"}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black">⭐ {categoryStats.schedules.avg > 0 ? categoryStats.schedules.avg : "-"}</span>
                <span className="text-[10px] font-bold opacity-75">/ 5</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-bold flex items-center justify-between">
            <span>{categoryStats.schedules.count} {isRtl ? "تقييم للجدول" : "ratings"}</span>
            <span>{categoryFilter === "schedules" ? "✓" : "➔"}</span>
          </div>
        </div>

        {/* Pillar 4: Quizzes */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "quizzes" ? "all" : "quizzes")}
          className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between shadow-md ${
            categoryFilter === "quizzes"
              ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-300/40 shadow-amber-600/30 scale-102"
              : "bg-card hover:bg-muted/40 border-amber-500/30 text-foreground hover:border-amber-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
                  categoryFilter === "quizzes" ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
              </div>
              <Badge
                className={
                  categoryFilter === "quizzes"
                    ? "bg-white/20 text-white text-[10px] font-black"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-black"
                }
              >
                {categoryStats.quizzes.positiveRate}% {isRtl ? "رضا" : "positive"}
              </Badge>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className="text-[11px] font-bold opacity-80 block">{isRtl ? "محور الاختبارات" : "Quizzes"}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black">⭐ {categoryStats.quizzes.avg > 0 ? categoryStats.quizzes.avg : "-"}</span>
                <span className="text-[10px] font-bold opacity-75">/ 5</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-bold flex items-center justify-between">
            <span>{categoryStats.quizzes.count} {isRtl ? "تقييم للاختبار" : "ratings"}</span>
            <span>{categoryFilter === "quizzes" ? "✓" : "➔"}</span>
          </div>
        </div>

        {/* Pillar 5: Assignments */}
        <div
          onClick={() => setCategoryFilter(categoryFilter === "assignments" ? "all" : "assignments")}
          className={`group relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border-2 flex flex-col justify-between shadow-md ${
            categoryFilter === "assignments"
              ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-300/40 shadow-purple-600/30 scale-102"
              : "bg-card hover:bg-muted/40 border-purple-500/30 text-foreground hover:border-purple-500/60"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
                  categoryFilter === "assignments" ? "bg-white/20 text-white" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <Badge
                className={
                  categoryFilter === "assignments"
                    ? "bg-white/20 text-white text-[10px] font-black"
                    : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 text-[10px] font-black"
                }
              >
                {categoryStats.assignments.positiveRate}% {isRtl ? "رضا" : "positive"}
              </Badge>
            </div>

            <div className="mt-3 space-y-0.5">
              <span className="text-[11px] font-bold opacity-80 block">{isRtl ? "محور التكليفات" : "Assignments"}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black">⭐ {categoryStats.assignments.avg > 0 ? categoryStats.assignments.avg : "-"}</span>
                <span className="text-[10px] font-bold opacity-75">/ 5</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-current/15 text-[10px] font-bold flex items-center justify-between">
            <span>{categoryStats.assignments.count} {isRtl ? "تقييم للتكليف" : "ratings"}</span>
            <span>{categoryFilter === "assignments" ? "✓" : "➔"}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Ribbon & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className={`w-4 h-4 absolute top-3.5 ${isRtl ? "right-3.5" : "left-3.5"} text-muted-foreground`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "بحث باسم عضو هيئة التدريس..." : "Search faculty name..."}
              className={`h-11 rounded-2xl font-bold border-2 bg-background ${isRtl ? "pr-10" : "pl-10"}`}
            />
          </div>

          {/* Department Filter */}
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-full sm:w-44 rounded-2xl font-bold h-11 border-2 bg-background text-xs">
              <SelectValue placeholder={isRtl ? "جميع الأقسام" : "All Departments"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-bold text-xs">{isRtl ? "جميع الأقسام" : "All Departments"}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id} className="font-bold text-xs">
                  {isRtl ? d.name_ar : d.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Role Filter */}
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-44 rounded-2xl font-bold h-11 border-2 bg-background text-xs">
              <SelectValue placeholder={isRtl ? "جميع الرتب الأكاديمية" : "All Titles"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-bold text-xs">{isRtl ? "جميع الرتب" : "All Titles"}</SelectItem>
              <SelectItem value="head" className="font-bold text-xs">{isRtl ? "رؤساء الأقسام" : "Heads of Dept"}</SelectItem>
              <SelectItem value="prof" className="font-bold text-xs">{isRtl ? "أساتذة دكاترة (أ.د)" : "Professors"}</SelectItem>
              <SelectItem value="dr" className="font-bold text-xs">{isRtl ? "دكاترة / مدرسين" : "Lecturers"}</SelectItem>
              <SelectItem value="assistant" className="font-bold text-xs">{isRtl ? "مدرسين مساعدين ومعيدين" : "Assistants / TAs"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Sort By Dropdown */}
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="rounded-2xl font-bold h-11 border-2 bg-background text-xs min-w-[150px]">
              <SelectValue placeholder={isRtl ? "ترتيب حسب" : "Sort by"} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="monthly" className="font-bold text-xs">{isRtl ? "⭐ الأعلى تقييماً شهرياً" : "Top Monthly"}</SelectItem>
              <SelectItem value="annual" className="font-bold text-xs">{isRtl ? "🏆 الأعلى تقييماً سنوياً" : "Top Annual"}</SelectItem>
              <SelectItem value="streams" className="font-bold text-xs">{isRtl ? "🔴 الأعلى في البث المباشر" : "Top in Streams"}</SelectItem>
              <SelectItem value="lectures" className="font-bold text-xs">{isRtl ? "📚 الأعلى في المحاضرات" : "Top in Lectures"}</SelectItem>
              <SelectItem value="schedules" className="font-bold text-xs">{isRtl ? "📅 الأعلى في الجداول" : "Top in Schedules"}</SelectItem>
              <SelectItem value="count" className="font-bold text-xs">{isRtl ? "📊 الأكثر تقييماً" : "Most Reviews"}</SelectItem>
              <SelectItem value="name" className="font-bold text-xs">{isRtl ? "🔤 أبجدياً بالاسم" : "Alphabetical"}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center p-1 bg-muted/60 rounded-2xl border border-border">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "cards" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title={isRtl ? "عرض البطاقات" : "Card View"}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
                <div className="bg-current rounded-[2px]" />
              </div>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all ${
                viewMode === "table" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title={isRtl ? "عرض الجدول" : "Table View"}
            >
              <div className="w-4 h-4 flex flex-col justify-between py-0.5">
                <div className="h-0.5 bg-current rounded-full" />
                <div className="h-0.5 bg-current rounded-full" />
                <div className="h-0.5 bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main List: Luxury Cards Grid vs Executive Table */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground font-bold text-sm bg-card rounded-3xl border-2 border-border shadow-sm">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-amber-500" />
          <p className="text-base font-black text-foreground">{isRtl ? "جاري تجميع تقييمات الطلاب لكافة المجالات..." : "Gathering student evaluations..."}</p>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 shadow-sm p-12 text-center space-y-3">
          <Users className="w-14 h-14 mx-auto text-muted-foreground/30 animate-pulse text-amber-500" />
          <h3 className="text-base font-black text-foreground">
            {isRtl ? "لا يوجد أعضاء هيئة تدريس مطابقين للبحث أو الفلتر المختار" : "No faculty members match criteria"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isRtl
              ? "جرّب تغيير خيارات البحث أو التصفية لعرض التقييمات المسجلة."
              : "Try adjusting search or category filters to display recorded evaluations."}
          </p>
        </Card>
      ) : viewMode === "cards" ? (
        /* Luxury Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredFaculty.map((f) => {
            const roleInfo = getRoleLabel(f.role, f.subRole);
            const overallScore = f.annualRating > 0 ? f.annualRating : f.monthlyRating;
            const isExcellent = overallScore >= 4.5;
            const isVeryGood = overallScore >= 3.8 && overallScore < 4.5;
            const isGood = overallScore >= 3.0 && overallScore < 3.8;

            return (
              <Card
                key={f.id}
                className="rounded-3xl border-2 border-border/80 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between bg-card"
              >
                <div className="p-5 space-y-4">
                  {/* Top Faculty Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-base shrink-0 border-2 border-amber-500/30 shadow-inner">
                        {f.fullName.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-foreground truncate">{f.fullName}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-black bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30 px-2 py-0.2 rounded-md">
                            {isRtl ? roleInfo.ar : roleInfo.en}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground truncate">
                            {isRtl ? f.departmentNameAr : f.departmentNameEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={`font-black text-[10px] px-2 py-0.5 rounded-lg shrink-0 ${
                        isExcellent
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : isVeryGood
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          : isGood
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isExcellent ? (isRtl ? "ممتاز 🌟" : "Excellent") : isVeryGood ? (isRtl ? "جيد جداً 👍" : "Very Good") : isGood ? (isRtl ? "جيد 👌" : "Good") : (isRtl ? "قيد التقييم" : "Pending")}
                    </Badge>
                  </div>

                  {/* 2 Big Score Pills */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/80 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block">{isRtl ? "التقييم الشهري (30 يوم)" : "Monthly (30d)"}</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                          {f.monthlyRating > 0 ? f.monthlyRating.toFixed(1) : "0.0"}
                        </span>
                        <Stars value={f.monthlyRating} size="sm" />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-bold">{f.monthlyCount} {isRtl ? "تقييم" : "reviews"}</span>
                    </div>

                    <div className="border-s border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground block">{isRtl ? "التقييم السنوي التراكمي" : "Annual Rating"}</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {f.annualRating > 0 ? f.annualRating.toFixed(1) : "0.0"}
                        </span>
                        <Stars value={f.annualRating} size="sm" />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-bold">{f.annualCount} {isRtl ? "تقييم إجمالي" : "total"}</span>
                    </div>
                  </div>

                  {/* 5 Sub-category Mini Visual Indicators */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>{isRtl ? "أداء المحاضر في المحاور الخمسة:" : "Performance across 5 pillars:"}</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {/* Live Streams */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-foreground font-bold">
                          <Radio className="w-3 h-3 text-rose-500" />
                          <span>{isRtl ? "البث المباشر:" : "Live Streams:"}</span>
                        </span>
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          {f.streamsAvg > 0 ? `⭐ ${f.streamsAvg} (${f.streamsCount})` : "—"}
                        </span>
                      </div>

                      {/* Lectures */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-foreground font-bold">
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          <span>{isRtl ? "المحاضرات:" : "Lectures:"}</span>
                        </span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          {f.lecturesAvg > 0 ? `⭐ ${f.lecturesAvg} (${f.lecturesCount})` : "—"}
                        </span>
                      </div>

                      {/* Schedules */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-foreground font-bold">
                          <Calendar className="w-3 h-3 text-teal-500" />
                          <span>{isRtl ? "الجداول والمواعيد:" : "Schedules:"}</span>
                        </span>
                        <span className="font-black text-teal-600 dark:text-teal-400">
                          {f.schedulesAvg > 0 ? `⭐ ${f.schedulesAvg} (${f.schedulesCount})` : "—"}
                        </span>
                      </div>

                      {/* Quizzes */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-foreground font-bold">
                          <ClipboardList className="w-3 h-3 text-amber-500" />
                          <span>{isRtl ? "الاختبارات:" : "Quizzes:"}</span>
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {f.quizzesAvg > 0 ? `⭐ ${f.quizzesAvg} (${f.quizzesCount})` : "—"}
                        </span>
                      </div>

                      {/* Assignments */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-foreground font-bold">
                          <ShieldCheck className="w-3 h-3 text-purple-500" />
                          <span>{isRtl ? "التكليفات:" : "Assignments:"}</span>
                        </span>
                        <span className="font-black text-purple-600 dark:text-purple-400">
                          {f.assignmentsAvg > 0 ? `⭐ ${f.assignmentsAvg} (${f.assignmentsCount})` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground truncate">
                    {f.email || (isRtl ? "حساب أكاديمي موثق" : "Verified Faculty")}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => setInspectedFaculty(f)}
                    className="rounded-xl font-bold text-xs gap-1.5 h-8 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRtl ? "فحص التقييمات 👁️" : "Inspect"}</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Executive Table View */
        <Card className="rounded-3xl border-2 border-border shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 border-b">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "عضو هيئة التدريس" : "Faculty Member"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "القسم والرتبة" : "Title & Dept"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "البث المباشر" : "Streams"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "المحاضرات" : "Lectures"}</TableHead>
                    <TableHead className="font-black text-xs text-center hidden md:table-cell">{isRtl ? "الجداول" : "Schedules"}</TableHead>
                    <TableHead className="font-black text-xs text-center hidden md:table-cell">{isRtl ? "الاختبارات" : "Quizzes"}</TableHead>
                    <TableHead className="font-black text-xs text-center hidden md:table-cell">{isRtl ? "التكليفات" : "Assignments"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "التقييم الشهري" : "Monthly"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "التقييم السنوي" : "Annual"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculty.map((f) => {
                    const roleInfo = getRoleLabel(f.role, f.subRole);

                    return (
                      <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/30">
                              {f.fullName.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground">{f.fullName}</span>
                              <span className="text-[10px] text-muted-foreground">{f.email || ""}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-xs font-bold">
                          <div className="flex flex-col">
                            <span className="text-foreground">{isRtl ? roleInfo.ar : roleInfo.en}</span>
                            <span className="text-[10px] text-muted-foreground">{isRtl ? f.departmentNameAr : f.departmentNameEn}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-black text-xs text-rose-600 dark:text-rose-400">
                          {f.streamsAvg > 0 ? `⭐ ${f.streamsAvg}` : "—"}
                        </TableCell>

                        <TableCell className="text-center font-black text-xs text-indigo-600 dark:text-indigo-400">
                          {f.lecturesAvg > 0 ? `⭐ ${f.lecturesAvg}` : "—"}
                        </TableCell>

                        <TableCell className="text-center font-black text-xs text-teal-600 dark:text-teal-400 hidden md:table-cell">
                          {f.schedulesAvg > 0 ? `⭐ ${f.schedulesAvg}` : "—"}
                        </TableCell>

                        <TableCell className="text-center font-black text-xs text-amber-600 dark:text-amber-400 hidden md:table-cell">
                          {f.quizzesAvg > 0 ? `⭐ ${f.quizzesAvg}` : "—"}
                        </TableCell>

                        <TableCell className="text-center font-black text-xs text-purple-600 dark:text-purple-400 hidden md:table-cell">
                          {f.assignmentsAvg > 0 ? `⭐ ${f.assignmentsAvg}` : "—"}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                              {f.monthlyRating > 0 ? `⭐ ${f.monthlyRating.toFixed(1)}` : "—"}
                            </span>
                            {f.monthlyCount > 0 && (
                              <span className="text-[9px] text-muted-foreground font-bold">({f.monthlyCount})</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              {f.annualRating > 0 ? `⭐ ${f.annualRating.toFixed(1)}` : "—"}
                            </span>
                            {f.annualCount > 0 && (
                              <span className="text-[9px] text-muted-foreground font-bold">({f.annualCount})</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            onClick={() => setInspectedFaculty(f)}
                            className="rounded-xl font-bold text-xs gap-1 h-8 px-3"
                            variant="outline"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isRtl ? "فحص" : "Inspect"}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Detailed Faculty Ratings Inspection Modal with Anonymous Student Reviews */}
      <Dialog open={!!inspectedFaculty} onOpenChange={(open) => !open && setInspectedFaculty(null)}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {inspectedFaculty && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg font-black flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>{inspectedFaculty.fullName}</span>
                      <Badge variant="outline" className="text-xs font-black bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30">
                        {getRoleLabel(inspectedFaculty.role, inspectedFaculty.subRole).ar}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold mt-1">
                      {isRtl
                        ? `القسم: ${inspectedFaculty.departmentNameAr} | البريد: ${inspectedFaculty.email || "-"}`
                        : `Department: ${inspectedFaculty.departmentNameEn} | Email: ${inspectedFaculty.email || "-"}`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* 2 Big Score Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "التقييم الشهري (30 يوم)" : "Monthly Rating (30d)"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{inspectedFaculty.monthlyRating > 0 ? inspectedFaculty.monthlyRating.toFixed(1) : "0.0"}</span>
                      <Stars value={inspectedFaculty.monthlyRating} size="md" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-bold">{inspectedFaculty.monthlyCount} {isRtl ? "تقييم طالب هذا الشهر" : "reviews this month"}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "التقييم السنوي التراكمي" : "Annual Rating (Cumulative)"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{inspectedFaculty.annualRating > 0 ? inspectedFaculty.annualRating.toFixed(1) : "0.0"}</span>
                      <Stars value={inspectedFaculty.annualRating} size="md" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-bold">{inspectedFaculty.annualCount} {isRtl ? "تقييم طالب إجمالي" : "total reviews"}</span>
                  </div>
                </div>

                {/* Sub-breakdown per 5 categories */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "تفاصيل تقييمات الطلاب لكل تصنيف أكاديمي:" : "Breakdown by Academic Category:"}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "المحاضرات" : "Lectures"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.lecturesAvg > 0 ? inspectedFaculty.lecturesAvg : "-"}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">({inspectedFaculty.lecturesCount})</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "البث المباشر" : "Streams"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.streamsAvg > 0 ? inspectedFaculty.streamsAvg : "-"}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">({inspectedFaculty.streamsCount})</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "الجداول" : "Schedules"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.schedulesAvg > 0 ? inspectedFaculty.schedulesAvg : "-"}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">({inspectedFaculty.schedulesCount})</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.quizzesAvg > 0 ? inspectedFaculty.quizzesAvg : "-"}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">({inspectedFaculty.quizzesCount})</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "التكليفات" : "Assignments"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.assignmentsAvg > 0 ? inspectedFaculty.assignmentsAvg : "-"}</div>
                      <div className="text-[9px] text-muted-foreground font-bold">({inspectedFaculty.assignmentsCount})</div>
                    </div>
                  </div>
                </div>

                {/* Ratings Breakdown with Anonymous Student Comments */}
                <div className="pt-3 border-t">
                  <h4 className="text-xs font-black text-foreground mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>{isRtl ? "سجل تقييمات الطلاب والملاحظات المكتوبة (سري ومجهول الهوية):" : "Student Reviews & Notes (Anonymous):"}</span>
                  </h4>
                  <RatingsBreakdown lecturerId={inspectedFaculty.id} />
                </div>
              </div>

              <DialogFooter className="border-t pt-3">
                <Button
                  onClick={() => setInspectedFaculty(null)}
                  className="rounded-xl font-bold px-6"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
