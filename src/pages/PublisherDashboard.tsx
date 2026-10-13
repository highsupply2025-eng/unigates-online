import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  BookOpen, 
  UploadCloud, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Calendar, 
  Download, 
  Percent, 
  Image as ImageIcon, 
  FileCheck, 
  Banknote,
  Send,
  PlusCircle,
  BarChart3,
  ShieldCheck,
  Check,
  Package,
  Store,
  Flame,
  QrCode,
  LineChart,
  Activity,
  Timer,
  Zap,
  Eye,
  ScanLine,
  FileSpreadsheet,
  Crown,
  Search,
  Filter,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { NashrDataStore } from "@/services/nashrDataStore";
import { AuthorProfile } from "@/types/nashr";
import { 
  PublisherProfile, 
  PublisherSaleRecord, 
  PublisherPayoutRequest, 
  BookStoreItem,
  BookFormat 
} from "@/types/bookStore";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const PublisherDashboard: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");

  // DataStore state
  const [profile, setProfile] = useState<PublisherProfile>(BookStoreDataStore.getPublisherProfile());
  const [sales, setSales] = useState<PublisherSaleRecord[]>(BookStoreDataStore.getPublisherSales());
  const [payouts, setPayouts] = useState<PublisherPayoutRequest[]>(BookStoreDataStore.getPublisherPayouts());
  const [catalog, setCatalog] = useState<BookStoreItem[]>(BookStoreDataStore.getCatalog());
  const financials = BookStoreDataStore.getPublisherFinancialSummary();

  const [activeTab, setActiveTab] = useState("overview");

  // Registered Authors from Nashr DataStore
  const [registeredAuthors, setRegisteredAuthors] = useState<AuthorProfile[]>(() => {
    try {
      return NashrDataStore.getAllAuthors();
    } catch {
      return [];
    }
  });
  const [selectedAuthorCode, setSelectedAuthorCode] = useState<string>("custom");

  // Sales Ledger Filters & Search
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [salesFormatFilter, setSalesFormatFilter] = useState<"all" | "digital" | "print">("all");

  // New Book Upload Form
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [authorAr, setAuthorAr] = useState("");
  const [authorEn, setAuthorEn] = useState("");
  const [category, setCategory] = useState("academic");
  const [format, setFormat] = useState<BookFormat>("both");
  const [priceDigital, setPriceDigital] = useState<number | string>(150);
  const [pricePrint, setPricePrint] = useState<number | string>(240);
  const [pages, setPages] = useState<number | string>(300);
  const [isbn, setIsbn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [sampleChapter1, setSampleChapter1] = useState("");
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // Payout Dialog Form
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number | string>(financials.availableBalance);
  const [payoutMethod, setPayoutMethod] = useState("تحويل بنكي");
  const [payoutDetails, setPayoutDetails] = useState(profile.bankAccount.ibanOrNumber);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Handle Book Upload
  const handleUploadBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr || !authorAr || !descAr) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Details",
        description: isRtl ? "يرجى ملء كافة الحقول الأساسية للكتاب." : "Please fill in all core fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBook(true);

    const newBook: BookStoreItem = {
      id: `bk-pub-${Date.now()}`,
      code: `BK-PUB-${Math.floor(1000 + Math.random() * 9000)}`,
      title_ar: titleAr,
      title_en: titleEn || titleAr,
      author_ar: authorAr,
      author_en: authorEn || authorAr,
      publisher_ar: profile.companyName,
      publisher_en: "Publisher Partner",
      publisher_id: profile.id,
      category,
      category_ar: category === "academic" ? "مراجع ودراسات أكاديمية" : category === "technology" ? "التقنية والذكاء الاصطناعي" : "إدارة الأعمال",
      category_en: "Academic & Professional Books",
      description_ar: descAr,
      description_en: descEn || descAr,
      price_digital: Number(priceDigital) || 120,
      price_print: Number(pricePrint) || 200,
      currency: "EGP",
      pages: Number(pages) || 250,
      format,
      cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      isbn: isbn || `978-977-90-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1 + Math.random() * 9)}`,
      rating: 5.0,
      reviews_count: 1,
      publish_year: 2026,
      is_new: true,
      stock_print: 100,
      full_content_chapters: [
        {
          id: "ch-1",
          title_ar: "الفصل الأول: مدخل المحتوى الأكاديمي المعتمد",
          title_en: "Chapter 1: Accredited Academic Content",
          content_ar: sampleChapter1 || descAr,
          content_en: descEn || descAr,
        }
      ]
    };

    BookStoreDataStore.addBookToCatalog(newBook);
    setCatalog(BookStoreDataStore.getCatalog());
    setIsSubmittingBook(false);

    toast({
      title: isRtl ? "تم إدراج ونشر الكتاب بنجاح! 🎉" : "Book Published Successfully! 🎉",
      description: isRtl
        ? `تم نشر كتاب «${titleAr}» في متجر الكتب وسيبدأ احتساب المبيعات ونسبتك 80% فوراً.`
        : `Book "${titleAr}" is now live in the Book Store.`,
    });

    // Reset Form
    setTitleAr("");
    setTitleEn("");
    setAuthorAr("");
    setAuthorEn("");
    setDescAr("");
    setSampleChapter1("");
    setActiveTab("catalog");
  };

  // Handle Payout Submission
  const handlePayoutSubmit = () => {
    const numAmount = Number(payoutAmount);
    if (!numAmount || numAmount <= 0 || numAmount > financials.availableBalance) {
      toast({
        title: isRtl ? "مبلغ غير صالح" : "Invalid Amount",
        description: isRtl
          ? `المبلغ يجب أن يكون أقل من أو يساوي الرصيد المتاح (${financials.availableBalance} EGP)`
          : `Amount must not exceed available balance (${financials.availableBalance} EGP)`,
        variant: "destructive",
      });
      return;
    }

    setIsRequestingPayout(true);
    BookStoreDataStore.requestPublisherPayout(numAmount, payoutMethod, payoutDetails);
    setPayouts(BookStoreDataStore.getPublisherPayouts());
    setIsRequestingPayout(false);
    setIsPayoutModalOpen(false);

    toast({
      title: isRtl ? "تم تقديم طلب سحب الأرباح بنجاح 💸" : "Payout Request Submitted 💸",
      description: isRtl
        ? `تم إرسال طلب سحب بقيمة ${numAmount} EGP، وستتم المعالجة والإيداع خلال 24 ساعة عمل.`
        : `Payout request for ${numAmount} EGP has been submitted for review.`,
    });
  };

  // Author Selection Handler
  const handleAuthorSelect = (code: string) => {
    setSelectedAuthorCode(code);
    if (code === "custom") {
      return;
    }
    const found = registeredAuthors.find((a) => a.authorCode === code || a.id === code);
    if (found) {
      setAuthorAr(found.fullName);
      if (!authorEn) {
        setAuthorEn(found.fullName);
      }
      toast({
        title: isRtl ? "تم ربط المؤلف المعتمد بنجاح ✍️" : "Author Profile Linked ✍️",
        description: isRtl
          ? `تم ربط «${found.fullName}» (${found.authorCode || "معتمد"}) بالكتاب وإدراجه بالكتالوج.`
          : `Linked to registered author ${found.fullName}`,
      });
    }
  };

  // Filtered Sales Logic
  const filteredSales = sales.filter((sale) => {
    const matchesFormat = salesFormatFilter === "all" || sale.format === salesFormatFilter;
    const q = salesSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      sale.bookTitle.toLowerCase().includes(q) ||
      sale.orderNumber.toLowerCase().includes(q) ||
      sale.buyerName.toLowerCase().includes(q);
    return matchesFormat && matchesQuery;
  });

  // Export Sales Ledger as CSV with UTF-8 BOM
  const handleExportSalesCsv = () => {
    if (filteredSales.length === 0) {
      toast({
        title: isRtl ? "لا توجد مبيعات لتصديرها" : "No Sales Records Found",
        description: isRtl ? "لا توجد عمليات مبيعات مطابقة لمعايير البحث الحالية." : "Filter yields no rows.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "رقم الطلب",
      "عنوان الكتاب",
      "الصيغة",
      "المشتري",
      "تاريخ الطلب",
      "إجمالي البيع (ج.م)",
      "صافي الدار 80% (ج.م)",
      "عمولة المنصة 20% (ج.م)",
      "الحالة",
    ];

    const rows = filteredSales.map((s) => [
      `"${s.orderNumber}"`,
      `"${s.bookTitle.replace(/"/g, '""')}"`,
      `"${s.format === "digital" ? "رقمي (E-Book)" : "ورقي (Print)"}"`,
      `"${s.buyerName.replace(/"/g, '""')}"`,
      `"${s.orderDate}"`,
      s.grossAmount,
      s.publisherShare,
      s.platformShare,
      `"${s.status === "completed" ? "مكتمل ومودع" : "قيد التسوية"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UNIGATES_Publisher_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: isRtl ? "تم تصدير سجل المبيعات بنجاح 📊" : "Sales Ledger Exported 📊",
      description: isRtl
        ? `تم تنزيل ${filteredSales.length} حركة بيع بصيغة CSV المتوافقة مع Microsoft Excel.`
        : `Downloaded ${filteredSales.length} records.`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Top Publisher Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "رجوع لمتجر الكتب" : "Back to Store"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "بوابة دور النشر والمؤلفين" : "Publisher & Author Studio"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="hidden sm:inline-flex bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold gap-1">
              <Percent className="w-3.5 h-3.5" />
              <span>{isRtl ? "نسبة الناشر: 80% • عمولة المنصة: 20%" : "Publisher Share: 80% • Platform: 20%"}</span>
            </Badge>
            <Link to="/book-store/browse">
              <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9">
                <Store className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "معاينة المتجر" : "Store Front"}</span>
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Studio Banner */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-8 px-4 sm:px-8 border-b border-border/40">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  {profile.publisherCode}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {profile.city} • {profile.country}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {profile.companyName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {profile.bio}
              </p>
            </div>

            {/* Available Balance Box */}
            <Card className="bg-card/90 border-amber-500/30 shadow-xl p-5 w-full md:w-80 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-muted-foreground">
                  {isRtl ? "الرصيد المتاح للسحب (صافي 80%)" : "Available Balance (Net 80%)"}
                </span>
                <Wallet className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {financials.availableBalance.toLocaleString()} {financials.currency}
              </p>
              <Button
                onClick={() => setIsPayoutModalOpen(true)}
                disabled={financials.availableBalance <= 0}
                className="w-full mt-3 h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isRtl ? "طلب سحب الأرباح الآن" : "Request Payout"}</span>
              </Button>
            </Card>
          </div>

          {/* Quick Financial Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-card/60 border-border/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                {isRtl ? "إجمالي المبيعات الإجمالية" : "Gross Sales"}
              </p>
              <p className="text-xl font-black text-foreground">
                {financials.grossSales.toLocaleString()} EGP
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {financials.totalSalesCount} {isRtl ? "عملية بيع" : "sales"}
              </p>
            </Card>

            <Card className="bg-card/60 border-border/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                {isRtl ? "أرباح الدار (80%)" : "Publisher Earnings (80%)"}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {financials.totalEarnings.toLocaleString()} EGP
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                {isRtl ? "صافي مستحق بعد عمولة 20%" : "Net after 20% platform share"}
              </p>
            </Card>

            <Card className="bg-card/60 border-border/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                {isRtl ? "عمولة المنصة (20%)" : "Platform Fee (20%)"}
              </p>
              <p className="text-xl font-black text-muted-foreground">
                {financials.platformCommission.toLocaleString()} EGP
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isRtl ? "رسوم الاستضافة والـ DRM" : "DRM & Hosting fee"}
              </p>
            </Card>

            <Card className="bg-card/60 border-border/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                {isRtl ? "الأرباح المسحوبة سابقاً" : "Total Paid Out"}
              </p>
              <p className="text-xl font-black text-foreground">
                {financials.paidOut.toLocaleString()} EGP
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isRtl ? "تم تحويلها لحسابك" : "Disbursed to bank"}
              </p>
            </Card>
          </div>

          {/* Publisher Pro Features Hub (إمكانيات متقدمة لدور النشر - قريباً باقات مدفوعة) */}
          <div className="pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-emerald-500/10 border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground">
                      {isRtl ? "إمكانيات متقدمة لدار النشر (Publisher Pro Suite • قريباً باقة مدفوعة)" : "Publisher Pro Suite (Coming Soon • Paid Tier)"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isRtl ? "أدوات متطورة لزيادة المبيعات، تحليل تفاعل القراء، وحماية المطبوعات الورقية من التزوير" : "Advanced growth tools, chapter heatmaps, and physical anti-counterfeit QR security"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-orange-600 text-white text-[10px] font-black">
                  {isRtl ? "قريباً جداً 🚀" : "Coming Soon 🚀"}
                </Badge>
              </div>

              {/* 4 Advanced Features Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <Link to="/book-store/publisher/contracts" className="group">
                  <div className="p-3.5 rounded-xl bg-card/80 hover:bg-card border border-indigo-500/30 hover:border-indigo-500/70 transition-all flex items-center gap-3 h-full shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-foreground truncate">{isRtl ? "إدارة العقود والأذونات" : "Contracts & IP"}</p>
                        <Badge className="bg-indigo-600 text-white text-[9px] px-1 py-0">{isRtl ? "متاح" : "Active"}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "تبادل العقود مع المؤلفين والختم الرقمي" : "Author agreements & IP exchange"}</p>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/publisher/promotions" className="group">
                  <div className="p-3.5 rounded-xl bg-card/80 hover:bg-card border border-orange-500/20 hover:border-orange-500/60 transition-all flex items-center gap-3 h-full">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-foreground truncate">{isRtl ? "أداة التسعير والفلاش سيل" : "Flash Sales & Pricing"}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-orange-500/40 text-orange-600">{isRtl ? "قريباً" : "Soon"}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "تخفيضات محددة وتنبيه قائمة الرغبات" : "Timed discounts & wishlist alerts"}</p>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/publisher/analytics" className="group">
                  <div className="p-3.5 rounded-xl bg-card/80 hover:bg-card border border-purple-500/20 hover:border-purple-500/60 transition-all flex items-center gap-3 h-full">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-foreground truncate">{isRtl ? "تحليلات القراءة والخرائط" : "Reading Heatmaps"}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-500/40 text-purple-600">{isRtl ? "قريباً" : "Soon"}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "الفصول الأكثر قراءة ومعدل الإكمال" : "Chapter telemetry & drop-off"}</p>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/publisher/anti-counterfeit" className="group">
                  <div className="p-3.5 rounded-xl bg-card/80 hover:bg-card border border-emerald-500/20 hover:border-emerald-500/60 transition-all flex items-center gap-3 h-full">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-foreground truncate">{isRtl ? "مكافحة التزوير والـ QR" : "Anti-Counterfeit QR"}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-600">{isRtl ? "قريباً" : "Soon"}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "رقم تسلسلي للتحقق من النسخ" : "Serialized print security"}</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-muted/80 p-1 rounded-2xl h-11">
            <TabsTrigger value="overview" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>{isRtl ? "لوحة القيادة والمبيعات" : "Sales Overview"}</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>{isRtl ? "رفع كتاب جديد (رقمي / ورقي)" : "Upload New Book"}</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{isRtl ? "مؤلفات الدار المنشورة" : "Published Titles"}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                {catalog.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
              <Wallet className="w-4 h-4" />
              <span>{isRtl ? "سجل سحب الأرباح" : "Payouts & Withdrawals"}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Sales & Orders Overview */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <span>{isRtl ? "سجل المبيعات وتوزيع الإيرادات (80% / 20%)" : "Sales Ledger & Revenue Share"}</span>
                    <Badge variant="outline" className="text-xs">
                      {filteredSales.length} {isRtl ? "عملية" : "orders"}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl
                      ? "كافة عمليات شراء الكتب الرقمية والورقية الصادرة من متجر الكتب مع رصد الحصة بدقة وتصديرها."
                      : "Detailed transaction log with automated 80% publisher / 20% platform revenue split."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <Button
                    onClick={handleExportSalesCsv}
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs gap-1.5 h-9 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRtl ? "تصدير سجل المبيعات (CSV)" : "Export CSV"}</span>
                  </Button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={salesSearchQuery}
                    onChange={(e) => setSalesSearchQuery(e.target.value)}
                    placeholder={isRtl ? "ابحث باسم الكتاب، رقم الطلب، أو المشتري..." : "Search by title, order #, or buyer..."}
                    className="ps-9 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <Select value={salesFormatFilter} onValueChange={(v: "all" | "digital" | "print") => setSalesFormatFilter(v)}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <Filter className="w-3.5 h-3.5 me-2 text-muted-foreground" />
                      <SelectValue placeholder={isRtl ? "تصفية الصيغة" : "Filter Format"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRtl ? "جميع الصيغ (الكل)" : "All Formats"}</SelectItem>
                      <SelectItem value="digital">{isRtl ? "رقمي فقط (E-Book)" : "Digital Only"}</SelectItem>
                      <SelectItem value="print">{isRtl ? "ورقي فقط (Print)" : "Print Only"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sales List */}
              <div className="space-y-3">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/70 bg-muted/20">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-bold text-foreground">
                      {isRtl ? "لا توجد حركات مبيعات مطابقة" : "No Matching Sales Records"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRtl ? "جرّب تغيير عبارة البحث أو إعادة ضبط فلتر الصيغة." : "Try clearing your search query or format filter."}
                    </p>
                  </div>
                ) : (
                  filteredSales.map((sale) => (
                    <Card key={sale.id} className="p-4 border-border/60 hover:border-border transition-all bg-card/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                            {sale.format === "digital" ? "E-BK" : "PRINT"}
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">{sale.bookTitle}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{isRtl ? "رقم الطلب:" : "Order:"} {sale.orderNumber}</span>
                              <span>•</span>
                              <span>{isRtl ? "المشتري:" : "Buyer:"} {sale.buyerName}</span>
                              <span>•</span>
                              <span>{sale.orderDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div className="text-end">
                            <p className="text-muted-foreground">{isRtl ? "إجمالي البيع:" : "Gross:"} {sale.grossAmount} EGP</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {isRtl ? "صافي الدار (80%):" : "Net 80%:"} {sale.publisherShare} EGP
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isRtl ? "عمولة المتجر (20%):" : "20% Platform:"} {sale.platformShare} EGP
                            </p>
                          </div>

                          <Badge
                            className={
                              sale.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }
                          >
                            {sale.status === "completed"
                              ? isRtl
                                ? "مكتمل ومودع"
                                : "Completed"
                              : isRtl
                              ? "قيد التسوية"
                              : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: Upload New Book */}
          <TabsContent value="upload" className="mt-0">
            <Card className="p-6 max-w-4xl mx-auto">
              <div className="mb-6 pb-4 border-b border-border/40">
                <h3 className="text-xl font-black text-foreground">
                  {isRtl ? "رفع وتدشين مؤلف / كتاب جديد في المتجر" : "Upload & Launch New Book"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRtl
                    ? "أدخل بيانات الكتاب، الغلاف، والمحتوى المشفر لنشره رقمياً أو ورقياً بنسبة 80% لدار النشر."
                    : "Fill in book details, cover, and DRM content to publish in UNIGATES Book Store."}
                </p>
              </div>

              <form onSubmit={handleUploadBook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "عنوان الكتاب بالعربية *" : "Book Title (Arabic) *"}</Label>
                    <Input
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder={isRtl ? "مثال: مقدمة في علوم البيانات والذكاء الاصطناعي" : "Arabic Book Title"}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "عنوان الكتاب بالإنجليزية" : "Book Title (English)"}</Label>
                    <Input
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="e.g. Introduction to Data Science & AI"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Author Selection Selector */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "اختيار المؤلف (من المؤلفين المسجلين في منصة نشر أو إدخال يدوي)" : "Author Selection (From Nashr Registry or Custom)"}
                      </Label>
                    </div>
                    {selectedAuthorCode !== "custom" && (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{isRtl ? "مؤلف مسجل ومعتمد" : "Verified Author"}</span>
                      </Badge>
                    )}
                  </div>

                  <Select value={selectedAuthorCode} onValueChange={handleAuthorSelect}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-card">
                      <SelectValue placeholder={isRtl ? "اختر مؤلفاً من المنصة أو كتابة يدوية" : "Choose author"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">
                        {isRtl ? "✍️ إدخال يدوي / مؤلف خارجي (كتابة الاسم بحرية)" : "✍️ Manual Entry / External Author"}
                      </SelectItem>
                      {registeredAuthors.map((auth) => (
                        <SelectItem key={auth.id || auth.authorCode} value={auth.authorCode || auth.id}>
                          {auth.fullName} ({auth.authorCode || "AUT-SEED"}) {auth.specialization ? `• ${auth.specialization}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "اسم المؤلف / الباحث بالعربية *" : "Author Name (Arabic) *"}</Label>
                    <Input
                      value={authorAr}
                      onChange={(e) => setAuthorAr(e.target.value)}
                      placeholder={isRtl ? "مثال: د. أحمد المنشاوي" : "Author Name"}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "الترقيم الدولي المعتمد ISBN" : "ISBN Number"}</Label>
                    <Input
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="978-977-90-XXXX-X"
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "التصنيف الأكاديمي" : "Category"}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">{isRtl ? "مراجع ودراسات أكاديمية" : "Academic References"}</SelectItem>
                        <SelectItem value="technology">{isRtl ? "التقنية والبرمجة والذكاء الاصطناعي" : "Technology & AI"}</SelectItem>
                        <SelectItem value="business">{isRtl ? "إدارة الأعمال والقيادة" : "Business & Leadership"}</SelectItem>
                        <SelectItem value="humanities">{isRtl ? "العلوم الإنسانية واللغات" : "Humanities & Languages"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "صيغة النشر في المتجر" : "Publish Format"}</Label>
                    <Select value={format} onValueChange={(v) => setFormat(v as BookFormat)}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">{isRtl ? "رقمي + ورقي معاً" : "Both Digital & Print"}</SelectItem>
                        <SelectItem value="digital">{isRtl ? "رقمي فقط (E-Book DRM)" : "Digital Only (DRM)"}</SelectItem>
                        <SelectItem value="print">{isRtl ? "ورقي فقط (طباعة وشحن)" : "Print Only"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "عدد الصفحات" : "Page Count"}</Label>
                    <Input
                      type="number"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الرقمية (EGP)" : "Digital Price (EGP)"}</Label>
                    <Input
                      type="number"
                      value={priceDigital}
                      onChange={(e) => setPriceDigital(e.target.value)}
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isRtl
                        ? `صافي ربح الدار: ${(Number(priceDigital) * 0.8 || 0).toFixed(0)} EGP (80%) • المنصة: ${(Number(priceDigital) * 0.2 || 0).toFixed(0)} EGP (20%)`
                        : "80% publisher share, 20% platform"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{isRtl ? "سعر النسخة الورقية (EGP)" : "Print Price (EGP)"}</Label>
                    <Input
                      type="number"
                      value={pricePrint}
                      onChange={(e) => setPricePrint(e.target.value)}
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isRtl
                        ? `صافي ربح الدار: ${(Number(pricePrint) * 0.8 || 0).toFixed(0)} EGP (80%) • المنصة: ${(Number(pricePrint) * 0.2 || 0).toFixed(0)} EGP (20%)`
                        : "80% publisher share, 20% platform"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">{isRtl ? "نبذة وملخص الكتاب *" : "Book Synopsis *"}</Label>
                  <Textarea
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder={isRtl ? "اكتب نبذة تسويقية وأكاديمية عن محتوى الكتاب..." : "Write a synopsis..."}
                    rows={3}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">{isRtl ? "محتوى الفصل الأول التجريبي للقراءة الرقمية DRM" : "Chapter 1 DRM Content"}</Label>
                  <Textarea
                    value={sampleChapter1}
                    onChange={(e) => setSampleChapter1(e.target.value)}
                    placeholder={isRtl ? "أدخل نص الفصل الأول ليتم تشفيره وعرضه في القارئ الإلكتروني..." : "Enter Chapter 1 body text..."}
                    rows={4}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Upload Action Button */}
                <Button
                  type="submit"
                  disabled={isSubmittingBook}
                  className="w-full h-11 text-sm font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/20 rounded-xl"
                >
                  <UploadCloud className="w-4 h-4 me-2" />
                  <span>{isRtl ? "نشر الكتاب فوراً في متجر الكتب" : "Publish Book in Store Now"}</span>
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* TAB 3: Published Catalog */}
          <TabsContent value="catalog" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map((b) => (
                <Card key={b.id} className="overflow-hidden border-border/70 hover:border-amber-500/40 transition-all">
                  <div className="relative aspect-16/9 overflow-hidden bg-slate-950">
                    <img src={b.cover_url} alt={b.title_ar} className="w-full h-full object-cover" />
                    <div className="absolute top-2 inset-x-2 flex justify-between">
                      <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                        {b.format === "both" ? (isRtl ? "رقمي + ورقي" : "Digital & Print") : b.format}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-black/60 text-white border-white/20">
                        ISBN: {b.isbn}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-black text-foreground line-clamp-2">
                      {isRtl ? b.title_ar : b.title_en}
                    </h4>
                    <p className="text-xs text-muted-foreground">{isRtl ? b.author_ar : b.author_en}</p>
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground">{isRtl ? "رقمي: " : "Digital: "}</span>
                        <span className="font-bold text-amber-600">{b.price_digital} EGP</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isRtl ? "ورقي: " : "Print: "}</span>
                        <span className="font-bold text-foreground">{b.price_print} EGP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 4: Payouts */}
          <TabsContent value="payouts" className="space-y-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {isRtl ? "سجل طلبات سحب الأرباح" : "Payout Requests Log"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "متابعة حالة التحويلات البنكية والإلكترونية للأرباح." : "Track bank wire and e-wallet transfers."}
                  </p>
                </div>
                <Button size="sm" onClick={() => setIsPayoutModalOpen(true)} className="font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>{isRtl ? "طلب سحب جديد" : "New Payout"}</span>
                </Button>
              </div>

              <div className="space-y-3">
                {payouts.map((p) => (
                  <Card key={p.id} className="p-4 border-border/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">{p.requestNumber}</span>
                        <Badge
                          className={
                            p.status === "processed"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }
                        >
                          {p.status === "processed" ? (isRtl ? "تم التحويل بنجاح" : "Processed") : (isRtl ? "قيد المراجعة" : "Pending")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.method} • {p.accountDetails} • {p.requestedAt}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="text-base font-black text-amber-600 dark:text-amber-400">
                        {p.amount.toLocaleString()} {p.currency}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Request Payout Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">
              {isRtl ? "طلب سحب الأرباح المتاحة" : "Request Earnings Payout"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl
                ? `رصيدك المتاح الحالي هو ${financials.availableBalance.toLocaleString()} EGP بعد خصم عمولة المنصة 20%.`
                : `Your available balance is ${financials.availableBalance.toLocaleString()} EGP.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">{isRtl ? "المبلغ المراد سحبه (EGP)" : "Amount (EGP)"}</Label>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                max={financials.availableBalance}
                min={100}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">{isRtl ? "طريقة استلام الأرباح" : "Payout Method"}</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="تحويل بنكي (IBAN)">{isRtl ? "تحويل بنكي رسمي (IBAN)" : "Bank Wire (IBAN)"}</SelectItem>
                  <SelectItem value="InstaPay">{isRtl ? "انستا باي (InstaPay)" : "InstaPay"}</SelectItem>
                  <SelectItem value="Vodafone Cash">{isRtl ? "فودافون كاش / محفظة إلكترونية" : "Vodafone Cash"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">{isRtl ? "بيانات الحساب / الرقم" : "Account Details / IBAN"}</Label>
              <Input
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder="EG92001000000000492810029"
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPayoutModalOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handlePayoutSubmit}
              disabled={isRequestingPayout}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRtl ? "تأكيد طلب السحب" : "Confirm Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default PublisherDashboard;
