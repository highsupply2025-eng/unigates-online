import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildAssignmentPath } from "@/lib/assignment-url";

const StudentAssignments = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("status", "active");
    const courseIds = (subs || []).map((s: any) => s.course_id);
    if (courseIds.length === 0) { setLoading(false); return; }
    const { data: asgs } = await supabase
      .from("assignments")
      .select("*")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true });
    setItems(asgs || []);
    const { data: mySubs } = await supabase
      .from("assignment_submissions")
      .select("assignment_id")
      .eq("student_id", user.id);
    setSubmittedIds(new Set((mySubs || []).map((s: any) => s.assignment_id)));
    setLoading(false);
  })(); }, [navigate]);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="التكليفات" titleEn="Assignments" icon={<ClipboardList className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="grid gap-3">
            {/* Demo assignment — always visible */}
            <Link to="/student/assignments/demo-1" className="block">
              <Card className="border-s-4 border-s-amber-500 bg-gradient-to-l from-amber-500/5 to-transparent hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                      <ClipboardList className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold truncate tracking-tight">
                        {isRtl ? "تكليف تجريبي - مقدمة في المادة" : "Demo Assignment - Course Introduction"}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-medium">
                        {isRtl
                          ? "هذا تكليف تجريبي لعرض شكل صفحة التكليف. اضغط لفتح الصفحة وحل التكليف."
                          : "Demo assignment to showcase the detail page. Click to open and solve."}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-600">
                        <Calendar className="w-3 h-3" />
                        2026-05-10
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold">{isRtl ? "مفتوح" : "Open"}</Badge>
                    <Button size="sm" className="shadow-md shadow-primary/20">{isRtl ? "حل" : "Solve"}</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {items.map(a => {
              const submitted = submittedIds.has(a.id);
              const overdue = a.due_date && new Date(a.due_date) < new Date() && !submitted;
              const accent = submitted ? "border-s-green-500" : overdue ? "border-s-red-500" : "border-s-amber-500/60";
              const iconBg = submitted ? "from-green-500 to-emerald-600 shadow-green-500/25" : overdue ? "from-red-500 to-rose-600 shadow-red-500/25" : "from-amber-500 to-orange-600 shadow-amber-500/25";
              return (
                <Card key={a.id} className={`border-s-4 ${accent} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${iconBg} shadow-md`}>
                        <ClipboardList className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold truncate tracking-tight">{isRtl ? a.title_ar : a.title_en}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{isRtl ? a.description_ar : a.description_en}</p>
                        {a.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {submitted ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md shadow-green-500/30"><CheckCircle2 className="w-3 h-3 me-1" />{isRtl ? "تم التسليم" : "Submitted"}</Badge>
                      ) : overdue ? (
                        <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-md shadow-red-500/30"><AlertCircle className="w-3 h-3 me-1" />{isRtl ? "متأخر" : "Overdue"}</Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold">{isRtl ? "مفتوح" : "Open"}</Badge>
                      )}
                      <Button size="sm" onClick={() => navigate(buildAssignmentPath(a.id, a.title_en, a.title_ar))} className="shadow-md shadow-primary/20">
                        {submitted ? (isRtl ? "عرض" : "View") : (isRtl ? "حل" : "Solve")}
                      </Button>
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

export default StudentAssignments;
