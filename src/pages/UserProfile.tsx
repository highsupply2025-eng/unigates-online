import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  created_at: string;
}

const UserProfile = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, role, platform, created_at")
        .eq("user_id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!profile) return null;

  const roleLabel = (r: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      student: { ar: "طالب جامعي", en: "University Student" },
      school_student: { ar: "طالب مدرسي", en: "School Student" },
      lecturer: { ar: "محاضر", en: "Lecturer" },
      teacher: { ar: "معلم", en: "Teacher" },
      personal: { ar: "حساب شخصي", en: "Personal" },
      admin: { ar: "مسؤول", en: "Admin" },
    };
    return map[r]?.[language] || r;
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader
        titleAr="البيانات الشخصية"
        titleEn="Personal Information"
        icon={<User className="w-4 h-4" />}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-s-4 border-s-primary shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center sm:text-start">
                <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">{profile.full_name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{profile.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{language === "ar" ? "انضم في" : "Joined"} {new Date(profile.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">{roleLabel(profile.role)}</Badge>
                  <Badge variant="outline">{profile.platform === "bookstore" ? (language === "ar" ? "متجر الكتب" : "Book Store") : profile.platform === "school" ? (language === "ar" ? "المدرسة" : "School") : (language === "ar" ? "الدورات" : "Courses")}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserProfile;
