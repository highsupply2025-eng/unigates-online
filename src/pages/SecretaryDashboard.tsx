import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, MessageSquare, Users, Building2 } from "lucide-react";

export default function SecretaryDashboard() {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: fac } = await supabase.from("institution_faculty_members").select("*").eq("user_id", user.id).maybeSingle();
      if (!fac || fac.specific_role !== "college_secretary") {
        // Allow also if user is college admin? Secretary is faculty type, so check
        if (!fac) { navigate("/login"); return; }
      }
      setFaculty(fac);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" dir={dir}><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir={dir}>
      <header className="border-b border-primary/20 px-4 py-4 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" />{isRtl ? "لوحة أمين الكلية" : "College Secretary Dashboard"}</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate("/institution/messages")}><MessageSquare className="w-4 h-4 me-1" />{isRtl ? "التواصل" : "Messages"}</Button>
            <Button size="sm" variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>{isRtl ? "خروج" : "Logout"}</Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <Card className="border-primary/20">
          <CardHeader><CardTitle>{faculty?.full_name} — {isRtl ? "أمين الكلية" : "Secretary"}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{isRtl ? "حساب إداري — يمكنك التواصل مع جميع اللوحات ما عدا الطالب (هيئة التدريس، الإدارة، المكتبة، القيادة)" : "Administrative account — contact all dashboards except students"}</p>
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-xs font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />{isRtl ? "الصلاحيات: مراسلة الإدارة + جميع أعضاء هيئة التدريس" : "Permissions: message administration + all faculty"}</p>
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/institution/messages")}>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-primary mb-2" />
              <h3 className="font-bold">{isRtl ? "التواصل الداخلي" : "Internal Messages"}</h3>
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "صفحة بها أعضاء هيئة التدريس وإدارة الكلية وتبدأ المراسلات" : "Page with faculty and administration to start correspondence"}</p>
              <Button className="mt-3 w-full">{isRtl ? "فتح التواصل" : "Open Messages"}</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />{isRtl ? "إدارة الكلية" : "College Admin"}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => navigate("/institution/dashboard")}>{isRtl ? "لوحة الكلية" : "Institution Dashboard"}</Button>
              <Button variant="outline" onClick={() => navigate("/leadership/dashboard")}>{isRtl ? "لوحة القيادة" : "Leadership"}</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
