import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentAffiliate,
  saveCurrentAffiliate,
  logoutAffiliate,
  buildLecturerInviteLink,
  buildWhatsAppInviteMessage,
  getSampleAffiliateData,
  calculateAffiliateCommission,
  AffiliateProfile,
  ReferredLecturer,
  AffiliateCommissionRecord,
  PayoutRequest
} from "@/lib/affiliate/affiliateService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  TrendingUp,
  Percent,
  Users,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  DollarSign,
  GraduationCap,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Search,
  ChevronDown
} from "lucide-react";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

export default function AffiliateDashboard() {
  const { dir, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
  const [lecturers, setLecturers] = useState<ReferredLecturer[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommissionRecord[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Payout Request Modal
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_iban");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const current = getCurrentAffiliate();
    if (!current) {
      navigate("/affiliate/login", { replace: true });
      return;
    }
    setAffiliate(current);
    const sample = getSampleAffiliateData(current);
    setLecturers(sample.lecturers);
    setCommissions(sample.commissions);
  }, [navigate]);

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const inviteLink = buildLecturerInviteLink(affiliate.referralCode);
  const whatsappMessage = buildWhatsAppInviteMessage(affiliate.referralCode, affiliate.fullName, isRtl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({
      title: isRtl ? "تم نسخ رابط الدعوة!" : "Invite link copied!",
      description: isRtl ? "يمكنك الآن إرساله لأي محاضر أو دكتور للانضمام عبر كودك." : "Send this link to professors and instructors.",
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(affiliate.referralCode);
    setCopiedCode(true);
    toast({
      title: isRtl ? "تم نسخ كود الأفلييت!" : "Referral code copied!",
      description: affiliate.referralCode,
    });
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleLogout = () => {
    logoutAffiliate();
    toast({
      title: isRtl ? "تم تسجيل الخروج" : "Logged out",
      description: isRtl ? "نتمنى لك يوماً سعيداً ومزيداً من الأرباح!" : "See you soon!",
    });
    navigate("/affiliate");
  };

  const handleRequestPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: isRtl ? "مبلغ غير صالح" : "Invalid amount",
        description: isRtl ? "يرجى كتابة مبلغ صحيح للسحب." : "Please enter a valid payout amount.",
        variant: "destructive",
      });
      return;
    }
    if (amount > affiliate.walletBalance) {
      toast({
        title: isRtl ? "رصيد غير كافٍ" : "Insufficient Balance",
        description: isRtl ? `الرصيد المتاح للسحب هو $${affiliate.walletBalance}` : `Available balance is $${affiliate.walletBalance}`,
        variant: "destructive",
      });
      return;
    }
    if (!payoutAccount.trim()) {
      toast({
        title: isRtl ? "بيانات الحساب مطلوبة" : "Account details required",
        description: isRtl ? "يرجى كتابة رقم الآيبان أو المحفظة." : "Please provide account or IBAN details.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingPayout(true);
    setTimeout(() => {
      setIsSubmittingPayout(false);
      const updatedAffiliate: AffiliateProfile = {
        ...affiliate,
        walletBalance: affiliate.walletBalance - amount,
        pendingPayout: affiliate.pendingPayout + amount,
      };
      saveCurrentAffiliate(updatedAffiliate);
      setAffiliate(updatedAffiliate);
      setPayoutSuccess(true);
      toast({
        title: isRtl ? "تم تقديم طلب السحب بنجاح!" : "Payout requested successfully!",
        description: isRtl ? `تم استلام طلبك بقيمة $${amount} وسيتم تحويله خلال 24 ساعة عمل.` : `Your request of $${amount} will be processed within 24 hours.`,
      });
    }, 1000);
  };

  const totalCourseSalesCount = lecturers.reduce((acc, l) => acc + l.totalStudentsEnrolled, 0);

  // Filtered lists
  const filteredCommissions = commissions.filter(c => 
    c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lecturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-black" dir={dir}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={ugLogo} alt="UNIGATES" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
                  UNIGATES <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">AFFILIATE 20%</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isRtl ? "لوحة تحكم المسوق الأكاديمي" : "Affiliate Partner Dashboard"}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-200">
                {affiliate.fullName}
              </span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                {affiliate.referralCode}
              </Badge>
            </div>

            <LanguageSelectorDropdown />
            <ThemeToggle />

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs gap-1.5 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{isRtl ? "خروج" : "Logout"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Quick Referral Bar Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-purple-900/30 border border-amber-500/30 p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-slate-950 font-black px-3 py-1 text-xs uppercase tracking-wider">
                  {isRtl ? "نسبة ربح ثابتة 20%" : "20% Fixed RevShare"}
                </Badge>
                <span className="text-xs text-amber-300/80 font-medium">
                  {isRtl ? "مُفعّل مدى الحياة لجميع المحاضرين" : "Active lifetime for all your lecturers"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {isRtl ? `مرحباً بك يا ${affiliate.fullName} 👋` : `Welcome back, ${affiliate.fullName} 👋`}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isRtl
                  ? "شارك رابط دعوتك مع المحاضرين والدكاترة والمراكز التدريبية، وسجل أرباحاً بنسبة 20% فورياً عند شراء أي طالب لمحاضراتهم."
                  : "Share your invite link with lecturers & academies. You earn 20% instantly whenever any student subscribes to their courses."}
              </p>
            </div>

            {/* Quick Actions / Request Payout */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => { setPayoutSuccess(false); setPayoutOpen(true); }}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 gap-2"
              >
                <Wallet className="w-5 h-5" />
                {isRtl ? "طلب سحب الأرباح" : "Request Payout"}
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Available Balance */}
          <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isRtl ? "الرصيد المتاح للسحب" : "Available Balance"}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tight">
                  ${affiliate.walletBalance.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? "جاهز للتحويل الفوري لحسابك" : "Ready for instant payout"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total Earned */}
          <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isRtl ? "إجمالي الأرباح المحققة (20%)" : "Total Earned (20%)"}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-400 tracking-tight">
                  ${affiliate.totalEarned.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isRtl ? `تم سحب $${affiliate.totalWithdrawn.toLocaleString()} سابقاً` : `Withdrawn $${affiliate.totalWithdrawn.toLocaleString()} so far`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Referred Lecturers */}
          <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isRtl ? "المحاضرون المسجلون عبرك" : "Referred Lecturers"}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {lecturers.length}
                </div>
                <p className="text-xs text-purple-300 mt-1 font-medium">
                  {isRtl ? "دكاترة ومعلمون معتمدون" : "Verified active instructors"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Course Subscriptions Sold */}
          <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isRtl ? "مبيعات الدورات المشتركة" : "Student Course Sales"}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {totalCourseSalesCount}
                </div>
                <p className="text-xs text-cyan-300 mt-1 font-medium">
                  {isRtl ? "اشتراك طالب في دورات المحاضرين" : "Total student enrollments"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lecturer Invitation Generator Tool (The Core Requested Tool) */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border-2 border-amber-500/40 rounded-3xl p-6 lg:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Share2 className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black text-white">
                  {isRtl ? "أداة توليد روابط دعوة المحاضرين الذكية" : "Lecturer Smart Invite Link Generator"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {isRtl
                  ? "عندما يضغط المحاضر على هذا الرابط ويسجل حسابه، يتم ربطه تلقائياً بحسابك وتحصل على 20% من أي دورة يبيعها."
                  : "When a lecturer registers using this link, they are automatically tied to your code and you earn 20% on all their course sales."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                className="rounded-2xl border-white/20 text-xs gap-1.5 h-10 hover:bg-white/10"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                {showQR ? (isRtl ? "إخفاء رمز QR" : "Hide QR") : (isRtl ? "عرض رمز QR" : "Show QR")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Direct Link & Copy */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isRtl ? "رابط التسجيل المباشر للمحاضر (مع كود الإحالة المدمج)" : "Direct Lecturer Referral URL"}</span>
                  <span className="text-amber-400 text-xs font-mono">{affiliate.referralCode}</span>
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="bg-slate-950/80 border-white/20 h-12 text-xs sm:text-sm font-mono text-amber-300 font-semibold rounded-2xl pr-4 pl-4"
                    />
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className="h-12 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 gap-2 shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? (isRtl ? "تم النسخ!" : "Copied!") : (isRtl ? "نسخ الرابط" : "Copy Link")}
                  </Button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={handleOpenWhatsApp}
                  className="h-11 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs gap-2 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  {isRtl ? "مشاركة الدعوة عبر واتساب فوراً" : "Share via WhatsApp"}
                </Button>

                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="h-11 px-4 rounded-2xl border-white/20 text-slate-200 hover:bg-white/10 text-xs gap-2"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  {isRtl ? `نسخ الكود فقط (${affiliate.referralCode})` : `Copy Code Only (${affiliate.referralCode})`}
                </Button>
              </div>
            </div>

            {/* Quick QR Code Display */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-white/10 text-center space-y-3">
              <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`}
                  alt="Affiliate QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-200">
                  {isRtl ? "رمز QR للدعوة السريعة" : "Fast Scan QR Code"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isRtl ? "اطبعه في البروشورات أو اعرضه في اللقاءات" : "Print for brochures or live events"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Data Tabs: Referred Lecturers & Live 20% Commissions */}
        <Tabs defaultValue="commissions" className="space-y-6" dir={dir}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-slate-900/80 border border-white/10 p-1 rounded-2xl">
              <TabsTrigger
                value="commissions"
                className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs sm:text-sm px-4 py-2"
              >
                <DollarSign className="w-4 h-4 mr-1.5" />
                {isRtl ? `سجل العمولات (20%) (${commissions.length})` : `Commission Logs (20%) (${commissions.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="lecturers"
                className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs sm:text-sm px-4 py-2"
              >
                <Users className="w-4 h-4 mr-1.5" />
                {isRtl ? `المحاضرون المسجلون (${lecturers.length})` : `Referred Lecturers (${lecturers.length})`}
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث في السجلات والدورات..." : "Search courses, lecturers..."}
                className="bg-slate-900/70 border-white/10 rounded-2xl h-10 pl-9 pr-4 text-xs"
              />
            </div>
          </div>

          {/* Commissions Tab Content */}
          <TabsContent value="commissions" className="space-y-4 m-0">
            <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left rtl:text-right text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">{isRtl ? "الدورة التدريبية" : "Course Title"}</th>
                      <th className="py-4 px-6">{isRtl ? "المحاضر" : "Lecturer"}</th>
                      <th className="py-4 px-6">{isRtl ? "الطالب المشترك" : "Student"}</th>
                      <th className="py-4 px-6">{isRtl ? "سعر الدورة" : "Course Price"}</th>
                      <th className="py-4 px-6">{isRtl ? "عمولتك (20%)" : "Your 20% Net"}</th>
                      <th className="py-4 px-6">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="py-4 px-6">{isRtl ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCommissions.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-bold text-white max-w-[240px] truncate">
                          {record.courseTitle}
                        </td>
                        <td className="py-4 px-6 text-slate-200">
                          {record.lecturerName}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <div>{record.studentName}</div>
                          {record.studentEmail && (
                            <span className="text-[10px] text-slate-500 font-mono">{record.studentEmail}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-slate-200">
                          ${record.coursePrice}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            +${record.commissionEarned}
                          </span>
                          <span className="text-[10px] text-amber-500/80 block">(20%)</span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {isRtl ? "معتمد ومضاف" : "Approved"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredCommissions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          {isRtl ? "لا توجد سجلات عمولات تطابق البحث." : "No commission records match your filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Lecturers Tab Content */}
          <TabsContent value="lecturers" className="space-y-4 m-0">
            <Card className="bg-slate-900/70 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left rtl:text-right text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">{isRtl ? "اسم المحاضر" : "Lecturer Name"}</th>
                      <th className="py-4 px-6">{isRtl ? "البريد الإلكتروني" : "Email"}</th>
                      <th className="py-4 px-6">{isRtl ? "عدد الدورات" : "Courses Published"}</th>
                      <th className="py-4 px-6">{isRtl ? "إجمالي الطلاب" : "Students Enrolled"}</th>
                      <th className="py-4 px-6">{isRtl ? "إجمالي مبيعاته" : "Total Revenue"}</th>
                      <th className="py-4 px-6">{isRtl ? "أرباحك منه (20%)" : "Your 20% Cut"}</th>
                      <th className="py-4 px-6">{isRtl ? "تاريخ الانضمام" : "Joined Date"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {lecturers.map((lec) => (
                      <tr key={lec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                            {lec.lecturerName.charAt(0)}
                          </div>
                          {lec.lecturerName}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-400 text-xs">
                          {lec.lecturerEmail}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-200">
                          {lec.coursesCount} {isRtl ? "دورات" : "courses"}
                        </td>
                        <td className="py-4 px-6 font-semibold text-cyan-300">
                          {lec.totalStudentsEnrolled} {isRtl ? "طالباً" : "students"}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">
                          ${lec.totalRevenueGenerated.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            ${lec.totalCommissionGenerated.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(lec.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payout Request Modal */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="bg-slate-900 border border-amber-500/30 text-white max-w-lg rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-amber-400" />
              {isRtl ? "طلب سحب الأرباح" : "Withdraw Affiliate Earnings"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              {isRtl
                ? `رصيدك المتاح الحالي: $${affiliate.walletBalance}. الحد الأدنى للسحب هو $50.`
                : `Your available balance: $${affiliate.walletBalance}. Minimum payout is $50.`}
            </DialogDescription>
          </DialogHeader>

          {payoutSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isRtl ? "تم إرسال طلب السحب بنجاح!" : "Payout Request Received!"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isRtl
                  ? "يقوم القسم المالي بمراجعة الطلب وتحويل المبلغ إلى حسابك المحدد خلال 24 ساعة كحد أقصى."
                  : "Our finance department is processing the transaction to your designated account."}
              </p>
              <Button
                onClick={() => setPayoutOpen(false)}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-11"
              >
                {isRtl ? "إغلاق" : "Close"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestPayoutSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  {isRtl ? "المبلغ المطلوب سحبه ($)" : "Payout Amount ($)"}
                </Label>
                <Input
                  type="number"
                  min="50"
                  max={affiliate.walletBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={isRtl ? "مثال: 500" : "e.g. 500"}
                  required
                  className="bg-slate-950 border-white/10 rounded-2xl h-11 text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  {isRtl ? "طريقة استلام الأرباح" : "Payout Method"}
                </Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger className="bg-slate-950 border-white/10 rounded-2xl h-11 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="bank_iban">{isRtl ? "تحويل بنكي مباشر (IBAN الدولي)" : "Direct Bank Wire (IBAN)"}</SelectItem>
                    <SelectItem value="vodafone_cash">{isRtl ? "فودافون كاش / إنستاباي (مصر)" : "Vodafone Cash / InstaPay"}</SelectItem>
                    <SelectItem value="stc_pay">{isRtl ? "STC Pay / UrPay (السعودية)" : "STC Pay / UrPay"}</SelectItem>
                    <SelectItem value="usdt_crypto">{isRtl ? "USDT (TRC20 Crypto)" : "USDT (TRC20 Crypto)"}</SelectItem>
                    <SelectItem value="paypal">{isRtl ? "PayPal الحساب الإلكتروني" : "PayPal"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  {isRtl ? "تفاصيل الحساب أو رقم الآيبان" : "Account Number / IBAN Details"}
                </Label>
                <Input
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder={isRtl ? "اكتب رقم الآيبان أو رقم المحفظة واسم صاحب الحساب" : "IBAN or Wallet address & account holder name"}
                  required
                  className="bg-slate-950 border-white/10 rounded-2xl h-11 text-white text-xs"
                />
              </div>

              <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayoutOpen(false)}
                  className="rounded-2xl border-white/10 text-xs h-11"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-11 flex-1 shadow-lg shadow-amber-500/20"
                >
                  {isSubmittingPayout ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isRtl ? "تأكيد وإرسال طلب السحب" : "Submit Payout Request"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
