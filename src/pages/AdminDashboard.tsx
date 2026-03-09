import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, LogOut, Users, UserCheck, UserX, Shield,
  BookOpen, Eye, Search, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "lecturer" | "student";
  approved: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  university_cert_url: string | null;
  additional_certs_urls: string[] | null;
  id_photo_url: string | null;
  live_photo_url: string | null;
  created_at: string;
}

const getSignedUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null;
  // If it's already a full URL (legacy data), extract the path
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
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingLecturers, setPendingLecturers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [allUsers, setAllUsers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalLecturers: 0, pendingCount: 0, totalCourses: 0, totalViews: 0 });

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
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setLoading(false);
  };

  const loadPending = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").eq("role", "lecturer").eq("approved", false);
    if (!roles) { setPendingLecturers([]); return; }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);

    const merged = roles.map(r => ({
      ...r,
      profile: (profiles || []).find(p => p.user_id === r.user_id),
    }));
    setPendingLecturers(merged);
  };

  const loadAllUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (!roles) { setAllUsers([]); return; }

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);

    const merged = roles.map(r => ({
      ...r,
      profile: (profiles || []).find(p => p.user_id === r.user_id),
    }));
    setAllUsers(merged);
  };

  const loadStats = async () => {
    const [
      { count: totalUsers },
      { count: totalLecturers },
      { count: pendingCount },
      { count: totalCourses },
      { count: totalViews },
    ] = await Promise.all([
      supabase.rpc("get_profile_count"),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer").eq("approved", true),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer").eq("approved", false),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("course_views").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      totalUsers: Number(totalUsers) || 0,
      totalLecturers: totalLecturers || 0,
      pendingCount: pendingCount || 0,
      totalCourses: totalCourses || 0,
      totalViews: totalViews || 0,
    });
  };

  const handleApprove = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").update({ approved: true }).eq("id", roleId);
    if (error) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تمت الموافقة على المحاضر" : "Lecturer approved" });
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const handleReject = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: language === "ar" ? "تم" : "Done", description: language === "ar" ? "تم رفض الطلب" : "Request rejected" });
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const filteredUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.profile?.full_name?.toLowerCase().includes(q) ||
      u.profile?.email?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const roleBadge = (role: string, approved: boolean) => {
    if (role === "admin") return <Badge className="bg-primary/20 text-primary border-primary/30">{language === "ar" ? "مسؤول" : "Admin"}</Badge>;
    if (role === "lecturer" && approved) return <Badge className="bg-green-100 text-green-700 border-green-300">{language === "ar" ? "محاضر معتمد" : "Approved Lecturer"}</Badge>;
    if (role === "lecturer" && !approved) return <Badge className="bg-amber-100 text-amber-700 border-amber-300">{language === "ar" ? "بانتظار الموافقة" : "Pending"}</Badge>;
    return <Badge variant="secondary">{language === "ar" ? "طالب" : "Student"}</Badge>;
  };

  const openDetail = (user: UserRole & { profile?: Profile }) => {
    setSelectedUser(user);
    setShowDetailDialog(true);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-2">
              <Shield className="w-3 h-3 me-1" />{language === "ar" ? "لوحة الأدمن" : "Admin Panel"}
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center">
            <Users className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي المستخدمين" : "Total Users"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <UserCheck className="w-7 h-7 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{stats.totalLecturers}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "محاضرون معتمدون" : "Approved Lecturers"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Clock className="w-7 h-7 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{stats.pendingCount}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "بانتظار الموافقة" : "Pending Approval"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <BookOpen className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{stats.totalCourses}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "الدورات" : "Courses"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Eye className="w-7 h-7 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-foreground">{stats.totalViews}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "المشاهدات" : "Views"}</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="w-4 h-4" />
              {language === "ar" ? "طلبات الانتظار" : "Pending Requests"}
              {stats.pendingCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" />
              {language === "ar" ? "جميع المستخدمين" : "All Users"}
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            {pendingLecturers.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{language === "ar" ? "لا توجد طلبات معلقة" : "No pending requests"}</p>
              </div>
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
                        <p className="text-xs text-muted-foreground me-3">
                          {new Date(lecturer.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </p>
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

          {/* All Users Tab */}
          <TabsContent value="users">
            <div className="mb-4 relative max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ps-10"
              />
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
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(user.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد نتائج" : "No results found"}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل المستخدم" : "User Details"}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.profile?.live_photo_url ? (
                  <img src={selectedUser.profile.live_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedUser.profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.profile?.email}</p>
                  {roleBadge(selectedUser.role, selectedUser.approved)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "الهاتف" : "Phone"}</p>
                  <p className="font-medium text-foreground">{selectedUser.profile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === "ar" ? "تاريخ التسجيل" : "Registered"}</p>
                  <p className="font-medium text-foreground">{new Date(selectedUser.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</p>
                </div>
              </div>

              {/* Documents for lecturers */}
              {selectedUser.role === "lecturer" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{language === "ar" ? "المستندات المرفقة" : "Attached Documents"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.profile?.id_photo_url && (
                      <a href={selectedUser.profile.id_photo_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <Shield className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? "صورة الهوية" : "ID Photo"}</p>
                      </a>
                    )}
                    {selectedUser.profile?.university_cert_url && (
                      <a href={selectedUser.profile.university_cert_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <GraduationCap className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? "الشهادة الجامعية" : "University Cert"}</p>
                      </a>
                    )}
                    {selectedUser.profile?.additional_certs_urls?.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium">{language === "ar" ? `شهادة إضافية ${i + 1}` : `Certificate ${i + 1}`}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions for pending lecturers */}
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
