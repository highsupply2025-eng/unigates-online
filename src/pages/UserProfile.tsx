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
  const { t, dir, language, toggleLanguage } = useLanguage();
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
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><Home className="w-5 h-5" /></Link>
            </Button>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5">
              {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

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

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {language === "ar" ? "طلبات الكتب" : "Book Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{language === "ar" ? "لم تقم بأي عملية شراء بعد" : "No purchases yet"}</p>
                <Button asChild className="mt-4">
                  <Link to="/book-store">{language === "ar" ? "تصفح متجر الكتب" : "Browse Book Store"}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    {order.book?.cover_url ? (
                      <img src={order.book.cover_url} alt="" className="w-14 h-20 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-20 rounded bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {language === "ar" ? order.book?.title_ar : order.book?.title_en}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {language === "ar" ? order.book?.author_ar : order.book?.author_en}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </span>
                        <Badge variant="outline" className="text-xs">{order.book?.category}</Badge>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="font-bold text-foreground">{Number(order.amount).toFixed(0)} {language === "ar" ? "ج.م" : "EGP"}</p>
                      {statusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserProfile;
