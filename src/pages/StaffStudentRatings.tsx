import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Row = { user_id: string; full_name: string | null; email: string | null };

const StaffStudentRatings = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, approved")
        .eq("user_id", user.id);
      const allowed = (roles || []).some((r: any) =>
        r.approved && ["admin", "lecturer", "department_head", "vice_dean", "dean"].includes(r.role)
      );
      if (!allowed) {
        toast({ title: isRtl ? "غير مصرح" : "Forbidden", variant: "destructive" });
        navigate(-1);
        return;
      }

      const studentIds = new Set<string>();
      // Quiz submissions visible to me
      const { data: qs } = await supabase.from("quiz_submissions").select("student_id").limit(1000);
      (qs || []).forEach((r: any) => r.student_id && studentIds.add(r.student_id));
      // Assignment submissions visible to me
      const { data: asubs } = await supabase.from("assignment_submissions").select("student_id").limit(1000);
      (asubs || []).forEach((r: any) => r.student_id && studentIds.add(r.student_id));

      const ids = Array.from(studentIds);
      if (ids.length === 0) { setStudents([]); setLoading(false); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      setStudents((profs || []) as Row[]);
      setLoading(false);
    })();
  }, [navigate, isRtl]);

  const filtered = students.filter((s) => {
    const t = (s.full_name || "") + " " + (s.email || "");
    return t.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="تقييمات الطلاب"
        titleEn="Student Ratings"
        icon={<Users className="w-3.5 h-3.5" />}
      />
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8 space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold">{isRtl ? "عرض فقط — تقارير تقييم الطلاب" : "View only — student rating reports"}</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <Input
            placeholder={isRtl ? "ابحث باسم الطالب أو البريد..." : "Search by name or email..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-9"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {isRtl ? "لا يوجد طلاب لعرضهم" : "No students to display"}
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((s) => (
              <Card key={s.user_id} className="hover:shadow transition">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{s.full_name || (isRtl ? "بدون اسم" : "Unnamed")}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/student/ratings?student=${s.user_id}`)}
                    className="gap-1.5 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isRtl ? "عرض" : "View"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffStudentRatings;
