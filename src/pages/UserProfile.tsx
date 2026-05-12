import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar, ShoppingBag, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface BookOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  book: {
    title_ar: string;
    title_en: string;
    author_ar: string;
    author_en: string;
    cover_url: string | null;
    category: string;
  } | null;
}

const UserProfile = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<BookOrder[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const [{ data: profileData }, { data: ordersData }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone, role, platform, created_at").eq("user_id", user.id).single(),
      supabase.from("book_orders").select("id, amount, status, created_at, book:books(title_ar, title_en, author_ar, author_en, cover_url, category)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setProfile(profileData);
    setOrders((ordersData as any) || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-green-300">{language === "ar" ? "مكتمل" : "Completed"}</Badge>;
    if (status === "cancelled") return <Badge variant="destructive">{language === "ar" ? "ملغي" : "Cancelled"}</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-300">{language === "ar" ? "قيد المعالجة" : "Pending"}</Badge>;
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!profile) return null;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader
        titleAr="بيانات الحساب"
        titleEn="Account Details"
        icon={<User className="w-4 h-4" />}
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-start">
                <h1 className="text-2xl font-black text-foreground mb-1">{profile.full_name}</h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground mt-3">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{profile.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(profile.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <Badge variant="secondary">{profile.role === "lecturer" ? (language === "ar" ? "محاضر" : "Lecturer") : profile.role === "admin" ? (language === "ar" ? "مسؤول" : "Admin") : (language === "ar" ? "طالب" : "Student")}</Badge>
                  <Badge variant="outline">{profile.platform === "bookstore" ? (language === "ar" ? "متجر الكتب" : "Book Store") : (language === "ar" ? "الدورات" : "Courses")}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center">
            <ShoppingBag className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الطلبات" : "Total Orders"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <BookOpen className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{orders.filter(o => o.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "مكتملة" : "Completed"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <span className="text-2xl">💰</span>
            <p className="text-2xl font-black text-foreground">{totalSpent.toFixed(0)} {language === "ar" ? "ج.م" : "EGP"}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي المدفوعات" : "Total Spent"}</p>
          </CardContent></Card>
        </div>

      </main>
    </div>
  );
};

export default UserProfile;
