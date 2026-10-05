import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  PenTool, 
  FileText, 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Lock,
  AlertTriangle,
  UploadCloud, 
  Check, 
  User, 
  Stamp, 
  ExternalLink, 
  Bell, 
  Eye, 
  Download, 
  Printer, 
  LogOut, 
  Calendar, 
  Layers, 
  Clock, 
  Briefcase,
  GraduationCap,
  CreditCard,
  MessageSquare,
  Wallet,
  Send,
  Image as ImageIcon,
  Video,
  FileCheck,
  Key,
  Copy,
  PlusCircle,
  HelpCircle,
  Banknote,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { 
  AuthorProfile, 
  ManuscriptSubmission, 
  NashrInvoice, 
  NashrMessage, 
  BookSaleRecord, 
  PayoutRequest, 
  PublishType 
} from "@/types/nashr";
import { NashrDataStore } from "@/services/nashrDataStore";

const NasherDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "submit";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  // State from DataStore
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(NashrDataStore.getAuthorProfile());
  const isUnderReview = authorProfile.verificationStatus === "pending_review";

  const handleApproveAccount = () => {
    NashrDataStore.approveAuthor();
    refreshData();
    toast({
      title: isRtl ? "🎉 تمت الموافقة على الحساب واعتماده بنجاح!" : "Account Approved Successfully!",
      description: isRtl 
        ? "تمت مطابقة وثائق الهوية والمؤهلات الأكاديمية واعتماد الحساب رسمياً من إدارة دار عبيد. أصبحت كافة خدمات النشر والاستوديو متاحة لك الآن."
        : "Your credentials have been verified and author account officially activated.",
    });
  };

  const [submissions, setSubmissions] = useState<ManuscriptSubmission[]>(NashrDataStore.getSubmissions());
  const [invoices, setInvoices] = useState<NashrInvoice[]>(NashrDataStore.getInvoices());
  const [messages, setMessages] = useState<NashrMessage[]>(NashrDataStore.getMessages());
  const [sales, setSales] = useState<BookSaleRecord[]>(NashrDataStore.getSales());
  const [payouts, setPayouts] = useState<PayoutRequest[]>(NashrDataStore.getPayouts());
  const [financials, setFinancials] = useState(NashrDataStore.getFinancialSummary());

  // Form states for New Submission
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("دراسات وأبحاث أكاديمية");
  const [customCategory, setCustomCategory] = useState("");
  const [newPublishType, setNewPublishType] = useState<PublishType>("both");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newPageCount, setNewPageCount] = useState<number | string>(200);
  const [newLanguage, setNewLanguage] = useState("العربية");
  const [coverFileName, setCoverFileName] = useState("");
  const [manuscriptFileName, setManuscriptFileName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);

  // Form states for Chat
  const [chatInput, setChatInput] = useState("");
  const [chatAttachmentName, setChatAttachmentName] = useState("");

  // Form states for Payment Receipt Upload Modal
  const [selectedInvoice, setSelectedInvoice] = useState<NashrInvoice | null>(null);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState("bank_transfer");
  const [receiptImagePlaceholder, setReceiptImagePlaceholder] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Form states for Payout Request Modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number | string>("");
  const [payoutMethod, setPayoutMethod] = useState<any>("bank_transfer");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Password Change Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const refreshData = () => {
    setAuthorProfile(NashrDataStore.getAuthorProfile());
    setSubmissions(NashrDataStore.getSubmissions());
    setInvoices(NashrDataStore.getInvoices());
    setMessages(NashrDataStore.getMessages());
    setSales(NashrDataStore.getSales());
    setPayouts(NashrDataStore.getPayouts());
    setFinancials(NashrDataStore.getFinancialSummary());
  };

  // Submit New Manuscript
  const handleSubmitManuscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnderReview) {
      toast({
        title: isRtl ? "الحساب قيد المراجعة" : "Account Under Review",
        description: isRtl 
          ? "حسابكم ومستنداتكم قيد التدقيق حالياً من قبل لجان التحكيم. ستتمكن من إرسال المخطوطات والتعاقد فور اعتماد الإدارة وتفعيل الحساب."
          : "Your credentials are under review. Submissions will be activated upon official platform approval.",
        variant: "destructive"
      });
      return;
    }

    if (!newTitle.trim() || !newSynopsis.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى كتابة عنوان المؤلف والنبذة التعريفية." : "Please provide title and synopsis.",
        variant: "destructive"
      });
      return;
    }

    if (newCategory === "آخر" && !customCategory.trim()) {
      toast({
        title: isRtl ? "المجال العلمي مطلوب" : "Field required",
        description: isRtl ? "يرجى كتابة اسم وطبيعة مجالك العلمي في الخانة المخصصة." : "Please specify your field of expertise.",
        variant: "destructive"
      });
      return;
    }

    const finalCategory = newCategory === "آخر" ? customCategory.trim() : newCategory;

    setSubmittingWork(true);
    setTimeout(() => {
      NashrDataStore.addSubmission({
        authorId: authorProfile.id,
        authorName: authorProfile.fullName,
        authorCode: authorProfile.authorCode,
        title: newTitle.trim(),
        category: finalCategory,
        publishType: newPublishType,
        synopsis: newSynopsis.trim(),
        pageCount: Number(newPageCount) || 150,
        language: newLanguage,
        coverImage: coverFileName || undefined,
        manuscriptFile: manuscriptFileName ? { name: manuscriptFileName, size: "4.2 MB", type: "PDF" } : undefined,
        introVideo: videoFileName ? { name: videoFileName } : undefined,
        priceEstimate: newPublishType === "digital" ? 90 : newPublishType === "print" ? 140 : 160
      });

      refreshData();
      setSubmittingWork(false);
      
      // Reset form
      setNewTitle("");
      setNewCategory("دراسات وأبحاث أكاديمية");
      setCustomCategory("");
      setNewSynopsis("");
      setCoverFileName("");
      setManuscriptFileName("");
      setVideoFileName("");

      toast({
        title: isRtl ? "🎉 تم إرسال المؤلف بنجاح للمراجعة!" : "Manuscript Submitted Successfully!",
        description: isRtl 
          ? "تم تحويل المخطوطة لإدارة دار عبيد للمراجعة والتدقيق والاعتماد."
          : "Your work is now under review by Dar Obeid editors."
      });
    }, 600);
  };

  // Send Internal Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    NashrDataStore.sendMessage(chatInput.trim(), chatAttachmentName || undefined);
    setChatInput("");
    setChatAttachmentName("");
    refreshData();
  };

  // Handle Payment Receipt Upload
  const handleConfirmPaymentReceipt = () => {
    if (!selectedInvoice) return;
    setUploadingReceipt(true);
    setTimeout(() => {
      NashrDataStore.uploadPaymentReceipt(
        selectedInvoice.id,
        receiptImagePlaceholder || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
        paymentMethodSelect === "bank_transfer" ? "تحويل بنكي رسمي" : paymentMethodSelect === "instapay" ? "إنستاباي InstaPay" : "محفظة فودافون كاش"
      );
      refreshData();
      setUploadingReceipt(false);
      setSelectedInvoice(null);
      setReceiptImagePlaceholder("");
      toast({
        title: isRtl ? "تم رفع إيصال الدفع بنجاح" : "Receipt Uploaded",
        description: isRtl ? "تم إرسال إيصال السداد للإدارة المالية للمطابقة والاعتماد." : "Payment proof sent for financial verification."
      });
    }, 600);
  };

  // Handle Payout Request
  const handleRequestPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum <= 0) {
      toast({
        title: isRtl ? "مبلغ غير صحيح" : "Invalid Amount",
        description: isRtl ? "يرجى تحديد مبلغ صالح للسحب." : "Enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    if (amountNum > financials.availableBalance) {
      toast({
        title: isRtl ? "الرصيد غير كافٍ" : "Insufficient Balance",
        description: isRtl ? `الرصيد المتاح للسحب هو ${financials.availableBalance} جنيه.` : `Available balance is ${financials.availableBalance} EGP.`,
        variant: "destructive"
      });
      return;
    }

    if (!payoutDetails.trim()) {
      toast({
        title: isRtl ? "بيانات التحويل مطلوبة" : "Account details required",
        description: isRtl ? "يرجى كتابة رقم الحساب البنكي أو رقم المحفظة." : "Please provide account or wallet number.",
        variant: "destructive"
      });
      return;
    }

    setRequestingPayout(true);
    setTimeout(() => {
      NashrDataStore.requestPayout(amountNum, payoutMethod, payoutDetails.trim());
      refreshData();
      setRequestingPayout(false);
      setPayoutModalOpen(false);
      setPayoutAmount("");
      setPayoutDetails("");
      toast({
        title: isRtl ? "🎉 تم تسجيل طلب السحب بنجاح!" : "Payout Request Submitted!",
        description: isRtl ? "سيتم مراجعة الطلب وتحويل المبلغ لحسابكم خلال 24-48 ساعة." : "Your payout will be processed within 24-48 hours."
      });
    }, 600);
  };

  // Change Temporary Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: isRtl ? "كلمة المرور قصيرة" : "Short password",
        description: isRtl ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل." : "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: isRtl ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    NashrDataStore.updatePassword(newPassword);
    refreshData();
    setPasswordModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    toast({
      title: isRtl ? "🎉 تم تعيين كلمة المرور الدائمة بنجاح!" : "Password Updated Successfully!",
      description: isUnderReview
        ? (isRtl 
            ? "تم حفظ كلمة المرور الجديدة. تنبيه: يبقى الحساب تحت المراجعة والتدقيق لحين صدور الموافقة الرسمية من المنصة." 
            : "Password updated. Note: Account remains under administrative review until officially approved.")
        : (isRtl 
            ? "تم تأمين حساب المؤلف بكلمة المرور الجديدة الخاصة بك." 
            : "Your permanent password is now active.")
    });
  };

  const publishedWorks = submissions.filter(s => s.status === "published");

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      
      {/* Top Header Navbar */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <Link to="/nashr" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-foreground">UNIGATES</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-1.5 py-0">
                {isRtl ? "منصة نشر" : "Nashr Studio"}
              </Badge>
            </div>
            <span className="text-[10px] block font-bold text-muted-foreground">
              {isRtl ? "لوحة تحكم المؤلف واستوديو المبيعات" : "Author Dashboard & Publishing Suite"}
            </span>
          </div>
        </Link>

        {/* User Badge & Fast Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/70 text-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              ✍️
            </div>
            <div className="text-start">
              <span className="font-bold text-foreground block truncate max-w-[170px]">{authorProfile.fullName}</span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">{authorProfile.authorCode}</span>
            </div>
          </div>

          <ThemeToggle />
          <LanguageSelectorDropdown />

          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => navigate("/nashr")}
            className="text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-2.5 rounded-xl gap-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "خروج" : "Logout"}</span>
          </Button>
        </div>
      </header>

      {/* Account Verification & Security Status Banner */}
      {isUnderReview ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border-b-2 border-amber-500/40 px-4 sm:px-8 py-4 shadow-sm animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-200">
                    {isRtl ? "الحساب تحت المراجعة والتدقيق من قبل إدارة المنصة" : "Account Under Platform Review"}
                  </h3>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-black px-2 py-0.5">
                    {isRtl ? "مستندات الهوية والمؤهلات الأكاديمية قيد الفحص ⏳" : "Documents Under Verification"}
                  </Badge>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium max-w-3xl">
                  {isRtl
                    ? "يجري حالياً فحص وتدقيق مستنداتكم الرسمية (الهوية الوطنية والمؤهلات الأكاديمية) من قبل لجان التحكيم وإدارة دار عبيد للنشر والتوزيع. حتى وإن قمت بتغيير كلمة المرور المؤقتة، سيبقى الحساب تحت المراجعة، وفور اعتماد الإدارة ستختفي هذه الرسالة تلقائياً وتتمكن من استخدام كامل خدمات الاستوديو."
                    : "Your identity and academic credentials are being reviewed by Dar Obeid committee. Even after updating your temporary password, this notice remains active until officially approved."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
                className="h-9 px-3.5 rounded-xl border-amber-500/40 bg-background/80 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {authorProfile.isTemporaryPassword 
                    ? (isRtl ? "تعيين كلمة مرور دائمة" : "Set Permanent Password") 
                    : (isRtl ? "تغيير كلمة المرور" : "Change Password")}
                </span>
              </Button>

              <Button
                size="sm"
                onClick={handleApproveAccount}
                className="h-9 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 gap-1.5 hover:scale-105 transition-all"
                title={isRtl ? "محاكاة اعتماد الإدارة وتفعيل الحساب فوراً" : "Simulate Platform Approval"}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRtl ? "اعتماد الحساب (موافقة الإدارة)" : "Simulate Approval"}</span>
              </Button>
            </div>

          </div>
        </div>
      ) : authorProfile.isTemporaryPassword ? (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {isRtl 
                ? "تنبيه أمان: حسابك يعمل حالياً بكلمة مرور مؤقتة. يُفضل تعيين كلمة مرور دائمة لحماية مؤلفاتك وبيانات أرباحك."
                : "Security Notice: You are using a temporary password. Please set a permanent password."}
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={() => setPasswordModalOpen(true)}
            className="h-7 px-3 rounded-lg text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0"
          >
            {isRtl ? "تغيير كلمة المرور الآن" : "Set Password"}
          </Button>
        </div>
      ) : null}

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16 space-y-6">

        {/* Author Executive Header Card */}
        <Card className="border-2 border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-6 sm:p-8 border-b border-border/60">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Profile Block */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white shadow-xl shadow-amber-500/20 flex items-center justify-center text-2xl sm:text-3xl font-black shrink-0">
                  ✍️
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
                      {authorProfile.fullName}
                    </h1>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black text-xs px-2.5 py-0.5">
                      {isRtl ? "كود المؤلف:" : "Code:"} {authorProfile.authorCode}
                    </Badge>
                    {isUnderReview ? (
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>{isRtl ? "الحساب تحت المراجعة والتدقيق" : "Under Review"}</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{isRtl ? "حساب معتمد وموثق رسمياً" : "Verified Author"}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                    {authorProfile.specialization} {authorProfile.institution ? `• ${authorProfile.institution}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {isRtl ? "تاريخ الانضمام:" : "Joined:"} {authorProfile.joinedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-rose-500" />
                      {isRtl ? "الناشر الرسمي:" : "Publisher:"} دار عبيد للنشر والتوزيع
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Wallet Stats Pill */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-md">
                <div className="p-3 rounded-xl bg-amber-500/10 text-start">
                  <span className="text-[10px] font-extrabold text-muted-foreground block">{isRtl ? "الرصيد المتاح للسحب" : "Available Balance"}</span>
                  <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">{financials.availableBalance} ج.م</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-start">
                  <span className="text-[10px] font-extrabold text-muted-foreground block">{isRtl ? "نسبة المؤلف (أرباحك)" : "Author Royalty"}</span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">{isRtl ? "70% رقمي • 30% ورقي" : "70% Digital • 30% Print"}</span>
                </div>
                <Button 
                  onClick={() => setPayoutModalOpen(true)}
                  disabled={financials.availableBalance <= 0}
                  className="h-12 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isRtl ? "طلب سحب الأرباح" : "Payout"}</span>
                </Button>
              </div>

            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-4 sm:px-6 pt-3 bg-muted/20 border-b border-border/60">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-transparent p-0 gap-1 sm:gap-2 justify-start overflow-x-auto">
                
                {/* 1. رفع مؤلفات */}
                <TabsTrigger 
                  value="submit" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isRtl ? "📁 رفع مؤلفات جديدة" : "Submit Manuscript"}</span>
                </TabsTrigger>

                {/* 2. المؤلفات المنشورة */}
                <TabsTrigger 
                  value="published" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isRtl ? "📚 المؤلفات المنشورة" : "Published Works"}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                    {publishedWorks.length}
                  </Badge>
                </TabsTrigger>

                {/* 3. الدفع والفواتير */}
                <TabsTrigger 
                  value="payments" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isRtl ? "💳 الفواتير وطرق الدفع" : "Invoices & Payments"}</span>
                  {invoices.filter(i => i.status === "unpaid").length > 0 && (
                    <Badge className="bg-destructive text-white text-[10px] px-1.5 py-0 h-4 font-bold">
                      {invoices.filter(i => i.status === "unpaid").length}
                    </Badge>
                  )}
                </TabsTrigger>

                {/* 4. التواصل الداخلي */}
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isRtl ? "💬 التواصل مع الإدارة" : "Direct Messages"}</span>
                </TabsTrigger>

                {/* 5. مبيعات الكتب والأرباح */}
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{isRtl ? "📈 مبيعات الكتب والأرباح" : "Sales & Royalties"}</span>
                </TabsTrigger>

                {/* 6. إدارة الحساب والأمان */}
                <TabsTrigger 
                  value="settings" 
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-transparent data-[state=active]:shadow-md transition-all gap-2 ms-auto"
                >
                  <Key className="w-4 h-4" />
                  <span>{isRtl ? "🔐 الأمان وكلمة المرور" : "Security"}</span>
                </TabsTrigger>

              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: 📁 رفع مؤلفات (Submit Manuscript) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "submit" && (
          <div className="space-y-6 animate-fade-in">
            {isUnderReview && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1 text-xs text-start">
                  <h4 className="font-black text-amber-900 dark:text-amber-300">
                    {isRtl ? "تنبيه: حساب المؤلف قيد المراجعة والتدقيق الأكاديمي" : "Notice: Author Account Under Review"}
                  </h4>
                  <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium">
                    {isRtl
                      ? "المستندات المرفقة (الهوية الوطنية والمؤهلات الأكاديمية) قيد الفحص والتدقيق من قبل إدارة النشر والتحكيم بدار عبيد. حتى وإن قمت بتغيير كلمة المرور المؤقتة، سيبقى الحساب تحت المراجعة، وسيتم تفعيل إرسال المخطوطات والتعاقد فور اعتماد الإدارة."
                      : "Your credentials are under administrative review. Manuscript submissions and contracts will be enabled once your account is officially approved."}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2 border-border/80 shadow-lg bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        📁
                      </div>
                      <div>
                        <CardTitle className="text-base font-black text-foreground">
                          {isRtl ? "استوديو تقديم ورفع مؤلف جديد للمراجعة" : "Submit New Work for Review"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {isRtl 
                            ? "ارفع مخطوطتك، صورة الغلاف، أو الفيديو التعريفي وحدد طريقة النشر المطلوبة"
                            : "Upload cover, manuscript file, or intro video and choose publishing method"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-5">
                    <form onSubmit={handleSubmitManuscript} className="space-y-5">
                      
                      {/* Title & Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold flex items-center gap-1">
                            <span>{isRtl ? "عنوان المؤلف / الكتاب *" : "Book Title *"}</span>
                          </Label>
                          <Input 
                            placeholder={isRtl ? "مثال: النظرية الحديثة في التقييم الأكاديمي" : "e.g. Modern Theory in Academic Evaluation"}
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                            className="h-11 rounded-xl text-xs font-semibold border-border bg-muted/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold flex items-center gap-1">
                            <span>{isRtl ? "المجال / التصنيف العلمي *" : "Category *"}</span>
                          </Label>
                          <Select 
                            value={newCategory} 
                            onValueChange={(val) => {
                              setNewCategory(val);
                              if (val !== "آخر") {
                                setCustomCategory("");
                              }
                            }}
                          >
                            <SelectTrigger className="h-11 rounded-xl font-bold text-xs border-border bg-muted/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="دراسات وأبحاث أكاديمية">دراسات وأبحاث أكاديمية</SelectItem>
                              <SelectItem value="كتب جامعية ومراجع تدريسية">كتب جامعية ومراجع تدريسية</SelectItem>
                              <SelectItem value="قانون وتشريعات وسياسة">قانون وتشريعات وسياسة</SelectItem>
                              <SelectItem value="هندسة وتقنية وذكاء اصطناعي">هندسة وتقنية وذكاء اصطناعي</SelectItem>
                              <SelectItem value="طب وعلوم صحية وصيدلة">طب وعلوم صحية وصيدلة</SelectItem>
                              <SelectItem value="إدارة أعمال واقتصاد">إدارة أعمال واقتصاد</SelectItem>
                              <SelectItem value="أدب وروايات وفكر عام">أدب وروايات وفكر عام</SelectItem>
                              <SelectItem value="تربية ومناهج تعليمية">تربية ومناهج تعليمية</SelectItem>
                              <SelectItem value="آخر" className="font-bold text-amber-600 dark:text-amber-400 border-t border-border/60 mt-1">
                                {isRtl ? "آخر (تحديد مجال غير موجود بالقائمة)" : "Other (specify)"}
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {newCategory === "آخر" && (
                            <div className="mt-2 space-y-1.5 animate-fade-in p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                              <Label className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <span>✍️ {isRtl ? "اكتب طبيعة أو اسم مجالك العلمي / التخصص: *" : "Specify academic field / discipline: *"}</span>
                              </Label>
                              <Input 
                                placeholder={isRtl ? "مثال: علوم الفضاء، الذكاء الاصطناعي الحيوي، علم الاجتماع الرقمي..." : "e.g. Space Sciences, Bioinformatics, Digital Sociology..."}
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                required
                                autoFocus
                                className="h-10 rounded-xl text-xs font-bold border-amber-500/40 bg-card focus:border-amber-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Publish Type Selection (Digital / Print / Both) */}
                      <div className="space-y-2 p-4 rounded-2xl bg-amber-500/5 border-2 border-amber-500/20">
                        <Label className="text-xs font-black text-foreground block">
                          {isRtl ? "حدد طريقة النشر المطلوبة من دار عبيد: *" : "Select Required Publishing Mode: *"}
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          
                          {/* Digital */}
                          <div 
                            onClick={() => setNewPublishType("digital")}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                              newPublishType === "digital" 
                                ? "border-amber-500 bg-amber-500/15 shadow-md" 
                                : "border-border bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                              📱
                            </div>
                            <div>
                              <span className="text-xs font-black block">{isRtl ? "نشر رقمي (E-Book)" : "Digital E-Book"}</span>
                              <span className="text-[10px] text-muted-foreground">{isRtl ? "قراءة فورية وتطبيقات ذكية" : "Instant reading on apps"}</span>
                            </div>
                          </div>

                          {/* Print */}
                          <div 
                            onClick={() => setNewPublishType("print")}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                              newPublishType === "print" 
                                ? "border-amber-500 bg-amber-500/15 shadow-md" 
                                : "border-border bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                              📖
                            </div>
                            <div>
                              <span className="text-xs font-black block">{isRtl ? "نشر ورقي (Print)" : "Print Edition"}</span>
                              <span className="text-[10px] text-muted-foreground">{isRtl ? "طباعة فاخرة وشحن للمكتبات" : "Physical copies & shipping"}</span>
                            </div>
                          </div>

                          {/* Both */}
                          <div 
                            onClick={() => setNewPublishType("both")}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                              newPublishType === "both" 
                                ? "border-amber-500 bg-amber-500/15 shadow-md ring-2 ring-amber-500/20" 
                                : "border-border bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                              ✨
                            </div>
                            <div>
                              <span className="text-xs font-black block">{isRtl ? "الاثنين معاً (رقمي + ورقي)" : "Hybrid (Digital + Print)"}</span>
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{isRtl ? "الخيار الأوسع انتشاراً" : "Most Popular"}</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* File Uploads (Image, File, Video) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* 1. Cover Image */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 text-center space-y-2">
                          <ImageIcon className="w-6 h-6 text-amber-500 mx-auto" />
                          <span className="text-xs font-bold block">{isRtl ? "صورة الغلاف (أو المقترح)" : "Book Cover"}</span>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setCoverFileName(e.target.files?.[0]?.name || "")}
                            className="text-[10px] h-8 rounded-lg cursor-pointer bg-background"
                          />
                          {coverFileName && <span className="text-[10px] font-bold text-emerald-600 block truncate">{coverFileName}</span>}
                        </div>

                        {/* 2. Manuscript File */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 text-center space-y-2">
                          <FileText className="w-6 h-6 text-blue-500 mx-auto" />
                          <span className="text-xs font-bold block">{isRtl ? "ملف المخطوطة (PDF / Word)" : "Manuscript File"}</span>
                          <Input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setManuscriptFileName(e.target.files?.[0]?.name || "")}
                            className="text-[10px] h-8 rounded-lg cursor-pointer bg-background"
                          />
                          {manuscriptFileName && <span className="text-[10px] font-bold text-emerald-600 block truncate">{manuscriptFileName}</span>}
                        </div>

                        {/* 3. Intro Video */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 text-center space-y-2">
                          <Video className="w-6 h-6 text-rose-500 mx-auto" />
                          <span className="text-xs font-bold block">{isRtl ? "فيديو تعريفي (اختياري)" : "Intro Video"}</span>
                          <Input 
                            type="file" 
                            accept="video/*"
                            onChange={(e) => setVideoFileName(e.target.files?.[0]?.name || "")}
                            className="text-[10px] h-8 rounded-lg cursor-pointer bg-background"
                          />
                          {videoFileName && <span className="text-[10px] font-bold text-emerald-600 block truncate">{videoFileName}</span>}
                        </div>

                      </div>

                      {/* Synopsis & Estimated Pages */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-extrabold flex items-center gap-1">
                            <span>{isRtl ? "نبذة وملخص المؤلف / الفهرس *" : "Synopsis & Table of Contents *"}</span>
                          </Label>
                          <span className="text-[10px] text-muted-foreground">{isRtl ? "تساعد لجنة القراءة بدار عبيد في التحكيم السريع" : "Helps editorial board evaluate"}</span>
                        </div>
                        <Textarea 
                          placeholder={isRtl ? "اكتب نبذة عن أهداف الكتاب، الفئة المستهدفة، والمحاور الرئيسية..." : "Describe book goals, target readers, and key chapters..."}
                          value={newSynopsis}
                          onChange={(e) => setNewSynopsis(e.target.value)}
                          required
                          rows={4}
                          className="rounded-xl text-xs border-border bg-muted/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold">{isRtl ? "عدد الصفحات التقديري" : "Estimated Pages"}</Label>
                          <Input 
                            type="number" 
                            value={newPageCount}
                            onChange={(e) => setNewPageCount(e.target.value)}
                            className="h-10 rounded-xl text-xs bg-muted/20"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold">{isRtl ? "لغة المؤلف" : "Language"}</Label>
                          <Select value={newLanguage} onValueChange={setNewLanguage}>
                            <SelectTrigger className="h-10 rounded-xl font-bold text-xs bg-muted/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="العربية">العربية</SelectItem>
                              <SelectItem value="الإنجليزية">English</SelectItem>
                              <SelectItem value="الفرنسية">Français</SelectItem>
                              <SelectItem value="مزدوج (عربي - إنجليزي)">مزدوج (عربي - إنجليزي)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={submittingWork}
                        size="lg"
                        className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/25 gap-2 hover:scale-[1.01] transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{isRtl ? "إرسال المخطوطة لإدارة المنصة للموافقة والاعتماد ➔" : "Submit Manuscript for Review ➔"}</span>
                      </Button>

                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info & Workflow Guide */}
              <div className="space-y-6">
                
                {/* Guide Card */}
                <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "مراحل اعتماد ونشر المؤلف" : "Publishing Workflow"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0">1</div>
                      <div>
                        <span className="font-black text-foreground block">{isRtl ? "المراجعة والتدقيق" : "Review & Editing"}</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{isRtl ? "فحص المخطوطة والتأكد من استيفاء الشروط والتدقيق اللغوي الأكاديمي." : "Manuscript vetting & academic proofreading."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs shrink-0">2</div>
                      <div>
                        <span className="font-black text-foreground block">{isRtl ? "الفاتورة وتجهيز الغلاف" : "Invoice & Formatting"}</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{isRtl ? "إصدار فاتورة التكلفة وسدادها مع تصميم الغلاف المعتمد وتجهيز ملفات الطباعة." : "Invoice generation, cover design & print files."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs shrink-0">3</div>
                      <div>
                        <span className="font-black text-foreground block">{isRtl ? "الموافقة والنشر المباشر" : "Approval & Publishing"}</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{isRtl ? "طرح الكتاب في صفحة المؤلفات المنشورة ومتجر UNIGATES فورياً." : "Book goes live on published roster and store."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">4</div>
                      <div>
                        <span className="font-black text-foreground block">{isRtl ? "مبيعات وأرباح فورية (70% رقمي / 30% ورقي)" : "Instant Royalties (70% Digital / 30% Print)"}</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{isRtl ? "تحصيل نسبة المؤلف مباشرة مع إمكانية سحب الأموال لحسابكم في أي وقت." : "Direct author royalty crediting and instant withdrawals."}</p>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Submissions in review tracker */}
                <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{isRtl ? "مخطوطاتك قيد المتابعة والاعتماد" : "Submissions Status"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="p-3 rounded-2xl bg-muted/30 border border-border/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-foreground truncate">{sub.title}</span>
                          <Badge className={
                            sub.status === "published" 
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                              : sub.status === "approved"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]"
                          }>
                            {sub.status === "published" ? (isRtl ? "منشور بالمتجر 🟢" : "Published") : (isRtl ? "قيد المراجعة ⏳" : "Under Review")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{sub.category}</span>
                          <span className="font-mono">{sub.submissionDate}</span>
                        </div>
                        {sub.adminFeedback && (
                          <p className="text-[10px] p-2 rounded-xl bg-background/80 border border-border/50 text-muted-foreground leading-relaxed">
                            {sub.adminFeedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: 📚 المؤلفات المنشورة (Published Works) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "published" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {isRtl ? "سجل المؤلفات والكتب المنشورة رسمياً" : "Official Published Books Roster"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl 
                    ? "الكتب التي تمت الموافقة عليها واعتمادها من إدارة المنصة ونشرها في متجر كتب UNIGATES"
                    : "Books vetted and published in the official UNIGATES bookstore"}
                </p>
              </div>

              <Button 
                onClick={() => handleTabChange("submit")}
                className="h-10 px-4 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isRtl ? "رفع مؤلف جديد" : "Submit New"}</span>
              </Button>
            </div>

            {publishedWorks.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-border/80 rounded-3xl space-y-3">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-base font-black">{isRtl ? "لا توجد مؤلفات منشورة بعد" : "No published works yet"}</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isRtl ? "بمجرد اعتماد وموافقة إدارة المنصة على مخطوطاتك، ستظهر هنا مباشرة مع كود الكتاب ورابط المتجر." : "Once approved, books appear here."}
                </p>
                <Button onClick={() => handleTabChange("submit")} className="bg-amber-500 text-white text-xs font-bold rounded-xl">
                  {isRtl ? "رفع أول مؤلف الآن" : "Submit First Book"}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedWorks.map((work) => (
                  <Card key={work.id} className="border-2 border-border/80 shadow-lg bg-card rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 transition-all">
                    <div>
                      {/* Top Header Strip */}
                      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-b border-border/60 flex items-center justify-between">
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-black">
                          {isRtl ? "معتمد ومنشور بالمتجر 🟢" : "Live in Store"}
                        </Badge>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {work.storeBookCode}
                        </span>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-18 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md flex items-center justify-center text-2xl font-bold shrink-0">
                            📖
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-black text-sm text-foreground line-clamp-2 leading-tight">
                              {work.title}
                            </h3>
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {work.category}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {work.synopsis}
                        </p>

                        <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground block">{isRtl ? "صيغة النشر:" : "Format:"}</span>
                            <span className="font-black text-foreground">
                              {work.publishType === "both" 
                                ? (isRtl ? "ورقي + رقمي 📦" : "Print & Digital")
                                : work.publishType === "print"
                                ? (isRtl ? "ورقي مطبوع 📖" : "Print Only")
                                : (isRtl ? "رقمي E-Book 📱" : "Digital Only")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">{isRtl ? "الصفحات:" : "Pages:"}</span>
                            <span className="font-black text-foreground">{work.pageCount} {isRtl ? "صفحة" : "pages"}</span>
                          </div>
                        </div>

                        {/* Royalty Info */}
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">{isRtl ? "نسبة ربح المؤلف:" : "Royalty Rate:"}</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {work.format === "digital" ? "70%" : "30%"} ({((work.priceEstimate || 100) * (work.format === "digital" ? 0.7 : 0.3)).toFixed(0)} ج.م / نسخة)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                      <Link to={work.storeUrl || "/book-store"} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl gap-1.5 border-border hover:bg-muted">
                          <ExternalLink className="w-3.5 h-3.5 text-primary" />
                          <span>{isRtl ? "عرض في متجر الكتب" : "View in Store"}</span>
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://unigates.online/book-store?code=${work.storeBookCode}`);
                          toast({ title: isRtl ? "تم نسخ رابط الكتاب" : "Link Copied" });
                        }}
                        className="h-9 px-2.5 rounded-xl text-muted-foreground hover:text-foreground"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: 💳 الفواتير وطرق الدفع (Invoices & Payments) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {isRtl ? "الفواتير وتكاليف النشر وطرق السداد" : "Invoices & Payment Methods"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl 
                    ? "فواتير التكلفة المحددة من المنصة للمؤلف مع إمكانية سدادها ورفع إيصال الدفع"
                    : "Publishing cost invoices with online payment & proof upload"}
                </p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "فواتير النشر الصادرة" : "Issued Invoices"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {invoices.length === 0 ? (
                      <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 space-y-3">
                        <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/40" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            {isRtl ? "لا توجد فواتير صادرة حالياً" : "No invoices issued yet"}
                          </p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {isRtl 
                              ? "سيتم إصدار فواتير رسوم النشر والخدمات الأكاديمية بعد مراجعة وقبول المخطوطات وتقديم عروض النشر."
                              : "Invoices will be issued after manuscripts are reviewed and publishing offers are made."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      invoices.map((inv) => (
                        <div 
                          key={inv.id} 
                          className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                            inv.status === "paid" 
                              ? "border-emerald-500/30 bg-emerald-500/5" 
                              : inv.status === "under_review"
                              ? "border-blue-500/30 bg-blue-500/5"
                              : "border-amber-500/40 bg-amber-500/5 shadow-md"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-foreground">{inv.invoiceNumber}</span>
                              <Badge className={
                                inv.status === "paid" 
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                                  : inv.status === "under_review"
                                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]"
                                  : "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
                              }>
                                {inv.status === "paid" 
                                  ? (isRtl ? "تم السداد بنجاح ✅" : "Paid") 
                                  : inv.status === "under_review" 
                                  ? (isRtl ? "الإيصال قيد المراجعة ⏳" : "Under Review") 
                                  : (isRtl ? "بانتظار السداد ⚠️" : "Unpaid")}
                              </Badge>
                            </div>
                            <span className="text-base font-black text-foreground font-mono">
                              {inv.amount} {inv.currency}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-foreground block">{inv.manuscriptTitle}</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">{inv.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                            <span>{isRtl ? "تاريخ الإصدار:" : "Date:"} {inv.createdAt}</span>
                            {inv.paymentMethod && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                {inv.paymentMethod}
                              </span>
                            )}
                            {inv.status === "unpaid" && (
                              <Button 
                                onClick={() => setSelectedInvoice(inv)}
                                size="sm" 
                                className="h-8 px-3.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                              >
                                {isRtl ? "اختيار طريقة الدفع ورفع الإيصال ➔" : "Pay & Upload Receipt"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Guide */}
              <div className="space-y-6">
                <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "طرق الدفع المتوفرة رسمياً" : "Official Payment Methods"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5 text-xs">
                    
                    {/* Bank Transfer */}
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                      <span className="font-black text-foreground block">🏛️ {isRtl ? "التحويل البنكي المباشر:" : "Bank Transfer:"}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {isRtl ? "البنك الأهلي المصري - حساب دار عبيد للنشر والتوزيع" : "National Bank of Egypt - Dar Obeid Publishing"}
                      </p>
                      <p className="font-mono text-[10px] font-bold text-primary">IBAN: EG380002000100000012345678901</p>
                    </div>

                    {/* InstaPay */}
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                      <span className="font-black text-foreground block">⚡ {isRtl ? "إنستاباي (InstaPay):" : "InstaPay:"}</span>
                      <p className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">darobeid@instapay</p>
                    </div>

                    {/* Vodafone Cash */}
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                      <span className="font-black text-foreground block">📱 {isRtl ? "محافظ إلكترونية (فودافون كاش / اتصالات):" : "E-Wallets:"}</span>
                      <p className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">0100 987 6543</p>
                    </div>

                    {/* GCC / International */}
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 space-y-1">
                      <span className="font-black text-foreground block">🌐 {isRtl ? "دول الخليج والدولي (STC Pay / بطاقات ائتمان):" : "Gulf & Global:"}</span>
                      <p className="text-[11px] text-muted-foreground">{isRtl ? "سداد، فيزا وماستركارد الدولية، وApple Pay" : "Visa, MasterCard, STC Pay & Apple Pay"}</p>
                    </div>

                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: 💬 التواصل الداخلي مع الإدارة (Direct Messages) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {isRtl ? "التواصل الداخلي المباشر مع إدارة المنصة" : "Direct Editorial & Admin Messaging"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl 
                    ? "قناة مراسلة مشفرة ومباشرة مع فريق دار عبيد لمناقشة تعديلات المخطوطة، الغلاف، والتحكيم"
                    : "Direct chat with Dar Obeid editors regarding manuscripts, covers, and reviews"}
                </p>
              </div>
            </div>

            <Card className="border-2 border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden flex flex-col h-[600px]">
              
              {/* Chat Header */}
              <div className="p-4 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
                    🏢
                  </div>
                  <div>
                    <span className="font-black text-sm text-foreground block">
                      {isRtl ? "إدارة دار عبيد للنشر والتوزيع" : "Dar Obeid Publishing Administration"}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isRtl ? "فريق التحرير والتدقيق متصل الآن" : "Editorial Team Online"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-background/50">
                {messages.map((msg) => {
                  const isAuthor = msg.sender === "author";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isAuthor ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {msg.senderName} ({msg.senderTitle})
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">{msg.timestamp}</span>
                      </div>
                      
                      <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed shadow-sm ${
                        isAuthor 
                          ? "bg-amber-500 text-white rounded-te-xs" 
                          : "bg-muted/80 text-foreground border border-border/80 rounded-ts-xs"
                      }`}>
                        <p>{msg.text}</p>
                        {msg.attachmentName && (
                          <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 text-[10px] font-bold ${
                            isAuthor ? "bg-white/20 text-white" : "bg-background border border-border"
                          }`}>
                            <FileText className="w-3.5 h-3.5" />
                            <span>{msg.attachmentName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-card border-t border-border/60">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  {chatAttachmentName && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted text-xs">
                      <span className="text-muted-foreground truncate">{chatAttachmentName}</span>
                      <Button size="sm" variant="ghost" onClick={() => setChatAttachmentName("")} className="h-6 px-2 text-[10px]">
                        إلغاء
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder={isRtl ? "اكتب استفسارك أو ملاحظتك لإدارة دار عبيد..." : "Type your message to Dar Obeid team..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border bg-muted/20 flex-1"
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="h-11 px-5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md gap-1.5 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isRtl ? "إرسال" : "Send"}</span>
                    </Button>
                  </div>
                </form>
              </div>

            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: 📈 مبيعات الكتب والأرباح (Sales & 20% Royalty) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "sales" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {isRtl ? "مبيعات الكتب ونسبة أرباح المؤلف (70% رقمي / 30% ورقي)" : "Book Sales & Author Royalties (70% Digital / 30% Print)"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl 
                    ? "تتبع مبيعات كتبكم رقمياً (70%) وورقياً (30%) مع احتساب فوري وإمكانية سحب الأرباح لحسابكم"
                    : "Track digital (70%) and print (30%) sales with real-time royalty calculation and payouts"}
                </p>
              </div>

              <Button 
                onClick={() => setPayoutModalOpen(true)}
                disabled={financials.availableBalance <= 0}
                className="h-10 px-5 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>{isRtl ? "طلب سحب الأرباح المتاحة" : "Request Payout"}</span>
              </Button>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <Card className="p-4 sm:p-5 rounded-3xl border-2 border-border/80 bg-card shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "الرصيد المتاح للسحب" : "Available Balance"}</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">💰</div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {financials.availableBalance} <span className="text-xs font-normal">ج.م</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{isRtl ? "جاهز للسحب الفوري لحسابكم" : "Ready for immediate payout"}</p>
              </Card>

              <Card className="p-4 sm:p-5 rounded-3xl border-2 border-border/80 bg-card shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي أرباح المؤلف" : "Total Royalties"}</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">📈</div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {financials.totalAuthorRoyalties} <span className="text-xs font-normal">ج.م</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{isRtl ? "70% للرقمي • 30% للورقي" : "70% Digital • 30% Print"}</p>
              </Card>

              <Card className="p-4 sm:p-5 rounded-3xl border-2 border-border/80 bg-card shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "إجمالي النسخ المباعة" : "Total Copies Sold"}</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">📚</div>
                </div>
                <div className="text-2xl font-black text-foreground font-mono">
                  {financials.totalCopiesSold} <span className="text-xs font-normal">{isRtl ? "نسخة" : "copies"}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {financials.digitalCopiesSold} {isRtl ? "رقمي" : "digital"} • {financials.printCopiesSold} {isRtl ? "ورقي" : "print"}
                </p>
              </Card>

              <Card className="p-4 sm:p-5 rounded-3xl border-2 border-border/80 bg-card shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "الأرباح المسحوبة سابقاً" : "Withdrawn Amount"}</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">🏦</div>
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {financials.totalWithdrawn} <span className="text-xs font-normal">ج.م</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{isRtl ? "تم تحويلها لحسابكم بنجاح" : "Successfully transferred"}</p>
              </Card>

            </div>

            {/* Sales Table */}
            <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? "سجل مبيعات الكتب المباشرة وتوزيع العوائد" : "Live Book Sales Roster"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-black">
                    <tr>
                      <th className="p-3.5 text-start">{isRtl ? "الكتاب / الكود" : "Book / Code"}</th>
                      <th className="p-3.5 text-start">{isRtl ? "صيغة البيع" : "Format"}</th>
                      <th className="p-3.5 text-start">{isRtl ? "سعر البيع" : "Sale Price"}</th>
                      <th className="p-3.5 text-start">{isRtl ? "نسبة وربح المؤلف" : "Author Royalty"}</th>
                      <th className="p-3.5 text-start">{isRtl ? "المشتري / رقم الطلب" : "Buyer / Order"}</th>
                      <th className="p-3.5 text-start">{isRtl ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-foreground block truncate max-w-xs">{s.bookTitle}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{s.bookCode}</span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {s.format === "digital" ? "رقمي 📱" : "ورقي 📖"}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-foreground">
                          {s.salePrice} ج.م
                        </td>
                        <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                          +{s.authorEarnings} ج.م ({s.authorRoyaltyPercentage}%)
                        </td>
                        <td className="p-3.5">
                          <span className="text-foreground font-semibold block truncate max-w-[150px]">{s.buyerName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{s.orderNumber}</span>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {s.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Payouts History */}
            <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span>{isRtl ? "سجل طلبات سحب الأرباح" : "Payout Requests History"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                {payouts.map((pay) => (
                  <div key={pay.id} className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">{pay.amount} {pay.currency}</span>
                        <Badge className={
                          pay.status === "completed" 
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]"
                        }>
                          {pay.status === "completed" ? (isRtl ? "تم التحويل بنجاح ✅" : "Completed") : (isRtl ? "قيد المعالجة ⏳" : "Pending")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{pay.accountDetails}</p>
                    </div>

                    <div className="text-end text-[11px] text-muted-foreground">
                      <span className="block font-mono">{pay.requestDate}</span>
                      {pay.transactionRef && <span className="text-[10px] font-mono text-primary">{pay.transactionRef}</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: 🔐 إدارة الحساب والأمان (Security & Password) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <Card className="border-2 border-border/80 shadow-xl bg-card rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    🔐
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground">
                      {isRtl ? "إعدادات الأمان وتغيير كلمة المرور" : "Security & Password Management"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRtl 
                        ? "قم بتحديث كلمة المرور المؤقتة وتأمين حساب المؤلف ووسائل سحب الأرباح"
                        : "Update your temporary password and secure your author account"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">

                {/* Account Review & Verification Status Block */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "حالة اعتماد وتوثيق الحساب:" : "Verification Status:"}</span>
                    {isUnderReview ? (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>{isRtl ? "الحساب تحت المراجعة والتدقيق" : "Under Platform Review"}</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{isRtl ? "حساب معتمد وموثق رسمياً ✓" : "Verified Author Account ✓"}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">{isRtl ? "المستندات المرفقة (الهوية والمؤهلات):" : "Attached Credentials:"}</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      {isUnderReview ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{isRtl ? "مرفوعة (تخضع للتدقيق من قبل الإدارة ⏳)" : "Uploaded (Under Review)"}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{isRtl ? "موثقة ومعتمدة رسمياً ✓" : "Verified & Authenticated ✓"}</span>
                      )}
                    </span>
                  </div>

                  {isUnderReview ? (
                    <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-amber-800 dark:text-amber-300">
                      <p className="font-medium">
                        {isRtl
                          ? "تنبيه: حتى وإن قمت بتغيير كلمة المرور المؤقتة، سيبقى الحساب تحت المراجعة حتى صدور موافقة الإدارة الرسمية."
                          : "Note: Even after updating your temporary password, your account remains under review until official platform approval."}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApproveAccount}
                        className="h-8 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                      >
                        {isRtl ? "اعتماد الحساب من المنصة" : "Simulate Approval"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      {isRtl ? "تم اعتماد ملفكم الأكاديمي رسمياً وتوثيق بطاقة المؤلف لدى دار عبيد." : "Your author credentials have been officially approved by Dar Obeid."}
                    </p>
                  )}
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-extrabold">{isRtl ? "كلمة المرور الجديدة *" : "New Password *"}</Label>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl text-xs bg-muted/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-extrabold">{isRtl ? "تأكيد كلمة المرور الجديدة *" : "Confirm New Password *"}</Label>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl text-xs bg-muted/20"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md gap-1.5"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isRtl ? "حفظ وتعيين كلمة المرور الدائمة" : "Save New Password"}</span>
                  </Button>
                </form>

                {/* Bank / Wallet Payout Info */}
                <div className="pt-6 border-t border-border/60 space-y-3">
                  <h3 className="font-black text-xs text-foreground flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    <span>{isRtl ? "البيانات المصرفية المعتمدة لتحويل الأرباح" : "Registered Payout Details"}</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isRtl ? "اسم صاحب الحساب:" : "Account Holder:"}</span>
                      <span className="font-bold text-foreground">{authorProfile.bankDetails?.accountHolder}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isRtl ? "البنك المعتمد:" : "Bank Name:"}</span>
                      <span className="font-bold text-foreground">{authorProfile.bankDetails?.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isRtl ? "رقم الحساب / IBAN:" : "IBAN / Account:"}</span>
                      <span className="font-mono font-bold text-foreground">{authorProfile.bankDetails?.ibanOrAccount}</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Upload Payment Receipt */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {isRtl ? "سداد الفاتورة ورفع إيصال التحويل" : "Pay Invoice & Upload Receipt"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedInvoice?.invoiceNumber} - {selectedInvoice?.amount} {selectedInvoice?.currency}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "طريقة الدفع المستخدمة:" : "Payment Method:"}</Label>
              <Select value={paymentMethodSelect} onValueChange={setPaymentMethodSelect}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{isRtl ? "تحويل بنكي (البنك الأهلي)" : "Bank Transfer"}</SelectItem>
                  <SelectItem value="instapay">{isRtl ? "إنستاباي (InstaPay)" : "InstaPay"}</SelectItem>
                  <SelectItem value="vodafone_cash">{isRtl ? "فودافون كاش / محفظة إلكترونية" : "Vodafone Cash"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-amber-500 mx-auto" />
              <span className="text-xs font-bold block">{isRtl ? "إرفاق صورة إيصال الدفع / لقطة الشاشة *" : "Upload Payment Receipt *"}</span>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => setReceiptImagePlaceholder(e.target.files?.[0]?.name || "receipt.jpg")}
                className="text-xs h-9 rounded-xl bg-background cursor-pointer"
              />
              {receiptImagePlaceholder && (
                <span className="text-[10px] font-bold text-emerald-600 block">
                  {isRtl ? `تم اختيار: ${receiptImagePlaceholder}` : `Selected: ${receiptImagePlaceholder}`}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedInvoice(null)} className="rounded-xl text-xs font-bold">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={handleConfirmPaymentReceipt} 
              disabled={uploadingReceipt}
              className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isRtl ? "تأكيد وإرسال الإيصال للإدارة" : "Submit Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Payout Request */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {isRtl ? "طلب سحب الأرباح لحسابكم" : "Request Royalty Payout"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? `الرصيد المتاح للسحب حالياً: ${financials.availableBalance} ج.م` : `Available Balance: ${financials.availableBalance} EGP`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestPayoutSubmit} className="space-y-4 py-2">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "المبلغ المطلوب سحبه (ج.م) *" : "Payout Amount (EGP) *"}</Label>
              <Input 
                type="number"
                max={financials.availableBalance}
                min={50}
                placeholder={isRtl ? `الحد الأقصى ${financials.availableBalance}` : `Max ${financials.availableBalance}`}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
                className="h-10 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "وسيلة التحويل المعتمدة: *" : "Payout Method: *"}</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{isRtl ? "حساب بنكي (تحويل فوري)" : "Bank Transfer"}</SelectItem>
                  <SelectItem value="instapay">{isRtl ? "إنستاباي (InstaPay)" : "InstaPay"}</SelectItem>
                  <SelectItem value="vodafone_cash">{isRtl ? "محفظة فودافون كاش / إلكترونية" : "Vodafone Cash"}</SelectItem>
                  <SelectItem value="stc_pay">{isRtl ? "STC Pay (الخليج)" : "STC Pay"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "بيانات الحساب / رقم الهاتف / IBAN: *" : "Account / IBAN / Wallet Number: *"}</Label>
              <Input 
                placeholder={isRtl ? "مثال: البنك الأهلي - رقم 12345678901 أو 01001234567" : "e.g. Bank account or wallet number"}
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPayoutModalOpen(false)} className="rounded-xl text-xs font-bold">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={requestingPayout}
                className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isRtl ? "تأكيد طلب السحب ➔" : "Confirm Payout ➔"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Change Temporary Password */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {isRtl ? "تعيين كلمة مرور دائمة للحساب" : "Set Permanent Password"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? "أدخل كلمة المرور الشخصية الجديدة لحماية حساب المؤلف" : "Enter a new secure password"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)} className="rounded-xl text-xs font-bold">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isRtl ? "حفظ كلمة المرور" : "Save Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NasherDashboard;
