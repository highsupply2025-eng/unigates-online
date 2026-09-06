import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteFooter from "@/components/SiteFooter";
import { 
  PenTool, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Gavel, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  Scale, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Lock,
  AlertTriangle,
  FileSignature,
  Coins,
  Send,
  UploadCloud,
  Check,
  Building,
  User,
  Stamp,
  ExternalLink,
  Bell,
  Eye,
  Download,
  Printer,
  ChevronRight,
  LogOut,
  Calendar,
  Layers,
  Inbox,
  Clock,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

type UserRole = "public" | "author" | "publisher" | "admin";

interface Bid {
  id: string;
  publisherName: string;
  publisherType: string;
  royaltyPercentage: number;
  printCostCovered: boolean;
  editionCopies: number;
  timelineDays: number;
  notes: string;
  submittedDate: string;
  status: "pending" | "accepted" | "rejected" | "contract_signed";
}

interface Manuscript {
  id: string;
  title: string;
  authorName: string;
  genre: string;
  pageCount: number;
  synopsis: string;
  sampleChapter: string;
  submittedDate: string;
  status: "open_for_bids" | "contract_pending" | "published_in_store";
  bids: Bid[];
  contract?: {
    id: string;
    refNumber: string;
    acceptedBidId: string;
    publisherName: string;
    royaltyPercentage: number;
    authorSigned: boolean;
    publisherSigned: boolean;
    darObeidCertified: boolean;
    signedAt?: string;
    exclusiveStoreLive: boolean;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "bid" | "contract" | "payment" | "store";
  read: boolean;
  targetRole: "author" | "publisher" | "admin";
}

const initialManuscripts: Manuscript[] = [
  {
    id: "ms-1",
    title: "أسرار الأندلس المفقودة: دراسة وثائقية",
    authorName: "د. أحمد السعيد",
    genre: "تاريخ وبحوث وثائقية",
    pageCount: 280,
    synopsis: "دراسة روائية شيقة تسبر أغوار المخطوطات الأندلسية النادرة وتكشف تفاصيل الحياة الفكرية في قرطبة وغرناطة مع تحقيق مخطوطات لم تنشر من قبل.",
    sampleChapter: "الفصل الأول: البداية من مكتبة الزهراء المنسية في ربيع عام 1492، حيث تكشف الوثائق عن حركة الترجمة الأندلسية الدقيقة...",
    submittedDate: "2026-09-01",
    status: "open_for_bids",
    bids: [
      {
        id: "bid-101",
        publisherName: "دار المعرفة للطباعة والنشر",
        publisherType: "دار نشر معتمدة",
        royaltyPercentage: 65,
        printCostCovered: true,
        editionCopies: 3000,
        timelineDays: 25,
        notes: "طباعة فاخرة ورق شاموا 80 جرام، غلاف مقوى مجلد مع حملة تسويقية حصرية داخل متجر UNIGATES.",
        submittedDate: "2026-09-02",
        status: "pending"
      },
      {
        id: "bid-102",
        publisherName: "دار الأفق الرقمي للنشر",
        publisherType: "نشر إلكتروني وورقي",
        royaltyPercentage: 70,
        printCostCovered: true,
        editionCopies: 1500,
        timelineDays: 14,
        notes: "إطلاق ورقي وإلكتروني متزامن مع كتاب صوتي مسموع عبر المتجر مع رعاية حفلات التوقيع.",
        submittedDate: "2026-09-04",
        status: "pending"
      }
    ]
  },
  {
    id: "ms-2",
    title: "الذكاء الاصطناعي التوليدي في التعليم الجامعي",
    authorName: "م. محمود زكي",
    genre: "تكنولوجيا وذكاء اصطناعي",
    pageCount: 340,
    synopsis: "دليل تطبيقي عملي موجه للجامعات والأساتذة لبناء مناهج متوافقة مع الذكاء الاصطناعي وتطبيق أدوات المساعد الشخصي في التدريس والتقييم.",
    sampleChapter: "المقدمة: الانتقال من التعليم التقليدي إلى منظومة الذكاء الاصطناعي التوليدي التفاعلية داخل قاعات المحاضرات الحديثة...",
    submittedDate: "2026-09-03",
    status: "contract_pending",
    bids: [
      {
        id: "bid-201",
        publisherName: "دار النهضة الأكاديمية",
        publisherType: "نشر جامعي وعلمي",
        royaltyPercentage: 60,
        printCostCovered: true,
        editionCopies: 5000,
        timelineDays: 20,
        notes: "اعتماد أكاديمي موثق وتوزيع على كافة كليات الحاسبات والتربية داخل منصة UNIGATES.",
        submittedDate: "2026-09-04",
        status: "accepted"
      }
    ],
    contract: {
      id: "cnt-201",
      refNumber: "OBEID-UNIGATES-2026-089",
      acceptedBidId: "bid-201",
      publisherName: "دار النهضة الأكاديمية",
      royaltyPercentage: 60,
      authorSigned: true,
      publisherSigned: true,
      darObeidCertified: true,
      signedAt: "2026-09-05",
      exclusiveStoreLive: true
    }
  }
];

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "عرض سعر جديد على مخطوطتك!",
    message: "قدمت «دار المعرفة للطباعة والنشر» عرضاً بنسبة أرباح 65% لكتاب (أسرار الأندلس المفقودة).",
    timestamp: "منذ 15 دقيقة",
    type: "bid",
    read: false,
    targetRole: "author"
  },
  {
    id: "notif-2",
    title: "تم توقيع العقد الإلكتروني بنجاح!",
    message: "تم اعتماد وتوثيق عقد كتاب (الذكاء الاصطناعي في التعليم الجامعي) من دار عبيد.",
    timestamp: "منذ ساعتين",
    type: "contract",
    read: false,
    targetRole: "publisher"
  },
  {
    id: "notif-3",
    title: "إشعار إشراف قانوني - دار عبيد",
    message: "تم تسجيل عقد جديد برقم مرجعي OBEID-UNIGATES-2026-089 مع تفعيل حصرية البيع.",
    timestamp: "منذ 4 ساعات",
    type: "contract",
    read: true,
    targetRole: "admin"
  }
];

const NasherDashboard = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Role State (public browse, author, publisher, dar obeid admin)
  const currentRole = (searchParams.get("role") as UserRole) || "public";
  const activeTab = searchParams.get("tab") || (currentRole === "public" ? "browse_deals" : currentRole === "author" ? "my_books" : currentRole === "publisher" ? "bids_inbox" : "admin_contracts");

  const [manuscripts, setManuscripts] = useState<Manuscript[]>(initialManuscripts);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript>(initialManuscripts[0]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(initialManuscripts[0].bids[0] || null);

  // Author submit form states
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newGenre, setNewGenre] = useState("روايات وأدب");
  const [newPageCount, setNewPageCount] = useState("200");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newSample, setNewSample] = useState("");

  // Publisher bid form states
  const [bidPublisher, setBidPublisher] = useState("");
  const [bidRoyalty, setBidRoyalty] = useState("65");
  const [bidCopies, setBidCopies] = useState("2000");
  const [bidDays, setBidDays] = useState("20");
  const [bidNotes, setBidNotes] = useState("");

  // Contract viewer modal state
  const [contractToView, setContractToView] = useState<Manuscript | null>(initialManuscripts[1]);

  const handleRoleSwitch = (role: UserRole) => {
    let defaultTab = "browse_deals";
    if (role === "author") defaultTab = "my_books";
    if (role === "publisher") defaultTab = "bids_inbox";
    if (role === "admin") defaultTab = "admin_contracts";
    setSearchParams({ role, tab: defaultTab });
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ role: currentRole, tab });
  };

  // 1. Author submits new manuscript
  const handleAuthorSubmitManuscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSynopsis.trim()) {
      toast({
        title: isAr ? "بيانات ناقصة" : "Missing fields",
        description: isAr ? "يرجى كتابة عنوان المخطوطة والنبذة المختصرة." : "Please fill in title and synopsis.",
        variant: "destructive"
      });
      return;
    }

    const created: Manuscript = {
      id: "ms-" + Date.now(),
      title: newTitle,
      authorName: newAuthor || (isAr ? "د. محمد فاروق (حسابك)" : "My Account Author"),
      genre: newGenre,
      pageCount: parseInt(newPageCount) || 180,
      synopsis: newSynopsis,
      sampleChapter: newSample || (isAr ? "الفصل الأول قيد المراجعة الفنية..." : "Sample under review..."),
      submittedDate: new Date().toISOString().split("T")[0],
      status: "open_for_bids",
      bids: []
    };

    setManuscripts([created, ...manuscripts]);
    setSelectedManuscript(created);

    // Add alert notification
    const newNotif: NotificationItem = {
      id: "notif-" + Date.now(),
      title: "تم نشر المخطوطة بنجاح!",
      message: `مخطوطتك (${newTitle}) أصبحت معروضة الآن لدور النشر لتقديم العروض.`,
      timestamp: "الآن",
      type: "bid",
      read: false,
      targetRole: "author"
    };
    setNotifications([newNotif, ...notifications]);

    toast({
      title: isAr ? "🎉 تم إدراج المخطوطة في حلبة المزايدة!" : "Manuscript Listed!",
      description: isAr ? "ستتلقى إشعارات فورية بكل عرض سعر يقدمه الناشرون." : "You will receive instant bid alerts."
    });

    setNewTitle("");
    setNewSynopsis("");
    setNewSample("");
    handleTabChange("my_books");
  };

  // 2. Publisher places a bid
  const handlePublisherPlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidPublisher.trim()) {
      toast({
        title: isAr ? "اسم دار النشر مطلوب" : "Publisher name required",
        variant: "destructive"
      });
      return;
    }

    const newBid: Bid = {
      id: "bid-" + Date.now(),
      publisherName: bidPublisher,
      publisherType: isAr ? "دار نشر معتمدة" : "Certified Publisher",
      royaltyPercentage: parseInt(bidRoyalty) || 65,
      printCostCovered: true,
      editionCopies: parseInt(bidCopies) || 2000,
      timelineDays: parseInt(bidDays) || 25,
      notes: bidNotes || (isAr ? "طباعة فاخرة مع النشر الحصري بمتجر UNIGATES." : "Deluxe print & exclusive store launch."),
      submittedDate: new Date().toISOString().split("T")[0],
      status: "pending"
    };

    const updated = manuscripts.map((m) => {
      if (m.id === selectedManuscript.id) {
        return {
          ...m,
          bids: [newBid, ...m.bids]
        };
      }
      return m;
    });

    setManuscripts(updated);
    setSelectedManuscript({ ...selectedManuscript, bids: [newBid, ...selectedManuscript.bids] });
    setSelectedBid(newBid);

    // Notify author
    const newNotif: NotificationItem = {
      id: "notif-" + Date.now(),
      title: "عرض سعر جديد لمخطوطتك!",
      message: `قدمت ${bidPublisher} عرضاً بنسبة أرباح ${bidRoyalty}% لكتاب (${selectedManuscript.title}).`,
      timestamp: "الآن",
      type: "bid",
      read: false,
      targetRole: "author"
    };
    setNotifications([newNotif, ...notifications]);

    toast({
      title: isAr ? "✨ تم تقديم عرض السعر بنجاح!" : "Bid Sent Successfully!",
      description: isAr ? "تم إرسال إشعار للمؤلف وفي انتظار مراجعته وقبوله." : "Author has been notified."
    });

    setBidPublisher("");
    setBidNotes("");
  };

  // 3. Author accepts bid & generates contract
  const handleAuthorAcceptBid = (manuscriptId: string, bid: Bid) => {
    const refNum = `OBEID-UNIGATES-2026-${Math.floor(100 + Math.random() * 900)}`;

    const updated = manuscripts.map((m) => {
      if (m.id === manuscriptId) {
        return {
          ...m,
          status: "contract_pending" as const,
          bids: m.bids.map((b) => b.id === bid.id ? { ...b, status: "accepted" as const } : { ...b, status: "rejected" as const }),
          contract: {
            id: "cnt-" + Date.now(),
            refNumber: refNum,
            acceptedBidId: bid.id,
            publisherName: bid.publisherName,
            royaltyPercentage: bid.royaltyPercentage,
            authorSigned: true, // Signed by author on acceptance
            publisherSigned: false, // Pending publisher signature
            darObeidCertified: false, // Pending Dar Obeid seal
            signedAt: new Date().toISOString().split("T")[0],
            exclusiveStoreLive: false
          }
        };
      }
      return m;
    });

    setManuscripts(updated);
    const updatedMs = updated.find((m) => m.id === manuscriptId) || selectedManuscript;
    setSelectedManuscript(updatedMs);
    setContractToView(updatedMs);

    // Notify publisher
    const newNotif: NotificationItem = {
      id: "notif-" + Date.now(),
      title: "🎉 وافق المؤلف على عرضك!",
      message: `وافق مؤلف (${updatedMs.title}) على عرضك وقام بتوقيع العقد. يرجى مراجعة وتوقيع نسختك.`,
      timestamp: "الآن",
      type: "contract",
      read: false,
      targetRole: "publisher"
    };
    setNotifications([newNotif, ...notifications]);

    toast({
      title: isAr ? "📜 تم قبول العرض وتوقيع العقد من طرفك!" : "Bid Accepted & Signed by Author!",
      description: isAr ? "تم إرسال العقد لدار النشر ولإشراف دار عبيد للاعتماد." : "Contract sent to publisher and Dar Obeid."
    });

    handleTabChange("my_contracts");
  };

  // 4. Publisher signs contract
  const handlePublisherSignContract = (manuscriptId: string) => {
    const updated = manuscripts.map((m) => {
      if (m.id === manuscriptId && m.contract) {
        return {
          ...m,
          contract: {
            ...m.contract,
            publisherSigned: true
          }
        };
      }
      return m;
    });

    setManuscripts(updated);
    toast({
      title: isAr ? "🖋️ تم توقيع العقد من دار النشر!" : "Publisher Signed Contract!",
      description: isAr ? "في انتظار ختم وتوثيق دار عبيد للنشر والتوزيع." : "Awaiting Dar Obeid certification seal."
    });
  };

  // 5. Dar Obeid Admin certifies contract & unlocks Store Publishing
  const handleDarObeidCertify = (manuscriptId: string) => {
    const updated = manuscripts.map((m) => {
      if (m.id === manuscriptId && m.contract) {
        return {
          ...m,
          status: "published_in_store" as const,
          contract: {
            ...m.contract,
            darObeidCertified: true,
            exclusiveStoreLive: true
          }
        };
      }
      return m;
    });

    setManuscripts(updated);

    // Notification
    const notif: NotificationItem = {
      id: "notif-" + Date.now(),
      title: "✅ تم توثيق ونشر الكتاب بالمتجر الحصري!",
      message: "أصبح الكتاب متاحاً للشراء في متجر كتب UNIGATES مع تفعيل نسبة الأرباح التلقائية.",
      timestamp: "الآن",
      type: "store",
      read: false,
      targetRole: "author"
    };
    setNotifications([notif, ...notifications]);

    toast({
      title: isAr ? "🏛️ تم توثيق العقد وختم دار عبيد بنجاح!" : "Certified & Published on Store!",
      description: isAr ? "تم إدراج الكتاب في متجر UNIGATES وتطبيق شروط الحصرية." : "Book is now live on UNIGATES Store."
    });
  };

  const unreadCount = notifications.filter((n) => currentRole === "public" ? true : n.targetRole === currentRole).length;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Top Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <Link to="/nasher" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-foreground">منصة ناشر</span>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                    {isAr ? "استوديو الحسابات والعقود" : "Accounts & Contracts Studio"}
                  </Badge>
                </div>
                <span className="text-[10px] block text-muted-foreground font-medium">
                  {isAr ? "إشراف دار عبيد للنشر والتوزيع • حصرية متجر UNIGATES" : "Dar Obeid Supervision • UNIGATES Exclusivity"}
                </span>
              </div>
            </Link>
          </div>

          {/* Role Switcher Pills (Author / Publisher / Dar Obeid Admin / Public) */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-2xl border border-border/60">
            <Button
              size="sm"
              variant={currentRole === "public" ? "default" : "ghost"}
              onClick={() => handleRoleSwitch("public")}
              className={`h-8 text-xs font-bold rounded-xl ${currentRole === "public" ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground"}`}
            >
              <Eye className="w-3.5 h-3.5 me-1" />
              {isAr ? "العرض العام" : "Public View"}
            </Button>

            <Button
              size="sm"
              variant={currentRole === "author" ? "default" : "ghost"}
              onClick={() => handleRoleSwitch("author")}
              className={`h-8 text-xs font-bold rounded-xl ${currentRole === "author" ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground"}`}
            >
              <User className="w-3.5 h-3.5 me-1" />
              {isAr ? "حساب المؤلف" : "Author Account"}
            </Button>

            <Button
              size="sm"
              variant={currentRole === "publisher" ? "default" : "ghost"}
              onClick={() => handleRoleSwitch("publisher")}
              className={`h-8 text-xs font-bold rounded-xl ${currentRole === "publisher" ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground"}`}
            >
              <Building2 className="w-3.5 h-3.5 me-1" />
              {isAr ? "حساب دار النشر" : "Publisher Account"}
            </Button>

            <Button
              size="sm"
              variant={currentRole === "admin" ? "default" : "ghost"}
              onClick={() => handleRoleSwitch("admin")}
              className={`h-8 text-xs font-bold rounded-xl ${currentRole === "admin" ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground"}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 me-1" />
              {isAr ? "إدارة دار عبيد" : "Dar Obeid Admin"}
            </Button>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2">
            <Link to="/book-store">
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-amber-500/30">
                <BookOpen className="w-3.5 h-3.5 me-1 text-amber-500" />
                {isAr ? "متجر الكتب" : "Book Store"}
              </Button>
            </Link>

            <ThemeToggle />
            <LanguageSelectorDropdown />

            {currentRole === "public" ? (
              <div className="flex items-center gap-1.5">
                <Link to="/nasher/login">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                    {isAr ? "تسجيل دخول" : "Sign In"}
                  </Button>
                </Link>
                <Link to="/nasher/signup">
                  <Button size="sm" className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white">
                    {isAr ? "إنشاء حساب" : "Sign Up"}
                  </Button>
                </Link>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => handleRoleSwitch("public")} className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                <LogOut className="w-3.5 h-3.5 me-1" />
                {isAr ? "خروج" : "Logout"}
              </Button>
            )}
          </div>

        </div>
      </header>

      {/* Role Context Bar & Notification Banner */}
      <div className="border-b border-border/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-background py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-foreground">
              {currentRole === "public" && (isAr ? "وضع التصفح العام (عرض الكتب والعروض المفتوحة)" : "Public Browsing Mode")}
              {currentRole === "author" && (isAr ? "أنت الآن في لوحة تحكم: د. أحمد السعيد (مؤلف معتمد)" : "Active as Author: Dr. Ahmed Al-Saeed")}
              {currentRole === "publisher" && (isAr ? "أنت الآن في لوحة تحكم: دار المعرفة للطباعة والنشر (ناشر معتمد)" : "Active as Publisher: Al-Maaref Publishing")}
              {currentRole === "admin" && (isAr ? "أنت الآن في لوحة الإشراف والتوثيق القانوني: إدارة دار عبيد" : "Active as Legal Supervisor: Dar Obeid Desk")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <Bell className="w-3.5 h-3.5" />
              <span>{unreadCount} {isAr ? "إشعارات جديدة" : "New Alerts"}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground font-mono">
              {isAr ? "حصرية البيع: متجر UNIGATES" : "Exclusive Store Active"}
            </span>
          </div>

        </div>
      </div>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        
        {/* ========================================================= */}
        {/* 1. PUBLIC VIEW (Browse Manuscripts & Open Market Only)   */}
        {/* ========================================================= */}
        {currentRole === "public" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-card border-2 border-amber-500/30">
              <div className="space-y-1 max-w-2xl">
                <Badge className="bg-amber-500 text-white text-[10px] font-bold mb-1">سوق العروض والمخطوطات</Badge>
                <h2 className="text-xl sm:text-2xl font-black">
                  {isAr ? "حلبة المزايدات المفتوحة (للعرض والاستكشاف)" : "Open Manuscript Bidding Arena"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isAr 
                    ? "هذه الشاشة مخصصة لاستعراض الكتب والعروض المطروحة. لتقديم عروض الأسعار أو طرح مخطوطة أو توقيع العقود الرسمية، يرجى تسجيل الدخول بحسابك المعتمد."
                    : "This screen is for browsing titles and bids. To submit bids or sign contracts, please sign in with your account."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleRoleSwitch("author")} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-10 px-4">
                  <User className="w-4 h-4 me-1.5" />
                  {isAr ? "دخول كـ مؤلف" : "Enter as Author"}
                </Button>
                <Button onClick={() => handleRoleSwitch("publisher")} variant="outline" className="border-amber-500/30 font-bold text-xs h-10 px-4">
                  <Building2 className="w-4 h-4 me-1.5 text-amber-500" />
                  {isAr ? "دخول كـ دار نشر" : "Enter as Publisher"}
                </Button>
              </div>
            </div>

            {/* Manuscripts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manuscripts.map((m) => (
                <Card key={m.id} className="border-border/60 bg-card hover:border-amber-500/50 shadow-md transition-all flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-bold">
                        {m.genre}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{m.bids.length} {isAr ? "عروض متنافسة" : "bids"}</span>
                    </div>
                    <CardTitle className="text-base font-bold line-clamp-1">{m.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {isAr ? "المؤلف:" : "Author:"} {m.authorName} • {m.pageCount} {isAr ? "صفحة" : "pages"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {m.synopsis}
                    </p>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span>{isAr ? "أعلى نسبة أرباح معروضة:" : "Highest Royalty:"}</span>
                        <span className="text-amber-500">{m.bids[0]?.royaltyPercentage || 65}%</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isAr ? "الناشر المتصدر:" : "Leading Bidder:"} {m.bids[0]?.publisherName || (isAr ? "في انتظار العروض" : "Pending")}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {m.status === "open_for_bids" ? (isAr ? "مفتوح للمزايدة" : "Open") : (isAr ? "تم الاتفاق والعقد" : "Contracted")}
                      </Badge>
                      <Button size="sm" variant="secondary" onClick={() => handleRoleSwitch("publisher")} className="text-xs h-7 font-bold">
                        {isAr ? "تقديم عرض سعر (تسجيل دخول)" : "Place Bid (Login)"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. AUTHOR ACCOUNT DASHBOARD (Submit, Inquiries, Contracts)*/}
        {/* ========================================================= */}
        {currentRole === "author" && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-3xl mx-auto bg-muted/60 p-1">
                <TabsTrigger value="my_books" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <BookOpen className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "مخطوطاتي وعروض الأسعار" : "My Manuscripts & Bids"}
                </TabsTrigger>
                <TabsTrigger value="author_submit" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <PenTool className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "طرح نبذة مخطوطة جديدة" : "Submit New"}
                </TabsTrigger>
                <TabsTrigger value="my_contracts" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <FileSignature className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "عقودي المعتمدة ونسخ العقد" : "My Contracts"}
                </TabsTrigger>
                <TabsTrigger value="author_notifications" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <Bell className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "الإشعارات والتنبيهات" : "Notifications"}
                </TabsTrigger>
              </TabsList>

              {/* Author Tab 1: My Manuscripts & Incoming Bids */}
              <TabsContent value="my_books" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Manuscripts list */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm flex items-center justify-between">
                      <span>{isAr ? "قائمة كتبي ومخطوطاتي" : "My Manuscripts"}</span>
                      <Badge variant="outline">{manuscripts.length}</Badge>
                    </h3>
                    {manuscripts.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedManuscript(m)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedManuscript.id === m.id
                            ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-md"
                            : "border-border/60 hover:border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge variant="secondary" className="text-[10px] font-semibold">{m.genre}</Badge>
                          <span className="text-[11px] text-amber-500 font-bold">{m.bids.length} {isAr ? "عروض مقدمة" : "bids"}</span>
                        </div>
                        <h4 className="font-bold text-sm line-clamp-1">{m.title}</h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                          <span>{m.pageCount} {isAr ? "صفحة" : "pages"}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {m.status === "open_for_bids" ? (isAr ? "مفتوح للعروض" : "Open") : (isAr ? "تم إبرام العقد" : "Contracted")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Incoming Bids & Acceptance Studio */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="border-b border-border/40 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg font-bold">{selectedManuscript.title}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {isAr ? "تاريخ النشر:" : "Listed on:"} {selectedManuscript.submittedDate} • {selectedManuscript.pageCount} {isAr ? "صفحة" : "pages"}
                            </CardDescription>
                          </div>
                          <Badge className="bg-amber-500 text-white font-bold text-xs">
                            {selectedManuscript.bids.length} {isAr ? "عروض أسعار متنافسة" : "bids"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div>
                          <h4 className="font-bold text-xs mb-1.5 text-muted-foreground">{isAr ? "نبذة الكتاب:" : "Synopsis:"}</h4>
                          <p className="text-xs sm:text-sm text-foreground/90 p-3.5 rounded-xl bg-muted/40 border border-border/40 leading-relaxed">
                            {selectedManuscript.synopsis}
                          </p>
                        </div>

                        {/* Competing Bids list */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-500" />
                            {isAr ? "العروض المالية المقدمة من دور النشر (اختر أفضل عرض للموافقة والتوقيع):" : "Publisher Bids:"}
                          </h4>

                          {selectedManuscript.bids.length === 0 ? (
                            <div className="text-center py-8 p-4 rounded-xl border border-dashed border-border/60 text-muted-foreground text-xs">
                              {isAr ? "لم تقدم دور النشر عروضاً بعد على هذه المخطوطة." : "No bids submitted yet."}
                            </div>
                          ) : (
                            selectedManuscript.bids.map((b) => (
                              <div key={b.id} className="p-4 rounded-2xl border-2 border-border/60 bg-card hover:border-amber-500/40 space-y-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-amber-500" />
                                    <strong className="text-sm font-bold">{b.publisherName}</strong>
                                    <Badge variant="outline" className="text-[10px]">{b.publisherType}</Badge>
                                  </div>
                                  <div className="text-base font-black text-amber-600 dark:text-amber-400">
                                    {b.royaltyPercentage}% {isAr ? "أرباح للمؤلف" : "Royalties"}
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed">{b.notes}</p>

                                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                                  <span>{isAr ? "نسخ الطبعة الأولى:" : "Copies:"} {b.editionCopies.toLocaleString()}</span>
                                  <span>{isAr ? "مدة التنفيذ:" : "Timeline:"} {b.timelineDays} {isAr ? "يوم" : "days"}</span>

                                  {selectedManuscript.status === "open_for_bids" ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleAuthorAcceptBid(selectedManuscript.id, b)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 rounded-xl shadow-md shadow-emerald-500/20"
                                    >
                                      <Check className="w-3.5 h-3.5 me-1.5" />
                                      {isAr ? "قبول وتوقيع العقد الإلكتروني" : "Accept & Sign Contract"}
                                    </Button>
                                  ) : (
                                    <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                                      {b.status === "accepted" ? (isAr ? "العرض المقبول والمعتمد" : "Accepted Bid") : (isAr ? "مرفوض" : "Declined")}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Author Tab 2: Submit New Manuscript */}
              <TabsContent value="author_submit" className="max-w-2xl mx-auto">
                <Card className="border-2 border-border/60 shadow-xl bg-card">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg font-black">{isAr ? "طرح مخطوطة جديدة للمزايدة" : "Submit Manuscript for Bids"}</CardTitle>
                    <CardDescription className="text-xs">
                      {isAr ? "استقبل عروض أسعار الطباعة والأرباح من دور النشر المعتمدة تحت إشراف دار عبيد" : "Receive competing offers under Dar Obeid legal protection"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleAuthorSubmitManuscript} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold mb-1.5 block">{isAr ? "عنوان الكتاب *" : "Book Title *"}</label>
                          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder={isAr ? "مثال: عبقرية الذكاء الاصطناعي" : "Book Title"} className="h-10 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold mb-1.5 block">{isAr ? "اسم المؤلف *" : "Author Name *"}</label>
                          <Input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder={isAr ? "د. أحمد السعيد" : "Author Name"} className="h-10 text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold mb-1.5 block">{isAr ? "التصنيف الأدبي / العلمي" : "Genre"}</label>
                          <Input value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="h-10 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold mb-1.5 block">{isAr ? "عدد الصفحات التقديري" : "Pages"}</label>
                          <Input type="number" value={newPageCount} onChange={(e) => setNewPageCount(e.target.value)} className="h-10 text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold mb-1.5 block">{isAr ? "النبذة التعريفية (ملخص الكتاب) *" : "Synopsis *"}</label>
                        <Textarea value={newSynopsis} onChange={(e) => setNewSynopsis(e.target.value)} required rows={4} placeholder={isAr ? "اكتب نبذة شيقة توضح فكرة الكتاب وميزاته التنافسية..." : "Write a synopsis..."} className="text-sm" />
                      </div>

                      <div>
                        <label className="text-xs font-bold mb-1.5 block">{isAr ? "فصل تجريبي أو عينة من النص (اختياري)" : "Sample Chapter"}</label>
                        <Textarea value={newSample} onChange={(e) => setNewSample(e.target.value)} rows={3} placeholder={isAr ? "الصق الفصل الأول أو المقدمة للتقييم الأدبي..." : "Paste excerpt..."} className="text-sm" />
                      </div>

                      <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 text-base shadow-lg shadow-amber-500/25">
                        <UploadCloud className="w-5 h-5 me-2" />
                        {isAr ? "طرح النبذة واستقبال عروض الأسعار" : "Publish Synopsis & Open Bids"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Author Tab 3: My Contracts & E-Signatures */}
              <TabsContent value="my_contracts" className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">{isAr ? "عقودي الرسمية ونسخ العقد المعتمدة" : "My Signed Contracts"}</h3>
                  <Badge className="bg-amber-500 text-white font-bold">إشراف دار عبيد</Badge>
                </div>

                {manuscripts.filter((m) => m.contract).map((m) => (
                  <Card key={m.id} className="border-2 border-amber-500/30 bg-card shadow-lg">
                    <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-serif font-black text-lg border border-amber-500/30">
                            ع
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">{m.title}</CardTitle>
                            <CardDescription className="text-xs font-mono">{m.contract?.refNumber}</CardDescription>
                          </div>
                        </div>
                        <Badge className={m.contract?.darObeidCertified ? "bg-emerald-500" : "bg-amber-500"}>
                          {m.contract?.darObeidCertified ? (isAr ? "موثق ومنشور بالمتجر" : "Certified & Live") : (isAr ? "بانتظار اكتمال التواقيع" : "Pending")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-xs sm:text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-xl bg-muted/40 border border-border/40">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">{isAr ? "الناشر المتعاقد:" : "Publisher:"}</span>
                          <strong className="font-bold">{m.contract?.publisherName}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">{isAr ? "نسبة أرباحك من المبيعات:" : "Royalty Rate:"}</span>
                          <strong className="font-bold text-amber-500">{m.contract?.royaltyPercentage}% {isAr ? "لكل نسخة" : "per copy"}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">{isAr ? "قناة البيع الحصرية:" : "Exclusive Channel:"}</span>
                          <strong className="font-bold text-emerald-500">{isAr ? "متجر كتب UNIGATES" : "UNIGATES Store"}</strong>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAr ? "توقيعك (المؤلف)" : "Author Signed"}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-bold ${m.contract?.publisherSigned ? "text-emerald-500" : "text-amber-500"}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{m.contract?.publisherSigned ? (isAr ? "توقيع الناشر" : "Publisher Signed") : (isAr ? "بانتظار توقيع الناشر" : "Pending Publisher")}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-bold ${m.contract?.darObeidCertified ? "text-emerald-500" : "text-amber-500"}`}>
                            <Stamp className="w-4 h-4" />
                            <span>{m.contract?.darObeidCertified ? (isAr ? "ختم دار عبيد" : "Dar Obeid Certified") : (isAr ? "بانتظار الختم" : "Pending Seal")}</span>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" onClick={() => setContractToView(m)} className="text-xs font-bold border-amber-500/30">
                          <FileText className="w-3.5 h-3.5 me-1 text-amber-500" />
                          {isAr ? "عرض وتحميل نسخة العقد PDF" : "View Contract PDF"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Author Tab 4: Notifications */}
              <TabsContent value="author_notifications" className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-base font-bold">{isAr ? "سجل الإشعارات والتنبيهات المباشرة" : "Live Notification Stream"}</h3>
                <div className="space-y-3">
                  {notifications.filter((n) => n.targetRole === "author").map((n) => (
                    <div key={n.id} className="p-4 rounded-2xl border border-border/60 bg-card flex items-start gap-3 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm font-bold text-foreground">{n.title}</strong>
                          <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. PUBLISHER ACCOUNT DASHBOARD (Browse, Bid, Sign & Print)*/}
        {/* ========================================================= */}
        {currentRole === "publisher" && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 w-full max-w-2xl mx-auto bg-muted/60 p-1">
                <TabsTrigger value="bids_inbox" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <TrendingUp className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "المخطوطات وتقديم عروض الأسعار" : "Manuscripts & Bids"}
                </TabsTrigger>
                <TabsTrigger value="publisher_contracts" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <FileSignature className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "العقود وتأكيد التوقيع" : "Sign Contracts"}
                </TabsTrigger>
                <TabsTrigger value="publisher_notifications" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <Bell className="w-3.5 h-3.5 me-1.5" />
                  {isAr ? "إشعارات دار النشر" : "Notifications"}
                </TabsTrigger>
              </TabsList>

              {/* Publisher Tab 1: Explore & Place Bid */}
              <TabsContent value="bids_inbox" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Open manuscripts list */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm">{isAr ? "المخطوطات المتاحة للمزايدة" : "Available Manuscripts"}</h3>
                    {manuscripts.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedManuscript(m)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedManuscript.id === m.id
                            ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-md"
                            : "border-border/60 hover:border-border bg-card"
                        }`}
                      >
                        <Badge variant="secondary" className="text-[10px] mb-1">{m.genre}</Badge>
                        <h4 className="font-bold text-sm line-clamp-1">{m.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{m.authorName} • {m.pageCount} صفحة</p>
                      </div>
                    ))}
                  </div>

                  {/* Manuscript details and Bid Submission Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="border-b border-border/40 pb-4">
                        <CardTitle className="text-lg font-bold">{selectedManuscript.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {isAr ? "المؤلف:" : "Author:"} {selectedManuscript.authorName} • {selectedManuscript.pageCount} صفحة
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-xs text-muted-foreground">{isAr ? "نبذة المخطوطة:" : "Synopsis:"}</h4>
                          <p className="text-xs sm:text-sm text-foreground/90 p-3.5 rounded-xl bg-muted/40 border border-border/40 leading-relaxed">
                            {selectedManuscript.synopsis}
                          </p>
                        </div>

                        {/* Place Bid Form */}
                        <div className="p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/30 space-y-4">
                          <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            {isAr ? "تقديم عرض سعر جديد كناشر معتمد:" : "Submit Production Bid:"}
                          </h4>

                          <form onSubmit={handlePublisherPlaceBid} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold mb-1 block">{isAr ? "اسم دار النشر الرسمية *" : "Publisher Name *"}</label>
                              <Input placeholder={isAr ? "دار المعرفة للطباعة والنشر" : "Al-Maaref Publishing"} value={bidPublisher} onChange={(e) => setBidPublisher(e.target.value)} required className="h-9 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs font-bold mb-1 block">{isAr ? "نسبة أرباح المؤلف (%) *" : "Author Royalty (%) *"}</label>
                              <Input type="number" min="10" max="95" value={bidRoyalty} onChange={(e) => setBidRoyalty(e.target.value)} required className="h-9 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs font-bold mb-1 block">{isAr ? "عدد نسخ الطبعة الأولى:" : "Copies:"}</label>
                              <Input type="number" value={bidCopies} onChange={(e) => setBidCopies(e.target.value)} className="h-9 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs font-bold mb-1 block">{isAr ? "مدة الطباعة والتجهيز (أيام):" : "Turnaround (Days):"}</label>
                              <Input type="number" value={bidDays} onChange={(e) => setBidDays(e.target.value)} className="h-9 text-xs" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs font-bold mb-1 block">{isAr ? "المواصفات وخطة التسويق الحصري بالمتجر:" : "Specs & Details:"}</label>
                              <Textarea rows={2} placeholder={isAr ? "نوع الورق والتجليد ومزايا العرض..." : "Binding, paper grade..."} value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} className="text-xs" />
                            </div>

                            <div className="sm:col-span-2 pt-1">
                              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-xs">
                                <Send className="w-3.5 h-3.5 me-1.5" />
                                {isAr ? "إرسال عرض السعر إلى حساب المؤلف" : "Submit Bid to Author"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Publisher Tab 2: Sign Contracts */}
              <TabsContent value="publisher_contracts" className="max-w-4xl mx-auto space-y-6">
                <h3 className="text-lg font-black">{isAr ? "العقود الموجهة لدار النشر (توقيع واعتماد)" : "Contracts Requiring Publisher Signature"}</h3>
                {manuscripts.filter((m) => m.contract).map((m) => (
                  <Card key={m.id} className="border-2 border-border/60 bg-card p-6 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base">{m.title}</h4>
                        <span className="text-xs text-muted-foreground font-mono">{m.contract?.refNumber} • {isAr ? "المؤلف:" : "Author:"} {m.authorName}</span>
                      </div>
                      <Badge className={m.contract?.publisherSigned ? "bg-emerald-500" : "bg-amber-500"}>
                        {m.contract?.publisherSigned ? (isAr ? "موقع من دار النشر" : "Publisher Signed") : (isAr ? "بانتظار توقيعك" : "Pending Signature")}
                      </Badge>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                      <strong>{isAr ? "بند الحصرية والمسؤولية:" : "Exclusivity Clause:"}</strong>{" "}
                      {isAr ? "تلتزم دار النشر بطرح وتوزيع الكتاب حصرياً عبر متجر كتب UNIGATES، وأي بيع خارجه يترتب عليه مسؤولية قانونية وتعويضات ملزمة." : "Exclusive sales on UNIGATES Book Store required."}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Button size="sm" variant="outline" onClick={() => setContractToView(m)} className="text-xs font-bold">
                        <FileText className="w-3.5 h-3.5 me-1.5 text-amber-500" />
                        {isAr ? "معاينة بنود العقد الكاملة" : "View Contract Terms"}
                      </Button>

                      {!m.contract?.publisherSigned ? (
                        <Button size="sm" onClick={() => handlePublisherSignContract(m.id)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">
                          <FileSignature className="w-3.5 h-3.5 me-1.5" />
                          {isAr ? "الموافقة والتوقيع الإلكتروني كدار نشر" : "Sign E-Contract"}
                        </Button>
                      ) : (
                        <div className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isAr ? "تم اعتماد التوقيع وإرساله لدار عبيد" : "Signed & Sent to Dar Obeid"}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Publisher Tab 3: Notifications */}
              <TabsContent value="publisher_notifications" className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-base font-bold">{isAr ? "إشعارات دار النشر" : "Publisher Notifications"}</h3>
                <div className="space-y-3">
                  {notifications.filter((n) => n.targetRole === "publisher").map((n) => (
                    <div key={n.id} className="p-4 rounded-2xl border border-border/60 bg-card flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm font-bold">{n.title}</strong>
                          <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. DAR OBEID LEGAL ADMIN DESK (Certify, Seal & Store Lock)*/}
        {/* ========================================================= */}
        {currentRole === "admin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border-2 border-amber-500/40 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-serif font-black text-2xl border-2 border-amber-500/30 shrink-0">
                  ع
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">{isAr ? "لوحة الإشراف القانوني والتوثيق — دار عبيد للنشر" : "Dar Obeid Legal Desk"}</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    {isAr ? "مراجعة تواقيع الأطراف، إصدار شهادة التوثيق والترقيم الدولي، وتأكيد حصرية البيع داخل متجر UNIGATES" : "Contract audit, ISBN issuance & exclusivity enforcement"}
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white font-bold self-start sm:self-auto px-3 py-1">
                {isAr ? "إشراف رسمي معتمد" : "Official Audit"}
              </Badge>
            </div>

            {/* Admin Contracts Queue */}
            <div className="space-y-4">
              <h3 className="text-base font-bold">{isAr ? "قائمة العقود المرفوعة للاعتماد والختم الرسمي:" : "Contracts Pending Certification:"}</h3>
              {manuscripts.filter((m) => m.contract).map((m) => (
                <Card key={m.id} className="border-2 border-border/60 bg-card p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base">{m.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {m.contract?.refNumber} • {isAr ? "المؤلف:" : "Author:"} {m.authorName} • {isAr ? "الناشر:" : "Publisher:"} {m.contract?.publisherName}
                      </p>
                    </div>
                    <Badge className={m.contract?.darObeidCertified ? "bg-emerald-500" : "bg-amber-500"}>
                      {m.contract?.darObeidCertified ? (isAr ? "معتمد ومختوم رسمياً" : "Certified") : (isAr ? "بانتظار الختم والتوثيق" : "Pending Seal")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3.5 rounded-xl bg-muted/40 border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{isAr ? "توقيع المؤلف:" : "Author Signature:"}</span>
                      <strong className="text-emerald-500 font-bold">{m.contract?.authorSigned ? "✓ تم التوقيع إلكترونياً" : "قيد الانتظار"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{isAr ? "توقيع الناشر:" : "Publisher Signature:"}</span>
                      <strong className={m.contract?.publisherSigned ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                        {m.contract?.publisherSigned ? "✓ تم التوقيع والاعتماد" : "قيد الانتظار"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">{isAr ? "قناة البيع الحصرية:" : "Exclusivity:"}</span>
                      <strong className="text-amber-500 font-bold">متجر كتب UNIGATES</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setContractToView(m)} className="text-xs font-bold border-amber-500/30">
                      <FileText className="w-3.5 h-3.5 me-1.5 text-amber-500" />
                      {isAr ? "معاينة مسودة العقد الثلاثي" : "Inspect E-Contract"}
                    </Button>

                    {!m.contract?.darObeidCertified ? (
                      <Button
                        size="sm"
                        onClick={() => handleDarObeidCertify(m.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        <Stamp className="w-4 h-4 me-1.5" />
                        {isAr ? "توثيق العقد بختم دار عبيد وإطلاق النشر بالمتجر" : "Certify with Official Seal & Launch"}
                      </Button>
                    ) : (
                      <Link to="/book-store">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-9">
                          <ShoppingBag className="w-4 h-4 me-1.5" />
                          {isAr ? "معاينة الكتاب المنشور بالمتجر الحصري" : "View Live in Store"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTRACT PREVIEW & SIGNATURE VIEWER MODAL/CARD           */}
        {/* ========================================================= */}
        {contractToView && contractToView.contract && (
          <div className="pt-8 border-t-2 border-border/60">
            <Card className="border-2 border-amber-500/40 shadow-2xl bg-card max-w-4xl mx-auto">
              <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-serif font-black text-2xl border border-amber-500/30">
                      ع
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">{isAr ? "عقد طباعة ونشر وتوزيع إلكتروني موحد" : "Publishing & Distribution Contract"}</CardTitle>
                      <CardDescription className="text-xs font-mono">{contractToView.contract.refNumber}</CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs font-bold">
                      <Printer className="w-3.5 h-3.5 me-1.5" />
                      {isAr ? "طباعة العقد" : "Print"}
                    </Button>
                    <Badge className="bg-amber-500 text-white font-bold">معتمد برعاية دار عبيد</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed">
                {/* Contract Parties */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{isAr ? "الطرف الأول (المؤلف):" : "Party 1 (Author):"}</span>
                    <strong className="font-bold text-sm text-foreground">{contractToView.authorName}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{isAr ? "الطرف الثاني (الناشر):" : "Party 2 (Publisher):"}</span>
                    <strong className="font-bold text-sm text-foreground">{contractToView.contract.publisherName}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{isAr ? "الطرف الثالث (المشرف والضامن):" : "Party 3 (Supervisor):"}</span>
                    <strong className="font-bold text-sm text-amber-600 dark:text-amber-400">دار عبيد للنشر والتوزيع</strong>
                  </div>
                </div>

                {/* Strict Legal Exclusivity Terms */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-background/60">
                    <strong className="text-foreground font-bold">{isAr ? "البند الأول (العمل الأدبي ونسبة الأرباح):" : "Clause 1:"}</strong>{" "}
                    {isAr
                      ? `تم الاتفاق على نشر وتوزيع كتاب (${contractToView.title}) وتخصيص نسبة أرباح ${contractToView.contract.royaltyPercentage}% للمؤلف تصرف شهرياً وبشكل تلقائي.`
                      : `Publication of "${contractToView.title}" with ${contractToView.contract.royaltyPercentage}% author royalties.`}
                  </div>

                  <div className="p-4 rounded-xl border-2 border-rose-500/40 bg-rose-500/5 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? "البند الثاني (الحصرية الإلزامية والمسؤولية القانونية الصارمة):" : "Clause 2 (Mandatory Exclusivity & Legal Liability):"}</span>
                    </div>
                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {isAr
                        ? "يلتزم الطرف الثاني (الناشر) بطرح الكتاب وبيعه وتوزيعه حصرياً ومطلقاً داخل «متجر كتب UNIGATES». ويُحظر تماماً بيع أو توزيع أو تفويض أي جهة أخرى بتداول الكتاب ورقياً أو رقمياً خارج المنصة دون موافقة كتابية رسمية من دار عبيد والكاتب. وفي حال ثبوت بيع الكتاب خارج متجر كتب UNIGATES، يُساءل الناشر جنائياً ومدنياً وتُفرض عليه غرامة تعويضية ملزمة لصالح الكاتب والمنصة."
                        : "The Publisher strictly undertakes to sell and distribute the book EXCLUSIVELY through UNIGATES Book Store. Selling outside incurs strict civil and criminal liability."}
                    </p>
                  </div>
                </div>

                {/* Signatures and Seals */}
                <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <span className="text-[11px] text-muted-foreground block">{isAr ? "توقيع المؤلف" : "Author Signature"}</span>
                    <div className="font-serif italic font-bold text-amber-600 h-7 flex items-center justify-center">
                      {contractToView.contract.authorSigned ? contractToView.authorName : "—"}
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {contractToView.contract.authorSigned ? "✓ تم التوقيع" : "بانتظار التوقيع"}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <span className="text-[11px] text-muted-foreground block">{isAr ? "توقيع الناشر" : "Publisher Signature"}</span>
                    <div className="font-serif italic font-bold text-foreground h-7 flex items-center justify-center">
                      {contractToView.contract.publisherSigned ? contractToView.contract.publisherName : "—"}
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {contractToView.contract.publisherSigned ? "✓ تم التوقيع والاعتماد" : "بانتظار التوقيع"}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">{isAr ? "ختم دار عبيد للنشر" : "Dar Obeid Seal"}</span>
                    <div className="h-7 flex items-center justify-center text-amber-600">
                      <Stamp className="w-5 h-5 animate-pulse" />
                    </div>
                    <Badge className="bg-amber-500 text-white text-[9px] font-bold">
                      {contractToView.contract.darObeidCertified ? "موثق رسمياً" : "بانتظار الختم"}
                    </Badge>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
};

export default NasherDashboard;
