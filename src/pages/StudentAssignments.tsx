import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import SiteFooter from "@/components/SiteFooter";
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
    <div className="min-h-screen bg-background flex flex-col">
      <StudentPageHeader titleAr="التكليفات" titleEn="Assignments" icon={<ClipboardList className="w-3 h-3" />} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-6">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-amber-500" />
          {isRtl ? "التكليفات" : "Assignments"}
        </h1>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لا توجد تكليفات حالياً" : "No assignments yet"}</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(a => {
              const submitted = submittedIds.has(a.id);
              const overdue = a.due_date && new Date(a.due_date) < new Date() && !submitted;
              return (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{isRtl ? a.title_ar : a.title_en}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{isRtl ? a.description_ar : a.description_en}</p>
                      {a.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {submitted ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 me-1" />{isRtl ? "تم التسليم" : "Submitted"}</Badge>
                      ) : overdue ? (
                        <Badge variant="destructive"><AlertCircle className="w-3 h-3 me-1" />{isRtl ? "متأخر" : "Overdue"}</Badge>
                      ) : (
                        <Badge variant="secondary">{isRtl ? "مفتوح" : "Open"}</Badge>
                      )}
                      <Button size="sm" onClick={() => navigate(buildAssignmentPath(a.id, a.title_en, a.title_ar))}>
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
      <SiteFooter />
    </div>
  );
};

export default StudentAssignments;
