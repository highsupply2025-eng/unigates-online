import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, Users, UserCheck, Shield,
  BookOpen, Eye, Search, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight,
  School, MapPin, Phone, Mail, MessageSquare, FileText, CreditCard,
  BarChart3, ShoppingCart, BookMarked, Radio, Bell, Send,
  Calendar, PlayCircle, Download, Trash2, Pencil, Landmark, LinkIcon, Copy, Building2
} from "lucide-react";

import AdminPreviewLinks from "@/components/AdminPreviewLinks";
import AllPagesDropdown from "@/components/AllPagesDropdown";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import BackButton from "@/components/BackButton";
import TestAccountsPanel from "@/components/TestAccountsPanel";
import { StudentPillActivityChart as SectionsActivityChart } from "@/components/StudentPillActivityChart";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Interfaces ──
interface UserRole { id: string; user_id: string; role: string; approved: boolean; created_at: string; }
interface SchoolRegistration { id: string; school_name: string; principal_name: string; city: string; phone: string; email: string; student_count: number | null; address: string | null; message: string | null; status: string; created_at: string; }
interface ProfileDocuments { id_photo_url: string | null; university_cert_url: string | null; additional_certs_urls: string[] | null; live_photo_url: string | null; }
interface Profile { id: string; user_id: string; full_name: string; email: string; phone: string; role: string; platform: string; created_at: string; documents?: ProfileDocuments | null; }
interface Course { id: string; title_ar: string; title_en: string; instructor_ar: string; instructor_en: string; category_ar: string; category_en: string; episode_count: number; is_free: boolean; thumbnail_url: string | null; created_at: string; }
interface Book { id: string; title_ar: string; title_en: string; author_ar: string; author_en: string; category: string; price: number; original_price: number | null; is_bestseller: boolean | null; is_new: boolean | null; is_active: boolean | null; rating: number | null; reviews_count: number | null; cover_url: string | null; created_at: string; }
interface BookOrder { id: string; user_id: string; book_id: string; amount: number; status: string; created_at: string; book?: Book; profile?: Profile; }
interface Subscription { id: string; user_id: string; course_id: string; level_number: number; plan_type: string; amount_paid: number; status: string; starts_at: string; expires_at: string | null; created_at: string; course?: Course; profile?: Profile; }
interface LiveStream { id: string; title_ar: string; title_en: string; creator_id: string; course_id: string | null; status: string; scheduled_at: string | null; created_at: string; profile?: Profile; }
interface CollegeRegistration { id: string; college_name: string; dean_name: string; city: string; phone: string; email: string; student_count: number | null; address: string | null; message: string | null; status: string; email_confirmed: boolean; logo_url: string | null; created_at: string; }
interface CollegeInvitation { id: string; college_id: string; invitation_code: string; role: string; max_uses: number; used_count: number; is_active: boolean; created_at: string; college?: CollegeRegistration; }
interface CollegeMember { id: string; college_id: string; user_id: string; role: string; joined_at: string; college?: CollegeRegistration; profile?: Profile; }
interface InstituteRegistration { id: string; institute_name: string; director_name: string; city: string; phone: string; email: string; student_count: number | null; specialization: string | null; address: string | null; message: string | null; status: string; created_at: string; email_confirmed?: boolean | null; }
interface Department { id: string; institution_id: string; institution_type: string; department_name: string; student_count: number; status: string; payment_status: string; payment_amount: number; created_at: string; }
interface DepartmentMember { id: string; department_id: string; full_name: string; role: string; date_of_birth: string | null; photo_url: string | null; invitation_code: string | null; user_id: string | null; created_at: string; }

const getSignedUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null;
  const storagePath = path.includes('/storage/v1/object/public/user-documents/') ? path.split('/storage/v1/object/public/user-documents/')[1] : path;
  const { data } = await supabase.storage.from("user-documents").createSignedUrl(storagePath, 3600);
  return data?.signedUrl || null;
};

const AdminDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

  const [pendingLecturers, setPendingLecturers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [allUsers, setAllUsers] = useState<(UserRole & { profile?: Profile })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const [schoolRegistrations, setSchoolRegistrations] = useState<SchoolRegistration[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRegistration | null>(null);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookOrders, setBookOrders] = useState<BookOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subSearch, setSubSearch] = useState("");
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [streamSearch, setStreamSearch] = useState("");

  // College states
  const [colleges, setColleges] = useState<CollegeRegistration[]>([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<CollegeRegistration | null>(null);
  const [showCollegeDialog, setShowCollegeDialog] = useState(false);
  const [collegeAdminNotes, setCollegeAdminNotes] = useState("");
  const [collegeInvitations, setCollegeInvitations] = useState<CollegeInvitation[]>([]);
  const [collegeMembers, setCollegeMembers] = useState<CollegeMember[]>([]);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [newInvitationCollegeId, setNewInvitationCollegeId] = useState("");
  const [newInvitationRole, setNewInvitationRole] = useState("student");
  const [newInvitationMaxUses, setNewInvitationMaxUses] = useState("0");

  // Institute states
  const [institutes, setInstitutes] = useState<InstituteRegistration[]>([]);
  const [instituteSearch, setInstituteSearch] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteRegistration | null>(null);
  const [showInstituteDialog, setShowInstituteDialog] = useState(false);
  const [instituteAdminNotes, setInstituteAdminNotes] = useState("");

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [selectedDeptInstitutionId, setSelectedDeptInstitutionId] = useState("");
  const [selectedDeptInstitutionType, setSelectedDeptInstitutionType] = useState<"college" | "institute">("college");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStudentCount, setNewDeptStudentCount] = useState("");
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("student");
  const [newMemberDob, setNewMemberDob] = useState("");

  // Payment states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDept, setPaymentDept] = useState<Department | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentCardName, setPaymentCardName] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState("");
  const [paymentCvv, setPaymentCvv] = useState("");

  // Invitation codes display
  const [showInvitationCodesDialog, setShowInvitationCodesDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<DepartmentMember[]>([]);
  const [selectedCodesInstType, setSelectedCodesInstType] = useState<"college" | "institute">("college");

  const [stats, setStats] = useState({ totalUsers: 0, totalLecturers: 0, pendingCount: 0, totalCourses: 0, totalViews: 0, pendingSchools: 0, totalBooks: 0, totalOrders: 0, totalSubscriptions: 0, totalStreams: 0, totalRevenue: 0, totalColleges: 0, pendingColleges: 0, totalInstitutes: 0, pendingInstitutes: 0, totalDepartments: 0, pendingDepartments: 0 });

  const [selectedUser, setSelectedUser] = useState<(UserRole & { profile?: Profile }) | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Edit/Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [editOrder, setEditOrder] = useState<BookOrder | null>(null);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [editStream, setEditStream] = useState<LiveStream | null>(null);


  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).eq("role", "admin").eq("approved", true);
    if (!roles || roles.length === 0) { navigate("/"); return; }
    setIsAdmin(true);
    await loadAll();
    setLoading(false);
  };

  const loadAll = () => Promise.all([loadPending(), loadAllUsers(), loadStats(), loadSchoolRegistrations(), loadCourses(), loadBooks(), loadOrders(), loadSubscriptions(), loadStreams(), loadColleges(), loadCollegeInvitations(), loadCollegeMembers(), loadInstitutes(), loadDepartments(), loadDepartmentMembers()]);

  const loadPending = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").eq("role", "lecturer").eq("approved", false);
    if (!roles || roles.length === 0) { setPendingLecturers([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", roles.map(r => r.user_id));
    setPendingLecturers(roles.map(r => ({ ...r, profile: (profiles || []).find(p => p.user_id === r.user_id) })));
  };

  const loadAllUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (!roles || roles.length === 0) { setAllUsers([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", roles.map(r => r.user_id));
    setAllUsers(roles.map(r => ({ ...r, profile: (profiles || []).find(p => p.user_id === r.user_id) })));
  };

  const loadSchoolRegistrations = async () => { const { data } = await supabase.from("school_registrations").select("*").order("created_at", { ascending: false }); setSchoolRegistrations(data || []); };
  const loadCourses = async () => { const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false }); setCourses(data || []); };
  const loadBooks = async () => { const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false }); setBooks(data || []); };

  const loadOrders = async () => {
    const { data: orders } = await supabase.from("book_orders").select("*").order("created_at", { ascending: false });
    if (!orders || orders.length === 0) { setBookOrders([]); return; }
    const [{ data: booksData }, { data: profilesData }] = await Promise.all([
      supabase.from("books").select("*").in("id", [...new Set(orders.map(o => o.book_id))]),
      supabase.from("profiles").select("*").in("user_id", [...new Set(orders.map(o => o.user_id))]),
    ]);
    setBookOrders(orders.map(o => ({ ...o, book: (booksData || []).find(b => b.id === o.book_id), profile: (profilesData || []).find(p => p.user_id === o.user_id) })));
  };

  const loadSubscriptions = async () => {
    const { data: subs } = await supabase.from("user_subscriptions").select("*").order("created_at", { ascending: false });
    if (!subs || subs.length === 0) { setSubscriptions([]); return; }
    const [{ data: coursesData }, { data: profilesData }] = await Promise.all([
      supabase.from("courses").select("*").in("id", [...new Set(subs.map(s => s.course_id))]),
      supabase.from("profiles").select("*").in("user_id", [...new Set(subs.map(s => s.user_id))]),
    ]);
    setSubscriptions(subs.map(s => ({ ...s, course: (coursesData || []).find(c => c.id === s.course_id), profile: (profilesData || []).find(p => p.user_id === s.user_id) })));
  };

  const loadStreams = async () => {
    const { data: streams } = await supabase.from("live_streams").select("*").order("created_at", { ascending: false });
    if (!streams || streams.length === 0) { setLiveStreams([]); return; }
    const { data: profilesData } = await supabase.from("profiles").select("*").in("user_id", [...new Set(streams.map(s => s.creator_id))]);
    setLiveStreams(streams.map(s => ({ ...s, profile: (profilesData || []).find(p => p.user_id === s.creator_id) })));
  };


  const loadColleges = async () => {
    const { data } = await supabase.from("college_registrations").select("*").eq("email_confirmed", true).order("created_at", { ascending: false });
    setColleges(data || []);
  };

  const loadCollegeInvitations = async () => {
    const { data: invitations } = await supabase.from("college_invitations").select("*").order("created_at", { ascending: false });
    if (!invitations || invitations.length === 0) { setCollegeInvitations([]); return; }
    const collegeIds = [...new Set(invitations.map(i => i.college_id))];
    const { data: collegesData } = await supabase.from("college_registrations").select("*").in("id", collegeIds);
    setCollegeInvitations(invitations.map(i => ({ ...i, college: (collegesData || []).find(c => c.id === i.college_id) })));
  };

  const loadCollegeMembers = async () => {
    const { data: members } = await supabase.from("college_members").select("*").order("joined_at", { ascending: false });
    if (!members || members.length === 0) { setCollegeMembers([]); return; }
    const collegeIds = [...new Set(members.map(m => m.college_id))];
    const userIds = [...new Set(members.map(m => m.user_id))];
    const [{ data: collegesData }, { data: profilesData }] = await Promise.all([
      supabase.from("college_registrations").select("*").in("id", collegeIds),
      supabase.from("profiles").select("*").in("user_id", userIds),
    ]);
    setCollegeMembers(members.map(m => ({ ...m, college: (collegesData || []).find(c => c.id === m.college_id), profile: (profilesData || []).find(p => p.user_id === m.user_id) })));
  };

  const loadInstitutes = async () => {
    const { data } = await supabase.from("institute_registrations" as any).select("*").order("created_at", { ascending: false });
    setInstitutes((data as any[]) || []);
  };

  const loadDepartments = async () => {
    const { data } = await supabase.from("departments" as any).select("*").order("created_at", { ascending: false });
    setDepartments((data as any[]) || []);
  };

  const loadDepartmentMembers = async () => {
    const { data } = await supabase.from("department_members" as any).select("*").order("created_at", { ascending: false });
    setDepartmentMembers((data as any[]) || []);
  };

  const loadStats = async () => {
    const [{ data: totalUsers }, { count: totalLecturers }, { count: pendingCount }, { count: totalCourses }, { count: totalViews }, { count: pendingSchools }, { count: totalBooks }, { count: totalOrders }, { count: totalSubscriptions }, { count: totalStreams }, { count: totalColleges }, { count: pendingColleges }, { count: totalInstitutes }, { count: pendingInstitutes }, { count: totalDepartments }, { count: pendingDepartments }] = await Promise.all([
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
      supabase.from("college_registrations").select("*", { count: "exact", head: true }).eq("email_confirmed", true),
      supabase.from("college_registrations").select("*", { count: "exact", head: true }).eq("status", "pending").eq("email_confirmed", true),
      supabase.from("institute_registrations" as any).select("*", { count: "exact", head: true }),
      supabase.from("institute_registrations" as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("departments" as any).select("*", { count: "exact", head: true }),
      supabase.from("departments" as any).select("*", { count: "exact", head: true }).eq("payment_status", "unpaid"),
    ]);
    setStats({ totalUsers: Number(totalUsers) || 0, totalLecturers: totalLecturers || 0, pendingCount: pendingCount || 0, totalCourses: totalCourses || 0, totalViews: totalViews || 0, pendingSchools: pendingSchools || 0, totalBooks: totalBooks || 0, totalOrders: totalOrders || 0, totalSubscriptions: totalSubscriptions || 0, totalStreams: totalStreams || 0, totalRevenue: 0, totalColleges: totalColleges || 0, pendingColleges: pendingColleges || 0, totalInstitutes: totalInstitutes || 0, pendingInstitutes: pendingInstitutes || 0, totalDepartments: totalDepartments || 0, pendingDepartments: pendingDepartments || 0 });
  };

  // ── CRUD Handlers ──
  const showSuccess = (msg: string) => toast({ title: language === "ar" ? "تم" : "Done", description: msg });
  const showError = (err: string) => toast({ title: language === "ar" ? "خطأ" : "Error", description: err, variant: "destructive" });

  const handleApprove = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").update({ approved: true }).eq("id", roleId);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تمت الموافقة" : "Approved");
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const handleReject = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم الرفض" : "Rejected");
    await Promise.all([loadPending(), loadAllUsers(), loadStats()]);
    setShowDetailDialog(false);
  };

  const upsertAdminNotes = async (kind: "college" | "institute" | "school", id: string, notes: string) => {
    const trimmed = notes.trim();
    if (!trimmed) {
      await supabase.from("registration_admin_notes").delete().eq("kind", kind).eq("registration_id", id);
      return;
    }
    await supabase.from("registration_admin_notes").upsert(
      { kind, registration_id: id, notes: trimmed, updated_at: new Date().toISOString() },
      { onConflict: "kind,registration_id" }
    );
  };

  const fetchAdminNotes = async (kind: "college" | "institute" | "school", id: string): Promise<string> => {
    const { data } = await supabase.from("registration_admin_notes").select("notes").eq("kind", kind).eq("registration_id", id).maybeSingle();
    return (data?.notes as string | null) || "";
  };

  const handleSchoolApprove = async (id: string) => {
    const { error } = await supabase.from("school_registrations").update({ status: "approved" }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("school", id, adminNotes);
    showSuccess(language === "ar" ? "تم قبول المدرسة" : "School approved");
    setShowSchoolDialog(false); setAdminNotes("");
    await Promise.all([loadSchoolRegistrations(), loadStats()]);
  };

  const handleSchoolReject = async (id: string) => {
    const { error } = await supabase.from("school_registrations").update({ status: "rejected" }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("school", id, adminNotes);
    showSuccess(language === "ar" ? "تم رفض المدرسة" : "School rejected");
    setShowSchoolDialog(false); setAdminNotes("");
    await Promise.all([loadSchoolRegistrations(), loadStats()]);
  };

  // College handlers
  const handleCollegeApprove = async (id: string) => {
    if (!colleges.find((college) => college.id === id)?.email_confirmed) {
      showError(language === "ar" ? "يجب تأكيد بريد الكلية قبل الموافقة" : "The college email must be confirmed before approval");
      return;
    }
    const { error } = await supabase.rpc("review_college_registration" as any, {
      _registration_id: id,
      _decision: "approved",
    });
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("college", id, collegeAdminNotes);
    showSuccess(language === "ar" ? "تم قبول الكلية" : "College approved");
    setShowCollegeDialog(false); setCollegeAdminNotes("");
    await Promise.all([loadColleges(), loadStats()]);
  };

  const handleCollegeReject = async (id: string) => {
    const { error } = await supabase.rpc("review_college_registration" as any, {
      _registration_id: id,
      _decision: "rejected",
    });
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("college", id, collegeAdminNotes);
    showSuccess(language === "ar" ? "تم رفض الكلية" : "College rejected");
    setShowCollegeDialog(false); setCollegeAdminNotes("");
    await Promise.all([loadColleges(), loadStats()]);
  };

  // Institute handlers
  const handleInstituteApprove = async (id: string) => {
    if (!institutes.find((institute) => institute.id === id)?.email_confirmed) {
      showError(language === "ar" ? "يجب تأكيد بريد المعهد قبل الموافقة" : "The institute email must be confirmed before approval");
      return;
    }
    const { error } = await supabase.from("institute_registrations" as any).update({ status: "approved" }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("institute", id, instituteAdminNotes);
    showSuccess(language === "ar" ? "تم قبول المعهد" : "Institute approved");
    setShowInstituteDialog(false); setInstituteAdminNotes("");
    await Promise.all([loadInstitutes(), loadStats()]);
  };

  const handleInstituteReject = async (id: string) => {
    const { error } = await supabase.from("institute_registrations" as any).update({ status: "rejected" }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    await upsertAdminNotes("institute", id, instituteAdminNotes);
    showSuccess(language === "ar" ? "تم رفض المعهد" : "Institute rejected");
    setShowInstituteDialog(false); setInstituteAdminNotes("");
    await Promise.all([loadInstitutes(), loadStats()]);
  };

  // Department handlers
  const handleCreateDepartment = async () => {
    if (!selectedDeptInstitutionId || !newDeptName) return;
    const studentCount = parseInt(newDeptStudentCount) || 0;
    const { error } = await supabase.from("departments" as any).insert({
      institution_id: selectedDeptInstitutionId,
      institution_type: selectedDeptInstitutionType,
      department_name: newDeptName,
      student_count: studentCount,
      payment_amount: studentCount * 299,
    });
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم إنشاء القسم" : "Department created");
    setShowDeptDialog(false); setNewDeptName(""); setNewDeptStudentCount("");
    await loadDepartments();
  };

  const handleAddDepartmentMember = async () => {
    if (!selectedDeptId || !newMemberName) return;
    const invCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const { error } = await supabase.from("department_members" as any).insert({
      department_id: selectedDeptId,
      full_name: newMemberName,
      role: newMemberRole,
      date_of_birth: newMemberDob || null,
      invitation_code: invCode,
    });
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم إضافة العضو" : "Member added");
    setNewMemberName(""); setNewMemberDob("");
    await loadDepartmentMembers();
  };

  // Payment handler
  const handleDeptPayment = async () => {
    if (!paymentDept) return;
    setPaymentProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    
    // Update department payment status
    const { error } = await supabase.from("departments" as any)
      .update({ payment_status: "paid", status: "active" })
      .eq("id", paymentDept.id);
    
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); setPaymentProcessing(false); return; }
    
    // Generate invitation codes for all members without one
    const members = getMembersForDepartment(paymentDept.id);
    for (const member of members) {
      if (!member.invitation_code) {
        const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
        await supabase.from("department_members" as any)
          .update({ invitation_code: code })
          .eq("id", member.id);
      }
    }
    
    setPaymentProcessing(false);
    setShowPaymentDialog(false);
    setPaymentCardNumber(""); setPaymentCardName(""); setPaymentExpiry(""); setPaymentCvv("");
    showSuccess(language === "ar" ? "تم الدفع بنجاح وتم توليد أكواد الدعوة" : "Payment successful, invitation codes generated");
    
    // Fetch fresh members for this department
    const { data: freshMembers } = await supabase.from("department_members" as any).select("*").eq("department_id", paymentDept.id);
    setGeneratedCodes((freshMembers as unknown as DepartmentMember[]) || []);
    setSelectedCodesInstType(paymentDept.institution_type as "college" | "institute");
    setShowInvitationCodesDialog(true);
    setPaymentDept(null);
    await Promise.all([loadDepartments(), loadDepartmentMembers()]);
  };

  const copyDeptInviteLink = (code: string, role: string, instType: "college" | "institute" = selectedCodesInstType) => {
    const instPath = instType === "college" ? "college" : "institute";
    const link = `${window.location.origin}/signup/${instPath}/${role}?code=${code}`;
    navigator.clipboard.writeText(link);
    showSuccess(language === "ar" ? "تم نسخ رابط الدعوة" : "Invitation link copied");
  };

  const handleCreateInvitation = async () => {
    if (!newInvitationCollegeId) return;
    const { error } = await supabase.from("college_invitations").insert({
      college_id: newInvitationCollegeId,
      role: newInvitationRole,
      max_uses: parseInt(newInvitationMaxUses) || 0,
    });
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم إنشاء رابط الدعوة" : "Invitation created");
    setShowCreateInvitation(false);
    setNewInvitationCollegeId("");
    setNewInvitationRole("student");
    setNewInvitationMaxUses("0");
    await loadCollegeInvitations();
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(link);
    showSuccess(language === "ar" ? "تم نسخ الرابط" : "Link copied");
  };

  // Generic delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    let error: any = null;
    if (type === "course") ({ error } = await supabase.from("courses").delete().eq("id", id));
    else if (type === "book") ({ error } = await supabase.from("books").delete().eq("id", id));
    else if (type === "order") ({ error } = await supabase.from("book_orders").delete().eq("id", id));
    else if (type === "subscription") ({ error } = await supabase.from("user_subscriptions").delete().eq("id", id));
    else if (type === "stream") ({ error } = await supabase.from("live_streams").delete().eq("id", id));
    else if (type === "school") ({ error } = await supabase.from("school_registrations").delete().eq("id", id));
    else if (type === "college") ({ error } = await supabase.from("college_registrations").delete().eq("id", id));
    else if (type === "invitation") ({ error } = await supabase.from("college_invitations").delete().eq("id", id));
    else if (type === "member") ({ error } = await supabase.from("college_members").delete().eq("id", id));
    else if (type === "institute") ({ error } = await supabase.from("institute_registrations" as any).delete().eq("id", id));
    else if (type === "department") ({ error } = await supabase.from("departments" as any).delete().eq("id", id));
    else if (type === "dept_member") ({ error } = await supabase.from("department_members" as any).delete().eq("id", id));
    else if (type === "user") {
      const user = allUsers.find(u => u.id === id);
      ({ error } = await supabase.from("user_roles").delete().eq("id", id));
      if (!error && user?.profile) await supabase.from("profiles").delete().eq("id", user.profile.id);
    }
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); setDeleteTarget(null); return; }
    showSuccess(language === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    setDeleteTarget(null);
    await loadAll();
  };

  // Save handlers
  const handleSaveCourse = async () => {
    if (!editCourse) return;
    const { id, title_ar, title_en, instructor_ar, instructor_en, category_ar, category_en, is_free } = editCourse;
    const { error } = await supabase.from("courses").update({ title_ar, title_en, instructor_ar, instructor_en, category_ar, category_en, is_free }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم تحديث الدورة" : "Course updated");
    setEditCourse(null); await loadCourses();
  };

  const handleSaveBook = async () => {
    if (!editBook) return;
    const { id, title_ar, title_en, author_ar, author_en, category, price, original_price, is_bestseller, is_new, is_active } = editBook;
    const { error } = await supabase.from("books").update({ title_ar, title_en, author_ar, author_en, category, price, original_price, is_bestseller, is_new, is_active }).eq("id", id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم تحديث الكتاب" : "Book updated");
    setEditBook(null); await loadBooks();
  };

  const handleSaveOrder = async () => {
    if (!editOrder) return;
    const { error } = await supabase.from("book_orders").update({ status: editOrder.status }).eq("id", editOrder.id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم تحديث الطلب" : "Order updated");
    setEditOrder(null); await loadOrders();
  };

  const handleSaveSub = async () => {
    if (!editSub) return;
    const { error } = await supabase.from("user_subscriptions").update({ status: editSub.status, plan_type: editSub.plan_type }).eq("id", editSub.id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم تحديث الاشتراك" : "Subscription updated");
    setEditSub(null); await loadSubscriptions();
  };

  const handleSaveStream = async () => {
    if (!editStream) return;
    const { error } = await supabase.from("live_streams").update({ title_ar: editStream.title_ar, title_en: editStream.title_en, status: editStream.status }).eq("id", editStream.id);
    if (error) { console.error("Operation failed:", error); showError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred"); return; }
    showSuccess(language === "ar" ? "تم تحديث البث" : "Stream updated");
    setEditStream(null); await loadStreams();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  // ── Filters ──
  const filteredSchools = schoolRegistrations.filter(s => { if (!schoolSearchQuery) return true; const q = schoolSearchQuery.toLowerCase(); return s.school_name.toLowerCase().includes(q) || s.principal_name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q); });
  const filteredUsers = allUsers.filter(u => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return u.profile?.full_name?.toLowerCase().includes(q) || u.profile?.email?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q); });
  const filteredCourses = courses.filter(c => { if (!courseSearch) return true; const q = courseSearch.toLowerCase(); return c.title_ar.toLowerCase().includes(q) || c.title_en.toLowerCase().includes(q) || c.instructor_ar.toLowerCase().includes(q) || c.instructor_en.toLowerCase().includes(q); });
  const filteredBooks = books.filter(b => { if (!bookSearch) return true; const q = bookSearch.toLowerCase(); return b.title_ar.toLowerCase().includes(q) || b.title_en.toLowerCase().includes(q) || b.author_ar.toLowerCase().includes(q) || b.author_en.toLowerCase().includes(q); });
  const filteredOrders = bookOrders.filter(o => { if (!orderSearch) return true; const q = orderSearch.toLowerCase(); return o.book?.title_ar?.toLowerCase().includes(q) || o.book?.title_en?.toLowerCase().includes(q) || o.profile?.full_name?.toLowerCase().includes(q) || o.status.toLowerCase().includes(q); });
  const filteredSubs = subscriptions.filter(s => { if (!subSearch) return true; const q = subSearch.toLowerCase(); return s.course?.title_ar?.toLowerCase().includes(q) || s.course?.title_en?.toLowerCase().includes(q) || s.profile?.full_name?.toLowerCase().includes(q); });
  const filteredStreams = liveStreams.filter(s => { if (!streamSearch) return true; const q = streamSearch.toLowerCase(); return s.title_ar.toLowerCase().includes(q) || s.title_en.toLowerCase().includes(q) || s.profile?.full_name?.toLowerCase().includes(q); });
  const filteredColleges = colleges.filter(c => { if (!collegeSearch) return true; const q = collegeSearch.toLowerCase(); return c.college_name.toLowerCase().includes(q) || c.dean_name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q); });
  const filteredInstitutes = institutes.filter(i => { if (!instituteSearch) return true; const q = instituteSearch.toLowerCase(); return i.institute_name.toLowerCase().includes(q) || i.director_name.toLowerCase().includes(q) || i.city.toLowerCase().includes(q); });

  // Department helpers
  const getDepartmentsForInstitution = (id: string) => departments.filter(d => d.institution_id === id);
  const getMembersForDepartment = (deptId: string) => departmentMembers.filter(m => m.department_id === deptId);

  const exportInstitutes = () => exportCSV("institutes.csv", [ar("المعهد","Institute"), ar("المدير","Director"), ar("المدينة","City"), ar("الهاتف","Phone"), ar("البريد","Email"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredInstitutes.map(i => [i.institute_name, i.director_name, i.city, i.phone, i.email, i.status, fmtDate(i.created_at)]));

  // ── Helpers ──
  const roleBadge = (role: string, approved: boolean) => {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
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
    const info = map[key] || { ar: role, en: role, cls: "" };
    return <Badge className={info.cls}>{language === "ar" ? info.ar : info.en}</Badge>;
  };

  const openDetail = async (user: UserRole & { profile?: Profile }) => {
    setSelectedUser(user); setShowDetailDialog(true);
    if (user.profile) {
      // Fetch identity documents from restricted table
      const { data: docsData } = await supabase
        .from('profile_documents')
        .select('id_photo_url, university_cert_url, additional_certs_urls, live_photo_url')
        .eq('user_id', user.profile.user_id)
        .maybeSingle();
      const docs: ProfileDocuments | null = docsData ?? null;
      if (user.profile) user.profile.documents = docs;

      const urls: Record<string, string> = {};
      if (docs) {
        for (const field of ['live_photo_url', 'id_photo_url', 'university_cert_url'] as const) {
          const val = docs[field];
          if (val) { const signed = await getSignedUrl(val); if (signed) urls[field] = signed; }
        }
        if (docs.additional_certs_urls) {
          for (let i = 0; i < docs.additional_certs_urls.length; i++) {
            const signed = await getSignedUrl(docs.additional_certs_urls[i]);
            if (signed) urls[`cert_${i}`] = signed;
          }
        }
      }
      setSignedUrls(urls);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { ar: string; en: string; cls: string }> = {
      approved: { ar: "مقبول", en: "Approved", cls: "bg-green-100 text-green-700 border-green-300" },
      active: { ar: "نشط", en: "Active", cls: "bg-green-100 text-green-700 border-green-300" },
      rejected: { ar: "مرفوض", en: "Rejected", cls: "bg-destructive text-destructive-foreground" },
      cancelled: { ar: "ملغي", en: "Cancelled", cls: "bg-destructive text-destructive-foreground" },
      pending: { ar: "قيد الانتظار", en: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-300" },
      expired: { ar: "منتهي", en: "Expired", cls: "bg-gray-100 text-gray-700 border-gray-300" },
      live: { ar: "مباشر", en: "Live", cls: "bg-red-100 text-red-700 border-red-300" },
      scheduled: { ar: "مجدول", en: "Scheduled", cls: "bg-blue-100 text-blue-700 border-blue-300" },
      ended: { ar: "انتهى", en: "Ended", cls: "bg-gray-100 text-gray-700 border-gray-300" },
    };
    const info = map[status] || { ar: status, en: status, cls: "" };
    return <Badge className={info.cls}>{language === "ar" ? info.ar : info.en}</Badge>;
  };

  const collegeStatusBadge = (status: string) => status === "pending"
    ? <Badge className="bg-amber-100 text-amber-700 border-amber-300">{ar("بانتظار موافقة الإدارة", "Pending Admin Approval")}</Badge>
    : statusBadge(status);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US");
  const ar = (a: string, e: string) => language === "ar" ? a : e;

  const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative max-w-md flex-1">
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

  // ── CSV Export ──
  const exportCSV = (filename: string, headers: string[], rows: string[][]) => {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(c => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showSuccess(filename);
  };

  const exportUsers = () => exportCSV("users.csv", [ar("الاسم","Name"), ar("البريد","Email"), ar("الهاتف","Phone"), ar("الدور","Role"), ar("المنصة","Platform"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredUsers.map(u => [u.profile?.full_name||"", u.profile?.email||"", u.profile?.phone||"", u.role, u.profile?.platform||"", u.approved?"Approved":"Pending", fmtDate(u.created_at)]));
  const exportSchools = () => exportCSV("schools.csv", [ar("المدرسة","School"), ar("المدير","Principal"), ar("المدينة","City"), ar("الهاتف","Phone"), ar("البريد","Email"), ar("الطلاب","Students"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredSchools.map(s => [s.school_name, s.principal_name, s.city, s.phone, s.email, String(s.student_count||0), s.status, fmtDate(s.created_at)]));
  const exportCourses = () => exportCSV("courses.csv", [ar("العنوان عربي","Title AR"), ar("العنوان إنجليزي","Title EN"), ar("المدرب","Instructor"), ar("التصنيف","Category"), ar("الحلقات","Episodes"), ar("مجاني","Free"), ar("التاريخ","Date")], filteredCourses.map(c => [c.title_ar, c.title_en, ar(c.instructor_ar,c.instructor_en), ar(c.category_ar,c.category_en), String(c.episode_count), c.is_free?"Yes":"No", fmtDate(c.created_at)]));
  const exportBooks = () => exportCSV("books.csv", [ar("العنوان عربي","Title AR"), ar("العنوان إنجليزي","Title EN"), ar("المؤلف","Author"), ar("التصنيف","Category"), ar("السعر","Price"), ar("التقييم","Rating"), ar("التاريخ","Date")], filteredBooks.map(b => [b.title_ar, b.title_en, ar(b.author_ar,b.author_en), b.category, String(b.price), String(b.rating||0), fmtDate(b.created_at)]));
  const exportOrders = () => exportCSV("orders.csv", [ar("الكتاب","Book"), ar("المشتري","Buyer"), ar("المبلغ","Amount"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredOrders.map(o => [ar(o.book?.title_ar||"",o.book?.title_en||""), o.profile?.full_name||"", String(o.amount), o.status, fmtDate(o.created_at)]));
  const exportSubscriptions = () => exportCSV("subscriptions.csv", [ar("الدورة","Course"), ar("المشترك","Subscriber"), ar("الخطة","Plan"), ar("المبلغ","Amount"), ar("الحالة","Status"), ar("البداية","Start")], filteredSubs.map(s => [ar(s.course?.title_ar||"",s.course?.title_en||""), s.profile?.full_name||"", s.plan_type, String(s.amount_paid), s.status, fmtDate(s.starts_at)]));
  const exportStreams = () => exportCSV("streams.csv", [ar("العنوان عربي","Title AR"), ar("العنوان إنجليزي","Title EN"), ar("المحاضر","Lecturer"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredStreams.map(s => [s.title_ar, s.title_en, s.profile?.full_name||"", s.status, fmtDate(s.created_at)]));
  const exportColleges = () => exportCSV("colleges.csv", [ar("الكلية","College"), ar("العميد","Dean"), ar("المدينة","City"), ar("الهاتف","Phone"), ar("البريد","Email"), ar("الحالة","Status"), ar("التاريخ","Date")], filteredColleges.map(c => [c.college_name, c.dean_name, c.city, c.phone, c.email, c.status, fmtDate(c.created_at)]));

  const ExportButton = ({ onClick }: { onClick: () => void }) => (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={onClick}>
      <Download className="w-4 h-4" />{ar("تصدير","Export CSV")}
    </Button>
  );

  const ActionButtons = ({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      {onEdit && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); onEdit(); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
    </div>
  );

  const ToolbarRow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 flex-wrap mb-4">{children}</div>
  );

  const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAdmin) return null;

  // Get members for a specific college
  const getMembersForCollege = (collegeId: string) => collegeMembers.filter(m => m.college_id === collegeId);
  const getInvitationsForCollege = (collegeId: string) => collegeInvitations.filter(i => i.college_id === collegeId);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-full mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">{isRtl ? "لوحة التحكم" : "Control Panel"}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">{isRtl ? "الادارة العامة" : "General Administration"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => navigate("/admin/security-center")}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isRtl ? "مركز الأمان" : "Security Center"}</span>
            </Button>

            <DashboardMenuDropdown
              onLanguageToggle={toggleLanguage}
              onLogout={handleLogout}
              items={[
                { key: "overview", label: isRtl ? "نظرة عامة" : "Overview", Icon: BarChart3, color: "from-blue-500 to-blue-600", onClick: () => setActiveTab("overview") },
                { key: "pending", label: isRtl ? "طلبات الانتظار" : "Pending", Icon: Clock, color: "from-amber-500 to-amber-600", onClick: () => setActiveTab("pending") },
                { key: "colleges", label: isRtl ? "الكليات" : "Colleges", Icon: Landmark, color: "from-indigo-500 to-indigo-600", onClick: () => setActiveTab("colleges") },
                { key: "institutes", label: isRtl ? "المعاهد" : "Institutes", Icon: Landmark, color: "from-violet-500 to-violet-600", onClick: () => setActiveTab("institutes") },
                { key: "schools", label: isRtl ? "المدارس" : "Schools", Icon: School, color: "from-cyan-500 to-cyan-600", onClick: () => setActiveTab("schools") },
                { key: "users", label: isRtl ? "المستخدمين" : "Users", Icon: Users, color: "from-emerald-500 to-emerald-600", onClick: () => setActiveTab("users") },
                { key: "courses", label: isRtl ? "الدورات" : "Courses", Icon: BookOpen, color: "from-amber-500 to-amber-600", onClick: () => setActiveTab("courses") },
                { key: "books", label: isRtl ? "الكتب" : "Books", Icon: BookMarked, color: "from-pink-500 to-pink-600", onClick: () => setActiveTab("books") },
                { key: "orders", label: isRtl ? "الطلبات" : "Orders", Icon: ShoppingCart, color: "from-orange-500 to-orange-600", onClick: () => setActiveTab("orders") },
                { key: "subscriptions", label: isRtl ? "الاشتراكات" : "Subscriptions", Icon: CreditCard, color: "from-teal-500 to-teal-600", onClick: () => setActiveTab("subscriptions") },
                { key: "streams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-red-600", onClick: () => setActiveTab("streams") },
                { key: "departments", label: isRtl ? "الأقسام" : "Departments", Icon: Building2, color: "from-slate-500 to-slate-600", onClick: () => setActiveTab("departments_admin") },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 sm:mb-8 flex-wrap h-auto gap-1 p-1 justify-start">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><BarChart3 className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("نظرة عامة","Overview")}</span></TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Clock className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("طلبات الانتظار","Pending")}</span>{stats.pendingCount > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingCount}</Badge>}</TabsTrigger>
            <TabsTrigger value="schools" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><School className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("المدارس","Schools")}</span>{stats.pendingSchools > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingSchools}</Badge>}</TabsTrigger>
            <TabsTrigger value="colleges" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Landmark className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الكليات","Colleges")}</span>{stats.pendingColleges > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingColleges}</Badge>}</TabsTrigger>
            <TabsTrigger value="institutes" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Landmark className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("المعاهد","Institutes")}</span>{stats.pendingInstitutes > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingInstitutes}</Badge>}</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Users className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("المستخدمين","Users")}</span></TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><BookOpen className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الدورات","Courses")}</span></TabsTrigger>
            <TabsTrigger value="books" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><BookMarked className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الكتب","Books")}</span></TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><ShoppingCart className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الطلبات","Orders")}</span></TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><CreditCard className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الاشتراكات","Subscriptions")}</span></TabsTrigger>
            <TabsTrigger value="streams" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Radio className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("البث المباشر","Live Streams")}</span></TabsTrigger>
            <TabsTrigger value="departments_admin" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3"><Building2 className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{ar("الأقسام","Departments")}</span>{stats.pendingDepartments > 0 && <Badge className="bg-destructive text-destructive-foreground ms-1 text-xs px-1.5 py-0">{stats.pendingDepartments}</Badge>}</TabsTrigger>
            
          </TabsList>

          {/* ===== Overview ===== */}
          <TabsContent value="overview" dir={isRtl ? "rtl" : "ltr"}>
            <AdminPreviewLinks />

            {/* Primary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              {[
                { icon: Users, value: stats.totalUsers, label: ar("إجمالي المستخدمين","Total Users"), color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
                { icon: UserCheck, value: stats.totalLecturers, label: ar("محاضرون معتمدون","Approved Lecturers"), color: "from-green-500 to-green-600", bgLight: "bg-green-50 dark:bg-green-950/30" },
                { icon: Clock, value: stats.pendingCount, label: ar("بانتظار الموافقة","Pending Approval"), color: "from-amber-500 to-amber-600", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
                { icon: Landmark, value: stats.totalColleges, label: ar("الكليات","Colleges"), color: "from-indigo-500 to-indigo-600", bgLight: "bg-indigo-50 dark:bg-indigo-950/30" },
                { icon: Landmark, value: stats.totalInstitutes, label: ar("المعاهد","Institutes"), color: "from-violet-500 to-violet-600", bgLight: "bg-violet-50 dark:bg-violet-950/30" },
                { icon: School, value: stats.pendingSchools, label: ar("طلبات مدارس","School Requests"), color: "from-cyan-500 to-cyan-600", bgLight: "bg-cyan-50 dark:bg-cyan-950/30" },
              ].map((s, i) => (
                <Card key={i} className={`overflow-hidden ${s.bgLight} border-0`}>
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
              {[
                { icon: BookOpen, value: stats.totalCourses, label: ar("الدورات","Courses"), color: "from-amber-500 to-amber-600", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
                { icon: Eye, value: stats.totalViews, label: ar("المشاهدات","Views"), color: "from-sky-500 to-sky-600", bgLight: "bg-sky-50 dark:bg-sky-950/30" },
                { icon: BookMarked, value: stats.totalBooks, label: ar("الكتب","Books"), color: "from-pink-500 to-pink-600", bgLight: "bg-pink-50 dark:bg-pink-950/30" },
                { icon: ShoppingCart, value: stats.totalOrders, label: ar("طلبات الشراء","Orders"), color: "from-orange-500 to-orange-600", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
                { icon: CreditCard, value: stats.totalSubscriptions, label: ar("الاشتراكات","Subscriptions"), color: "from-teal-500 to-teal-600", bgLight: "bg-teal-50 dark:bg-teal-950/30" },
                { icon: Radio, value: stats.totalStreams, label: ar("البث المباشر","Streams"), color: "from-red-500 to-red-600", bgLight: "bg-red-50 dark:bg-red-950/30" },
              ].map((s, i) => (
                <Card key={i} className={`overflow-hidden ${s.bgLight} border-0`}>
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sections Overview Chart - activity per section in last 7 days */}
            <TimeRangeToggle value={rangeDays} onChange={setRangeDays} className="mb-3" />
            <SectionsActivityChart
              className="mb-6"
              days={rangeDays}
              sections={[
                { label: "Users", Icon: Users, color: "#3b82f6", timestamps: allUsers.map((u: any) => u.created_at || u.profile?.created_at) },
                { label: "Lecturers", Icon: UserCheck, color: "#22c55e", timestamps: allUsers.filter((u: any) => u.role === "lecturer").map((u: any) => u.created_at || u.profile?.created_at) },
                { label: "Schools", Icon: School, color: "#06b6d4", timestamps: schoolRegistrations.map((s: any) => s.created_at) },
                { label: "Colleges", Icon: Landmark, color: "#6366f1", timestamps: colleges.map((c: any) => c.created_at) },
                { label: "Institutes", Icon: Landmark, color: "#8b5cf6", timestamps: institutes.map((i: any) => i.created_at) },
                { label: "Courses", Icon: BookOpen, color: "#f59e0b", timestamps: courses.map((c: any) => c.created_at) },
                { label: "Books", Icon: BookMarked, color: "#ec4899", timestamps: books.map((b: any) => b.created_at) },
                { label: "Orders", Icon: ShoppingCart, color: "#f97316", timestamps: bookOrders.map((o: any) => o.created_at) },
                { label: "Subscriptions", Icon: CreditCard, color: "#14b8a6", timestamps: subscriptions.map((s: any) => s.created_at) },
                { label: "Streams", Icon: Radio, color: "#ef4444", timestamps: liveStreams.map((s: any) => s.created_at || s.scheduled_at) },
              ]}
            />





            {(stats.pendingCount > 0 || stats.pendingSchools > 0 || stats.pendingColleges > 0 || stats.pendingInstitutes > 0) && (
              <div className="grid gap-4 md:grid-cols-3">
                {stats.pendingCount > 0 && (
                  <Card className="border-amber-200 bg-amber-50/50 cursor-pointer" onClick={() => setActiveTab("pending")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingCount} {ar("طلب محاضر بانتظار المراجعة","pending lecturer requests")}</p>
                        <p className="text-sm text-muted-foreground">{ar("اضغط للمراجعة","Click to review")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats.pendingSchools > 0 && (
                  <Card className="border-blue-200 bg-blue-50/50 cursor-pointer" onClick={() => setActiveTab("schools")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><School className="w-6 h-6 text-blue-600" /></div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingSchools} {ar("طلب مدرسة بانتظار المراجعة","pending school requests")}</p>
                        <p className="text-sm text-muted-foreground">{ar("اضغط للمراجعة","Click to review")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats.pendingColleges > 0 && (
                  <Card className="border-indigo-200 bg-indigo-50/50 cursor-pointer" onClick={() => setActiveTab("colleges")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center"><Landmark className="w-6 h-6 text-indigo-600" /></div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingColleges} {ar("طلب كلية بانتظار المراجعة","pending college requests")}</p>
                        <p className="text-sm text-muted-foreground">{ar("اضغط للمراجعة","Click to review")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {stats.pendingInstitutes > 0 && (
                  <Card className="border-violet-200 bg-violet-50/50 cursor-pointer" onClick={() => setActiveTab("institutes")}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center"><Landmark className="w-6 h-6 text-violet-600" /></div>
                      <div>
                        <p className="font-bold text-foreground">{stats.pendingInstitutes} {ar("طلب معهد بانتظار المراجعة","pending institute requests")}</p>
                        <p className="text-sm text-muted-foreground">{ar("اضغط للمراجعة","Click to review")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Review Test Accounts — dev only */}
            {import.meta.env.DEV && <TestAccountsPanel ar={ar} />}
          </TabsContent>

          {/* ===== Pending ===== */}
          <TabsContent value="pending" dir={isRtl ? "rtl" : "ltr"}>
            {pendingLecturers.length === 0 ? <EmptyState icon={CheckCircle} text={ar("لا توجد طلبات معلقة","No pending requests")} /> : (
              <div className="grid gap-4">
                {pendingLecturers.map(l => (
                  <Card key={l.id} className="card-hover cursor-pointer" onClick={() => openDetail(l)}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><UserCheck className="w-6 h-6 text-amber-600" /></div>
                        <div>
                          <p className="font-bold text-foreground">{l.profile?.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{l.profile?.email || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground me-3">{fmtDate(l.created_at)}</p>
                        <Button size="sm" className="gap-1" onClick={e => { e.stopPropagation(); handleApprove(l.id); }}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleReject(l.id); }}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Schools ===== */}
          <TabsContent value="schools" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={schoolSearchQuery} onChange={setSchoolSearchQuery} placeholder={ar("بحث باسم المدرسة أو المدينة...","Search by school name or city...")} />
              <ExportButton onClick={exportSchools} />
            </ToolbarRow>
            {filteredSchools.length === 0 ? <EmptyState icon={School} text={ar("لا توجد طلبات تسجيل مدارس","No school registration requests")} /> : (
              <div className="grid gap-4">
                {filteredSchools.map(school => (
                  <Card key={school.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedSchool(school); fetchAdminNotes("school", school.id).then(setAdminNotes); setShowSchoolDialog(true); }}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><School className="w-6 h-6 text-blue-600" /></div>
                        <div>
                          <p className="font-bold text-foreground">{school.school_name}</p>
                          <p className="text-sm text-muted-foreground">{school.principal_name} — {school.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(school.status)}
                        <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(school.created_at)}</p>
                        {school.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="gap-1" onClick={e => { e.stopPropagation(); handleSchoolApprove(school.id); }}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleSchoolReject(school.id); }}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                          </div>
                        )}
                        <ActionButtons onDelete={() => setDeleteTarget({ type: "school", id: school.id, name: school.school_name })} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Colleges ===== */}
          <TabsContent value="colleges" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={collegeSearch} onChange={setCollegeSearch} placeholder={ar("بحث باسم الكلية أو المدينة...","Search by college name or city...")} />
              <ExportButton onClick={exportColleges} />
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateInvitation(true)}>
                <LinkIcon className="w-4 h-4" />{ar("إنشاء رابط دعوة","Create Invitation")}
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => { setSelectedDeptInstitutionType("college"); setShowDeptDialog(true); }}>
                <BookOpen className="w-4 h-4" />{ar("إضافة قسم","Add Department")}
              </Button>
            </ToolbarRow>

            {filteredColleges.length === 0 ? <EmptyState icon={Landmark} text={ar("لا توجد كليات مسجلة","No college registrations")} /> : (
              <div className="grid gap-4">
                {filteredColleges.map(college => {
                  const members = getMembersForCollege(college.id);
                  const invitations = getInvitationsForCollege(college.id);
                  const studentCount = members.filter(m => m.role === "student").length;
                  const lecturerCount = members.filter(m => m.role === "lecturer").length;

                  return (
                    <Card key={college.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedCollege(college); fetchAdminNotes("college", college.id).then(setCollegeAdminNotes); setShowCollegeDialog(true); }}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            {college.logo_url ? (
                              <img
                                src={college.logo_url}
                                alt={college.college_name}
                                className="w-12 h-12 rounded-full object-cover border border-indigo-200 bg-white shrink-0"
                                onError={(event) => { event.currentTarget.src = "/placeholder.svg"; }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Landmark className="w-6 h-6 text-indigo-600" /></div>
                            )}
                            <div>
                              <p className="font-bold text-foreground">{college.college_name}</p>
                              <p className="text-sm text-muted-foreground">{college.dean_name} — {college.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {collegeStatusBadge(college.status)}
                            {!college.email_confirmed && <Badge variant="outline" className="text-amber-700 border-amber-400">{ar("البريد غير مؤكد","Email unconfirmed")}</Badge>}
                            <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(college.created_at)}</p>
                            {college.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="gap-1" disabled={!college.email_confirmed} onClick={e => { e.stopPropagation(); handleCollegeApprove(college.id); }}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleCollegeReject(college.id); }}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                              </div>
                            )}
                            <ActionButtons onDelete={() => setDeleteTarget({ type: "college", id: college.id, name: college.college_name })} />
                          </div>
                        </div>
                        {/* Members summary */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{studentCount} {ar("طالب","students")}</span>
                          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{lecturerCount} {ar("محاضر","lecturers")}</span>
                          <span className="flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" />{invitations.length} {ar("دعوة","invitations")}</span>
                        </div>
                        {/* Invitation links */}
                        {invitations.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {invitations.map(inv => (
                              <div key={inv.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs" onClick={e => e.stopPropagation()}>
                                <Badge variant="outline" className="text-xs">{inv.role === "student" ? ar("طالب","Student") : ar("محاضر","Lecturer")}</Badge>
                                <code className="flex-1 truncate text-muted-foreground">{inv.invitation_code}</code>
                                <span className="text-muted-foreground">{inv.used_count}/{inv.max_uses || "∞"}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyInvitationLink(inv.invitation_code)}><Copy className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "invitation", id: inv.id, name: inv.invitation_code })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Members list */}
                        {members.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">{ar("الأعضاء","Members")}:</p>
                            {members.slice(0, 5).map(m => (
                              <div key={m.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-3 py-1.5" onClick={e => e.stopPropagation()}>
                                <span className="font-medium text-foreground">{m.profile?.full_name || m.user_id}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{m.role === "student" ? ar("طالب","Student") : ar("محاضر","Lecturer")}</Badge>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "member", id: m.id, name: m.profile?.full_name || "" })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                                </div>
                              </div>
                            ))}
                            {members.length > 5 && <p className="text-xs text-muted-foreground text-center">+{members.length - 5} {ar("عضو آخر","more members")}</p>}
                          </div>
                        )}
                        {/* Departments for this college */}
                        {getDepartmentsForInstitution(college.id).length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">{ar("الأقسام","Departments")} ({getDepartmentsForInstitution(college.id).length}):</p>
                            {getDepartmentsForInstitution(college.id).map(dept => {
                              const deptMembers = getMembersForDepartment(dept.id);
                              return (
                                <div key={dept.id} className="bg-muted/30 rounded-lg p-2 text-xs" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">{dept.department_name} ({deptMembers.length} {ar("عضو","members")})</span>
                                      <span className="ms-2 text-muted-foreground">{dept.payment_amount} {ar("جنيه","EGP")}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {dept.payment_status !== "paid" && deptMembers.length > 0 && (
                                        <Button variant="default" size="sm" className="h-6 text-xs gap-1" onClick={() => { setPaymentDept(dept); setShowPaymentDialog(true); }}>
                                          <CreditCard className="w-3 h-3" />{ar("دفع","Pay")}
                                        </Button>
                                      )}
                                      {dept.payment_status === "paid" && (
                                        <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => { setGeneratedCodes(deptMembers); setSelectedCodesInstType(dept.institution_type as "college" | "institute"); setShowInvitationCodesDialog(true); }}>
                                          <LinkIcon className="w-3 h-3" />{ar("أكواد","Codes")}
                                        </Button>
                                      )}
                                      <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={() => { setSelectedDeptId(dept.id); setShowAddMembersDialog(true); }}>
                                        <Users className="w-3 h-3" />{ar("أعضاء","Members")}
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "department", id: dept.id, name: dept.department_name })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== Institutes ===== */}
          <TabsContent value="institutes" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={instituteSearch} onChange={setInstituteSearch} placeholder={ar("بحث باسم المعهد أو المدينة...","Search by institute name or city...")} />
              <ExportButton onClick={exportInstitutes} />
              <Button size="sm" className="gap-1.5" onClick={() => { setSelectedDeptInstitutionType("institute"); setShowDeptDialog(true); }}>
                <BookOpen className="w-4 h-4" />{ar("إضافة قسم","Add Department")}
              </Button>
            </ToolbarRow>

            {filteredInstitutes.length === 0 ? <EmptyState icon={Landmark} text={ar("لا توجد معاهد مسجلة","No institute registrations")} /> : (
              <div className="grid gap-4">
                {filteredInstitutes.map(inst => {
                  const depts = getDepartmentsForInstitution(inst.id);
                  return (
                    <Card key={inst.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedInstitute(inst); fetchAdminNotes("institute", inst.id).then(setInstituteAdminNotes); setShowInstituteDialog(true); }}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center"><Landmark className="w-6 h-6 text-violet-600" /></div>
                            <div>
                              <p className="font-bold text-foreground">{inst.institute_name}</p>
                              <p className="text-sm text-muted-foreground">{inst.director_name} — {inst.city}</p>
                              {inst.specialization && <p className="text-xs text-muted-foreground">{ar("التخصص:","Specialization:")} {inst.specialization}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {statusBadge(inst.status)}
                            {!inst.email_confirmed && <Badge variant="outline" className="text-amber-700 border-amber-400">{ar("البريد غير مؤكد","Email unconfirmed")}</Badge>}
                            <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(inst.created_at)}</p>
                            {inst.status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" className="gap-1" disabled={!inst.email_confirmed} onClick={e => { e.stopPropagation(); handleInstituteApprove(inst.id); }}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={e => { e.stopPropagation(); handleInstituteReject(inst.id); }}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                              </div>
                            )}
                            <ActionButtons onDelete={() => setDeleteTarget({ type: "institute", id: inst.id, name: inst.institute_name })} />
                          </div>
                        </div>
                        {/* Departments */}
                        {depts.length > 0 && (
                          <div className="border-t border-border pt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">{ar("الأقسام","Departments")} ({depts.length}):</p>
                            {depts.map(dept => {
                              const members = getMembersForDepartment(dept.id);
                              const students = members.filter(m => m.role === "student");
                              const lecturers = members.filter(m => m.role === "lecturer");
                              return (
                                <div key={dept.id} className="bg-muted/30 rounded-lg p-3 space-y-2" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm text-foreground">{dept.department_name}</p>
                                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                        <span>{students.length} {ar("طالب","students")}</span>
                                        <span>{lecturers.length} {ar("محاضر","lecturers")}</span>
                                        <span>{dept.payment_amount} {ar("جنيه","EGP")}</span>
                                        <span>{statusBadge(dept.payment_status === "paid" ? "approved" : "pending")}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {dept.payment_status !== "paid" && members.length > 0 && (
                                        <Button variant="default" size="sm" className="gap-1 text-xs" onClick={() => { setPaymentDept(dept); setShowPaymentDialog(true); }}>
                                          <CreditCard className="w-3 h-3" />{ar("دفع","Pay")}
                                        </Button>
                                      )}
                                      {dept.payment_status === "paid" && (
                                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setGeneratedCodes(members); setSelectedCodesInstType(dept.institution_type as "college" | "institute"); setShowInvitationCodesDialog(true); }}>
                                          <LinkIcon className="w-3 h-3" />{ar("أكواد الدعوة","Invite Codes")}
                                        </Button>
                                      )}
                                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setSelectedDeptId(dept.id); setShowAddMembersDialog(true); }}>
                                        <Users className="w-3 h-3" />{ar("إضافة أعضاء","Add Members")}
                                      </Button>
                                      <ActionButtons onDelete={() => setDeleteTarget({ type: "department", id: dept.id, name: dept.department_name })} />
                                    </div>
                                  </div>
                                  {members.length > 0 && (
                                    <div className="space-y-1">
                                      {members.slice(0, 5).map(m => (
                                        <div key={m.id} className="flex items-center justify-between text-xs bg-background rounded px-2 py-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{m.full_name}</span>
                                            {m.invitation_code && <code className="text-muted-foreground bg-muted px-1 rounded">{m.invitation_code}</code>}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">{m.role === "student" ? ar("طالب","Student") : ar("محاضر","Lecturer")}</Badge>
                                            {m.invitation_code && (
                                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyDeptInviteLink(m.invitation_code!, m.role, dept.institution_type as "college" | "institute")}>
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDeleteTarget({ type: "dept_member", id: m.id, name: m.full_name })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                                          </div>
                                        </div>
                                      ))}
                                      {members.length > 5 && <p className="text-xs text-muted-foreground text-center">+{members.length - 5} {ar("عضو آخر","more")}</p>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={ar("بحث بالاسم أو البريد...","Search by name or email...")} />
              <ExportButton onClick={exportUsers} />
            </ToolbarRow>
            <div className="grid gap-3">
              {filteredUsers.map(user => (
                <Card key={user.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openDetail(user)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{user.profile?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.profile?.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {roleBadge(user.role, user.approved)}
                      <Badge variant="outline" className="text-xs">{user.profile?.platform || "courses"}</Badge>
                      <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(user.created_at)}</p>
                      <ActionButtons onDelete={() => setDeleteTarget({ type: "user", id: user.id, name: user.profile?.full_name || user.role })} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && <EmptyState icon={Users} text={ar("لا توجد نتائج","No results found")} />}
            </div>
          </TabsContent>

          {/* ===== Courses ===== */}
          <TabsContent value="courses" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder={ar("بحث بعنوان الدورة أو المدرب...","Search by course title or instructor...")} />
              <ExportButton onClick={exportCourses} />
            </ToolbarRow>
            {filteredCourses.length === 0 ? <EmptyState icon={BookOpen} text={ar("لا توجد دورات","No courses found")} /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map(course => (
                  <Card key={course.id} className="hover:bg-muted/50 transition-colors relative group">
                    <div className="absolute top-2 end-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButtons
                        onEdit={() => setEditCourse({ ...course })}
                        onDelete={() => setDeleteTarget({ type: "course", id: course.id, name: ar(course.title_ar, course.title_en) })}
                      />
                    </div>
                    <CardContent className="p-4">
                      {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />}
                      <p className="font-bold text-foreground text-sm mb-1">{ar(course.title_ar, course.title_en)}</p>
                      <p className="text-xs text-muted-foreground mb-2">{ar(course.instructor_ar, course.instructor_en)}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{ar(course.category_ar, course.category_en)}</Badge>
                        <Badge variant="secondary" className="text-xs"><PlayCircle className="w-3 h-3 me-1" />{course.episode_count} {ar("حلقة","episodes")}</Badge>
                        {course.is_free && <Badge className="bg-green-100 text-green-700 text-xs">{ar("مجاني","Free")}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Books ===== */}
          <TabsContent value="books" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={bookSearch} onChange={setBookSearch} placeholder={ar("بحث بعنوان الكتاب أو المؤلف...","Search by book title or author...")} />
              <ExportButton onClick={exportBooks} />
            </ToolbarRow>
            {filteredBooks.length === 0 ? <EmptyState icon={BookMarked} text={ar("لا توجد كتب","No books found")} /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBooks.map(book => (
                  <Card key={book.id} className="hover:bg-muted/50 transition-colors relative group">
                    <div className="absolute top-2 end-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionButtons
                        onEdit={() => setEditBook({ ...book })}
                        onDelete={() => setDeleteTarget({ type: "book", id: book.id, name: ar(book.title_ar, book.title_en) })}
                      />
                    </div>
                    <CardContent className="p-4">
                      {book.cover_url && <img src={book.cover_url} alt="" className="w-full h-48 object-cover rounded-lg mb-3" />}
                      <p className="font-bold text-foreground text-sm mb-1">{ar(book.title_ar, book.title_en)}</p>
                      <p className="text-xs text-muted-foreground mb-2">{ar(book.author_ar, book.author_en)}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{book.category}</Badge>
                        <span className="font-bold text-sm text-primary">{book.price} {ar("ج.م","EGP")}</span>
                        {book.is_bestseller && <Badge className="bg-amber-100 text-amber-700 text-xs">{ar("الأكثر مبيعاً","Bestseller")}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Orders ===== */}
          <TabsContent value="orders" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder={ar("بحث بعنوان الكتاب أو المشتري...","Search by book or buyer...")} />
              <ExportButton onClick={exportOrders} />
            </ToolbarRow>
            {filteredOrders.length === 0 ? <EmptyState icon={ShoppingCart} text={ar("لا توجد طلبات","No orders found")} /> : (
              <div className="grid gap-3">
                {filteredOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-orange-600" /></div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{ar(order.book?.title_ar||"", order.book?.title_en||"—")}</p>
                          <p className="text-xs text-muted-foreground">{order.profile?.full_name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-primary">{order.amount} {ar("ج.م","EGP")}</span>
                        {statusBadge(order.status)}
                        <p className="text-xs text-muted-foreground hidden sm:block">{fmtDate(order.created_at)}</p>
                        <ActionButtons
                          onEdit={() => setEditOrder({ ...order })}
                          onDelete={() => setDeleteTarget({ type: "order", id: order.id, name: ar(order.book?.title_ar||"", order.book?.title_en||"Order") })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Subscriptions ===== */}
          <TabsContent value="subscriptions" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={subSearch} onChange={setSubSearch} placeholder={ar("بحث بعنوان الدورة أو المشترك...","Search by course or subscriber...")} />
              <ExportButton onClick={exportSubscriptions} />
            </ToolbarRow>
            {filteredSubs.length === 0 ? <EmptyState icon={CreditCard} text={ar("لا توجد اشتراكات","No subscriptions found")} /> : (
              <div className="grid gap-3">
                {filteredSubs.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-teal-600" /></div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{ar(sub.course?.title_ar||"", sub.course?.title_en||"—")}</p>
                          <p className="text-xs text-muted-foreground">{sub.profile?.full_name || "—"} • {ar("المستوى","Level")} {sub.level_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{sub.plan_type}</Badge>
                        <span className="font-bold text-sm text-primary">{sub.amount_paid} {ar("ج.م","EGP")}</span>
                        {statusBadge(sub.status)}
                        <ActionButtons
                          onEdit={() => setEditSub({ ...sub })}
                          onDelete={() => setDeleteTarget({ type: "subscription", id: sub.id, name: ar(sub.course?.title_ar||"", sub.course?.title_en||"Sub") })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Live Streams ===== */}
          <TabsContent value="streams" dir={isRtl ? "rtl" : "ltr"}>
            <ToolbarRow>
              <SearchBar value={streamSearch} onChange={setStreamSearch} placeholder={ar("بحث بعنوان البث أو المحاضر...","Search by stream title or lecturer...")} />
              <ExportButton onClick={exportStreams} />
            </ToolbarRow>
            {filteredStreams.length === 0 ? <EmptyState icon={Radio} text={ar("لا توجد بثوث مباشرة","No live streams found")} /> : (
              <div className="grid gap-3">
                {filteredStreams.map(stream => (
                  <Card key={stream.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stream.status === "live" ? "bg-red-100" : "bg-blue-100"}`}>
                          <Radio className={`w-5 h-5 ${stream.status === "live" ? "text-red-600" : "text-blue-600"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{ar(stream.title_ar, stream.title_en)}</p>
                          <p className="text-xs text-muted-foreground">{stream.profile?.full_name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(stream.status)}
                        {stream.scheduled_at && <p className="text-xs text-muted-foreground hidden sm:block"><Calendar className="w-3 h-3 inline me-1" />{fmtDate(stream.scheduled_at)}</p>}
                        <ActionButtons
                          onEdit={() => setEditStream({ ...stream })}
                          onDelete={() => setDeleteTarget({ type: "stream", id: stream.id, name: ar(stream.title_ar, stream.title_en) })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Departments Admin ===== */}
          <TabsContent value="departments_admin" dir={isRtl ? "rtl" : "ltr"}>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {ar("إدارة الأقسام - الموافقة والدفع النقدي", "Departments - Approval & Cash Payment")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-primary">{stats.totalDepartments}</p>
                  <p className="text-sm text-muted-foreground">{ar("إجمالي الأقسام", "Total Departments")}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-amber-500">{stats.pendingDepartments}</p>
                  <p className="text-sm text-muted-foreground">{ar("بانتظار الموافقة", "Pending Approval")}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-emerald-500">{departments.filter(d => d.payment_status === "paid").length}</p>
                  <p className="text-sm text-muted-foreground">{ar("أقسام مفعّلة", "Active Departments")}</p>
                </CardContent></Card>
              </div>

              {departments.length === 0 ? (
                <Card><CardContent className="text-center py-10 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{ar("لا توجد أقسام بعد", "No departments yet")}</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {departments.map(dept => {
                    const members = departmentMembers.filter(m => m.department_id === dept.id);
                    const students = members.filter(m => m.role === "student").length;
                    const lecturers = members.filter(m => m.role === "lecturer").length;
                    // Find institution name
                    const college = colleges.find(c => c.id === dept.institution_id);
                    const institute = institutes.find(i => i.id === dept.institution_id);
                    const instName = college?.college_name || institute?.institute_name || dept.institution_id.slice(0, 8);
                    return (
                      <Card key={dept.id} className={`border-2 ${dept.payment_status === "paid" ? "border-emerald-500/30" : "border-amber-500/30"}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-foreground">{dept.department_name}</h3>
                                <Badge variant={dept.payment_status === "paid" ? "default" : "secondary"}>
                                  {dept.payment_status === "paid" ? ar("مفعّل ✅", "Active ✅") : ar("بانتظار الموافقة", "Pending")}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <Landmark className="w-3.5 h-3.5 inline me-1" />
                                {instName} · {dept.institution_type === "college" ? ar("كلية", "College") : ar("معهد", "Institute")}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {students} {ar("طالب", "students")} · {lecturers} {ar("محاضر", "lecturers")} · {dept.payment_amount} {ar("جنيه/شهر", "EGP/month")}
                              </p>
                              <p className="text-xs text-muted-foreground">{fmtDate(dept.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {dept.payment_status !== "paid" && (
                                <Button
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={async () => {
                                    try {
                                      await supabase
                                        .from("departments")
                                        .update({ payment_status: "paid", status: "active" } as any)
                                        .eq("id", dept.id);
                                      showSuccess(ar("تم تفعيل القسم بنجاح - تم استلام الدفع نقداً", "Department activated - Cash payment received"));
                                      await Promise.all([loadDepartments(), loadStats()]);
                                    } catch (e: any) {
                                      showError(e.message);
                                    }
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {ar("موافقة (تم الدفع نقداً)", "Approve (Cash Paid)")}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={async () => {
                                  try {
                                    await supabase.from("department_members").delete().eq("department_id", dept.id);
                                    await supabase.from("departments").delete().eq("id", dept.id);
                                    showSuccess(ar("تم حذف القسم", "Department deleted"));
                                    await Promise.all([loadDepartments(), loadDepartmentMembers(), loadStats()]);
                                  } catch (e: any) {
                                    showError(e.message);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ar("تأكيد الحذف","Confirm Delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {ar("هل أنت متأكد من حذف","Are you sure you want to delete")} <strong>{deleteTarget?.name}</strong>؟ {ar("لا يمكن التراجع عن هذا الإجراء.","This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar("إلغاء","Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{ar("حذف","Delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Edit Course Dialog ===== */}
      <Dialog open={!!editCourse} onOpenChange={open => !open && setEditCourse(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar("تعديل الدورة","Edit Course")}</DialogTitle></DialogHeader>
          {editCourse && (
            <div className="space-y-3">
              <Field label={ar("العنوان (عربي)","Title (Arabic)")} value={editCourse.title_ar} onChange={v => setEditCourse({ ...editCourse, title_ar: v })} />
              <Field label={ar("العنوان (إنجليزي)","Title (English)")} value={editCourse.title_en} onChange={v => setEditCourse({ ...editCourse, title_en: v })} />
              <Field label={ar("المدرب (عربي)","Instructor (Arabic)")} value={editCourse.instructor_ar} onChange={v => setEditCourse({ ...editCourse, instructor_ar: v })} />
              <Field label={ar("المدرب (إنجليزي)","Instructor (English)")} value={editCourse.instructor_en} onChange={v => setEditCourse({ ...editCourse, instructor_en: v })} />
              <Field label={ar("التصنيف (عربي)","Category (Arabic)")} value={editCourse.category_ar} onChange={v => setEditCourse({ ...editCourse, category_ar: v })} />
              <Field label={ar("التصنيف (إنجليزي)","Category (English)")} value={editCourse.category_en} onChange={v => setEditCourse({ ...editCourse, category_en: v })} />
              <div className="flex items-center gap-2">
                <Switch checked={editCourse.is_free} onCheckedChange={v => setEditCourse({ ...editCourse, is_free: v })} />
                <Label>{ar("مجاني","Free")}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCourse(null)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleSaveCourse}>{ar("حفظ","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Book Dialog ===== */}
      <Dialog open={!!editBook} onOpenChange={open => !open && setEditBook(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar("تعديل الكتاب","Edit Book")}</DialogTitle></DialogHeader>
          {editBook && (
            <div className="space-y-3">
              <Field label={ar("العنوان (عربي)","Title (Arabic)")} value={editBook.title_ar} onChange={v => setEditBook({ ...editBook, title_ar: v })} />
              <Field label={ar("العنوان (إنجليزي)","Title (English)")} value={editBook.title_en} onChange={v => setEditBook({ ...editBook, title_en: v })} />
              <Field label={ar("المؤلف (عربي)","Author (Arabic)")} value={editBook.author_ar} onChange={v => setEditBook({ ...editBook, author_ar: v })} />
              <Field label={ar("المؤلف (إنجليزي)","Author (English)")} value={editBook.author_en} onChange={v => setEditBook({ ...editBook, author_en: v })} />
              <Field label={ar("التصنيف","Category")} value={editBook.category} onChange={v => setEditBook({ ...editBook, category: v })} />
              <Field label={ar("السعر","Price")} value={editBook.price} onChange={v => setEditBook({ ...editBook, price: Number(v) || 0 })} type="number" />
              <Field label={ar("السعر الأصلي","Original Price")} value={editBook.original_price || ""} onChange={v => setEditBook({ ...editBook, original_price: Number(v) || null })} type="number" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={editBook.is_bestseller || false} onCheckedChange={v => setEditBook({ ...editBook, is_bestseller: v })} /><Label>{ar("الأكثر مبيعاً","Bestseller")}</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editBook.is_new || false} onCheckedChange={v => setEditBook({ ...editBook, is_new: v })} /><Label>{ar("جديد","New")}</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editBook.is_active || false} onCheckedChange={v => setEditBook({ ...editBook, is_active: v })} /><Label>{ar("نشط","Active")}</Label></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBook(null)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleSaveBook}>{ar("حفظ","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Order Dialog ===== */}
      <Dialog open={!!editOrder} onOpenChange={open => !open && setEditOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{ar("تعديل حالة الطلب","Edit Order Status")}</DialogTitle></DialogHeader>
          {editOrder && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{ar("الكتاب:","Book:")} <strong>{ar(editOrder.book?.title_ar||"", editOrder.book?.title_en||"")}</strong></p>
              <div className="space-y-1.5">
                <Label>{ar("الحالة","Status")}</Label>
                <Input value={editOrder.status} onChange={e => setEditOrder({ ...editOrder, status: e.target.value })} placeholder="pending / completed / cancelled" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleSaveOrder}>{ar("حفظ","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Subscription Dialog ===== */}
      <Dialog open={!!editSub} onOpenChange={open => !open && setEditSub(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{ar("تعديل الاشتراك","Edit Subscription")}</DialogTitle></DialogHeader>
          {editSub && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{ar("الدورة:","Course:")} <strong>{ar(editSub.course?.title_ar||"", editSub.course?.title_en||"")}</strong></p>
              <div className="space-y-1.5">
                <Label>{ar("الحالة","Status")}</Label>
                <Input value={editSub.status} onChange={e => setEditSub({ ...editSub, status: e.target.value })} placeholder="active / expired / cancelled" />
              </div>
              <div className="space-y-1.5">
                <Label>{ar("نوع الخطة","Plan Type")}</Label>
                <Input value={editSub.plan_type} onChange={e => setEditSub({ ...editSub, plan_type: e.target.value })} placeholder="monthly / yearly" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleSaveSub}>{ar("حفظ","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Stream Dialog ===== */}
      <Dialog open={!!editStream} onOpenChange={open => !open && setEditStream(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar("تعديل البث","Edit Stream")}</DialogTitle></DialogHeader>
          {editStream && (
            <div className="space-y-3">
              <Field label={ar("العنوان (عربي)","Title (Arabic)")} value={editStream.title_ar} onChange={v => setEditStream({ ...editStream, title_ar: v })} />
              <Field label={ar("العنوان (إنجليزي)","Title (English)")} value={editStream.title_en} onChange={v => setEditStream({ ...editStream, title_en: v })} />
              <div className="space-y-1.5">
                <Label>{ar("الحالة","Status")}</Label>
                <Input value={editStream.status} onChange={e => setEditStream({ ...editStream, status: e.target.value })} placeholder="scheduled / live / ended" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStream(null)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleSaveStream}>{ar("حفظ","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== School Detail Dialog ===== */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar("تفاصيل طلب المدرسة","School Registration Details")}</DialogTitle></DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"><School className="w-8 h-8 text-blue-600" /></div>
                <div><p className="text-lg font-bold text-foreground">{selectedSchool.school_name}</p>{statusBadge(selectedSchool.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("المدير","Principal")}</p><p className="font-medium text-foreground">{selectedSchool.principal_name}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("المدينة","City")}</p><p className="font-medium text-foreground">{selectedSchool.city}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("الهاتف","Phone")}</p><p className="font-medium text-foreground">{selectedSchool.phone}</p></div></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("البريد","Email")}</p><p className="font-medium text-foreground">{selectedSchool.email}</p></div></div>
              </div>
              {selectedSchool.message && (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{ar("رسالة المدرسة","School Message")}</p>
                  <p className="font-medium text-foreground mt-1">{selectedSchool.message}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-4 h-4" />{ar("ملاحظات الأدمن","Admin Notes")}</p>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={ar("أضف ملاحظاتك هنا...","Add your notes here...")} className="min-h-[80px]" />
              </div>
              {selectedSchool.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" onClick={() => handleSchoolApprove(selectedSchool.id)}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleSchoolReject(selectedSchool.id)}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== College Detail Dialog ===== */}
      <Dialog open={showCollegeDialog} onOpenChange={setShowCollegeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar("تفاصيل طلب الكلية","College Registration Details")}</DialogTitle></DialogHeader>
          {selectedCollege && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedCollege.logo_url ? (
                  <img
                    src={selectedCollege.logo_url}
                    alt={selectedCollege.college_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 bg-white shrink-0"
                    onError={(event) => { event.currentTarget.src = "/placeholder.svg"; }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Landmark className="w-8 h-8 text-indigo-600" /></div>
                )}
                <div><p className="text-lg font-bold text-foreground">{selectedCollege.college_name}</p>{collegeStatusBadge(selectedCollege.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("العميد","Dean")}</p><p className="font-medium text-foreground">{selectedCollege.dean_name}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("المدينة","City")}</p><p className="font-medium text-foreground">{selectedCollege.city}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("الهاتف","Phone")}</p><p className="font-medium text-foreground">{selectedCollege.phone}</p></div></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("البريد","Email")}</p><p className="font-medium text-foreground">{selectedCollege.email}</p></div></div>
              </div>
              {selectedCollege.message && (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{ar("رسالة الكلية","College Message")}</p>
                  <p className="font-medium text-foreground mt-1">{selectedCollege.message}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-4 h-4" />{ar("ملاحظات الأدمن","Admin Notes")}</p>
                <Textarea value={collegeAdminNotes} onChange={e => setCollegeAdminNotes(e.target.value)} placeholder={ar("أضف ملاحظاتك هنا...","Add your notes here...")} className="min-h-[80px]" />
              </div>
              {selectedCollege.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" disabled={!selectedCollege.email_confirmed} onClick={() => handleCollegeApprove(selectedCollege.id)}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleCollegeReject(selectedCollege.id)}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Create Invitation Dialog ===== */}
      <Dialog open={showCreateInvitation} onOpenChange={setShowCreateInvitation}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ar("إنشاء رابط دعوة","Create Invitation Link")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{ar("الكلية","College")}</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={newInvitationCollegeId}
                onChange={e => setNewInvitationCollegeId(e.target.value)}
              >
                <option value="">{ar("اختر كلية","Select a college")}</option>
                {colleges.filter(c => c.status === "approved").map(c => (
                  <option key={c.id} value={c.id}>{c.college_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{ar("الدور","Role")}</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={newInvitationRole}
                onChange={e => setNewInvitationRole(e.target.value)}
              >
                <option value="student">{ar("طالب","Student")}</option>
                <option value="lecturer">{ar("محاضر","Lecturer")}</option>
              </select>
            </div>
            <Field label={ar("الحد الأقصى للاستخدام (0 = غير محدود)","Max Uses (0 = unlimited)")} value={newInvitationMaxUses} onChange={setNewInvitationMaxUses} type="number" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvitation(false)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleCreateInvitation} disabled={!newInvitationCollegeId}>{ar("إنشاء","Create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== User Detail Dialog ===== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar("تفاصيل المستخدم","User Details")}</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {signedUrls.live_photo_url ? <img src={signedUrls.live_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" /> : <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><Users className="w-8 h-8 text-muted-foreground" /></div>}
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedUser.profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.profile?.email}</p>
                  <div className="flex gap-2 mt-1">{roleBadge(selectedUser.role, selectedUser.approved)}<Badge variant="outline" className="text-xs">{selectedUser.profile?.platform || "courses"}</Badge></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">{ar("الهاتف","Phone")}</p><p className="font-medium text-foreground">{selectedUser.profile?.phone || "—"}</p></div>
                <div><p className="text-muted-foreground">{ar("تاريخ التسجيل","Registered")}</p><p className="font-medium text-foreground">{fmtDate(selectedUser.created_at)}</p></div>
              </div>
              {/* Show college membership */}
              {collegeMembers.filter(m => m.user_id === selectedUser.user_id).length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-semibold text-foreground mb-2">{ar("الكلية","College")}</p>
                  {collegeMembers.filter(m => m.user_id === selectedUser.user_id).map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <Landmark className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium">{m.college?.college_name || m.college_id}</span>
                      <Badge variant="outline" className="text-xs">{m.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {selectedUser.role === "lecturer" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{ar("المستندات المرفقة","Attached Documents")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {signedUrls.id_photo_url && <a href={signedUrls.id_photo_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors"><Shield className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-xs font-medium">{ar("صورة الهوية","ID Photo")}</p></a>}
                    {signedUrls.university_cert_url && <a href={signedUrls.university_cert_url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors"><GraduationCap className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-xs font-medium">{ar("الشهادة الجامعية","University Cert")}</p></a>}
                    {selectedUser.profile?.documents?.additional_certs_urls?.map((_, i) => signedUrls[`cert_${i}`] && <a key={i} href={signedUrls[`cert_${i}`]} target="_blank" rel="noreferrer" className="block rounded-lg border border-border p-3 text-center hover:bg-muted/50 transition-colors"><BookOpen className="w-6 h-6 text-primary mx-auto mb-1" /><p className="text-xs font-medium">{ar(`شهادة إضافية ${i+1}`,`Certificate ${i+1}`)}</p></a>)}
                  </div>
                </div>
              )}
              {selectedUser.role === "lecturer" && !selectedUser.approved && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" onClick={() => handleApprove(selectedUser.id)}><CheckCircle className="w-4 h-4" />{ar("قبول المحاضر","Approve Lecturer")}</Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleReject(selectedUser.id)}><XCircle className="w-4 h-4" />{ar("رفض الطلب","Reject Request")}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ===== Institute Detail Dialog ===== */}
      <Dialog open={showInstituteDialog} onOpenChange={setShowInstituteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar("تفاصيل طلب المعهد","Institute Registration Details")}</DialogTitle></DialogHeader>
          {selectedInstitute && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center"><Landmark className="w-8 h-8 text-violet-600" /></div>
                <div><p className="text-lg font-bold text-foreground">{selectedInstitute.institute_name}</p>{statusBadge(selectedInstitute.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("المدير","Director")}</p><p className="font-medium text-foreground">{selectedInstitute.director_name}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("المدينة","City")}</p><p className="font-medium text-foreground">{selectedInstitute.city}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("الهاتف","Phone")}</p><p className="font-medium text-foreground">{selectedInstitute.phone}</p></div></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-muted-foreground">{ar("البريد","Email")}</p><p className="font-medium text-foreground">{selectedInstitute.email}</p></div></div>
              </div>
              {selectedInstitute.specialization && (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-muted-foreground">{ar("التخصص الرئيسي","Main Specialization")}</p>
                  <p className="font-medium text-foreground mt-1">{selectedInstitute.specialization}</p>
                </div>
              )}
              {selectedInstitute.message && (
                <div className="text-sm border-t border-border pt-3">
                  <p className="text-muted-foreground flex items-center gap-1"><MessageSquare className="w-4 h-4" />{ar("رسالة المعهد","Institute Message")}</p>
                  <p className="font-medium text-foreground mt-1">{selectedInstitute.message}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-4 h-4" />{ar("ملاحظات الأدمن","Admin Notes")}</p>
                <Textarea value={instituteAdminNotes} onChange={e => setInstituteAdminNotes(e.target.value)} placeholder={ar("أضف ملاحظاتك هنا...","Add your notes here...")} className="min-h-[80px]" />
              </div>
              {selectedInstitute.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-1.5" disabled={!selectedInstitute.email_confirmed} onClick={() => handleInstituteApprove(selectedInstitute.id)}><CheckCircle className="w-4 h-4" />{ar("قبول","Approve")}</Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => handleInstituteReject(selectedInstitute.id)}><XCircle className="w-4 h-4" />{ar("رفض","Reject")}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Create Department Dialog ===== */}
      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ar("إنشاء قسم جديد","Create New Department")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{ar(selectedDeptInstitutionType === "college" ? "الكلية" : "المعهد", selectedDeptInstitutionType === "college" ? "College" : "Institute")}</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedDeptInstitutionId}
                onChange={e => setSelectedDeptInstitutionId(e.target.value)}
              >
                <option value="">{ar("اختر","Select")}</option>
                {selectedDeptInstitutionType === "college"
                  ? colleges.filter(c => c.status === "approved").map(c => <option key={c.id} value={c.id}>{c.college_name}</option>)
                  : institutes.filter(i => i.status === "approved").map(i => <option key={i.id} value={i.id}>{i.institute_name}</option>)
                }
              </select>
            </div>
            <Field label={ar("اسم القسم","Department Name")} value={newDeptName} onChange={setNewDeptName} />
            <Field label={ar("عدد الطلاب","Number of Students")} value={newDeptStudentCount} onChange={setNewDeptStudentCount} type="number" />
            {newDeptStudentCount && parseInt(newDeptStudentCount) > 0 && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 text-center">
                <p className="text-sm text-muted-foreground">{ar("تكلفة الاشتراك","Subscription Cost")}</p>
                <p className="text-2xl font-black text-primary">{parseInt(newDeptStudentCount) * 299} {ar("جنيه","EGP")}</p>
                <p className="text-xs text-muted-foreground">{newDeptStudentCount} {ar("طالب","students")} × 299 {ar("جنيه","EGP")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleCreateDepartment} disabled={!selectedDeptInstitutionId || !newDeptName}>{ar("إنشاء","Create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Add Department Members Dialog ===== */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar("إضافة أعضاء للقسم","Add Department Members")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={ar("الاسم الكامل","Full Name")} value={newMemberName} onChange={setNewMemberName} />
              <div className="space-y-1.5">
                <Label className="text-sm">{ar("الدور","Role")}</Label>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value)}
                >
                  <option value="student">{ar("طالب","Student")}</option>
                  <option value="lecturer">{ar("محاضر","Lecturer")}</option>
                </select>
              </div>
            </div>
            <Field label={ar("تاريخ الميلاد","Date of Birth")} value={newMemberDob} onChange={setNewMemberDob} type="date" />
            <Button className="w-full gap-1.5" onClick={handleAddDepartmentMember} disabled={!newMemberName}>
              <Users className="w-4 h-4" />{ar("إضافة العضو","Add Member")}
            </Button>
            {/* Current members list */}
            {selectedDeptId && getMembersForDepartment(selectedDeptId).length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-sm font-semibold text-foreground">{ar("الأعضاء الحاليين","Current Members")} ({getMembersForDepartment(selectedDeptId).length})</p>
                {getMembersForDepartment(selectedDeptId).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                    <div>
                      <span className="font-medium text-foreground">{m.full_name}</span>
                      {m.date_of_birth && <span className="text-xs text-muted-foreground ms-2">{m.date_of_birth}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{m.role === "student" ? ar("طالب","Student") : ar("محاضر","Lecturer")}</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget({ type: "dept_member", id: m.id, name: m.full_name })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Payment Dialog ===== */}
      <Dialog open={showPaymentDialog} onOpenChange={open => { if (!open && !paymentProcessing) { setShowPaymentDialog(false); setPaymentDept(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{ar("دفع اشتراك القسم","Department Subscription Payment")}</DialogTitle></DialogHeader>
          {paymentDept && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">{ar("المبلغ المطلوب","Amount Due")}</p>
                <p className="text-3xl font-black text-primary">{paymentDept.payment_amount} {ar("جنيه","EGP")}</p>
                <p className="text-xs text-muted-foreground mt-1">{paymentDept.student_count} {ar("طالب","students")} × 299 {ar("جنيه","EGP")}</p>
                <p className="text-xs font-medium text-foreground mt-1">{paymentDept.department_name}</p>
              </div>
              <div className="space-y-3">
                <Field label={ar("رقم البطاقة","Card Number")} value={paymentCardNumber} onChange={setPaymentCardNumber} />
                <Field label={ar("اسم حامل البطاقة","Cardholder Name")} value={paymentCardName} onChange={setPaymentCardName} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={ar("تاريخ الانتهاء","Expiry")} value={paymentExpiry} onChange={setPaymentExpiry} />
                  <Field label="CVV" value={paymentCvv} onChange={setPaymentCvv} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground text-center">
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                {ar("هذه واجهة دفع تجريبية - لا يتم خصم أي مبالغ حقيقية","This is a demo payment interface - no real charges will be made")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPaymentDialog(false); setPaymentDept(null); }} disabled={paymentProcessing}>{ar("إلغاء","Cancel")}</Button>
            <Button onClick={handleDeptPayment} disabled={paymentProcessing} className="gap-1.5">
              {paymentProcessing ? (
                <><div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />{ar("جاري الدفع...","Processing...")}</>
              ) : (
                <><CreditCard className="w-4 h-4" />{ar("ادفع الآن","Pay Now")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Invitation Codes Dialog ===== */}
      <Dialog open={showInvitationCodesDialog} onOpenChange={setShowInvitationCodesDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ar("أكواد وروابط الدعوة","Invitation Codes & Links")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-700">{ar("تم الدفع بنجاح! يمكنك الآن مشاركة أكواد الدعوة","Payment successful! You can now share invitation codes")}</p>
            </div>
            
            {/* Lecturers */}
            {generatedCodes.filter(m => m.role === "lecturer").length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{ar("المحاضرون","Lecturers")}</p>
                {generatedCodes.filter(m => m.role === "lecturer").map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                      <code className="text-xs text-muted-foreground">{m.invitation_code || "—"}</code>
                    </div>
                    {m.invitation_code && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(m.invitation_code!); showSuccess(ar("تم نسخ الكود","Code copied")); }}>
                          <Copy className="w-3 h-3" />{ar("كود","Code")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyDeptInviteLink(m.invitation_code!, m.role)}>
                          <LinkIcon className="w-3 h-3" />{ar("رابط","Link")}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Students */}
            {generatedCodes.filter(m => m.role === "student").length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{ar("الطلاب","Students")}</p>
                {generatedCodes.filter(m => m.role === "student").map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                      <code className="text-xs text-muted-foreground">{m.invitation_code || "—"}</code>
                    </div>
                    {m.invitation_code && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(m.invitation_code!); showSuccess(ar("تم نسخ الكود","Code copied")); }}>
                          <Copy className="w-3 h-3" />{ar("كود","Code")}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyDeptInviteLink(m.invitation_code!, m.role)}>
                          <LinkIcon className="w-3 h-3" />{ar("رابط","Link")}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
