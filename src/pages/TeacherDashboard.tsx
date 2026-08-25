import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, MessageSquare, BookOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboard() {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: fac } = await supabase.from("institution_faculty_members").select("*").eq("user_id", user.id).maybeSingle();
      if (!fac || !["teacher","department_head","professor","doctor","assistant_lecturer","teaching_assistant","lecturer"].includes(fac.specific_role)) {
        // Allow any faculty but show message if not teacher specifically
        if (!fac) { navigate("/login"); return; }
      }
      setFaculty(fac);
      if (fac.department_id) {
        const { data: dept } = await supabase.from("departments").select("id, department_name, department_code").eq("id", fac.department_id).maybeSingle();
        setDepartment(dept);
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" dir={dir}><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir={dir}>
      <header className="border-b border-primary/20 px-4 py-4 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black flex items-center gap-2"><GraduationCap className="w-6 h-6 text-primary" />{isRtl ? "لوحة المدرس" : "Teacher Dashboard"}</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate("/institution/messages")}><MessageSquare className="w-4 h-4 me-1" />{isRtl ? "التواصل" : "Messages"}</Button>
            <Button size="sm" variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>{isRtl ? "خروج" : "Logout"}</Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />{faculty?.full_name} <Badge>{faculty?.specific_role}</Badge></CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{isRtl ? "حساب المدرس مثل حساب رئيس القسم — يمكنك إدارة طلاب قسمك والتواصل مع إدارة الكلية" : "Teacher account like Department Head — manage your department students and contact administration"}</p>
            {department && <p className="mt-2"><Badge variant="secondary"><BookOpen className="w-3 h-3 me-1" />{department.department_name} ({department.department_code})</Badge></p>}
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/institution/messages")}>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-primary mb-2" />
              <h3 className="font-bold">{isRtl ? "التواصل مع الإدارة وهيئة التدريس" : "Contact Administration & Faculty"}</h3>
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "بدء المراسلات حول القرارات والأوامر" : "Start correspondence on decisions and orders"}</p>
              <Button className="mt-3 w-full">{isRtl ? "فتح التواصل" : "Open Messages"}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{isRtl ? "اختصارات" : "Shortcuts"}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => navigate("/institution/dashboard")}>{isRtl ? "الذهاب للوحة الكلية" : "Go to Institution Dashboard"}</Button>
              <Button variant="outline" onClick={() => navigate("/leadership/dashboard")}>{isRtl ? "لوحة القيادة" : "Leadership Dashboard"}</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
