import React, { useState, useEffect, useMemo } from "react";
import {
  Star, Users, Award, TrendingUp, Search, Filter, Download,
  Sparkles, Calendar, BookOpen, Radio, ClipboardList, ShieldCheck,
  CheckCircle, ChevronRight, User, ArrowUpDown, Eye, MessageSquare,
  Building, RefreshCw
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

interface FacultyMemberRating {
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
  streamsAvg: number;
  quizzesAvg: number;
  schedulesAvg: number;
  assignmentsAvg: number;
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
  const [sortBy, setSortBy] = useState<"monthly" | "annual" | "count" | "name">("monthly");
  
  // Inspection dialog
  const [inspectedFaculty, setInspectedFaculty] = useState<FacultyMemberRating | null>(null);

  const getRoleLabel = (role: string, subRole?: string) => {
    const raw = (subRole || role || "").toLowerCase();
    if (raw.includes("dean") && !raw.includes("vice")) return { ar: institutionType === "institute" ? "مدير المعهد" : "عميد الكلية", en: "Dean" };
    if (raw.includes("vice_dean") || raw.includes("vicedean")) return { ar: "وكيل الكلية", en: "Vice Dean" };
    if (raw.includes("head") || raw.includes("department_head")) return { ar: "رئيس قسم", en: "Head of Department" };
    if (raw.includes("prof_dr") || raw.includes("professor")) return { ar: "أستاذ دكتور (أ.د)", en: "Professor" };
    if (raw.includes("dr") || raw.includes("doctor")) return { ar: "دكتور (د.)", en: "Doctor / Lecturer" };
    if (raw.includes("assistant_lecturer") || raw.includes("teaching_assistant")) return { ar: "مدرس مساعد", en: "Assistant Lecturer" };
    if (raw.includes("teacher") || raw.includes("lecturer")) return { ar: "مدرس", en: "Lecturer" };
    if (raw.includes("demonstrator") || raw.includes("ta")) return { ar: "معيد", en: "Demonstrator" };
    return { ar: "عضو هيئة تدريس", en: "Faculty Member" };
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

      // 3) Fetch all courses to map creator_id
      const { data: courses } = await supabase.from("courses").select("id, creator_id, department_id");
      const courseMap = new Map<string, string>(); // courseId -> creatorId
      (courses || []).forEach((c) => courseMap.set(c.id, c.creator_id));

      // 4) Fetch all ratings across 5 types
      const [lrRes, qrRes, srRes, strRes, arRes] = await Promise.all([
        supabase.from("lecture_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("quiz_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("schedule_ratings").select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
        supabase.from("live_stream_ratings").select("id, rating, created_at, stream_id").gte("created_at", yearAgoIso),
        supabase.from("assignment_ratings" as any).select("id, rating, created_at, course_id").gte("created_at", yearAgoIso),
      ]);

      const streamsData = await supabase.from("live_streams").select("id, creator_id");
      const streamMap = new Map<string, string>();
      (streamsData.data || []).forEach((s) => streamMap.set(s.id, s.creator_id));

      // Map ratings to faculty creator IDs
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

      const addRating = (creatorId: string | undefined, rating: number, createdAt: string, type: "lecture" | "stream" | "quiz" | "schedule" | "assignment") => {
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
          streamsAvg: Math.round(avg(b.streams) * 10) / 10,
          quizzesAvg: Math.round(avg(b.quizzes) * 10) / 10,
          schedulesAvg: Math.round(avg(b.schedules) * 10) / 10,
          assignmentsAvg: Math.round(avg(b.assignments) * 10) / 10,
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

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "monthly") return b.monthlyRating - a.monthlyRating || b.monthlyCount - a.monthlyCount;
        if (sortBy === "annual") return b.annualRating - a.annualRating || b.annualCount - a.annualCount;
        if (sortBy === "count") return b.annualCount - a.annualCount;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [facultyMembers, searchQuery, selectedDepartment, selectedRole, sortBy]);

  // Overall metrics
  const totalFacultyCount = facultyMembers.length;
  const overallAvgMonthly = facultyMembers.filter(f => f.monthlyCount > 0).length > 0
    ? (facultyMembers.filter(f => f.monthlyCount > 0).reduce((a, b) => a + b.monthlyRating, 0) / facultyMembers.filter(f => f.monthlyCount > 0).length).toFixed(1)
    : "0.0";
  const overallAvgAnnual = facultyMembers.filter(f => f.annualCount > 0).length > 0
    ? (facultyMembers.filter(f => f.annualCount > 0).reduce((a, b) => a + b.annualRating, 0) / facultyMembers.filter(f => f.annualCount > 0).length).toFixed(1)
    : "0.0";
  const totalReviewsCount = facultyMembers.reduce((a, b) => a + b.annualCount, 0);

  // PDF Export
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title = isRtl ? "كشف التقييم الشهري والسنوي لأعضاء هيئة التدريس" : "Faculty Monthly & Annual Ratings Report";

    const html = `
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: ${isRtl ? "rtl" : "ltr"}; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #1e1b4b; }
            .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: ${isRtl ? "right" : "left"}; }
            th { background: #f1f5f9; font-weight: bold; }
            .score { font-weight: bold; color: #d97706; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <span>${isRtl ? "إجمالي أعضاء هيئة التدريس:" : "Total Faculty:"} ${facultyMembers.length}</span> | 
            <span>${isRtl ? "المتوسط الشهري العام:" : "Overall Monthly Avg:"} ⭐ ${overallAvgMonthly} / 5</span> | 
            <span>${isRtl ? "المتوسط السنوي العام:" : "Overall Annual Avg:"} ⭐ ${overallAvgAnnual} / 5</span> | 
            <span>${isRtl ? "تاريخ التصدير:" : "Date:"} ${new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isRtl ? "اسم عضو هيئة التدريس" : "Faculty Member"}</th>
                <th>${isRtl ? "المنصب الأكاديمي" : "Academic Title"}</th>
                <th>${isRtl ? "القسم" : "Department"}</th>
                <th>${isRtl ? "التقييم الشهري (30 يوم)" : "Monthly Rating (30d)"}</th>
                <th>${isRtl ? "التقييم السنوي (365 يوم)" : "Annual Rating (365d)"}</th>
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
                    <td class="score">⭐ ${f.monthlyRating > 0 ? `${f.monthlyRating} / 5 (${f.monthlyCount} تقييم)` : (isRtl ? "لا توجد تقييمات هذا الشهر" : "No ratings")}</td>
                    <td class="score">⭐ ${f.annualRating > 0 ? `${f.annualRating} / 5 (${f.annualCount} تقييم)` : (isRtl ? "لا توجد تقييمات" : "No ratings")}</td>
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
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border-2 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-md">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <span>{isRtl ? "تقييمات أداء أعضاء هيئة التدريس" : "Faculty Performance & Student Ratings"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs font-bold text-muted-foreground">
              {isRtl
                ? `متابعة تقييمات الطلاب الشهرية والسنوية لجميع أعضاء هيئة التدريس في ${institutionType === "institute" ? "المعهد" : "الكلية"} بدقة وشفافية.`
                : "Comprehensive overview of monthly and annual student evaluations for all faculty members."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="rounded-2xl font-bold h-11 px-4 gap-2 border-2"
          >
            <Download className="w-4 h-4" />
            <span>{isRtl ? "تصدير كشف التقييمات PDF" : "Export Report PDF"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchFacultyRatings();
              if (onRefresh) onRefresh();
            }}
            className="rounded-2xl font-bold gap-1.5 h-11"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-2 border-blue-500/25 bg-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300">
                {totalFacultyCount}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "إجمالي أعضاء هيئة التدريس" : "Total Faculty Members"}
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-amber-500/25 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span>{overallAvgMonthly}</span>
                <span className="text-xs font-normal text-muted-foreground">/ 5</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "متوسط التقييم الشهري (30 يوم)" : "Average Monthly Score"}
              </div>
            </div>
            <Star className="w-8 h-8 text-amber-600 opacity-80 fill-amber-500" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span>{overallAvgAnnual}</span>
                <span className="text-xs font-normal text-muted-foreground">/ 5</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "متوسط التقييم السنوي التراكمي" : "Average Annual Score"}
              </div>
            </div>
            <Award className="w-8 h-8 text-emerald-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-purple-500/25 bg-purple-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300">
                {totalReviewsCount}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                {isRtl ? "إجمالي تقييمات الطلاب المستلمة" : "Total Student Reviews"}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Ribbon */}
      <Card className="rounded-3xl border-2 border-border shadow-md overflow-hidden bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute top-3.5 ${isRtl ? "right-3.5" : "left-3.5"} text-muted-foreground`} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث باسم عضو هيئة التدريس..." : "Search faculty name..."}
                className={`rounded-2xl font-bold h-11 border-2 ${isRtl ? "pr-10" : "pl-10"}`}
              />
            </div>

            {/* Department Filter */}
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="rounded-2xl font-bold h-11 border-2 bg-background">
                <SelectValue placeholder={isRtl ? "جميع الأقسام" : "All Departments"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">{isRtl ? "جميع الأقسام" : "All Departments"}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="font-bold">
                    {isRtl ? d.name_ar : d.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="rounded-2xl font-bold h-11 border-2 bg-background">
                <SelectValue placeholder={isRtl ? "جميع الرتب الأكاديمية" : "All Titles"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="font-bold">{isRtl ? "جميع الرتب الأكاديمية" : "All Titles"}</SelectItem>
                <SelectItem value="head" className="font-bold">{isRtl ? "رؤساء الأقسام" : "Heads of Department"}</SelectItem>
                <SelectItem value="prof" className="font-bold">{isRtl ? "أساتذة دكاترة (أ.د)" : "Professors"}</SelectItem>
                <SelectItem value="dr" className="font-bold">{isRtl ? "دكاترة / مدرسين" : "Doctors / Lecturers"}</SelectItem>
                <SelectItem value="assistant" className="font-bold">{isRtl ? "مدرسين مساعدين ومعيدين" : "Assistant Lecturers / TAs"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="rounded-2xl font-bold h-11 border-2 bg-background">
                <SelectValue placeholder={isRtl ? "ترتيب حسب" : "Sort by"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="monthly" className="font-bold">{isRtl ? "⭐ الأعلى تقييماً شهرياً" : "Top Monthly Rating"}</SelectItem>
                <SelectItem value="annual" className="font-bold">{isRtl ? "🏆 الأعلى تقييماً سنوياً" : "Top Annual Rating"}</SelectItem>
                <SelectItem value="count" className="font-bold">{isRtl ? "📊 الأكثر عدداً للتقييمات" : "Most Reviews"}</SelectItem>
                <SelectItem value="name" className="font-bold">{isRtl ? "🔤 أبجدياً بالاسم" : "Alphabetical"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roster Table */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground font-bold text-sm">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-amber-500" />
              <p>{isRtl ? "جاري تحميل وتجميع تقييمات الطلاب لأعضاء هيئة التدريس..." : "Loading faculty ratings..."}</p>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-bold text-sm bg-muted/20 rounded-2xl border border-dashed">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p>{isRtl ? "لا يوجد أعضاء هيئة تدريس مطابقين للبحث المختار." : "No faculty members found."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black text-xs">{isRtl ? "عضو هيئة التدريس" : "Faculty Member"}</TableHead>
                    <TableHead className="font-black text-xs">{isRtl ? "المنصب الأكاديمي" : "Academic Title"}</TableHead>
                    <TableHead className="font-black text-xs hidden sm:table-cell">{isRtl ? "القسم" : "Department"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "التقييم الشهري (30 يوم)" : "Monthly Rating (30d)"}</TableHead>
                    <TableHead className="font-black text-xs text-center">{isRtl ? "التقييم السنوي التراكمي" : "Annual Rating"}</TableHead>
                    <TableHead className="font-black text-xs text-end">{isRtl ? "الإجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculty.map((f) => {
                    const roleInfo = getRoleLabel(f.role, f.subRole);
                    const hasMonthly = f.monthlyCount > 0;
                    const hasAnnual = f.annualCount > 0;

                    return (
                      <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/30">
                              {f.fullName.slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground">{f.fullName}</span>
                              {f.email && <span className="text-[11px] text-muted-foreground font-mono">{f.email}</span>}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="font-black text-xs bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30">
                            {isRtl ? roleInfo.ar : roleInfo.en}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell font-bold text-xs text-muted-foreground">
                          {isRtl ? f.departmentNameAr : f.departmentNameEn}
                        </TableCell>

                        <TableCell className="text-center">
                          {hasMonthly ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">{f.monthlyRating.toFixed(1)}</span>
                                <Stars value={f.monthlyRating} size="sm" />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {f.monthlyCount} {isRtl ? "تقييم هذا الشهر" : "reviews this month"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground italic">
                              {isRtl ? "لا توجد تقييمات هذا الشهر" : "No reviews this month"}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {hasAnnual ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{f.annualRating.toFixed(1)}</span>
                                <Stars value={f.annualRating} size="sm" />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {f.annualCount} {isRtl ? "تقييم إجمالي" : "total reviews"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground italic">
                              {isRtl ? "لا توجد تقييمات" : "No reviews"}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            onClick={() => setInspectedFaculty(f)}
                            className="rounded-xl font-bold text-xs gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30"
                            variant="ghost"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? "فحص التقييمات" : "Inspect"}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Faculty Ratings Inspection Modal */}
      <Dialog open={!!inspectedFaculty} onOpenChange={(open) => !open && setInspectedFaculty(null)}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {inspectedFaculty && (
            <>
              <DialogHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
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

                {/* Sub-breakdown per category */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "تفاصيل تقييمات الطلاب لكل تصنيف أكاديمي:" : "Breakdown by Academic Category:"}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "المحاضرات" : "Lectures"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.lecturesAvg > 0 ? inspectedFaculty.lecturesAvg : "-"}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "البث المباشر" : "Streams"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.streamsAvg > 0 ? inspectedFaculty.streamsAvg : "-"}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.quizzesAvg > 0 ? inspectedFaculty.quizzesAvg : "-"}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "الجداول" : "Schedules"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.schedulesAvg > 0 ? inspectedFaculty.schedulesAvg : "-"}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-muted/30">
                      <div className="text-[11px] font-bold text-muted-foreground">{isRtl ? "التكليفات" : "Assignments"}</div>
                      <div className="text-sm font-black text-foreground mt-0.5">⭐ {inspectedFaculty.assignmentsAvg > 0 ? inspectedFaculty.assignmentsAvg : "-"}</div>
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
