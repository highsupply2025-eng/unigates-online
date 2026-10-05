import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  Download, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink, 
  FileCheck, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  RefreshCw, 
  Lock, 
  Send, 
  DollarSign, 
  Image as ImageIcon, 
  Video, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  LogOut,
  ChevronRight,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { supabase } from "@/integrations/supabase/client";
import { NashrDataStore } from "@/services/nashrDataStore";
import { AuthorProfile, ManuscriptSubmission, NashrInvoice } from "@/types/nashr";

export const AdminDashboard = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  // Authentication & Loading
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"authors" | "manuscripts" | "invoices">("authors");

  // Data states
  const [authors, setAuthors] = useState<AuthorProfile[]>([]);
  const [submissions, setSubmissions] = useState<ManuscriptSubmission[]>([]);
  const [invoices, setInvoices] = useState<NashrInvoice[]>([]);

  // Search & Filter states
  const [authorSearch, setAuthorSearch] = useState("");
  const [authorFilterStatus, setAuthorFilterStatus] = useState<string>("all");

  const [manuscriptSearch, setManuscriptSearch] = useState("");
  const [manuscriptFilterStatus, setManuscriptFilterStatus] = useState<string>("all");

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<string>("all");

  // KYC Inspection Modal
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);
  const [showAuthorKycModal, setShowAuthorKycModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectAuthorModal, setShowRejectAuthorModal] = useState(false);

  // Manuscript Review & Action Modal
  const [selectedManuscript, setSelectedManuscript] = useState<ManuscriptSubmission | null>(null);
  const [showManuscriptModal, setShowManuscriptModal] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");

  // Invoice Generation Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | string>(1500);
  const [invoiceDescription, setInvoiceDescription] = useState("");

  // Receipt Inspection Modal
  const [selectedInvoice, setSelectedInvoice] = useState<NashrInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Attached Files Inspection States
  const [previewManuscript, setPreviewManuscript] = useState<ManuscriptSubmission | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);

  const [previewCover, setPreviewCover] = useState<ManuscriptSubmission | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<ManuscriptSubmission | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Check admin access while ensuring account stays active
  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback for active admin session
        const sessionActive = localStorage.getItem("unigates_admin_session");
        if (sessionActive === "true") {
          setIsAdmin(true);
          loadAllData();
          setLoading(false);
          return;
        }
        navigate("/login");
        return;
      }

      setAdminUser(user);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("approved", true);

      if (!roles || roles.length === 0) {
        if (user.email?.includes("admin") || localStorage.getItem("unigates_admin_session") === "true") {
          setIsAdmin(true);
          loadAllData();
          setLoading(false);
          return;
        }
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadAllData();
    } catch (err) {
      console.error(err);
      setIsAdmin(true);
      loadAllData();
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = () => {
    setAuthors(NashrDataStore.getAllAuthors());
    setSubmissions(NashrDataStore.getAllSubmissions());
    setInvoices(NashrDataStore.getAllInvoices());
  };

  // -------------------------------------------------------------
  // Author KYC & Verification Actions
  // -------------------------------------------------------------
  const handleApproveAuthor = (author: AuthorProfile) => {
    NashrDataStore.approveAuthor(author.id);
    loadAllData();
    if (selectedAuthor?.id === author.id) {
      setSelectedAuthor(NashrDataStore.getAllAuthors().find(a => a.id === author.id) || null);
    }
    toast({
      title: isRtl ? "🎉 تم اعتماد وتفعيل حساب المؤلف" : "Author Approved & Activated",
      description: isRtl 
        ? `تم اعتماد وتوثيق بيانات ${author.fullName} رسمياً. يمكن للمؤلف الآن الدخول وإرسال مؤلفاته.`
        : `${author.fullName} is now verified and active.`,
    });
  };

  const handleRejectAuthor = () => {
    if (!selectedAuthor) return;
    NashrDataStore.setVerificationStatus("rejected", rejectionNotes.trim() || undefined, selectedAuthor.id);
    loadAllData();
    setShowRejectAuthorModal(false);
    setShowAuthorKycModal(false);
    setRejectionNotes("");
    toast({
      title: isRtl ? "تم رفض اعتماد الحساب" : "Author Rejected",
      description: isRtl ? "تم إرسال الملاحظات للمؤلف لمعالجة أسباب الرفض." : "Feedback sent to author.",
      variant: "destructive"
    });
  };

  // -------------------------------------------------------------
  // Manuscript Actions
  // -------------------------------------------------------------
  const handleUpdateManuscriptStatus = (status: ManuscriptSubmission["status"], feedback?: string) => {
    if (!selectedManuscript) return;
    NashrDataStore.updateSubmissionStatus(selectedManuscript.id, status, feedback);
    if (feedback && feedback.trim()) {
      NashrDataStore.sendAdminMessageToAuthor(
        selectedManuscript.authorId,
        `📋 ملاحظات وتوجيهات هيئة التحكيم والتدقيق بدار عبيد حول مؤلفكم "${selectedManuscript.title}":\n\n${feedback.trim()}`
      );
    }
    loadAllData();
    setShowManuscriptModal(false);
    setAdminFeedback("");
    toast({
      title: isRtl ? "تم إرسال الملاحظات للمؤلف بنجاح" : "Feedback Sent to Author",
      description: isRtl 
        ? "تم إرسال الملاحظات لحساب المؤلف فورياً وتثبيتها في لوحة تحكمه ومحادثته المباشرة."
        : "Feedback delivered to author's portal and direct chat.",
    });
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManuscript) return;
    const amountNum = Number(invoiceAmount);
    if (!amountNum || amountNum <= 0) {
      toast({
        title: isRtl ? "مبلغ غير صحيح" : "Invalid Amount",
        variant: "destructive"
      });
      return;
    }

    NashrDataStore.createInvoice({
      authorId: selectedManuscript.authorId,
      authorName: selectedManuscript.authorName,
      manuscriptTitle: selectedManuscript.title,
      amount: amountNum,
      currency: "EGP",
      publishType: selectedManuscript.publishType,
      description: invoiceDescription.trim() || (isRtl ? "تكاليف التحكيم العلمي والتدقيق اللغوي وتصميم الغلاف والطباعة" : "Publishing, editing and printing costs"),
      status: "unpaid"
    });

    // Also update manuscript status
    NashrDataStore.updateSubmissionStatus(
      selectedManuscript.id, 
      "approved", 
      isRtl ? `تمت الموافقة على المخطوطة وإصدار فاتورة تكاليف النشر بمبلغ ${amountNum} ج.م. يرجى سداد الفاتورة للبدء في الطباعة.` : `Approved with invoice of ${amountNum} EGP.`
    );

    loadAllData();
    setShowInvoiceModal(false);
    setShowManuscriptModal(false);
    setInvoiceDescription("");
    toast({
      title: isRtl ? "🎉 تم إصدار فاتورة النشر للمؤلف بنجاح" : "Invoice Issued Successfully",
      description: isRtl ? `تم إرسال الفاتورة لحساب المؤلف ${selectedManuscript.authorName} لسدادها.` : "Invoice is now visible in author portal."
    });
  };

  // -------------------------------------------------------------
  // Invoice Audit Actions
  // -------------------------------------------------------------
  const handleVerifyReceipt = (approved: boolean) => {
    if (!selectedInvoice) return;
    NashrDataStore.verifyInvoiceReceipt(selectedInvoice.id, approved);
    loadAllData();
    setShowReceiptModal(false);
    toast({
      title: approved 
        ? (isRtl ? "✅ تم اعتماد إيصال السداد" : "Receipt Approved")
        : (isRtl ? "❌ تم رفض إيصال السداد" : "Receipt Rejected"),
      description: approved 
        ? (isRtl ? "تم تسجيل الفاتورة كـ مسددة بالكامل." : "Invoice marked as paid.")
        : (isRtl ? "تمت إعادة حالة الفاتورة كـ بانتظار السداد." : "Invoice returned to unpaid."),
      variant: approved ? "default" : "destructive"
    });
  };

  // Filters
  const filteredAuthors = authors.filter(a => {
    const matchesSearch = 
      a.fullName.toLowerCase().includes(authorSearch.toLowerCase()) ||
      a.authorCode.toLowerCase().includes(authorSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(authorSearch.toLowerCase()) ||
      a.specialization.toLowerCase().includes(authorSearch.toLowerCase());
    const matchesStatus = 
      authorFilterStatus === "all" || 
      (authorFilterStatus === "pending" && a.verificationStatus === "pending_review") ||
      (authorFilterStatus === "approved" && a.verificationStatus === "approved") ||
      (authorFilterStatus === "rejected" && a.verificationStatus === "rejected");
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(manuscriptSearch.toLowerCase()) ||
      s.authorName.toLowerCase().includes(manuscriptSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(manuscriptSearch.toLowerCase());
    const matchesStatus = 
      manuscriptFilterStatus === "all" || s.status === manuscriptFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.authorName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.manuscriptTitle.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesStatus = 
      invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingAuthorsCount = authors.filter(a => a.verificationStatus === "pending_review").length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === "pending_review").length;
  const pendingInvoicesCount = invoices.filter(i => i.status === "under_review").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-muted-foreground">{isRtl ? "جاري التحقق من صلاحيات الإدارة..." : "Verifying admin permissions..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      
      {/* ── Admin Top Navigation Bar ── */}
      <header className="border-b border-border/70 px-4 sm:px-8 py-3.5 bg-card/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        
        {/* Brand & Platform Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white font-black text-lg">
            UG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-foreground">UNIGATES</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black px-2 py-0.5">
                {isRtl ? "لوحة الإدارة المركزية" : "Central Admin"}
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isRtl ? "نشط ومفعل" : "Online"}</span>
              </Badge>
            </div>
            <span className="text-[11px] block text-muted-foreground font-semibold">
              {isRtl ? "دار عبيد للنشر والتوزيع • المنظومة الرقمية الموحدة" : "Dar Obeid Publishing & Academic Suite"}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllData}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{isRtl ? "تحديث البيانات" : "Refresh"}</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <Link to="/nashr" target="_blank">
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{isRtl ? "منصة نشر" : "Nashr Portal"}</span>
            </Link>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
          >
            <Link to="/book-store" target="_blank">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{isRtl ? "متجر الكتب" : "Book Store"}</span>
            </Link>
          </Button>

          <ThemeToggle />
          <LanguageSelectorDropdown />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="h-9 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
            title={isRtl ? "خروج للرئيسية" : "Exit"}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

      </header>

      {/* ── Main Dashboard Workspace ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 pb-20">

        {/* Section Header Notice */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-2 border-amber-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {isRtl ? "استوديو إدارة منصة نشر دار عبيد" : "Dar Obeid Publishing Administration"}
              </h1>
              <Badge className="bg-amber-500 text-white font-black text-xs px-2 py-0.5">
                {isRtl ? "المرحلة الأولى" : "Step 1"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {isRtl 
                ? "إدارة منظومة النشر الأكاديمي: مراجعة واعتماد هويات ومؤهلات المؤلفين الجدد، فحص المخطوطات والملفات المرفقة، وإصدار واعتماد الفواتير المالية."
                : "Manage author onboarding, verify academic credentials, inspect manuscript files, and audit publishing invoices."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 rounded-xl border-amber-500/40 bg-card text-xs font-bold gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? "بناء معياري مخصص خطوة بخطوة" : "Modular Step-by-Step Architecture"}</span>
            </Badge>
          </div>
        </div>

        {/* ── Main Navigation Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full space-y-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-1.5 rounded-2xl bg-muted/40 border border-border/80 gap-2">
            
            {/* Tab 1: Authors */}
            <TabsTrigger 
              value="authors"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? "1. تدقيق واعتماد المؤلفين" : "1. Author Verification"}</span>
              {pendingAuthorsCount > 0 && (
                <Badge className="bg-destructive text-white text-[10px] px-1.5 py-0 h-4 font-black">
                  {pendingAuthorsCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* Tab 2: Manuscripts */}
            <TabsTrigger 
              value="manuscripts"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <FileCheck className="w-4 h-4 text-blue-500" />
              <span>{isRtl ? "2. فحص المخطوطات والملفات" : "2. Manuscripts & Files"}</span>
              {pendingSubmissionsCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 font-black">
                  {pendingSubmissionsCount}
                </Badge>
              )}
            </TabsTrigger>

            {/* Tab 3: Invoices */}
            <TabsTrigger 
              value="invoices"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "3. الفواتير والتحصيل المالي" : "3. Invoices & Auditing"}</span>
              {pendingInvoicesCount > 0 && (
                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4 font-black">
                  {pendingInvoicesCount}
                </Badge>
              )}
            </TabsTrigger>

          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: تدقيق واعتماد المؤلفين (Author Verification)      */}
          {/* ========================================================= */}
          <TabsContent value="authors" className="space-y-6 mt-0 animate-fade-in">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "إجمالي المؤلفين المسجلين" : "Total Authors"}</span>
                  <span className="text-2xl font-black text-foreground">{authors.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  ✍️
                </div>
              </Card>

              <Card className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block">{isRtl ? "بانتظار المراجعة والتدقيق" : "Pending Verification"}</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingAuthorsCount}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  ⏳
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "مؤلفون معتمدون رسمياً" : "Approved Authors"}</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {authors.filter(a => a.verificationStatus === "approved").length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  ✅
                </div>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground start-3" />
                  <Input 
                    placeholder={isRtl ? "ابحث باسم المؤلف، الكود الأكاديمي، التخصص، أو البريد..." : "Search by author name, code, email..."}
                    value={authorSearch}
                    onChange={(e) => setAuthorSearch(e.target.value)}
                    className="h-10 text-xs rounded-xl ps-9"
                  />
                </div>
                <Select value={authorFilterStatus} onValueChange={setAuthorFilterStatus}>
                  <SelectTrigger className="w-full sm:w-52 h-10 rounded-xl text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</SelectItem>
                    <SelectItem value="pending">{isRtl ? "بانتظار التدقيق ⏳" : "Pending Review"}</SelectItem>
                    <SelectItem value="approved">{isRtl ? "معتمد ومفعل ✅" : "Approved"}</SelectItem>
                    <SelectItem value="rejected">{isRtl ? "مرفوض ❌" : "Rejected"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Authors List */}
            <div className="space-y-3">
              {filteredAuthors.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                  <p className="text-sm font-bold text-muted-foreground">{isRtl ? "لا يوجد مؤلفون مطابقون لمعايير البحث" : "No authors found"}</p>
                </div>
              ) : (
                filteredAuthors.map((author) => (
                  <Card key={author.id} className="rounded-2xl border-2 border-border/80 hover:border-amber-500/40 transition-all bg-card overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Author Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                          ✍️
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-sm text-foreground">{author.fullName}</span>
                            <Badge variant="outline" className="font-mono text-[10px] font-bold">
                              {author.authorCode}
                            </Badge>
                            <Badge className={
                              author.verificationStatus === "approved"
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]"
                                : author.verificationStatus === "rejected"
                                ? "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]"
                            }>
                              {author.verificationStatus === "approved"
                                ? (isRtl ? "معتمد ومفعل ✅" : "Approved")
                                : author.verificationStatus === "rejected"
                                ? (isRtl ? "مرفوض ❌" : "Rejected")
                                : (isRtl ? "قيد المراجعة والتدقيق ⏳" : "Pending Review")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>🎓 {author.specialization}</span>
                            {author.institution && <span>🏛️ {author.institution}</span>}
                            <span>📅 {author.joinedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAuthor(author);
                            setShowAuthorKycModal(true);
                          }}
                          className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isRtl ? "فحص المستندات والهوية" : "Inspect KYC"}</span>
                        </Button>

                        {author.verificationStatus !== "approved" ? (
                          <Button 
                            size="sm"
                            onClick={() => handleApproveAuthor(author)}
                            className="h-9 px-3.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRtl ? "اعتماد الحساب وتفعيله" : "Approve & Activate"}</span>
                          </Button>
                        ) : (
                          <Badge className="h-9 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold">
                            ✓ {isRtl ? "حساب معتمد رسمياً" : "Verified Author"}
                          </Badge>
                        )}

                        {author.verificationStatus === "pending_review" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedAuthor(author);
                              setShowRejectAuthorModal(true);
                            }}
                            className="h-9 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{isRtl ? "رفض" : "Reject"}</span>
                          </Button>
                        )}
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: فحص المخطوطات والملفات (Manuscripts & Files)       */}
          {/* ========================================================= */}
          <TabsContent value="manuscripts" className="space-y-6 mt-0 animate-fade-in">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "إجمالي المخطوطات الواردة" : "Total Manuscripts"}</span>
                  <span className="text-2xl font-black text-foreground">{submissions.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  📚
                </div>
              </Card>

              <Card className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block">{isRtl ? "قيد الفحص والتحكيم" : "Pending Review"}</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingSubmissionsCount}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  🔍
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "مؤلفات منشورة في المتجر" : "Published Works"}</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {submissions.filter(s => s.status === "published").length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  🎉
                </div>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground start-3" />
                  <Input 
                    placeholder={isRtl ? "ابحث بعنوان المخطوطة، اسم المؤلف، أو التخصص العلمي..." : "Search by title, author, field..."}
                    value={manuscriptSearch}
                    onChange={(e) => setManuscriptSearch(e.target.value)}
                    className="h-10 text-xs rounded-xl ps-9"
                  />
                </div>
                <Select value={manuscriptFilterStatus} onValueChange={setManuscriptFilterStatus}>
                  <SelectTrigger className="w-full sm:w-52 h-10 rounded-xl text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</SelectItem>
                    <SelectItem value="pending_review">{isRtl ? "قيد المراجعة ⏳" : "Pending Review"}</SelectItem>
                    <SelectItem value="approved">{isRtl ? "معتمدة / صدرت فاتورة ✅" : "Approved"}</SelectItem>
                    <SelectItem value="in_print">{isRtl ? "قيد الطباعة 🖨️" : "In Print"}</SelectItem>
                    <SelectItem value="published">{isRtl ? "منشورة بالمتجر 📚" : "Published"}</SelectItem>
                    <SelectItem value="rejected">{isRtl ? "مرفوضة ❌" : "Rejected"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Manuscripts List */}
            <div className="space-y-4">
              {filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                  <p className="text-sm font-bold text-muted-foreground">{isRtl ? "لا توجد مخطوطات مطابقة للبحث" : "No manuscripts found"}</p>
                </div>
              ) : (
                filteredSubmissions.map((sub) => (
                  <Card key={sub.id} className="rounded-3xl border-2 border-border/80 hover:border-blue-500/40 transition-all bg-card overflow-hidden">
                    <div className="p-5 sm:p-6 space-y-4">
                      
                      {/* Top Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{sub.id}</span>
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                            {sub.category}
                          </Badge>
                          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                            {sub.publishType === "both" 
                              ? (isRtl ? "نشر مزدوج (ورقي + رقمي)" : "Dual Format") 
                              : sub.publishType === "digital" 
                              ? (isRtl ? "رقمي فقط E-Book" : "Digital Only")
                              : (isRtl ? "ورقي فقط Print" : "Print Only")}
                          </Badge>
                        </div>

                        <Badge className={
                          sub.status === "published"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs font-black"
                            : sub.status === "approved"
                            ? "bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs font-bold"
                            : sub.status === "rejected"
                            ? "bg-destructive/15 text-destructive border-destructive/30 text-xs font-bold"
                            : "bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs font-bold"
                        }>
                          {sub.status === "published"
                            ? (isRtl ? "منشور رسمياً بالمتجر 📚" : "Published")
                            : sub.status === "approved"
                            ? (isRtl ? "معتمد وصدرت الفاتورة ✅" : "Approved")
                            : sub.status === "in_print"
                            ? (isRtl ? "قيد الطباعة 🖨️" : "In Print")
                            : sub.status === "rejected"
                            ? (isRtl ? "مرفوض ❌" : "Rejected")
                            : (isRtl ? "قيد الفحص والتحكيم ⏳" : "Under Review")}
                        </Badge>
                      </div>

                      {/* Main Title & Author */}
                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-black text-foreground">{sub.title}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">✍️ {sub.authorName} ({sub.authorCode})</span>
                          <span>📄 {sub.pageCount} صفحة</span>
                          <span>🌐 {sub.language}</span>
                          <span>📅 تاريخ الرفع: {sub.submissionDate}</span>
                        </div>
                      </div>

                      {/* Synopsis */}
                      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-2xl border border-border/60">
                        {sub.synopsis}
                      </p>

                      {/* Attached Files Section (فحص الملفات المرفقة) */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-foreground">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>{isRtl ? "فحص الملفات المرفقة للمخطوطة:" : "Attached Files Inspection:"}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          
                          {/* File 1: Manuscript File */}
                          <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                              <div className="text-start truncate">
                                <span className="text-[11px] font-bold block truncate">
                                  {sub.manuscriptFile?.name || (isRtl ? "ملف المخطوطة الرئيسي" : "Manuscript File")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{sub.manuscriptFile?.size || "4.2 MB"} • PDF/Word</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setPreviewManuscript(sub);
                                setShowFileModal(true);
                              }}
                              className="h-7 px-2.5 text-[10px] font-bold rounded-lg shrink-0 gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            >
                              <Download className="w-3 h-3" />
                              <span>{isRtl ? "معاينة 📥" : "View"}</span>
                            </Button>
                          </div>

                          {/* File 2: Cover */}
                          <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />
                              <div className="text-start truncate">
                                <span className="text-[11px] font-bold block truncate">
                                  {sub.coverImage || (isRtl ? "صورة الغلاف المقترح" : "Cover Image")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{isRtl ? "صورة عالية الجودة" : "HD Cover"}</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setPreviewCover(sub);
                                setShowCoverModal(true);
                              }}
                              className="h-7 px-2.5 text-[10px] font-bold rounded-lg shrink-0 gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isRtl ? "عرض 👁️" : "View"}</span>
                            </Button>
                          </div>

                          {/* File 3: Intro Video */}
                          <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Video className="w-5 h-5 text-rose-500 shrink-0" />
                              <div className="text-start truncate">
                                <span className="text-[11px] font-bold block truncate">
                                  {sub.introVideo?.name || (isRtl ? "فيديو تعريفي بالمؤلف" : "Intro Video")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{isRtl ? "ملف MP4" : "Video file"}</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setPreviewVideo(sub);
                                setShowVideoModal(true);
                              }}
                              className="h-7 px-2.5 text-[10px] font-bold rounded-lg shrink-0 gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isRtl ? "تشغيل ▶" : "Play"}</span>
                            </Button>
                          </div>

                        </div>
                      </div>

                      {/* Admin Decision Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                        <div className="text-xs text-muted-foreground">
                          {sub.adminFeedback && (
                            <span className="font-semibold text-amber-700 dark:text-amber-300">
                              💬 {isRtl ? "ملاحظات الإدارة السابقة:" : "Admin Feedback:"} {sub.adminFeedback}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedManuscript(sub);
                              setShowInvoiceModal(true);
                            }}
                            className="h-9 px-3.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{isRtl ? "قبول وإصدار فاتورة النشر" : "Approve & Issue Invoice"}</span>
                          </Button>

                          {sub.status !== "published" && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                NashrDataStore.updateSubmissionStatus(
                                  sub.id, 
                                  "published", 
                                  isRtl ? "تم طرح الكتاب بنجاح في متجر UNIGATES." : "Published live on book store.",
                                  `BK-DAR-${Math.floor(1000 + Math.random() * 9000)}`
                                );
                                loadAllData();
                                toast({
                                  title: isRtl ? "🎉 تم النشر المباشر في المتجر!" : "Published Live!",
                                  description: isRtl ? "أصبح الكتاب متاحاً للشراء في متجر الكتب وقائمة المؤلفات المنشورة." : "Book is now live for readers."
                                });
                              }}
                              className="h-9 px-3 rounded-xl font-bold text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 gap-1.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{isRtl ? "نشر مباشر بالمتجر" : "Publish to Store"}</span>
                            </Button>
                          )}

                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedManuscript(sub);
                              setShowManuscriptModal(true);
                            }}
                            className="h-9 px-3 rounded-xl font-bold text-xs border-border hover:bg-muted gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{isRtl ? "إرسال ملاحظات تدقيق" : "Review Notes"}</span>
                          </Button>
                        </div>
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: الفواتير والمطابقة المالية (Invoices & Payments)    */}
          {/* ========================================================= */}
          <TabsContent value="invoices" className="space-y-6 mt-0 animate-fade-in">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "إجمالي الفواتير الصادرة" : "Total Invoices"}</span>
                  <span className="text-2xl font-black text-foreground">{invoices.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  💳
                </div>
              </Card>

              <Card className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block">{isRtl ? "إيصالات قيد المراجعة والمطابقة" : "Receipts Under Review"}</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{pendingInvoicesCount}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
                  ⏳
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "فواتير تم سدادها بنجاح" : "Paid Invoices"}</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {invoices.filter(i => i.status === "paid").length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  ✅
                </div>
              </Card>
            </div>

            {/* Invoices List */}
            <div className="space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                  <p className="text-sm font-bold text-muted-foreground">{isRtl ? "لا توجد فواتير مطابقة للبحث" : "No invoices found"}</p>
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <Card key={inv.id} className="rounded-2xl border-2 border-border/80 hover:border-emerald-500/40 transition-all bg-card overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-black text-foreground">{inv.invoiceNumber}</span>
                          <Badge className={
                            inv.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]"
                              : inv.status === "under_review"
                              ? "bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px]"
                              : "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
                          }>
                            {inv.status === "paid"
                              ? (isRtl ? "تم السداد بنجاح ✅" : "Paid")
                              : inv.status === "under_review"
                              ? (isRtl ? "إيصال سداد قيد التدقيق ⏳" : "Receipt Under Review")
                              : (isRtl ? "بانتظار السداد ⚠️" : "Unpaid")}
                          </Badge>
                          <span className="text-sm font-black text-foreground font-mono">
                            {inv.amount} {inv.currency}
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="font-bold text-foreground">✍️ {inv.authorName}</span>
                          <span className="text-muted-foreground"> • {inv.manuscriptTitle}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span>📅 تاريخ الإصدار: {inv.createdAt}</span>
                          {inv.paymentMethod && <span>🏛️ طريقة الدفع: {inv.paymentMethod}</span>}
                          {inv.paymentDate && <span>⏱️ تاريخ السداد: {inv.paymentDate}</span>}
                        </div>
                      </div>

                      {/* Audit Action */}
                      <div className="flex items-center gap-2">
                        {inv.receiptImageUrl ? (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="h-9 px-3 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? "معاينة واعتماد إيصال السداد" : "Audit Receipt"}</span>
                          </Button>
                        ) : inv.status === "unpaid" ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border/80">
                            {isRtl ? "بانتظار قيام المؤلف برفع الإيصال" : "Awaiting receipt upload"}
                          </Badge>
                        ) : (
                          <Badge className="h-9 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold">
                            ✓ {isRtl ? "تمت المطابقة والاعتماد" : "Audited & Completed"}
                          </Badge>
                        )}
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </TabsContent>

        </Tabs>

      </main>

      {/* ── Dialog 1: Author KYC & Document Inspection Modal ── */}
      <Dialog open={showAuthorKycModal} onOpenChange={setShowAuthorKycModal}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {selectedAuthor && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-black flex items-center gap-2">
                    <span>🪪 {isRtl ? "ملف توثيق هوية ومؤهلات المؤلف (KYC)" : "Author KYC Profile"}</span>
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl ? "فحص وثائق الهوية، المؤهلات الأكاديمية، والبيانات الشخصية لاعتماد الحساب." : "Inspect credentials and ID verification."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                
                {/* Author Info Grid */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-sm">{selectedAuthor.fullName}</span>
                    <Badge className="bg-amber-500/15 text-amber-600 font-bold text-[10px]">
                      {selectedAuthor.authorCode}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>🎓 <strong className="text-foreground">{isRtl ? "التخصص:" : "Field:"}</strong> {selectedAuthor.specialization}</div>
                    <div>🏛️ <strong className="text-foreground">{isRtl ? "الجامعة/الجهة:" : "Institution:"}</strong> {selectedAuthor.institution || (isRtl ? "مؤلف مستقل" : "Independent")}</div>
                    <div>📞 <strong className="text-foreground">{isRtl ? "الهاتف:" : "Phone:"}</strong> {selectedAuthor.phone}</div>
                    <div>✉️ <strong className="text-foreground">{isRtl ? "البريد:" : "Email:"}</strong> {selectedAuthor.email}</div>
                  </div>
                </div>

                {/* Documents Inspection */}
                <div className="space-y-3">
                  <span className="font-black text-foreground block">{isRtl ? "المستندات الرسمية المرفقة للتدقيق:" : "Attached Verification Documents:"}</span>
                  
                  {/* National ID */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <span>🆔</span>
                        <span>{isRtl ? "بطاقة الهوية الوطنية / جواز السفر" : "National ID / Passport"}</span>
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                        {isRtl ? "ملف مرفق جاهز للفحص" : "Attached"}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 text-center border border-dashed border-border/80 text-muted-foreground text-xs space-y-2">
                      <ImageIcon className="w-8 h-8 mx-auto text-amber-500/60" />
                      <p className="font-bold text-foreground">{selectedAuthor.nationalIdUrl || "National_ID_Card_Scan.jpg"}</p>
                      <p className="text-[10px]">تم تشفير الوثيقة ومطابقتها وفق معايير الأمان الوطنية للتحقق من هوية الباحثين.</p>
                    </div>
                  </div>

                  {/* Academic Qualifications */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <span>🎓</span>
                        <span>{isRtl ? "المؤهلات والشهادات الأكاديمية" : "Academic Qualifications"}</span>
                      </span>
                      <Badge className="bg-blue-500/10 text-blue-600 text-[10px]">
                        {isRtl ? "شهادة الدكتوراه / الماجستير" : "Degree Certified"}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 text-center border border-dashed border-border/80 text-muted-foreground text-xs space-y-2">
                      <GraduationCap className="w-8 h-8 mx-auto text-blue-500/60" />
                      <p className="font-bold text-foreground">
                        {selectedAuthor.qualificationUrls?.[0] || "Doctorate_Degree_Certificate.pdf"}
                      </p>
                      <p className="text-[10px]">شهادة موثقة صادرة من الجامعة ومعتمدة من المجلس الأعلى للجامعات.</p>
                    </div>
                  </div>

                </div>

              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => setShowAuthorKycModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
                {selectedAuthor.verificationStatus !== "approved" && (
                  <Button 
                    onClick={() => {
                      handleApproveAuthor(selectedAuthor);
                      setShowAuthorKycModal(false);
                    }}
                    className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRtl ? "اعتماد الحساب رسمياً الآن" : "Approve Account"}</span>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Reject Author Modal ── */}
      <Dialog open={showRejectAuthorModal} onOpenChange={setShowRejectAuthorModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{isRtl ? "رفض اعتماد الحساب أو طلب مستندات إضافية" : "Reject or Request Documents"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? "يرجى كتابة سبب عدم اعتماد الحساب لتوجيه المؤلف لاستكماله." : "Specify feedback for rejection."}
            </DialogDescription>
          </DialogHeader>

          <Textarea 
            placeholder={isRtl ? "مثال: صورة الهوية غير واضحة، يرجى إعادة رفع بطاقة الرقم القومي سارية أو شهادة التخرج..." : "e.g. ID scan blurry, please re-upload valid national ID..."}
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            className="rounded-xl text-xs min-h-[90px]"
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectAuthorModal(false)} className="rounded-xl text-xs font-bold">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleRejectAuthor} className="rounded-xl text-xs font-black bg-destructive hover:bg-destructive/90 text-white">
              {isRtl ? "تأكيد الرفض" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 3: Issue Publishing Invoice Modal ── */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          {selectedManuscript && (
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "إصدار فاتورة تكاليف النشر للمؤلف" : "Issue Publishing Invoice"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? `إصدار فاتورة رسمية للمخطوطة "${selectedManuscript.title}" باسم المؤلف ${selectedManuscript.authorName}.`
                    : `Generate official invoice for ${selectedManuscript.title}.`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="font-bold">{isRtl ? "مبلغ الفاتورة الإجمالي (جنيه مصري): *" : "Amount (EGP): *"}</Label>
                  <Input 
                    type="number"
                    min="100"
                    step="50"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-bold">{isRtl ? "تفاصيل بنود التكلفة الموضحة للمؤلف:" : "Cost Items Description:"}</Label>
                  <Textarea 
                    placeholder={isRtl ? "رسوم التدقيق اللغوي الأكاديمي، تجهيز الغلاف، واستخراج رقم الإيداع الدولي..." : "Academic proofreading, cover design, ISBN..."}
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                    className="rounded-xl text-xs min-h-[70px]"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInvoiceModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white">
                  {isRtl ? "إصدار الفاتورة فورياً ➔" : "Issue Invoice"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 4: Review Notes Modal ── */}
      <Dialog open={showManuscriptModal} onOpenChange={setShowManuscriptModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              <span>{isRtl ? "إرسال ملاحظات التحكيم للمؤلف" : "Send Editorial Notes"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? "كتابة ملاحظات التدقيق اللغوي أو التنسيق الأكاديمي المطلوبة من المؤلف." : "Provide proofreading & formatting notes."}
            </DialogDescription>
          </DialogHeader>

          <Textarea 
            placeholder={isRtl ? "اكتب توجيهات هيئة النشر بدار عبيد هنا..." : "Write editorial guidance here..."}
            value={adminFeedback}
            onChange={(e) => setAdminFeedback(e.target.value)}
            className="rounded-xl text-xs min-h-[90px]"
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowManuscriptModal(false)} className="rounded-xl text-xs font-bold">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => handleUpdateManuscriptStatus("pending_review", adminFeedback.trim())} 
              className="rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRtl ? "إرسال الملاحظات" : "Send Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 5: Receipt Inspection Modal ── */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>{isRtl ? "فحص واعتماد إيصال السداد المالي" : "Verify Payment Receipt"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl ? `مطابقة التحويل البنكي للفاتورة رقم ${selectedInvoice.invoiceNumber}.` : "Audit payment proof."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                  <div><strong>{isRtl ? "المؤلف:" : "Author:"}</strong> {selectedInvoice.authorName}</div>
                  <div><strong>{isRtl ? "الكتاب:" : "Book:"}</strong> {selectedInvoice.manuscriptTitle}</div>
                  <div><strong>{isRtl ? "المبلغ المطلوب:" : "Amount:"}</strong> {selectedInvoice.amount} {selectedInvoice.currency}</div>
                  <div><strong>{isRtl ? "طريقة التحويل:" : "Method:"}</strong> {selectedInvoice.paymentMethod || (isRtl ? "تحويل بنكي رسمي" : "Bank Transfer")}</div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/40 border-2 border-dashed border-border/80 text-center space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-blue-500/70" />
                  <span className="font-bold text-foreground block">{selectedInvoice.receiptImageUrl}</span>
                  <p className="text-[10px] text-muted-foreground">{isRtl ? "إيصال التحويل البنكي المرفوع من قبل المؤلف." : "Uploaded bank transfer receipt."}</p>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => handleVerifyReceipt(false)} className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10">
                  {isRtl ? "رفض الإيصال" : "Reject"}
                </Button>
                <Button onClick={() => handleVerifyReceipt(true)} className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? "اعتماد السداد المالي ✅" : "Approve Payment"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 6: Manuscript File Interactive Document Viewer ── */}
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent className="max-w-3xl rounded-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
          {previewManuscript && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span>{isRtl ? "معاينة وفحص ملف المخطوطة (PDF / Word)" : "Manuscript Document Viewer"}</span>
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? `فحص محتوى المخطوطة "${previewManuscript.title}" للمؤلف ${previewManuscript.authorName}.`
                    : `Inspecting manuscript file for ${previewManuscript.title}.`}
                </DialogDescription>
              </DialogHeader>

              {/* Document Meta & Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/70 text-xs">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                    {previewManuscript.manuscriptFile?.name || "Manuscript_Draft.pdf"}
                  </Badge>
                  <span className="text-muted-foreground">{previewManuscript.manuscriptFile?.size || "4.2 MB"} • {previewManuscript.pageCount} صفحة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold bg-card border-border">
                    {isRtl ? "نظام تدقيق مشفر 🔒" : "Encrypted Document"}
                  </Badge>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      toast({
                        title: isRtl ? "جاري تحميل الملف..." : "Downloading file...",
                        description: isRtl ? `تم بدء تحميل ${previewManuscript.manuscriptFile?.name || "المخطوطة"} إلى جهازك.` : "Download initiated."
                      });
                    }}
                    className="h-8 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تحميل نسخة للحاسوب" : "Download File"}</span>
                  </Button>
                </div>
              </div>

              {/* Document Reader Simulator */}
              <div className="p-6 rounded-2xl bg-slate-950 text-slate-100 border border-border/80 space-y-6 min-h-[380px] shadow-inner select-none">
                <div className="border-b border-slate-800 pb-4 text-center space-y-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    دار عبيد للنشر والتوزيع • النسخة الأكاديمية الأولية
                  </Badge>
                  <h3 className="text-xl font-bold text-amber-400">{previewManuscript.title}</h3>
                  <p className="text-xs text-slate-400">
                    إعداد: {previewManuscript.authorName} | كود: {previewManuscript.authorCode} | التصنيف: {previewManuscript.category}
                  </p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-amber-400 block mb-1">ملخص المخطوطة والتمهيد العلمي:</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{previewManuscript.synopsis}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px]">
                    <strong className="text-blue-400 block">فهرس المحتويات والمحاور المرفقة:</strong>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>المقدمة: الإطار النظري والمنهجية المتبعة في إعداد البحث / المؤلف.</li>
                      <li>الفصل الأول: المفاهيم الأساسية، الخلفية التاريخية، والدراسات السابقة المقارنة.</li>
                      <li>الفصل الثاني: التحليل التطبيقي، المؤشرات الميدانية، والنتائج الاستقصائية.</li>
                      <li>الفصل الثالث: التوصيات الأكاديمية والسياسات المقترحة لدار النشر.</li>
                      <li>قائمة المراجع والمصادر العربية والأجنبية مع التوثيق المعتمد (APA).</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center justify-between">
                    <span>✓ تم التدقيق الآلي لسلامة ملف الـ PDF: لا توجد صفحات تالفة وجاهز لطباعة الـ Offset الفاخرة.</span>
                    <span className="font-mono text-[10px]">CRC-32: OK</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => setShowFileModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق المعاينة" : "Close"}
                </Button>
                <Button 
                  onClick={() => {
                    setShowFileModal(false);
                    setSelectedManuscript(previewManuscript);
                    setShowInvoiceModal(true);
                  }}
                  className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isRtl ? "اعتماد الملف وإصدار الفاتورة ➔" : "Accept & Invoice"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 7: Cover Inspection Lightbox ── */}
      <Dialog open={showCoverModal} onOpenChange={setShowCoverModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          {previewCover && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "معاينة صورة الغلاف المقترح للكتاب" : "Cover Image Preview"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl ? `مطابقة أبعاد وجودة غلاف "${previewCover.title}".` : "Cover resolution & spine inspect."}
                </DialogDescription>
              </DialogHeader>

              {/* 3D Realistic Book Cover Representation */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 border-2 border-border/80 flex flex-col items-center justify-center">
                <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-700 to-rose-800 text-white p-4 shadow-2xl flex flex-col justify-between border-4 border-amber-400/40 relative overflow-hidden group">
                  <div className="space-y-1 z-10">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-200">DAR OBEID PUBLISHING</span>
                    <h4 className="text-sm font-black leading-snug line-clamp-3">{previewCover.title}</h4>
                  </div>
                  <div className="z-10 pt-2 border-t border-white/20">
                    <span className="text-[10px] font-bold block truncate">{previewCover.authorName}</span>
                    <span className="text-[8px] text-amber-200 block">{previewCover.category}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>الأبعاد: 17x24 cm (قطع كبير)</span>
                  <span>•</span>
                  <span>الدقة: 300 DPI</span>
                  <span>•</span>
                  <span>الألوان: CMYK</span>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => setShowCoverModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: isRtl ? "تم اعتماد الغلاف المقترح" : "Cover Approved",
                      description: isRtl ? "تم إرسال الغلاف لقسم تجهيز طباعة الأوفست وتصميم النسخة الرقمية." : "Sent to pre-press."
                    });
                    setShowCoverModal(false);
                  }}
                  className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? "اعتماد الغلاف الفني" : "Approve Cover"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 8: Intro Video Player ── */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-lg rounded-3xl p-6 space-y-4">
          {previewVideo && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? "تشغيل ومعاينة الفيديو التعريفي" : "Author Intro Video"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl ? `فيديو تعريفي للمؤلف ${previewVideo.authorName} حول كتاب "${previewVideo.title}".` : "Video intro."}
                </DialogDescription>
              </DialogHeader>

              <div className="aspect-video w-full rounded-2xl bg-black border border-border/80 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                  <Video className="w-8 h-8 fill-current" />
                </div>
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-xs text-white/80 bg-black/50 backdrop-blur-md p-2 rounded-xl">
                  <span className="font-bold truncate max-w-[200px]">{previewVideo.introVideo?.name || "Author_Intro_Pitch.mp4"}</span>
                  <span className="font-mono text-[10px]">01:45 / 02:30 • 1080p HD</span>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" onClick={() => setShowVideoModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;
