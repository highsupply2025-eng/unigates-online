import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, LogOut, Users, UserCheck, UserX, Shield,
  BookOpen, Eye, Search, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight,
  School, MapPin, Phone, Mail, MessageSquare, FileText, Video, CreditCard,
  BarChart3, ShoppingCart, BookMarked, Radio, TrendingUp, Package, DollarSign,
  Calendar, PlayCircle, Layers, Download
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  approved: boolean;
  created_at: string;
}

interface SchoolRegistration {
  id: string;
  school_name: string;
  principal_name: string;
  city: string;
  phone: string;
  email: string;
  student_count: number | null;
  address: string | null;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  university_cert_url: string | null;
  additional_certs_urls: string[] | null;
  id_photo_url: string | null;
  live_photo_url: string | null;
  created_at: string;
}

interface Course {
  id: string;
  title_ar: string;
  title_en: string;
  instructor_ar: string;
  instructor_en: string;
  category_ar: string;
  category_en: string;
  episode_count: number;
  is_free: boolean;
  thumbnail_url: string | null;
  created_at: string;
}

interface Book {
  id: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  category: string;
  price: number;
  original_price: number | null;
  is_bestseller: boolean | null;
  is_new: boolean | null;
  is_active: boolean | null;
  rating: number | null;
  reviews_count: number | null;
  cover_url: string | null;
  created_at: string;
}

interface BookOrder {
  id: string;
  user_id: string;
  book_id: string;
  amount: number;
  status: string;
  created_at: string;
  book?: Book;
  profile?: Profile;
}

interface Subscription {
  id: string;
  user_id: string;
  course_id: string;
  level_number: number;
  plan_type: string;
  amount_paid: number;
  status: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  course?: Course;
  profile?: Profile;
}

interface LiveStream {
  id: string;
  title_ar: string;
  title_en: string;
  creator_id: string;
  course_id: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  profile?: Profile;
}

const getSignedUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null;
  const storagePath = path.includes('/storage/v1/object/public/user-documents/')
    ? path.split('/storage/v1/object/public/user-documents/')[1]
    : path;
  const { data } = await supabase.storage.from("user-documents").createSignedUrl(storagePath, 3600);
  return data?.signedUrl || null;
};

const AdminDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Users
  const [pendingLecturers, setPendingLecturers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [allUsers, setAllUsers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Schools
  const [schoolRegistrations, setSchoolRegistrations] = useState<SchoolRegistration[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRegistration | null>(null);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState("");

  // Books
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearch, setBookSearch] = useState("");

  // Orders
  const [bookOrders, setBookOrders] = useState<BookOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subSearch, setSubSearch] = useState("");

  // Live streams
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [streamSearch, setStreamSearch] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0, totalLecturers: 0, pendingCount: 0, totalCourses: 0,
    totalViews: 0, pendingSchools: 0, totalBooks: 0, totalOrders: 0,
    totalSubscriptions: 0, totalStreams: 0, totalRevenue: 0,
  });

  // Detail dialog
  const [selectedUser, setSelectedUser] = useState<(UserRole & { profile?: Profile }) | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) { navigate("/"); return; }
    setIsAdmin(true);
    await loadAll();
    setLoading(false);
  };

  const loadAll = async () => {
    await Promise.all([
      loadPending(), loadAllUsers(), loadStats(), loadSchoolRegistrations(),
      loadCourses(), loadBooks(), loadOrders(), loadSubscriptions(), loadStreams(),
    ]);
  };

  const loadPending = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").eq("role", "lecturer").eq("approved", false);
    if (!roles) { setPendingLecturers([]); return; }
    const userIds = roles.map(r => r.user_id);
    if (userIds.length === 0) { setPendingLecturers([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    setPendingLecturers(roles.map(r => ({ ...r, profile: (profiles || []).find(p => p.user_id === r.user_id) })));
  };

  const loadAllUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (!roles) { setAllUsers([]); return; }
    const userIds = roles.map(r => r.user_id);
    if (userIds.length === 0) { setAllUsers([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    setAllUsers(roles.map(r => ({ ...r, profile: (profiles || []).find(p => p.user_id === r.user_id) })));
  };

  const loadSchoolRegistrations = async () => {
    const { data } = await supabase.from("school_registrations").select("*").order("created_at", { ascending: false });
    setSchoolRegistrations(data || []);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  };

  const loadBooks = async () => {
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setBooks(data || []);
  };

  const loadOrders = async () => {
    const { data: orders } = await supabase.from("book_orders").select("*").order("created_at", { ascending: false });
    if (!orders || orders.length === 0) { setBookOrders([]); return; }
    const bookIds = [...new Set(orders.map(o => o.book_id))];
    const userIds = [...new Set(orders.map(o => o.user_id))];
    const [{ data: booksData }, { data: profilesData }] = await Promise.all([
      supabase.from("books").select("*").in("id", bookIds),
      supabase.from("profiles").select("*").in("user_id", userIds),
    ]);
    setBookOrders(orders.map(o => ({
      ...o,
      book: (booksData || []).find(b => b.id === o.book_id),
      profile: (profilesData || []).find(p => p.user_id === o.user_id),
    })));
  };

  const loadSubscriptions = async () => {
    const { data: subs } = await supabase.from("user_subscriptions").select("*").order("created_at", { ascending: false });
    if (!subs || subs.length === 0) { setSubscriptions([]); return; }
    const courseIds = [...new Set(subs.map(s => s.course_id))];
    const userIds = [...new Set(subs.map(s => s.user_id))];
    const [{ data: coursesData }, { data: profilesData }] = await Promise.all([
      supabase.from("courses").select("*").in("id", courseIds),
      supabase.from("profiles").select("*").in("user_id", userIds),
    ]);
    setSubscriptions(subs.map(s => ({
      ...s,
      course: (coursesData || []).find(c => c.id === s.course_id),
      profile: (profilesData || []).find(p => p.user_id === s.user_id),
    })));
  };

  const loadStreams = async () => {
    const { data: streams } = await supabase.from("live_streams").select("*").order("created_at", { ascending: false });
    if (!streams || streams.length === 0) { setLiveStreams([]); return; }
    const userIds = [...new Set(streams.map(s => s.creator_id))];
    const { data: profilesData } = await supabase.from("profiles").select("*").in("user_id", userIds);
    setLiveStreams(streams.map(s => ({
      ...s,
      profile: (profilesData || []).find(p => p.user_id === s.creator_id),
    })));
  };

  const loadStats = async () => {
    const [
      { data: totalUsers },
      { count: totalLecturers },
      { count: pendingCount },
      { count: totalCourses },
      { count: totalViews },
      { count: pendingSchools },
      { count: totalBooks },
      { count: totalOrders },
      { count: totalSubscriptions },
      { count: totalStreams },
    ] = await Promise.all([
      supabase.rpc("get_profile_count"),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer").eq("approved", true),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer").eq("approved", false),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("course_views").select("*", { count: "exact", head: true }),
      supabase.from("school_registrations").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("books").select("*", { count: "exact", head: true }),
      supabase.from("book_orders").select("*", { count: "exact", head: true }),
      supabase.from("user_subscriptions").select("*", { count: "exact", head: true }),
      supabase.from("live_streams").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      totalUsers: Number(totalUsers) || 0,
      totalLecturers: totalLecturers || 0,
      pendingCount: pendingCount || 0,
      totalCourses: totalCourses || 0,
      totalViews: totalViews || 0,
      pendingSchools: pendingSchools || 0,
      totalBooks: totalBooks || 0,
      totalOrders: totalOrders || 0,
      totalSubscriptions: totalSubscriptions || 0,
      totalStreams: totalStreams || 0,
      totalRevenue: 0,
    });
  };

  const handleApprove = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").update({ approved: true }).eq("id", roleId);
    if (error) { toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تمت الموافقة على المحاضر" : "Lecturer approved" });
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const handleReject = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم رفض الطلب" : "Request rejected" });
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const handleSchoolApprove = async (id: string) => {
    const { error } = await supabase.from("school_registrations").update({ status: "approved", admin_notes: adminNotes || null }).eq("id", id);
    if (error) { toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم قبول طلب المدرسة" : "School approved" });
    setShowSchoolDialog(false); setAdminNotes("");
    await Promise.all([loadSchoolRegistrations(), loadStats()]);
  };

  const handleSchoolReject = async (id: string) => {
    const { error } = await supabase.from("school_registrations").update({ status: "rejected", admin_notes: adminNotes || null }).eq("id", id);
    if (error) { toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم رفض طلب المدرسة" : "School rejected" });
    setShowSchoolDialog(false); setAdminNotes("");
    await Promise.all([loadSchoolRegistrations(), loadStats()]);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const filteredSchools = schoolRegistrations.filter(s => {
    if (!schoolSearchQuery) return true;
    const q = schoolSearchQuery.toLowerCase();
    return s.school_name.toLowerCase().includes(q) || s.principal_name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  const filteredUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.profile?.full_name?.toLowerCase().includes(q) || u.profile?.email?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const filteredCourses = courses.filter(c => {
    if (!courseSearch) return true;
    const q = courseSearch.toLowerCase();
    return c.title_ar.toLowerCase().includes(q) || c.title_en.toLowerCase().includes(q) || c.instructor_ar.toLowerCase().includes(q) || c.instructor_en.toLowerCase().includes(q);
  });

  const filteredBooks = books.filter(b => {
    if (!bookSearch) return true;
    const q = bookSearch.toLowerCase();
    return b.title_ar.toLowerCase().includes(q) || b.title_en.toLowerCase().includes(q) || b.author_ar.toLowerCase().includes(q) || b.author_en.toLowerCase().includes(q);
  });

  const filteredOrders = bookOrders.filter(o => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return o.book?.title_ar?.toLowerCase().includes(q) || o.book?.title_en?.toLowerCase().includes(q) || o.profile?.full_name?.toLowerCase().includes(q) || o.status.toLowerCase().includes(q);
  });

  const filteredSubs = subscriptions.filter(s => {
    if (!subSearch) return true;
    const q = subSearch.toLowerCase();
    return s.course?.title_ar?.toLowerCase().includes(q) || s.course?.title_en?.toLowerCase().includes(q) || s.profile?.full_name?.toLowerCase().includes(q) || s.plan_type.toLowerCase().includes(q);
  });

  const filteredStreams = liveStreams.filter(s => {
    if (!streamSearch) return true;
    const q = streamSearch.toLowerCase();
    return s.title_ar.toLowerCase().includes(q) || s.title_en.toLowerCase().includes(q) || s.profile?.full_name?.toLowerCase().includes(q);
  });

  const roleBadge = (role: string, approved: boolean) => {
    const roleMap: Record<string, { ar: string; en: string; cls: string }> = {
      admin: { ar: "مسؤول", en: "Admin", cls: "bg-primary/20 text-primary border-primary/30" },
      lecturer_approved: { ar: "محاضر معتمد", en: "Approved Lecturer", cls: "bg-green-100 text-green-700 border-green-300" },
      lecturer_pending: { ar: "بانتظار الموافقة", en: "Pending Lecturer", cls: "bg-amber-100 text-amber-700 border-amber-300" },
      personal: { ar: "شخصي", en: "Personal", cls: "bg-blue-100 text-blue-700 border-blue-300" },
      student: { ar: "طالب", en: "Student", cls: "bg-sky-100 text-sky-700 border-sky-300" },
      publisher: { ar: "ناشر", en: "Publisher", cls: "bg-purple-100 text-purple-700 border-purple-300" },
      seller: { ar: "بائع", en: "Seller", cls: "bg-orange-100 text-orange-700 border-orange-300" },
      school_student: { ar: "طالب مدرسي", en: "School Student", cls: "bg-teal-100 text-teal-700 border-teal-300" },
      parent: { ar: "ولي أمر", en: "Parent", cls: "bg-pink-100 text-pink-700 border-pink-300" },
      school: { ar: "مدرسة", en: "School", cls: "bg-indigo-100 text-indigo-700 border-indigo-300" },
      teacher: { ar: "معلم", en: "Teacher", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    };
    const key = role === "lecturer" ? (approved ? "lecturer_approved" : "lecturer_pending") : role;
    const info = roleMap[key] || { ar: role, en: role, cls: "" };
    return <Badge className={info.cls}>{language === "ar" ? info.ar : info.en}</Badge>;
  };

  const openDetail = async (user: UserRole & { profile?: Profile }) => {
    setSelectedUser(user);
    setShowDetailDialog(true);
    if (user.profile) {
      const urls: Record<string, string> = {};
      const docFields = ['live_photo_url', 'id_photo_url', 'university_cert_url'] as const;
      await Promise.all(docFields.map(async (field) => {
        const val = user.profile?.[field];
        if (val) { const signed = await getSignedUrl(val); if (signed) urls[field] = signed; }
      }));
      if (user.profile.additional_certs_urls) {
        await Promise.all(user.profile.additional_certs_urls.map(async (url, i) => {
          const signed = await getSignedUrl(url); if (signed) urls[`cert_${i}`] = signed;
        }));
      }
      setSignedUrls(urls);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "approved" || status === "active") return <Badge className="bg-green-100 text-green-700 border-green-300">{language === "ar" ? "نشط" : "Active"}</Badge>;
    if (status === "rejected" || status === "cancelled") return <Badge variant="destructive">{language === "ar" ? "ملغي" : "Cancelled"}</Badge>;
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 border-amber-300">{language === "ar" ? "قيد الانتظار" : "Pending"}</Badge>;
    if (status === "expired") return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{language === "ar" ? "منتهي" : "Expired"}</Badge>;
    if (status === "live") return <Badge className="bg-red-100 text-red-700 border-red-300">{language === "ar" ? "مباشر" : "Live"}</Badge>;
    if (status === "scheduled") return <Badge className="bg-blue-100 text-blue-700 border-blue-300">{language === "ar" ? "مجدول" : "Scheduled"}</Badge>;
    if (status === "ended") return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{language === "ar" ? "انتهى" : "Ended"}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US");

  const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="mb-4 relative max-w-md">
      <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="ps-10" />
    </div>
  );

  const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
    <div className="text-center py-16">
      <Icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-lg text-muted-foreground">{text}</p>
    </div>
  );

  const exportCSV = (filename: string, headers: string[], rows: string[][]) => {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(c => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast({ title: language === "ar" ? "تم التصدير" : "Exported", description: filename });
  };

  const exportUsers = () => {
    const h = [language === "ar" ? "الاسم" : "Name", language === "ar" ? "البريد" : "Email", language === "ar" ? "الهاتف" : "Phone", language === "ar" ? "الدور" : "Role", language === "ar" ? "المنصة" : "Platform", language === "ar" ? "الحالة" : "Status", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("users.csv", h, filteredUsers.map(u => [u.profile?.full_name || "", u.profile?.email || "", u.profile?.phone || "", u.role, u.profile?.platform || "", u.approved ? "Approved" : "Pending", fmtDate(u.created_at)]));
  };

  const exportSchools = () => {
    const h = [language === "ar" ? "اسم المدرسة" : "School", language === "ar" ? "المدير" : "Principal", language === "ar" ? "المدينة" : "City", language === "ar" ? "الهاتف" : "Phone", language === "ar" ? "البريد" : "Email", language === "ar" ? "عدد الطلاب" : "Students", language === "ar" ? "الحالة" : "Status", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("schools.csv", h, filteredSchools.map(s => [s.school_name, s.principal_name, s.city, s.phone, s.email, String(s.student_count || 0), s.status, fmtDate(s.created_at)]));
  };

  const exportCourses = () => {
    const h = [language === "ar" ? "العنوان (عربي)" : "Title (AR)", language === "ar" ? "العنوان (إنجليزي)" : "Title (EN)", language === "ar" ? "المدرب" : "Instructor", language === "ar" ? "التصنيف" : "Category", language === "ar" ? "الحلقات" : "Episodes", language === "ar" ? "مجاني" : "Free", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("courses.csv", h, filteredCourses.map(c => [c.title_ar, c.title_en, language === "ar" ? c.instructor_ar : c.instructor_en, language === "ar" ? c.category_ar : c.category_en, String(c.episode_count), c.is_free ? "Yes" : "No", fmtDate(c.created_at)]));
  };

  const exportBooks = () => {
    const h = [language === "ar" ? "العنوان (عربي)" : "Title (AR)", language === "ar" ? "العنوان (إنجليزي)" : "Title (EN)", language === "ar" ? "المؤلف" : "Author", language === "ar" ? "التصنيف" : "Category", language === "ar" ? "السعر" : "Price", language === "ar" ? "التقييم" : "Rating", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("books.csv", h, filteredBooks.map(b => [b.title_ar, b.title_en, language === "ar" ? b.author_ar : b.author_en, b.category, String(b.price), String(b.rating || 0), fmtDate(b.created_at)]));
  };

  const exportOrders = () => {
    const h = [language === "ar" ? "الكتاب" : "Book", language === "ar" ? "المشتري" : "Buyer", language === "ar" ? "البريد" : "Email", language === "ar" ? "المبلغ" : "Amount", language === "ar" ? "الحالة" : "Status", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("orders.csv", h, filteredOrders.map(o => [language === "ar" ? o.book?.title_ar || "" : o.book?.title_en || "", o.profile?.full_name || "", o.profile?.email || "", String(o.amount), o.status, fmtDate(o.created_at)]));
  };

  const exportSubscriptions = () => {
    const h = [language === "ar" ? "الدورة" : "Course", language === "ar" ? "المشترك" : "Subscriber", language === "ar" ? "الخطة" : "Plan", language === "ar" ? "المستوى" : "Level", language === "ar" ? "المبلغ" : "Amount", language === "ar" ? "الحالة" : "Status", language === "ar" ? "البداية" : "Start", language === "ar" ? "الانتهاء" : "Expiry"];
    exportCSV("subscriptions.csv", h, filteredSubs.map(s => [language === "ar" ? s.course?.title_ar || "" : s.course?.title_en || "", s.profile?.full_name || "", s.plan_type, String(s.level_number), String(s.amount_paid), s.status, fmtDate(s.starts_at), s.expires_at ? fmtDate(s.expires_at) : "—"]));
  };

  const exportStreams = () => {
    const h = [language === "ar" ? "العنوان (عربي)" : "Title (AR)", language === "ar" ? "العنوان (إنجليزي)" : "Title (EN)", language === "ar" ? "المحاضر" : "Lecturer", language === "ar" ? "الحالة" : "Status", language === "ar" ? "الموعد" : "Scheduled", language === "ar" ? "التاريخ" : "Date"];
    exportCSV("streams.csv", h, filteredStreams.map(s => [s.title_ar, s.title_en, s.profile?.full_name || "", s.status, s.scheduled_at ? fmtDate(s.scheduled_at) : "—", fmtDate(s.created_at)]));
  };

  const ExportButton = ({ onClick }: { onClick: () => void }) => (
    <Button variant="outline" size="sm" className="gap-1.5 mb-4" onClick={onClick}>
      <Download className="w-4 h-4" />{language === "ar" ? "تصدير CSV" : "Export CSV"}
    </Button>
  );

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-2">
              <Shield className="w-3 h-3 me-1" />{language === "ar" ? "لوحة التحكم" : "Control Panel"}
            </Badge>
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="max-w-full mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              {language === "ar" ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="w-4 h-4" />
              {language === "ar" ? "طلبات الانتظار" : "Pending"}
              {stats.pendingCount > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-1.5">
              <School className="w-4 h-4" />
              {language === "ar" ? "المدارس" : "Schools"}
              {stats.pendingSchools > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingSchools}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              {language === "ar" ? "المستخدمين" : "Users"}
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              {language === "ar" ? "الدورات" : "Courses"}
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-1.5">
              <BookMarked className="w-4 h-4" />
              {language === "ar" ? "الكتب" : "Books"}
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              {language === "ar" ? "الطلبات" : "Orders"}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5">
              <CreditCard className="w-4 h-4" />
              {language === "ar" ? "الاشتراكات" : "Subscriptions"}
            </TabsTrigger>
            <TabsTrigger value="streams" className="gap-1.5">
              <Radio className="w-4 h-4" />
              {language === "ar" ? "البث المباشر" : "Live Streams"}
            </TabsTrigger>
          </TabsList>

          {/* ===== Overview ===== */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { icon: Users, value: stats.totalUsers, label: language === "ar" ? "إجمالي المستخدمين" : "Total Users", color: "text-primary" },
                { icon: UserCheck, value: stats.totalLecturers, label: language === "ar" ? "محاضرون معتمدون" : "Approved Lecturers", color: "text-green-600" },
                { icon: Clock, value: stats.pendingCount, label: language === "ar" ? "بانتظار الموافقة" : "Pending Approval", color: "text-amber-500" },
                { icon: School, value: stats.pendingSchools, label: language === "ar" ? "طلبات مدارس" : "School Requests", color: "text-blue-600" },
                { icon: BookOpen, value: stats.totalCourses, label: language === "ar" ? "الدورات" : "Courses", color: "text-primary" },
                { icon: Eye, value: stats.totalViews, label: language === "ar" ? "المشاهدات" : "Views", color: "text-primary" },
                { icon: BookMarked, value: stats.totalBooks, label: language === "ar" ? "الكتب" : "Books", color: "text-purple-600" },
                { icon: ShoppingCart, value: stats.totalOrders, label: language === "ar" ? "طلبات الشراء" : "Orders", color: "text-orange-600" },
                { icon: CreditCard, value: stats.totalSubscriptions, label: language === "ar" ? "الاشتراكات" : "Subscriptions", color: "text-teal-600" },
                { icon: Radio, value: stats.totalStreams, label: language === "ar" ? "البث المباشر" : "Streams", color: "text-red-600" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 text-center">
                    <s.icon className={`w-7 h-7 ${s.color} mx-auto mb-1`} />
                    <p className="text-2xl font-black text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick alerts */}
            {(stats.pendingCount > 0 || stats.pendingSchools > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {stats.pendingCount > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50 cursor-pointer" onClick={() => setActiveTab("pending")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingCount} {language === "ar" ? "طلب محاضر بانتظار المراجعة" : "pending lecturer requests"}</p>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "اضغط للمراجعة" : "Click to review"}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats.pendingSchools > 0 && (
                  <Card className="border-blue-200 bg-blue-50/50 cursor-pointer" onClick={() => setActiveTab("schools")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <School className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingSchools} {language === "ar" ? "طلب مدرسة بانتظار المراجعة" : "pending school requests"}</p>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "اضغط للمراجعة" : "Click to review"}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ===== Pending Lecturers ===== */}
          <TabsContent value="pending">
            {pendingLecturers.length === 0 ? (
              <EmptyState icon={CheckCircle} text={language === "ar" ? "لا توجد طلبات معلقة" : "No pending requests"} />
            ) : (
              <div className="grid gap-4">
                {pendingLecturers.map(lecturer => (
                  <Card key={lecturer.id} className="card-hover cursor-pointer" onClick={() => openDetail(lecturer)}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{lecturer.profile?.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{lecturer.profile?.email || "—"}</p>
                          <p className="text-xs text-muted-foreground">{lecturer.profile?.phone || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground me-3">{fmtDate(lecturer.created_at)}</p>
                        <Button size="sm" className="gap-1" onClick={e => { e.stopPropagation(); handleApprove(lecturer.id); }}>
                          <CheckCircle className="w-4 h-4" />{language === "ar" ? "قبول" : "Approve"}
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleReject(lecturer.id); }}>
                          <XCircle className="w-4 h-4" />{language === "ar" ? "رفض" : "Reject"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Schools ===== */}
          <TabsContent value="schools">
            <div className="flex items-center gap-4 flex-wrap">
              <SearchBar value={schoolSearchQuery} onChange={setSchoolSearchQuery} placeholder={language === "ar" ? "بحث باسم المدرسة أو المدينة..." : "Search by school name or city..."} />
              <ExportButton onClick={exportSchools} />
            </div>
            {filteredSchools.length === 0 ? (
              <EmptyState icon={School} text={language === "ar" ? "لا توجد طلبات تسجيل مدارس" : "No school registration requests"} />
            ) : (
              <div className="grid gap-4">
                {filteredSchools.map(school => {
                  const sb = school.status === "approved"
                    ? <Badge className="bg-green-100 text-green-700 border-green-300">{language === "ar" ? "مقبول" : "Approved"}</Badge>
                    : school.status === "rejected"
                    ? <Badge variant="destructive">{language === "ar" ? "مرفوض" : "Rejected"}</Badge>
                    : <Badge className="bg-amber-100 text-amber-700 border-amber-300">{language === "ar" ? "قيد المراجعة" : "Pending"}</Badge>;
                  return (
                    <Card key={school.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedSchool(school); setAdminNotes(school.admin_notes || ""); setShowSchoolDialog(true); }}>
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><School className="w-6 h-6 text-blue-600" /></div>
                          <div>
                            <p className="font-bold text-foreground">{school.school_name}</p>
                            <p className="text-sm text-muted-foreground">{school.principal_name} — {school.city}</p>
                            <p className="text-xs text-muted-foreground">{school.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {sb}
                          <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(school.created_at)}</p>
                          {school.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1" onClick={e => { e.stopPropagation(); handleSchoolApprove(school.id); }}>
                                <CheckCircle className="w-4 h-4" />{language === "ar" ? "قبول" : "Approve"}
                              </Button>
                              <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleSchoolReject(school.id); }}>
                                <XCircle className="w-4 h-4" />{language === "ar" ? "رفض" : "Reject"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== All Users ===== */}
          <TabsContent value="users">
            <div className="flex items-center gap-4 flex-wrap">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={language === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."} />
              <ExportButton onClick={exportUsers} />
            </div>
            <div className="grid gap-3">
              {filteredUsers.map(user => (
                <Card key={user.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openDetail(user)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{user.profile?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.profile?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {roleBadge(user.role, user.approved)}
                      <Badge variant="outline" className="text-xs">{user.profile?.platform || "courses"}</Badge>
                      <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(user.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && <EmptyState icon={Users} text={language === "ar" ? "لا توجد نتائج" : "No results found"} />}
            </div>
          </TabsContent>

          {/* ===== Courses ===== */}
          <TabsContent value="courses">
            <div className="flex items-center gap-4 flex-wrap">
              <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder={language === "ar" ? "بحث بعنوان الدورة أو المدرب..." : "Search by course title or instructor..."} />
              <ExportButton onClick={exportCourses} />
            </div>
            {filteredCourses.length === 0 ? (
              <EmptyState icon={BookOpen} text={language === "ar" ? "لا توجد دورات" : "No courses found"} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map(course => (
                  <Card key={course.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      {course.thumbnail_url && (
                        <img src={course.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />
                      )}
                      <p className="font-bold text-foreground text-sm mb-1">{language === "ar" ? course.title_ar : course.title_en}</p>
                      <p className="text-xs text-muted-foreground mb-2">{language === "ar" ? course.instructor_ar : course.instructor_en}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{language === "ar" ? course.category_ar : course.category_en}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          <PlayCircle className="w-3 h-3 me-1" />{course.episode_count} {language === "ar" ? "حلقة" : "episodes"}
                        </Badge>
                        {course.is_free && <Badge className="bg-green-100 text-green-700 text-xs">{language === "ar" ? "مجاني" : "Free"}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{fmtDate(course.created_at)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Books ===== */}
          <TabsContent value="books">
            <div className="flex items-center gap-4 flex-wrap">
              <SearchBar value={bookSearch} onChange={setBookSearch} placeholder={language === "ar" ? "بحث بعنوان الكتاب أو المؤلف..." : "Search by book title or author..."} />
              <ExportButton onClick={exportBooks} />
            </div>
            {filteredBooks.length === 0 ? (
              <EmptyState icon={BookMarked} text={language === "ar" ? "لا توجد كتب" : "No books found"} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBooks.map(book => (
                  <Card key={book.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      {book.cover_url && (
                        <img src={book.cover_url} alt="" className="w-full h-48 object-cover rounded-lg mb-3" />
                      )}
                      <p className="font-bold text-foreground text-sm mb-1">{language === "ar" ? book.title_ar : book.title_en}</p>
                      <p className="text-xs text-muted-foreground mb-2">{language === "ar" ? book.author_ar : book.author_en}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{book.category}</Badge>
                        <span className="font-bold text-sm text-primary">{book.price} {language === "ar" ? "ج.م" : "EGP"}</span>
                        {book.is_bestseller && <Badge className="bg-amber-100 text-amber-700 text-xs">{language === "ar" ? "الأكثر مبيعاً" : "Bestseller"}</Badge>}
                        {book.is_new && <Badge className="bg-green-100 text-green-700 text-xs">{language === "ar" ? "جديد" : "New"}</Badge>}
                      </div>
                      {book.rating !== null && (
                        <p className="text-xs text-muted-foreground mt-2">⭐ {book.rating} ({book.reviews_count} {language === "ar" ? "تقييم" : "reviews"})</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Orders ===== */}
          <TabsContent value="orders">
            <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder={language === "ar" ? "بحث بعنوان الكتاب أو اسم المشتري..." : "Search by book or buyer..."} />
            {filteredOrders.length === 0 ? (
              <EmptyState icon={ShoppingCart} text={language === "ar" ? "لا توجد طلبات" : "No orders found"} />
            ) : (
              <div className="grid gap-3">
                {filteredOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{language === "ar" ? order.book?.title_ar : order.book?.title_en || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.profile?.full_name || "—"} • {order.profile?.email || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-primary">{order.amount} {language === "ar" ? "ج.م" : "EGP"}</span>
                        {statusBadge(order.status)}
                        <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(order.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Subscriptions ===== */}
          <TabsContent value="subscriptions">
            <SearchBar value={subSearch} onChange={setSubSearch} placeholder={language === "ar" ? "بحث بعنوان الدورة أو اسم المشترك..." : "Search by course or subscriber..."} />
            {filteredSubs.length === 0 ? (
              <EmptyState icon={CreditCard} text={language === "ar" ? "لا توجد اشتراكات" : "No subscriptions found"} />
            ) : (
              <div className="grid gap-3">
                {filteredSubs.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{language === "ar" ? sub.course?.title_ar : sub.course?.title_en || "—"}</p>
                          <p className="text-xs text-muted-foreground">{sub.profile?.full_name || "—"} • {language === "ar" ? "المستوى" : "Level"} {sub.level_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{sub.plan_type}</Badge>
                        <span className="font-bold text-sm text-primary">{sub.amount_paid} {language === "ar" ? "ج.م" : "EGP"}</span>
                        {statusBadge(sub.status)}
                        <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(sub.starts_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Live Streams ===== */}
          <TabsContent value="streams">
            <SearchBar value={streamSearch} onChange={setStreamSearch} placeholder={language === "ar" ? "بحث بعنوان البث أو اسم المحاضر..." : "Search by stream title or lecturer..."} />
            {filteredStreams.length === 0 ? (
              <EmptyState icon={Radio} text={language === "ar" ? "لا توجد بثوث مباشرة" : "No live streams found"} />
            ) : (
              <div className="grid gap-3">
                {filteredStreams.map(stream => (
                  <Card key={stream.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stream.status === "live" ? "bg-red-100" : "bg-blue-100"}`}>
                          <Radio className={`w-5 h-5 ${stream.status === "live" ? "text-red-600" : "text-blue-600"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{language === "ar" ? stream.title_ar : stream.title_en}</p>
                          <p className="text-xs text-muted-foreground">{stream.profile?.full_name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(stream.status)}
                        {stream.scheduled_at && (
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            <Calendar className="w-3 h-3 inline me-1" />{fmtDate(stream.scheduled_at)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(stream.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* School Detail Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل طلب المدرسة" : "School Registration Details"}</DialogTitle>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"><School className="w-8 h-8 text-blue-600" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedSchool.school_name}</p>
                  {statusBadge(selectedSchool.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "مدير المدرسة" : "Principal"}</p>
                    <p className="font-medium text-foreground">{selectedSchool.principal_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "المدينة" : "City"}</p>
                    <p className="font-medium text-foreground">{selectedSchool.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "الهاتف" : "Phone"}</p>
                    <p className="font-medium text-foreground">{selectedSchool.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">{language === "ar" ? "البريد" : "Email"}</p>
                    <p className="font-medium text-foreground">{selectedSchool.email}</p>
                  </div>
                </div>
              </div>
              {selectedSchool.address && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{language === "ar" ? "العنوان" : "Address"}</p>
                  <p className="font-medium text-foreground">{selectedSchool.address}</p>
                </div>
              )}
              {selectedSchool.student_count && selectedSchool.student_count > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{language === "ar" ? "عدد الطلاب" : "Student Count"}</p>
                  <p className="font-medium text-foreground">{selectedSchool.student_count}</p>
                </div>
              )}
              {selectedSchool.message && (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{language === "ar" ? "رسالة المدرسة" : "School Message"}</p>
                  <p className="font-medium text-foreground mt-1">{selectedSchool.message}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-4 h-4" />{language === "ar" ? "ملاحظات الأدمن" : "Admin Notes"}</p>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={language === "ar" ? "أضف ملاحظاتك هنا..." : "Add your notes here..."} className="min-h-[80px]" />
              </div>
              {selectedSchool.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" onClick={() => handleSchoolApprove(selectedSchool.id)}>
                    <CheckCircle className="w-4 h-4" />{language === "ar" ? "قبول الطلب" : "Approve"}
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleSchoolReject(selectedSchool.id)}>
                    <XCircle className="w-4 h-4" />{language === "ar" ? "رفض الطلب" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل المستخدم" : "User Details"}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {signedUrls.live_photo_url ? (
                  <img src={signedUrls.live_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><Users className="w-8 h-8 text-muted-foreground" /></div>
                )}
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedUser.profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.profile?.email}</p>
                  <div className="flex gap-2 mt-1">
                    {roleBadge(selectedUser.role, selectedUser.approved)}
                    <Badge variant="outline" className="text-xs">{selectedUser.profile?.platform || "courses"}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "الهاتف" : "Phone"}</p>
                  <p className="font-medium text-foreground">{selectedUser.profile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "تاريخ التسجيل" : "Registered"}</p>
                  <p className="font-medium text-foreground">{fmtDate(selectedUser.created_at)}</p>
                </div>
              </div>
              {selectedUser.role === "lecturer" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{language === "ar" ? "المستندات المرفقة" : "Attached Documents"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.profile?.id_photo_url && signedUrls.id_photo_url && (
                      <a href={signedUrls.id_photo_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <Shield className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? "صورة الهوية" : "ID Photo"}</p>
                      </a>
                    )}
                    {selectedUser.profile?.university_cert_url && signedUrls.university_cert_url && (
                      <a href={signedUrls.university_cert_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <GraduationCap className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? "الشهادة الجامعية" : "University Cert"}</p>
                      </a>
                    )}
                    {selectedUser.profile?.additional_certs_urls?.map((url, i) => signedUrls[`cert_${i}`] && (
                      <a key={i} href={signedUrls[`cert_${i}`]} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? `شهادة إضافية ${i + 1}` : `Certificate ${i + 1}`}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedUser.role === "lecturer" && !selectedUser.approved && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" onClick={() => handleApprove(selectedUser.id)}>
                    <CheckCircle className="w-4 h-4" />{language === "ar" ? "قبول المحاضر" : "Approve Lecturer"}
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleReject(selectedUser.id)}>
                    <XCircle className="w-4 h-4" />{language === "ar" ? "رفض الطلب" : "Reject Request"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
