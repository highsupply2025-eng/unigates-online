import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage, ALL_SUPPORTED_LANGUAGES, type Language } from "@/contexts/LanguageContext";
import { 
  PenTool, 
  Home,
  LayoutDashboard,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
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
  QrCode,
  Loader2,
  Edit3,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  SunMoon,
  Monitor,
  Paperclip,
  X,
  FileSignature,
  Scroll
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { 
  AuthorProfile, 
  ManuscriptSubmission, 
  NashrInvoice, 
  NashrMessage, 
  BookSaleRecord, 
  PayoutRequest, 
  PublishType,
  AuthorContract
} from "@/types/nashr";
import { NashrDataStore, generateSampleContractSvg, dataUrlToBlob } from "@/services/nashrDataStore";
import { ReceiptAuditModal } from "@/components/nashr/ReceiptAuditModal";
import { AttachmentViewerModal } from "@/components/nashr/AttachmentViewerModal";
import { 
  downloadFileOrDataUrl, 
  generateOfficialReceiptSvg, 
  printOfficialInvoiceOrReceipt,
  compressAndProcessReceiptFile 
} from "@/services/nashrReceiptHelper";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { BookStoreItem } from "@/types/bookStore";
import { BookSaleInvoiceModal } from "@/components/bookstore/BookSaleInvoiceModal";
import { generateOfficialBookSaleInvoiceSvg } from "@/services/bookSaleInvoiceHelper";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

const NasherDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "home";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { dir, language, setLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Personal Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // State from DataStore
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(NashrDataStore.getAuthorProfile());
  const [avatarUrl, setAvatarUrl] = useState<string>(authorProfile.avatarUrl || "");
  const isUnderReview = authorProfile.verificationStatus === "pending_review";

  const [submissions, setSubmissions] = useState<ManuscriptSubmission[]>(NashrDataStore.getSubmissions());
  const [invoices, setInvoices] = useState<NashrInvoice[]>(NashrDataStore.getInvoices());
  const [messages, setMessages] = useState<NashrMessage[]>(NashrDataStore.getMessages());
  const [sales, setSales] = useState<BookSaleRecord[]>(NashrDataStore.getSales());
  const [payouts, setPayouts] = useState<PayoutRequest[]>(NashrDataStore.getPayouts());
  const [financials, setFinancials] = useState(NashrDataStore.getFinancialSummary());
  const [bookStoreCatalog, setBookStoreCatalog] = useState<BookStoreItem[]>(BookStoreDataStore.getCatalog());
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<BookSaleRecord | null>(null);
  const [showSaleInvoiceModal, setShowSaleInvoiceModal] = useState<boolean>(false);
  const [analyticsChartType, setAnalyticsChartType] = useState<"bar" | "area">("bar");
  const [statsChartMode, setStatsChartMode] = useState<"operations" | "financial">("operations");

  // Publishing Contracts States
  const [contracts, setContracts] = useState<AuthorContract[]>(NashrDataStore.getContracts());
  const [selectedContractForReview, setSelectedContractForReview] = useState<AuthorContract | null>(null);
  const [showContractReviewModal, setShowContractReviewModal] = useState<boolean>(false);
  const [authorAgreedTerms1, setAuthorAgreedTerms1] = useState<boolean>(false);
  const [authorAgreedTerms2, setAuthorAgreedTerms2] = useState<boolean>(false);
  const [authorSignatureInput, setAuthorSignatureInput] = useState<string>(authorProfile.fullName);
  const [signingContract, setSigningContract] = useState<boolean>(false);
  const [selectedContractForView, setSelectedContractForView] = useState<AuthorContract | null>(null);
  const [showContractViewModal, setShowContractViewModal] = useState<boolean>(false);

  // Form states for New Submission
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("دراسات وأبحاث أكاديمية");
  const [customCategory, setCustomCategory] = useState("");
  const [newPublishType, setNewPublishType] = useState<PublishType>("both");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newPageCount, setNewPageCount] = useState<number | string>(200);
  const [newLanguage, setNewLanguage] = useState("العربية");
  const [coverFileName, setCoverFileName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [manuscriptFileName, setManuscriptFileName] = useState("");
  const [manuscriptFileUrl, setManuscriptFileUrl] = useState("");
  const [manuscriptFileSize, setManuscriptFileSize] = useState("4.2 MB");
  const [videoFileName, setVideoFileName] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);

  // Form states for Chat
  const [chatInput, setChatInput] = useState("");
  const [chatAttachmentName, setChatAttachmentName] = useState("");
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState("");
  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for Payment Receipt Upload Modal & Dedicated Section
  const [selectedInvoice, setSelectedInvoice] = useState<NashrInvoice | null>(null);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState("bank_transfer");
  const [receiptImagePlaceholder, setReceiptImagePlaceholder] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Dedicated Transfer Receipt Upload section states
  const [transferInvoiceTarget, setTransferInvoiceTarget] = useState<string>("auto");
  const [transferAmountInput, setTransferAmountInput] = useState<string>("");
  const [transferMethodInput, setTransferMethodInput] = useState<string>("instapay");
  const [transferRefInput, setTransferRefInput] = useState<string>("");
  const [transferNotesInput, setTransferNotesInput] = useState<string>("");
  const [transferReceiptPreview, setTransferReceiptPreview] = useState<string>("");
  const [transferReceiptFileName, setTransferReceiptFileName] = useState<string>("");
  const [transferReceiptFileSize, setTransferReceiptFileSize] = useState<string>("");
  const [transferReceiptFileType, setTransferReceiptFileType] = useState<string>("");
  const [submittingDirectReceipt, setSubmittingDirectReceipt] = useState<boolean>(false);
  const [viewReceiptModalInvoice, setViewReceiptModalInvoice] = useState<NashrInvoice | null>(null);

  // Chat Attachment Viewer Modal
  const [selectedAttachment, setSelectedAttachment] = useState<{
    fileName?: string;
    fileUrl?: string;
    senderName?: string;
    timestamp?: string;
    messageText?: string;
  } | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState<boolean>(false);
  const [isMenuLanguageOpen, setIsMenuLanguageOpen] = useState(false);
  const [isMenuThemeOpen, setIsMenuThemeOpen] = useState(false);

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

  // Manuscript Edit & Resubmit Modal states
  const [editingSubmission, setEditingSubmission] = useState<ManuscriptSubmission | null>(null);
  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("دراسات وأبحاث أكاديمية");
  const [editPublishType, setEditPublishType] = useState<PublishType>("both");
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editPageCount, setEditPageCount] = useState<number | string>(150);
  const [editLanguage, setEditLanguage] = useState("العربية");
  const [editCoverFileName, setEditCoverFileName] = useState("");
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [editManuscriptFileName, setEditManuscriptFileName] = useState("");
  const [editManuscriptFileUrl, setEditManuscriptFileUrl] = useState("");
  const [editManuscriptFileSize, setEditManuscriptFileSize] = useState("4.2 MB");
  const [savingEditSubmission, setSavingEditSubmission] = useState(false);

  // Guard: if user has a temporary password, redirect to login to change it
  useEffect(() => {
    if (authorProfile.isTemporaryPassword) {
      toast({
        title: isRtl ? "تنبيه: مطلوب تغيير كلمة المرور المؤقتة" : "Notice: Change Temporary Password",
        description: isRtl 
          ? "يرجى تعيين كلمة مرور شخصية دائمة لحسابك أولاً قبل استخدام استوديو المؤلف."
          : "Please set your permanent password first.",
        variant: "destructive"
      });
      navigate("/nashr/login", {
        state: {
          authorCode: authorProfile.authorCode,
          email: authorProfile.email,
          tempPassword: authorProfile.tempPassword,
          needsPasswordChange: true
        }
      });
    }
  }, [authorProfile, navigate, isRtl, toast]);

  // Asynchronously resolve author avatar from IndexedDB, direct URL, or fallback
  useEffect(() => {
    NashrDataStore.resolveAuthorAvatar(authorProfile).then((resolved) => {
      if (resolved) setAvatarUrl(resolved);
    });
  }, [authorProfile]);

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

  // Dynamic Tab & Page Title
  const getTabTitle = (tabKey: string) => {
    switch (tabKey) {
      case "contracts":
        return isRtl ? "العقود الرسمية" : "Official Contracts";
      case "submit":
        return isRtl ? "رفع مؤلفات جديدة" : "Submit New Manuscript";
      case "published":
        return isRtl ? "المؤلفات المنشورة" : "Published Works";
      case "payments":
        return isRtl ? "الفواتير وطرق الدفع" : "Invoices & Payments";
      case "chat":
        return isRtl ? "التواصل وملاحظات التدقيق" : "Review Notes & Chat";
      case "sales":
        return isRtl ? "مبيعات الكتب والأرباح" : "Sales & Royalties";
      case "settings":
        return isRtl ? "إعدادات الحساب والأمان" : "Account Settings";
      case "home":
      default:
        return isRtl ? "الصفحة الرئيسية" : "Home & Overview";
    }
  };

  // Sync browser document.title with active tab
  useEffect(() => {
    const currentName = getTabTitle(activeTab);
    document.title = `${currentName} | ${isRtl ? "لوحة تحكم المؤلف - منصة نشر UNIGATES" : "Author Dashboard - UNIGATES"}`;
  }, [activeTab, isRtl]);

  const refreshData = () => {
    const fresh = NashrDataStore.getAuthorProfile();
    setAuthorProfile(fresh);
    NashrDataStore.resolveAuthorAvatar(fresh).then((resolved) => {
      if (resolved) setAvatarUrl(resolved);
    });
    setSubmissions(NashrDataStore.getSubmissions());
    setInvoices(NashrDataStore.getInvoices());
    setMessages(NashrDataStore.getMessages());
    setSales(NashrDataStore.getSales());
    setPayouts(NashrDataStore.getPayouts());
    setFinancials(NashrDataStore.getFinancialSummary());
    setBookStoreCatalog(BookStoreDataStore.getCatalog());
    setContracts(NashrDataStore.getContracts(fresh.id));
  };

  // Real-time synchronization for internal chat & Bookstore live sales/prices
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes("messages")) {
        setMessages(NashrDataStore.getMessages());
      }
      if (e.key && (e.key.includes("bookstore") || e.key.includes("sales") || e.key.includes("orders") || e.key.includes("contracts"))) {
        refreshData();
      }
    };

    const handleCustomStoreEvent = () => {
      refreshData();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("bookstore-updated", handleCustomStoreEvent);
    window.addEventListener("bookstore-order-created", handleCustomStoreEvent);
    window.addEventListener("unigates-cloud-sync", handleCustomStoreEvent);

    const interval = setInterval(() => {
      if (activeTab === "chat") {
        setMessages(NashrDataStore.getMessages());
      } else if (activeTab === "sales" || activeTab === "published") {
        setSales(NashrDataStore.getSales());
        setBookStoreCatalog(BookStoreDataStore.getCatalog());
        setFinancials(NashrDataStore.getFinancialSummary());
      }
    }, 2500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("bookstore-updated", handleCustomStoreEvent);
      window.removeEventListener("bookstore-order-created", handleCustomStoreEvent);
      window.removeEventListener("unigates-cloud-sync", handleCustomStoreEvent);
      clearInterval(interval);
    };
  }, [activeTab]);

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
        coverImage: coverImageUrl || coverFileName || undefined,
        coverImageUrl: coverImageUrl || undefined,
        coverImageName: coverFileName || undefined,
        manuscriptFile: manuscriptFileName ? { 
          name: manuscriptFileName, 
          size: manuscriptFileSize || "4.2 MB", 
          type: manuscriptFileName.endsWith(".docx") || manuscriptFileName.endsWith(".doc") ? "WORD" : "PDF",
          url: manuscriptFileUrl || undefined
        } : undefined,
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
      setCoverImageUrl("");
      setManuscriptFileName("");
      setManuscriptFileUrl("");
      setManuscriptFileSize("4.2 MB");
      setVideoFileName("");

      toast({
        title: isRtl ? "🎉 تم إرسال الملفات بنجاح للمراجعة!" : "Files Submitted Successfully!",
        description: isRtl 
          ? "تم تحويل الملفات لإدارة دار عبيد للمراجعة والتدقيق والاعتماد."
          : "Your files are now under review by Dar Obeid editors."
      });
    }, 600);
  };

  // Open Edit Modal for Manuscript
  const handleOpenEditSubmission = (sub: ManuscriptSubmission) => {
    setEditingSubmission(sub);
    setEditTitle(sub.title || "");
    setEditCategory(sub.category || "دراسات وأبحاث أكاديمية");
    setEditPublishType(sub.publishType || "both");
    setEditSynopsis(sub.synopsis || "");
    setEditPageCount(sub.pageCount || 150);
    setEditLanguage(sub.language || "العربية");

    const coverName = sub.coverImageName || (typeof sub.coverImage === "string" && !sub.coverImage.startsWith("data:") ? sub.coverImage : "") || "";
    const coverUrl = sub.coverImageUrl || (typeof sub.coverImage === "string" && sub.coverImage.startsWith("data:") ? sub.coverImage : "") || "";
    setEditCoverFileName(coverName);
    setEditCoverImageUrl(coverUrl);

    setEditManuscriptFileName(sub.manuscriptFile?.name || "");
    setEditManuscriptFileUrl(sub.manuscriptFile?.url || "");
    setEditManuscriptFileSize(sub.manuscriptFile?.size || "4.2 MB");
    setShowEditSubmissionModal(true);
  };

  // Save Edits and Resubmit Manuscript
  const handleSaveEditSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    if (!editTitle.trim() || !editSynopsis.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى كتابة عنوان المؤلف والنبذة التعريفية." : "Please provide title and synopsis.",
        variant: "destructive"
      });
      return;
    }

    setSavingEditSubmission(true);
    setTimeout(() => {
      NashrDataStore.updateSubmission(editingSubmission.id, {
        title: editTitle.trim(),
        category: editCategory,
        publishType: editPublishType,
        synopsis: editSynopsis.trim(),
        pageCount: Number(editPageCount) || 150,
        language: editLanguage,
        coverImage: editCoverImageUrl || editCoverFileName || editingSubmission.coverImage,
        coverImageUrl: editCoverImageUrl || editingSubmission.coverImageUrl,
        coverImageName: editCoverFileName || editingSubmission.coverImageName,
        manuscriptFile: editManuscriptFileName ? {
          name: editManuscriptFileName,
          size: editManuscriptFileSize || "4.2 MB",
          type: editManuscriptFileName.endsWith(".docx") || editManuscriptFileName.endsWith(".doc") ? "WORD" : "PDF",
          url: editManuscriptFileUrl || editingSubmission.manuscriptFile?.url
        } : editingSubmission.manuscriptFile,
        status: "pending_review",
        adminFeedback: editingSubmission.adminFeedback
      });

      refreshData();
      setSavingEditSubmission(false);
      setShowEditSubmissionModal(false);
      setEditingSubmission(null);

      toast({
        title: isRtl ? "🎉 تم تحديث المخطوطة وإعادة إرسالها للتحكيم بنجاح!" : "Manuscript Updated & Resubmitted!",
        description: isRtl 
          ? "تم حفظ التعديلات وإرسال الملفات والبيانات المحدثة لإدارة التحكيم والاعتماد."
          : "Your changes have been submitted to Dar Obeid editors for re-evaluation."
      });
    }, 600);
  };

  // Send Internal Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatAttachmentName) return;

    NashrDataStore.sendMessage(
      chatInput.trim() || (isRtl ? `مرفق: ${chatAttachmentName}` : `Attachment: ${chatAttachmentName}`),
      chatAttachmentName || undefined,
      chatAttachmentUrl || undefined
    );
    setChatInput("");
    setChatAttachmentName("");
    setChatAttachmentUrl("");
    refreshData();
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingChatFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setChatAttachmentName(file.name);
      setChatAttachmentUrl(result);
      setIsUploadingChatFile(false);
      toast({
        title: isRtl ? "تم إرفاق الملف بنجاح" : "File Attached",
        description: file.name
      });
    };
    reader.onerror = () => {
      setIsUploadingChatFile(false);
      toast({
        title: isRtl ? "خطأ في قراءة الملف" : "File Read Error",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle Payment Receipt Upload (Modal)
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

  // Handle file selection and compress/read safely
  const handleReceiptFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await compressAndProcessReceiptFile(file);
        setTransferReceiptFileName(processed.fileName);
        setTransferReceiptFileSize(processed.fileSize);
        setTransferReceiptFileType(processed.fileType);
        setTransferReceiptPreview(processed.dataUrl);
      } catch (err) {
        console.error("Receipt process error:", err);
      }
    }
  };

  // Submit Dedicated Transfer Receipt Form
  const handleSubmitTransferReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferReceiptPreview && !transferReceiptFileName) {
      toast({
        title: isRtl ? "يرجى إرفاق صورة إيصال التحويل" : "Receipt Image Required",
        description: isRtl ? "من فضلك قم برفع لقطة شاشة أو صورة إشعار التحويل البنكي أو إنستاباي." : "Please upload a transfer screenshot.",
        variant: "destructive"
      });
      return;
    }

    const unpaidInvoices = invoices.filter(i => i.status === "unpaid");
    let targetInv = unpaidInvoices.find(i => i.id === transferInvoiceTarget);
    if (!targetInv && unpaidInvoices.length > 0 && transferInvoiceTarget === "auto") {
      targetInv = unpaidInvoices[0];
    }

    const paymentMethodLabel = 
      transferMethodInput === "instapay" ? "إنستاباي (InstaPay)" :
      transferMethodInput === "bank_transfer" ? "تحويل بنكي - البنك الأهلي" :
      transferMethodInput === "vodafone_cash" ? "محفظة إلكترونية (فودافون كاش)" : "بطاقة ائتمانية / سداد دولي";

    const receiptUrlToSave = transferReceiptPreview || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600";

    setSubmittingDirectReceipt(true);
    setTimeout(() => {
      if (targetInv) {
        NashrDataStore.uploadPaymentReceipt(
          targetInv.id,
          receiptUrlToSave,
          paymentMethodLabel,
          transferRefInput.trim() || undefined,
          transferNotesInput.trim() || undefined,
          transferReceiptFileName || undefined,
          transferReceiptFileSize || undefined,
          transferReceiptFileType || undefined
        );
      } else {
        const amountNum = Number(transferAmountInput) || 1200;
        NashrDataStore.submitDirectReceipt(
          authorProfile.id,
          authorProfile.fullName,
          amountNum,
          paymentMethodLabel,
          receiptUrlToSave,
          submissions[0]?.title || "رسوم نشر وتحكيم أكاديمي",
          transferRefInput.trim() || undefined,
          transferNotesInput.trim() || undefined,
          transferReceiptFileName || undefined,
          transferReceiptFileSize || undefined,
          transferReceiptFileType || undefined
        );
      }

      refreshData();
      setSubmittingDirectReceipt(false);
      setTransferReceiptPreview("");
      setTransferReceiptFileName("");
      setTransferRefInput("");
      setTransferNotesInput("");
      setTransferAmountInput("");

      toast({
        title: isRtl ? "🎉 تم إرسال إيصال التحويل بنجاح!" : "Receipt Uploaded Successfully!",
        description: isRtl 
          ? "تم إرسال إشعار السداد وصورة الإيصال للإدارة المالية لدار عبيد للمراجعة والمطابقة والاعتماد."
          : "Payment receipt sent to finance department for verification."
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

  // Contracts Actions
  const handleOpenContractReview = (contract: AuthorContract) => {
    setSelectedContractForReview(contract);
    setAuthorAgreedTerms1(false);
    setAuthorAgreedTerms2(false);
    setAuthorSignatureInput(authorProfile.fullName);
    setShowContractReviewModal(true);
  };

  const handleSignContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForReview) return;
    if (!authorAgreedTerms1 || !authorAgreedTerms2) {
      toast({
        title: isRtl ? "الموافقة على البنود مطلوبة" : "Agreement Required",
        description: isRtl ? "يرجى تأكيد الموافقة على إقرارات بنود العقد والتوقيع الرقمي." : "Please check the terms checkboxes.",
        variant: "destructive"
      });
      return;
    }
    if (!authorSignatureInput.trim()) {
      toast({
        title: isRtl ? "الاسم مطلوب للتوقيع" : "Name Required",
        description: isRtl ? "يرجى كتابة الاسم الكامل لاعتماد التوقيع الرقمي." : "Please enter your name.",
        variant: "destructive"
      });
      return;
    }

    setSigningContract(true);
    setTimeout(() => {
      const signed = NashrDataStore.signContract(selectedContractForReview.id, authorSignatureInput.trim());
      refreshData();
      setSigningContract(false);
      setShowContractReviewModal(false);
      if (signed) {
        toast({
          title: isRtl ? "🎉 تم توثيق وتوقيع العقد بنجاح!" : "Contract Signed Successfully!",
          description: isRtl 
            ? `أصبح عقد النشر والتوزيع رقم (${signed.contractNumber}) سارياً ومعتمداً الآن. يمكنك تحميل نسختك الرسمية المعتمدة فوراً.`
            : "Contract is now officially binding and verified."
        });
      }
    }, 600);
  };

  const handleDownloadAuthorContract = (contract: AuthorContract) => {
    try {
      const svgDataUrl = generateSampleContractSvg(contract);
      const blob = dataUrlToBlob(svgDataUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Official_Contract_${contract.contractNumber}_${contract.bookTitle}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      toast({
        title: isRtl ? "📥 تم بدء تحميل العقد الرسمي" : "Download Started",
        description: `Official_Contract_${contract.contractNumber}.svg`
      });
    } catch (e) {
      console.error(e);
      toast({
        title: isRtl ? "تعذر تحميل العقد" : "Download Failed",
        variant: "destructive"
      });
    }
  };

  const handlePrintAuthorContract = (contract: AuthorContract) => {
    try {
      const svgDataUrl = generateSampleContractSvg(contract);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>عقد نشر وتوزيع رسمي - ${contract.contractNumber}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #fff; font-family: sans-serif; }
              img { max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              @media print {
                body { padding: 0; }
                img { width: 100%; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <img src="${svgDataUrl}" onload="window.print();" />
          </body>
          </html>
        `);
        win.document.close();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const publishedWorks = submissions.filter(s => s.status === "published");
  const authorStoreBooks = bookStoreCatalog.filter(
    (b) =>
      b &&
      ((authorProfile.id && b.author_id === authorProfile.id) ||
        (authorProfile.authorCode && b.author_code === authorProfile.authorCode))
  );

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
            <span className="text-[10px] block font-bold text-muted-foreground transition-all duration-300">
              {isRtl ? `لوحة تحكم المؤلف • ${getTabTitle(activeTab)}` : `Author Dashboard • ${getTabTitle(activeTab)}`}
            </span>
          </div>
        </Link>

        {/* User Badge & Fast Actions (Requested Order: السطوع -> تغيير اللغة -> القائمة المنسدلة) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. السطوع (Theme Toggle) */}
          <ThemeToggle className="h-10 w-10 p-0 rounded-2xl bg-card/90 hover:bg-muted border-2 border-border/80 shadow-xs" />

          {/* 2. تغيير اللغة (Language Selector) */}
          <LanguageSelectorDropdown className="h-10 px-3 text-xs bg-card/90 hover:bg-muted border-2 border-border/80 rounded-2xl font-black text-foreground tracking-wide shadow-xs" />

          {/* 3. القائمة المنسدلة (Dropdown Menu - 3 Horizontal Lines) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 active:scale-95 transition-all duration-300 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40 border-2 border-white/20 outline-none focus:outline-none cursor-pointer shrink-0"
                aria-label={isRtl ? "قائمة المؤلف والخدمات" : "Author Studio Menu"}
                title={isRtl ? "القائمة الرئيسية لحساب المؤلف" : "Author Account Menu"}
              >
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* 3 Horizontal Lines (Burger Menu) */}
                <div className="flex flex-col items-center justify-center gap-1 w-5 h-5">
                  <span className="w-4 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
                  <span className="w-5 h-0.5 bg-white rounded-full transition-all duration-300 shadow-xs" />
                  <span className="w-3.5 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
                </div>

                {/* Notification Ping if review notes, unread messages, or pending contracts exist */}
                {(submissions.some(s => s.adminFeedback) || 
                  messages.filter(m => m.sender === "admin" && !m.read).length > 0 ||
                  contracts.some(c => c.status === "pending_signature")
                ) && (
                  <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-background animate-pulse" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align={isRtl ? "start" : "end"} 
              className="w-80 sm:w-88 max-h-[85vh] overflow-y-auto rounded-3xl p-2.5 shadow-2xl border-2 border-border/80 bg-popover/95 backdrop-blur-xl space-y-1 z-50 font-sans"
              dir={dir}
            >
              {/* Account Header in Dropdown */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/30 text-start space-y-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center shrink-0 overflow-hidden border border-white/30 shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={authorProfile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-sm font-black text-foreground truncate tracking-tight">{authorProfile.fullName}</span>
                      <Badge className="bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-mono font-black px-1.5 py-0 shadow-xs">
                        {authorProfile.authorCode}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground truncate">
                      {authorProfile.academicTitleLabel} • {authorProfile.specialization}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? "حساب معتمد وموثق رسمياً" : "Verified Author Account"}</span>
                </div>
              </div>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 0. الصفحة الرئيسية (نظرة عامة والتحليلات البيانية) */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("home");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors ${
                  activeTab === "home" 
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30" 
                    : "hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الصفحة الرئيسية" : "Home & Overview"}</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-black h-5">
                  {isRtl ? "الرئيسية 📊" : "Main"}
                </Badge>
              </DropdownMenuItem>

              {/* 1. رفع مؤلفات جديدة */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("submit");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "رفع مؤلفات جديدة" : "Submit New Manuscript"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 font-bold">
                  {isRtl ? "إرسال 📁" : "Upload"}
                </Badge>
              </DropdownMenuItem>

              {/* 2. المؤلفات المنشورة */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("published");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "المؤلفات المنشورة" : "Published Works"}</span>
                </div>
                <Badge className="bg-blue-500 text-white text-[10px] h-5 px-1.5 font-bold">
                  {publishedWorks.length}
                </Badge>
              </DropdownMenuItem>

              {/* 3. الفواتير وطرق الدفع */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("payments");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الفواتير وطرق الدفع" : "Invoices & Payments"}</span>
                </div>
                {invoices.filter(i => i.status === "unpaid").length > 0 ? (
                  <Badge className="bg-destructive text-white text-[10px] h-5 px-1.5 font-bold animate-pulse">
                    {invoices.filter(i => i.status === "unpaid").length} {isRtl ? "مستحقة" : "Unpaid"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 font-bold">
                    {invoices.length} {isRtl ? "فاتورة" : "Invoices"}
                  </Badge>
                )}
              </DropdownMenuItem>

              {/* 4. التواصل وملاحظات التدقيق */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("chat");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "التواصل وملاحظات التدقيق" : "Review Notes & Chat"}</span>
                </div>
                {messages.filter(m => m.sender === "admin" && !m.read).length > 0 && (
                  <Badge className="bg-purple-500 text-white text-[10px] h-5 px-1.5 font-bold">
                    {messages.filter(m => m.sender === "admin" && !m.read).length}
                  </Badge>
                )}
              </DropdownMenuItem>

              {/* 5. ملاحظات جديدة (ينتقل إلى صفحة مستقلة) */}
              <DropdownMenuItem 
                onClick={() => {
                  navigate("/nashr/notes");
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <span>{isRtl ? "ملاحظات جديدة" : "New Review Notes"}</span>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] h-5 px-2 font-black shadow-xs">
                  {submissions.filter(s => s.adminFeedback).length > 0 
                    ? (isRtl ? "واردة 🔥" : "Active 🔥") 
                    : (isRtl ? "محدثة" : "Updated")}
                </Badge>
              </DropdownMenuItem>

              {/* 6. مبيعات الكتب والأرباح */}
              <DropdownMenuItem 
                onClick={() => {
                  handleTabChange("sales");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "مبيعات الكتب والأرباح" : "Sales & Royalties"}</span>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] h-5 font-black">
                  {financials.availableBalance} EGP
                </Badge>
              </DropdownMenuItem>

              {/* 7. العقود الرسمية */}
              <DropdownMenuItem 
                onClick={() => {
                  if (contracts.length === 0) {
                    toast({
                      title: isRtl ? "صفحة العقود مقفلة حالياً 🔒" : "Contracts Locked 🔒",
                      description: isRtl 
                        ? "لا تفتح صفحة العقود إلا بعد قيام إدارة المنصة ودار عبيد للنشر بإصدار عقد رسمي معتمد لمخطوطتكم وإرساله لحسابكم."
                        : "Contracts page will only open once an official agreement is issued by Dar Obeid administration.",
                      variant: "destructive"
                    });
                    return;
                  }
                  handleTabChange("contracts");
                  setTimeout(() => {
                    const el = document.getElementById("nasher-tab-content") || document.querySelector("main");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors ${
                  activeTab === "contracts"
                    ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-900 dark:text-indigo-200 border border-indigo-500/30"
                    : contracts.length === 0
                      ? "opacity-60 hover:bg-muted/50 cursor-not-allowed"
                      : "hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                    contracts.length > 0 
                      ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "العقود الرسمية" : "Official Contracts"}</span>
                </div>
                {contracts.filter(c => c.status === "pending_signature").length > 0 ? (
                  <Badge className="bg-amber-500 text-white text-[10px] h-5 px-1.5 font-bold animate-pulse">
                    {contracts.filter(c => c.status === "pending_signature").length} {isRtl ? "بانتظار توقيعك ✍️" : "Pending Sign"}
                  </Badge>
                ) : contracts.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600 font-bold">
                    {contracts.length} {isRtl ? "عقود 📜" : "Contracts"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    {isRtl ? "بانتظار الإصدار" : "Pending Issue"}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 8. البيانات الشخصية وإعدادات الأمان (صفحة مستقلة مدمجة) */}
              <DropdownMenuItem 
                onClick={() => {
                  navigate("/nashr/profile");
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "البيانات الشخصية" : "Personal Profile"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-600">
                  {isRtl ? "عرض وإدارة 👤" : "View & Manage"}
                </Badge>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 9. تغيير اللغة (Inline Accordion) */}
              <div className="space-y-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuLanguageOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsMenuLanguageOpen((prev) => !prev);
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isMenuLanguageOpen ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" : "hover:bg-cyan-500/10 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span>{isRtl ? "تغيير اللغة" : "Change Language"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-black border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10">
                      {ALL_SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName || (language === "ar" ? "العربية" : "English")}
                    </Badge>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMenuLanguageOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isMenuLanguageOpen && (
                  <div 
                    className="p-2 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5 animate-in fade-in-50 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black text-cyan-600 uppercase tracking-wider">
                      <Globe className="w-3 h-3 text-cyan-600" />
                      <span>{isRtl ? "اختر لغة المنصة" : "Select Platform Language"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {ALL_SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLanguage(lang.code as Language);
                              toast({
                                title: lang.code === "ar" 
                                  ? "تم تغيير اللغة إلى العربية 🌐" 
                                  : `Language switched to ${lang.nativeName} 🌐`,
                                description: lang.code === "ar"
                                  ? "تم تحديث واجهة المنصة باللغة العربية."
                                  : `Interface language updated to ${lang.name}.`
                              });
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl text-start transition-all cursor-pointer ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-black border border-cyan-500/40 shadow-xs"
                                : "hover:bg-background/80 text-foreground border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs shrink-0">{lang.flag}</span>
                              <span className="text-xs font-bold truncate">{lang.nativeName}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 ms-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 10. السطوع والمظهر (Inline Accordion) */}
              <div className="space-y-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuThemeOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsMenuThemeOpen((prev) => !prev);
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isMenuThemeOpen ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "hover:bg-amber-500/10 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                      {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "system" ? <Monitor className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <span>{isRtl ? "السطوع والمظهر" : "Appearance & Theme"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-black border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                      {theme === "dark" 
                        ? (isRtl ? "داكن 🌙" : "Dark 🌙") 
                        : theme === "system"
                        ? (isRtl ? "تلقائي 💻" : "Auto 💻")
                        : (isRtl ? "فاتح ☀️" : "Light ☀️")}
                    </Badge>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMenuThemeOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isMenuThemeOpen && (
                  <div 
                    className="p-2 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5 animate-in fade-in-50 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black text-amber-600 uppercase tracking-wider">
                      <SunMoon className="w-3 h-3 text-amber-600" />
                      <span>{isRtl ? "اختيار السطوع والمظهر" : "Select Appearance"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {/* داكن */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("dark");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع الداكن 🌙" : "Dark Mode Activated 🌙",
                            description: isRtl ? "مظهر داكن مريح للعين في الإضاءة الخافتة." : "Comfortable dark theme for low light."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black border-2 border-indigo-500/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Moon className="w-4 h-4 mb-1 text-indigo-500" />
                        <span className="text-xs font-bold">{isRtl ? "داكن" : "Dark"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "ليلي 🌙" : "Night"}</span>
                      </button>

                      {/* فاتح */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("light");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع الفاتح ☀️" : "Light Mode Activated ☀️",
                            description: isRtl ? "مظهر ناصع ومشرق مناسب للقراءة بوضوح." : "Crisp and bright appearance."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "light"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border-2 border-amber-500/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Sun className="w-4 h-4 mb-1 text-amber-500" />
                        <span className="text-xs font-bold">{isRtl ? "فاتح" : "Light"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "نهاري ☀️" : "Day"}</span>
                      </button>

                      {/* تلقائي */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("system");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع التلقائي 💻" : "System Theme Activated 💻",
                            description: isRtl ? "يتطابق المظهر تلقائياً مع إعدادات نظام جهازك." : "Matches your device system preference."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "system"
                            ? "bg-primary/20 text-primary font-black border-2 border-primary/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Monitor className="w-4 h-4 mb-1 text-primary" />
                        <span className="text-xs font-bold">{isRtl ? "تلقائي" : "Auto"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "النظام 💻" : "Device"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 11. تسجيل الخروج */}
              <DropdownMenuItem 
                onClick={() => {
                  toast({
                    title: isRtl ? "تم تسجيل الخروج بنجاح" : "Logged Out Successfully",
                    description: isRtl ? "نتمنى لكم يوماً سعيداً في دار عبيد وUNIGATES." : "See you soon."
                  });
                  navigate("/nashr");
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-start cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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





        {/* Content Anchor for Smooth Scroll from Dropdown Menu */}
        <div id="nasher-tab-content" className="scroll-mt-20" />

        {/* ------------------------------------------------------------- */}
        {/* TAB 0: 🏠 الصفحة الرئيسية (Home & Visual Analytics Studio) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "home" && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Welcome Banner with Quick Actions */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border-2 border-amber-500/30 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4 max-w-2xl">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-lg shadow-amber-500/25 shrink-0 overflow-hidden border-2 border-white/20">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={authorProfile.fullName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">👤</div>
                    )}
                  </div>
                  <div className="space-y-2 text-start flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                      <span>{isRtl ? "لوحة التحليلات والمؤشرات المركزية للمؤلف" : "Author Central Visual Analytics"}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                      {isRtl ? "مرحباً بك في لوحة القيادة الذكية، د. " : "Welcome to Smart Dashboard, Dr. "}
                      <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                        {authorProfile.fullName}
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-relaxed">
                      {isRtl 
                        ? "رؤية بصرية شاملة ترصد كافة مؤشرات وأنشطة حسابك في دار عبيد للنشر والتوزيع: من رفع المخطوطات والتحكيم وحتى الفواتير والمبيعات والأرباح بنسب مئوية دقيقة ومخططات بيانية دائرية وتجميعية متقدمة."
                        : "Complete visual intelligence across your Dar Obeid author suite: submissions, peer reviews, sales, invoices, and royal earnings with live percentages and modular charts."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                  <Button
                    onClick={() => handleTabChange("submit")}
                    className="h-11 px-5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-lg shadow-amber-500/20 gap-2 cursor-pointer hover:scale-105 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isRtl ? "رفع مؤلف جديد 📁" : "Upload Manuscript"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/nashr/notes")}
                    className="h-11 px-4 rounded-2xl font-black text-xs border-2 border-amber-500/40 hover:bg-amber-500/10 text-foreground shadow-xs gap-2 cursor-pointer hover:scale-105 transition-all"
                  >
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "ملاحظات جديدة" : "Review Notes"}</span>
                    {submissions.filter(s => s.adminFeedback).length > 0 && (
                      <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0 h-4">
                        {submissions.filter(s => s.adminFeedback).length}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 📈 الرسوم البيانية التحليلية المجمعة والمحسوبة بالنسبة المئوية */}
            <div className="space-y-8">

              {/* 1. رسم بياني مجمع لكل الحساب (من أعلى الصفحة) */}
              <Card className="rounded-3xl border-2 border-border/80 shadow-2xl bg-card overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-border/60 p-5 sm:p-6 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-start">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base sm:text-lg font-black text-foreground">
                            {isRtl ? "رسم بياني مجمع لكل الحساب" : "Aggregate Account Performance"}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-black border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                            {isRtl ? "مجمع ومحدث 🔄" : "Live Aggregate"}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs font-bold text-muted-foreground mt-0.5">
                          {isRtl ? "مقارنة حية وشاملة لجميع وحدات الاستوديو (المرفقات، المنشورات، الفواتير، الرسائل، المبيعات، وملاحظات التحكيم)" : "Real-time count overview across all author studio operations and modules"}
                        </CardDescription>
                      </div>
                    </div>

                    {/* View Switcher: Bar Chart vs Area Chart */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setAnalyticsChartType("bar")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          analyticsChartType === "bar"
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-102"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{isRtl ? "أعمدة بيانية" : "Bar Chart"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalyticsChartType("area")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          analyticsChartType === "area"
                            ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md shadow-rose-500/30 scale-102"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{isRtl ? "مخطط مساحي انسيابي" : "Area Chart"}</span>
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-6">
                  {/* Chart Render Area */}
                  <div className="h-72 sm:h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {analyticsChartType === "bar" ? (
                        <BarChart
                          data={[
                            { name: isRtl ? "المرفقات" : "Attachments", count: submissions.length, fill: "#f59e0b", icon: "📁", category: isRtl ? "المرفقات" : "Attachments" },
                            { name: isRtl ? "المنشورة" : "Published", count: publishedWorks.length, fill: "#2563eb", icon: "📖", category: isRtl ? "الكتب المعروضة" : "Published" },
                            { name: isRtl ? "الفواتير" : "Invoices", count: invoices.length, fill: "#10b981", icon: "💳", category: isRtl ? "الفواتير" : "Invoices" },
                            { name: isRtl ? "الرسائل" : "Messages", count: messages.length, fill: "#9333ea", icon: "💬", category: isRtl ? "الرسائل" : "Messages" },
                            { name: isRtl ? "المبيعات" : "Sales", count: sales.length, fill: "#0d9488", icon: "📈", category: isRtl ? "عمليات البيع" : "Sales" },
                            { name: isRtl ? "الملاحظات" : "Feedback", count: submissions.filter(s => s.adminFeedback).length, fill: "#f43f5e", icon: "🔔", category: isRtl ? "ملاحظات التحكيم" : "Feedback" }
                          ]}
                          margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fontWeight: 800 }} 
                            stroke="currentColor" 
                            opacity={0.8}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fontWeight: 700 }} 
                            allowDecimals={false} 
                            stroke="currentColor" 
                            opacity={0.8}
                          />
                          <RechartsTooltip 
                            cursor={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="rounded-2xl p-3 bg-popover/95 backdrop-blur-md border-2 border-border shadow-xl text-xs font-black space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span>{data.icon}</span>
                                      <span className="text-foreground">{data.category}</span>
                                    </div>
                                    <div className="text-base text-primary font-black">
                                      {data.count} {isRtl ? "عنصر / عملية" : "Records"}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                            {[
                              "#f59e0b",
                              "#2563eb",
                              "#10b981",
                              "#9333ea",
                              "#0d9488",
                              "#f43f5e"
                            ].map((color, index) => (
                              <Cell key={`bar-cell-${index}`} fill={color} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <AreaChart
                          data={[
                            { name: isRtl ? "المرفقات" : "Attachments", count: submissions.length },
                            { name: isRtl ? "المنشورة" : "Published", count: publishedWorks.length },
                            { name: isRtl ? "الفواتير" : "Invoices", count: invoices.length },
                            { name: isRtl ? "الرسائل" : "Messages", count: messages.length },
                            { name: isRtl ? "المبيعات" : "Sales", count: sales.length },
                            { name: isRtl ? "الملاحظات" : "Feedback", count: submissions.filter(s => s.adminFeedback).length }
                          ]}
                          margin={{ top: 20, right: 15, left: -15, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="areaColorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fontWeight: 800 }} 
                            stroke="currentColor" 
                            opacity={0.8}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fontWeight: 700 }} 
                            allowDecimals={false} 
                            stroke="currentColor" 
                            opacity={0.8}
                          />
                          <RechartsTooltip />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#f59e0b" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#areaColorGradient)" 
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Metric Pillars Matrix (5 KPI Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 text-start space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground block">{isRtl ? "إجمالي العمليات المسجلة" : "Total Operations"}</span>
                      <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block">
                        {submissions.length + invoices.length + messages.length + sales.length}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">{isRtl ? "أنشطة استوديو المؤلف" : "Studio records"}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-start space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground block">{isRtl ? "الرصيد المتاح للسحب" : "Available Balance"}</span>
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                        {financials.availableBalance} ج.م
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">{isRtl ? "جاهز للسحب المباشر" : "Ready for payout"}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 text-start space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground block">{isRtl ? "الكتب المعروضة بالمتجر" : "Catalog Live Books"}</span>
                      <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 block">
                        {authorStoreBooks.length || publishedWorks.length}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">{isRtl ? "مؤلفات جاهزة للبيع" : "Published in store"}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-teal-500/10 border-2 border-teal-500/20 text-start space-y-1">
                      <span className="text-[10px] font-black text-muted-foreground block">{isRtl ? "إجمالي عوائد المبيعات" : "Total Royalties"}</span>
                      <span className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 block">
                        {financials.totalRoyalties} ج.م
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">{isRtl ? "أرباح تراكمية موثقة" : "Cumulative earnings"}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-start space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-black text-muted-foreground block">{isRtl ? "ملاحظات التحكيم النشطة" : "Active Notes"}</span>
                      <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 block">
                        {submissions.filter(s => s.adminFeedback).length}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">{isRtl ? "توجيهات تتطلب مراجعة" : "Action directives"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. لوحة الإحصائيات الشاملة والمؤشرات الرقمية لحساب المؤلف */}
              {(() => {
                // Real Author Numerical Computations:
                const totalSubs = submissions.length;
                const publishedSubs = submissions.filter(s => s.status === "published" || s.status === "approved").length;
                const pendingSubs = submissions.filter(s => s.status === "pending_review" || s.status === "in_review" || s.status === "pending").length;
                const feedbackSubs = submissions.filter(s => Boolean(s.adminFeedback)).length;

                const totalCopies = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);
                const digitalCopies = sales.filter(s => s.format === "digital").reduce((sum, s) => sum + (s.quantity || 1), 0);
                const printCopies = sales.filter(s => s.format === "print" || s.format === "both").reduce((sum, s) => sum + (s.quantity || 1), 0);
                const digitalEarn = sales.filter(s => s.format === "digital").reduce((sum, s) => sum + (s.authorEarnings || 0), 0);
                const printEarn = sales.filter(s => s.format === "print" || s.format === "both").reduce((sum, s) => sum + (s.authorEarnings || 0), 0);

                const totalInvs = invoices.length;
                const paidInvs = invoices.filter(i => i.status === "paid").length;
                const unpaidInvs = invoices.filter(i => i.status === "unpaid").length;
                const paidAmt = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
                const unpaidAmt = invoices.filter(i => i.status === "unpaid").reduce((sum, i) => sum + (i.amount || 0), 0);

                const activeNotes = feedbackSubs;
                const resolvedNotes = Math.max(0, totalSubs - activeNotes);
                const adminMsgs = messages.filter(m => m.sender === "admin").length;

                const totalOps = totalSubs + totalCopies + totalInvs + activeNotes;

                // Operations Donut Data:
                const opsDataRaw = [
                  { name: isRtl ? "مؤلفات منشورة ومعتمدة" : "Published Books", value: publishedSubs, fill: "#2563eb", unit: isRtl ? "مؤلف" : "Books" },
                  { name: isRtl ? "مؤلفات قيد المراجعة" : "Under Review", value: pendingSubs, fill: "#f59e0b", unit: isRtl ? "مؤلف" : "Books" },
                  { name: isRtl ? "نسخ مبيعات محققة" : "Copies Sold", value: totalCopies, fill: "#10b981", unit: isRtl ? "نسخة" : "Copies" },
                  { name: isRtl ? "فواتير مسددة بالكامل" : "Settled Invoices", value: paidInvs, fill: "#0d9488", unit: isRtl ? "فاتورة" : "Invoices" },
                  { name: isRtl ? "ملاحظات تحكيم نشطة" : "Active Notes", value: activeNotes, fill: "#e11d48", unit: isRtl ? "ملاحظة" : "Notes" }
                ];
                const opsData = opsDataRaw.filter(d => d.value > 0);
                const finalOpsData = opsData.length > 0 ? opsData : [
                  { name: isRtl ? "حساب معتمد وجاهز للنشر" : "Account Verified & Ready", value: 1, fill: "#10b981", unit: isRtl ? "نشط" : "Active" }
                ];

                // Financial Donut Data:
                const finDataRaw = [
                  { name: isRtl ? "أرباح مبيعات رقمية (70%)" : "Digital Royalties (70%)", value: digitalEarn, fill: "#10b981", unit: "EGP" },
                  { name: isRtl ? "أرباح مبيعات ورقية (30%)" : "Print Royalties (30%)", value: printEarn, fill: "#0d9488", unit: "EGP" },
                  { name: isRtl ? "رسوم فواتير مسددة" : "Settled Invoices", value: paidAmt, fill: "#6366f1", unit: "EGP" },
                  { name: isRtl ? "فواتير مستحقة الدفع" : "Unpaid Dues", value: unpaidAmt, fill: "#f43f5e", unit: "EGP" }
                ];
                const finData = finDataRaw.filter(d => d.value > 0);
                const finalFinData = finData.length > 0 ? finData : [
                  { name: isRtl ? "المحفظة المالية جاهزة" : "Wallet Initialized", value: 1, fill: "#10b981", unit: "EGP" }
                ];

                const currentChartData = statsChartMode === "operations" ? finalOpsData : finalFinData;

                return (
                  <Card className="rounded-3xl border-2 border-border/80 shadow-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-border/60 p-5 sm:p-6 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-start">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base sm:text-lg font-black text-foreground">
                                {isRtl ? "إحصائيات ومؤشرات حساب المؤلف بالأرقام الفعلية" : "Author Account Numerical Statistics & Metrics"}
                              </CardTitle>
                              <Badge className="bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                                {totalOps > 0 ? `${totalOps} ${isRtl ? "حركة رقمية" : "Operations"}` : (isRtl ? "حساب معتمد 100%" : "Active Account")}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs font-bold text-muted-foreground mt-0.5">
                              {isRtl 
                                ? "إحصائيات دقيقة وتفاعلية بالأرقام والنسب لما يدور في حسابك من مؤلفات، مبيعات، فواتير، وتحكيم"
                                : "Live numerical breakdown of your manuscripts, royalties, sales volumes, billing, and peer reviews"}
                            </CardDescription>
                          </div>
                        </div>

                        {/* View Mode Toggle: Operations vs Financial */}
                        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 self-start sm:self-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={statsChartMode === "operations" ? "default" : "ghost"}
                            onClick={() => setStatsChartMode("operations")}
                            className={`h-8 px-3 text-xs font-black rounded-xl transition-all ${
                              statsChartMode === "operations"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>{isRtl ? "📊 حركات الحساب" : "📊 Operations"}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={statsChartMode === "financial" ? "default" : "ghost"}
                            onClick={() => setStatsChartMode("financial")}
                            className={`h-8 px-3 text-xs font-black rounded-xl transition-all ${
                              statsChartMode === "financial"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>{isRtl ? "💰 العوائد المالية" : "💰 Royalties (EGP)"}</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Left Column: Interactive Numerical Donut Chart with Dynamic Center */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-center">
                          <div className="h-72 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={currentChartData}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={95}
                                  innerRadius={62}
                                  paddingAngle={currentChartData.length > 1 ? 4 : 0}
                                  dataKey="value"
                                >
                                  {currentChartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "1rem",
                                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                                    color: "hsl(var(--foreground))",
                                    fontWeight: "bold",
                                    fontSize: "12px"
                                  }}
                                  formatter={(val: any, name: any, item: any) => [
                                    `${val} ${item?.payload?.unit || ""}`, 
                                    name
                                  ]} 
                                />
                              </PieChart>
                            </ResponsiveContainer>

                            {/* Centered Gauge: Displays Real Total */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                              {statsChartMode === "operations" ? (
                                <>
                                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                                    {totalOps > 0 ? totalOps : "100%"}
                                  </span>
                                  <span className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                    {totalOps > 0 
                                      ? (isRtl ? "إجمالي الحركات بالأرقام" : "Total Operations") 
                                      : (isRtl ? "جاهزية الحساب" : "Account Ready")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                    {financials.totalAuthorRoyalties > 0 ? `${financials.totalAuthorRoyalties}` : "0"}
                                    <span className="text-xs ms-1 text-muted-foreground">ج.م</span>
                                  </span>
                                  <span className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                    {isRtl ? "إجمالي عوائد المؤلف" : "Total Royalties"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Numerical Legend Pills with REAL Values */}
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs font-bold">
                            {statsChartMode === "operations" ? (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                                  <span>{isRtl ? `المنشور بالمتجر (${publishedSubs})` : `Published (${publishedSubs})`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                                  <span>{isRtl ? `قيد المراجعة (${pendingSubs})` : `In Review (${pendingSubs})`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                                  <span>{isRtl ? `المبيعات (${totalCopies} نسخة)` : `Sold (${totalCopies})`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                                  <span>{isRtl ? `الفواتير المسددة (${paidInvs})` : `Paid Invoices (${paidInvs})`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
                                  <span>{isRtl ? `الملاحظات (${activeNotes})` : `Notes (${activeNotes})`}</span>
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                                  <span>{isRtl ? `أرباح رقمية: ${digitalEarn} ج.م` : `Digital: ${digitalEarn} EGP`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                                  <span>{isRtl ? `أرباح ورقية: ${printEarn} ج.م` : `Print: ${printEarn} EGP`}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[11px] shadow-xs">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                                  <span>{isRtl ? `مسدد لدار عبيد: ${paidAmt} ج.م` : `Paid: ${paidAmt} EGP`}</span>
                                </span>
                                {unpaidAmt > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-[11px] shadow-xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                                    <span>{isRtl ? `مستحق: ${unpaidAmt} ج.م` : `Due: ${unpaidAmt} EGP`}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right Column: 4 Real-Data Numerical Metric Rows & Policy Banner */}
                        <div className="lg:col-span-7 space-y-3.5">
                          
                          {/* Row 1: Manuscripts & Books */}
                          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-start transition-all hover:border-blue-500/40">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="flex items-center gap-2 text-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                                <span>{isRtl ? "المؤلفات والمخطوطات المسجلة" : "Manuscripts & Catalog"}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                                  {totalSubs} {isRtl ? "مؤلف إجمالي" : "Total"}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTabChange("submit")}
                                  className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg"
                                >
                                  {isRtl ? "+ رفع مؤلف" : "+ Submit"}
                                </Button>
                              </div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                style={{ 
                                  width: `${totalSubs > 0 
                                    ? Math.max(10, Math.round((publishedSubs / totalSubs) * 100)) 
                                    : 100}%` 
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                              <span>
                                {totalSubs > 0 
                                  ? (isRtl 
                                      ? `✅ ${publishedSubs} منشور ومعتمد • ⏳ ${pendingSubs} قيد التحكيم والقراءة` 
                                      : `✅ ${publishedSubs} Live • ⏳ ${pendingSubs} In Review`)
                                  : (isRtl ? "حسابك جاهز تماماً لاستقبال أول مؤلف ومخطوطة" : "Ready to receive your first manuscript")}
                              </span>
                              <span className="font-mono text-foreground font-black">
                                {publishedSubs} / {totalSubs} {isRtl ? "معتمد" : "Approved"}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Sales & Sold Copies */}
                          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-start transition-all hover:border-emerald-500/40">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="flex items-center gap-2 text-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                                <span>{isRtl ? "حركة المبيعات والنسخ المحققة" : "Book Sales & Copies Sold"}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                                  {totalCopies} {isRtl ? "نسخة مباعة" : "Copies"} • {financials.totalRoyalties} ج.م
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTabChange("sales")}
                                  className="h-6 px-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg"
                                >
                                  {isRtl ? "سجل المبيعات ↗" : "Sales ↗"}
                                </Button>
                              </div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                style={{ 
                                  width: `${totalCopies > 0 
                                    ? Math.min(100, Math.max(15, totalCopies * 10)) 
                                    : 100}%` 
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                              <span>
                                {totalCopies > 0
                                  ? (isRtl 
                                      ? `📱 ${digitalCopies} رقمية (${digitalEarn} ج.م) • 📦 ${printCopies} ورقية (${printEarn} ج.م)` 
                                      : `📱 ${digitalCopies} Digital • 📦 ${printCopies} Print`)
                                  : (isRtl ? `الرصيد المتاح للسحب الفوري: ${financials.availableBalance} ج.م` : `Available balance: ${financials.availableBalance} EGP`)}
                              </span>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                {financials.availableBalance} ج.م {isRtl ? "متاح" : "Ready"}
                              </span>
                            </div>
                          </div>

                          {/* Row 3: Invoices & Payments */}
                          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-start transition-all hover:border-teal-500/40">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="flex items-center gap-2 text-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-xs" />
                                <span>{isRtl ? "الفواتير وسندات السداد لدار عبيد" : "Invoices & Payment Receipts"}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-teal-600 dark:text-teal-400 font-extrabold text-sm">
                                  {totalInvs} {isRtl ? "فاتورة مسجلة" : "Invoices"}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTabChange("payments")}
                                  className="h-6 px-2 text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 rounded-lg"
                                >
                                  {isRtl ? "الفواتير ↗" : "Billing ↗"}
                                </Button>
                              </div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                                style={{ 
                                  width: `${totalInvs > 0 
                                    ? Math.round((paidInvs / totalInvs) * 100) 
                                    : 100}%` 
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                              <span>
                                {totalInvs > 0
                                  ? (isRtl 
                                      ? `💳 ${paidInvs} مسددة (${paidAmt} ج.م) • ⚠️ ${unpaidInvs} مستحقة (${unpaidAmt} ج.م)` 
                                      : `💳 ${paidInvs} Settled • ⚠️ ${unpaidInvs} Unpaid`)
                                  : (isRtl ? "لا توجد أي فواتير معلقة • حسابك مالي سليم بنسبة 100%" : "No pending invoices • Account 100% clean")}
                              </span>
                              <span className="font-mono text-foreground font-black">
                                {totalInvs > 0 ? `${Math.round((paidInvs / totalInvs) * 100)}%` : "100%"} {isRtl ? "مسدد" : "Settled"}
                              </span>
                            </div>
                          </div>

                          {/* Row 4: Peer Review & Feedback Directives */}
                          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-start transition-all hover:border-rose-500/40">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="flex items-center gap-2 text-foreground">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                                <span>{isRtl ? "ملاحظات التحكيم والتدقيق الأكاديمي" : "Peer Review & Editorial Notes"}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`font-extrabold text-sm ${activeNotes > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {activeNotes} {isRtl ? "ملاحظة نشطة" : "Active Notes"}
                                </span>
                                {activeNotes > 0 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate("/nashr/notes")}
                                    className="h-6 px-2 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg animate-pulse"
                                  >
                                    {isRtl ? "مراجعة الملاحظات 🔥" : "Review 🔥"}
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                                style={{ 
                                  width: `${totalSubs > 0 
                                    ? Math.round((resolvedNotes / totalSubs) * 100) 
                                    : 100}%` 
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                              <span>
                                {activeNotes > 0
                                  ? (isRtl 
                                      ? `💬 ${adminMsgs} توجيهات واستشارات • ${resolvedNotes} مؤلف مكتمل دون ملاحظات` 
                                      : `💬 ${adminMsgs} Directives • ${resolvedNotes} Clean`)
                                  : (isRtl ? "كافة مؤلفاتك خالية من الملاحظات المعلقة ومكتملة التدقيق" : "All manuscripts clear with zero pending notes")}
                              </span>
                              <span className="font-mono text-foreground font-black">
                                {totalSubs > 0 ? `${resolvedNotes} / ${totalSubs}` : (isRtl ? "سليم 100%" : "100% Clear")}
                              </span>
                            </div>
                          </div>

                          {/* Row 5: Official Royalty Distribution Policy */}
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start shadow-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                                {isRtl ? "نسبة أرباح المؤلف المعتمدة رسميًا بدار عبيد وUNIGATES:" : "Official Approved Author Royalty Share:"}
                              </span>
                              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-black text-foreground">
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>{isRtl ? "70% للنسخ الرقمية المشفرة (DRM)" : "70% Digital eBooks"}</span>
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>{isRtl ? "30% للنسخ الورقية المطبوعة والشحن" : "30% Print Editions"}</span>
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs px-3.5 py-1.5 self-start sm:self-auto shrink-0 shadow-md">
                              {isRtl ? "أرباح مضمونة 100% بعقد رسمي" : "100% Guaranteed Contract"}
                            </Badge>
                          </div>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

            </div>


          </div>
        )}

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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCoverFileName(file.name);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === "string") {
                                    setCoverImageUrl(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setCoverFileName("");
                                setCoverImageUrl("");
                              }
                            }}
                            className="text-[10px] h-8 rounded-lg cursor-pointer bg-background"
                          />
                          {coverFileName && <span className="text-[10px] font-bold text-emerald-600 block truncate">{coverFileName}</span>}
                        </div>

                        {/* 2. Manuscript File */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 text-center space-y-2">
                          <FileText className="w-6 h-6 text-blue-500 mx-auto" />
                          <span className="text-xs font-bold block">{isRtl ? "رفع ملف (PDF / Word)" : "Upload File (PDF / Word)"}</span>
                          <Input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setManuscriptFileName(file.name);
                                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                                setManuscriptFileSize(`${sizeMB} MB`);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === "string") {
                                    setManuscriptFileUrl(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setManuscriptFileName("");
                                setManuscriptFileUrl("");
                              }
                            }}
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
                        <span>{isRtl ? "إرسال الملفات لإدارة المنصة للموافقة والاعتماد ➔" : "Submit Files for Review ➔"}</span>
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
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{isRtl ? "فحص الملفات المرفقة والتأكد من استيفاء الشروط والتدقيق اللغوي الأكاديمي." : "Reviewing attached files & academic proofreading."}</p>
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
                      <span>{isRtl ? "الملفات قيد المتابعة والاعتماد" : "Files Status"}</span>
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
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] leading-relaxed space-y-1">
                            <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                              💬 {isRtl ? "ملاحظات هيئة التحكيم والتدقيق:" : "Editorial Review Notes:"}
                            </span>
                            <p className="text-foreground/90 font-medium bg-background/60 p-2 rounded-lg border border-border/40">
                              {sub.adminFeedback}
                            </p>
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditSubmission(sub)}
                            className="h-7 px-2.5 rounded-xl text-[10px] font-black border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isRtl ? "تعديل المرفقات وإعادة الإرسال ✏️" : "Edit Attachments & Resubmit"}</span>
                          </Button>
                        </div>
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
                  {isRtl ? "بمجرد اعتماد وموافقة إدارة المنصة على الملفات، ستظهر هنا مباشرة مع كود الكتاب ورابط المتجر." : "Once approved, books appear here."}
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

            {/* 📤 قسم رفع صورة إيصال التحويل والسداد البنكي المباشر */}
            <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-amber-500/15 border-b border-amber-500/30 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    📤
                  </div>
                  <div>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <span>{isRtl ? "رفع إيصال / صورة التحويل المالي أو السداد البنكي" : "Upload Transfer Receipt & Proof"}</span>
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                        {isRtl ? "خدمة المطابقة والاعتماد السريع ⚡" : "Fast Verification"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRtl 
                        ? "بعد تحويل المبلغ عبر إنستاباي أو الحساب البنكي أو المحفظة الإلكترونية، قم برفع صورة الإيصال أو لقطة الشاشة ليتم تدقيقها واعتمادها فوراً من قبل الإدارة المالية لدار عبيد."
                        : "Upload payment screenshot or bank receipt for instant editorial verification."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmitTransferReceipt} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Invoice Target Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "الفاتورة / سبب التحويل *" : "Target Invoice / Purpose *"}
                      </Label>
                      <Select 
                        value={transferInvoiceTarget} 
                        onValueChange={(val) => {
                          setTransferInvoiceTarget(val);
                          const inv = invoices.find(i => i.id === val);
                          if (inv) setTransferAmountInput(inv.amount.toString());
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-background">
                          <SelectValue placeholder={isRtl ? "اختر الفاتورة..." : "Select Invoice"} />
                        </SelectTrigger>
                        <SelectContent>
                          {invoices.filter(i => i.status === "unpaid").map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.invoiceNumber} - {i.amount} {i.currency} ({i.manuscriptTitle.slice(0, 24)}...)
                            </SelectItem>
                          ))}
                          <SelectItem value="auto">
                            {isRtl ? "سداد مباشر / دفعة حجز ونشر جديدة" : "Direct Publishing Deposit"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "المبلغ المحول (ج.م) *" : "Transferred Amount (EGP) *"}
                      </Label>
                      <Input 
                        type="number" 
                        placeholder={isRtl ? "مثال: 1200" : "e.g. 1200"}
                        value={transferAmountInput}
                        onChange={(e) => setTransferAmountInput(e.target.value)}
                        className="h-10 rounded-xl text-xs font-mono font-bold bg-background"
                      />
                    </div>

                    {/* Payment Method Used */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "طريقة التحويل المستخدمة *" : "Payment Method Used *"}
                      </Label>
                      <Select value={transferMethodInput} onValueChange={setTransferMethodInput}>
                        <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instapay">⚡ {isRtl ? "إنستاباي (InstaPay)" : "InstaPay"}</SelectItem>
                          <SelectItem value="bank_transfer">🏛️ {isRtl ? "تحويل بنكي - البنك الأهلي المصري" : "NBE Bank Transfer"}</SelectItem>
                          <SelectItem value="vodafone_cash">📱 {isRtl ? "محفظة إلكترونية (فودافون كاش / اتصالات)" : "Vodafone Cash"}</SelectItem>
                          <SelectItem value="credit_card">🌐 {isRtl ? "بطاقة بنكية / فيزا أو ماستركارد" : "Credit Card"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Transaction Reference Number */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "رقم العملية / المرجع أو اسم المحول (اختياري):" : "Transaction Ref / Sender Name (Optional):"}
                      </Label>
                      <Input 
                        placeholder={isRtl ? "مثال: TRX-88912 أو اسم المحول بحسابه" : "e.g. Ref # or Sender Name"}
                        value={transferRefInput}
                        onChange={(e) => setTransferRefInput(e.target.value)}
                        className="h-10 rounded-xl text-xs bg-background"
                      />
                    </div>

                    {/* Transfer Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">
                        {isRtl ? "ملاحظات إضافية للإدارة المالية (اختياري):" : "Notes for Finance (Optional):"}
                      </Label>
                      <Input 
                        placeholder={isRtl ? "مثال: تم التحويل لتكاليف الغلاف والطباعة الورقية" : "Additional payment notes"}
                        value={transferNotesInput}
                        onChange={(e) => setTransferNotesInput(e.target.value)}
                        className="h-10 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  {/* Upload Box with Drag & Drop styling and Live Preview */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>{isRtl ? "صورة إيصال التحويل / لقطة الشاشة *" : "Receipt Screenshot / Transfer Slip *"}</span>
                      <span className="text-[10px] text-muted-foreground">{isRtl ? "يقبل JPG, PNG, WebP أو PDF" : "PNG, JPG, PDF supported"}</span>
                    </Label>

                    <div className="border-2 border-dashed border-amber-500/50 hover:border-amber-500 rounded-2xl p-4 sm:p-6 bg-card/60 transition-all text-center space-y-3">
                      {transferReceiptPreview ? (
                        <div className="space-y-3">
                          {transferReceiptFileType === "application/pdf" || transferReceiptFileName.endsWith(".pdf") ? (
                            <div className="relative inline-flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-amber-500 bg-slate-950 text-white min-w-[260px] shadow-lg">
                              <FileText className="w-12 h-12 text-rose-500 mb-2" />
                              <span className="text-xs font-bold truncate max-w-[220px]">{transferReceiptFileName}</span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{transferReceiptFileSize || "مستند PDF"}</span>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  setTransferReceiptPreview("");
                                  setTransferReceiptFileName("");
                                  setTransferReceiptFileSize("");
                                  setTransferReceiptFileType("");
                                }}
                                className="absolute top-2 end-2 h-6 px-2 rounded-lg text-[10px] font-bold"
                              >
                                {isRtl ? "حذف" : "Remove"}
                              </Button>
                            </div>
                          ) : (
                            <div className="relative inline-block max-h-52 rounded-xl overflow-hidden border-2 border-amber-500 shadow-md bg-slate-950 p-1">
                              <img 
                                src={transferReceiptPreview} 
                                alt="Receipt Preview" 
                                className="max-h-52 w-auto object-contain mx-auto rounded-lg"
                              />
                              <Button 
                                type="button"
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  setTransferReceiptPreview("");
                                  setTransferReceiptFileName("");
                                  setTransferReceiptFileSize("");
                                  setTransferReceiptFileType("");
                                }}
                                className="absolute top-2 end-2 h-7 px-2.5 rounded-lg text-xs font-bold shadow-md"
                              >
                                {isRtl ? "حذف وتغيير" : "Remove"}
                              </Button>
                            </div>
                          )}
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {isRtl ? `تم تجهيز الإيصال: ${transferReceiptFileName || "صورة التحويل"}` : "Receipt ready"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="w-10 h-10 text-amber-500 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground">
                              {isRtl ? "اسحب وأفلت صورة الإيصال هنا أو اضغط للاختيار من جهازك" : "Drag and drop receipt image or browse"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isRtl ? "لقطة شاشة من تطبيق إنستاباي أو إشعار التحويل البنكي أو رسالة المحفظة" : "Screenshot from banking app or InstaPay"}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-2 pt-2">
                            <label className="cursor-pointer">
                              <span className="h-9 px-4 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white inline-flex items-center gap-1.5 shadow-sm transition-all">
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>{isRtl ? "اختيار صورة الإيصال من الجهاز" : "Browse File"}</span>
                              </span>
                              <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                onChange={handleReceiptFileSelect} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      disabled={submittingDirectReceipt}
                      className="h-11 px-6 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 gap-2"
                    >
                      {submittingDirectReceipt ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isRtl ? "إرسال إيصال السداد للإدارة المالية للتدقيق والاعتماد 📤" : "Submit Receipt for Audit"}</span>
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>

            {/* Invoices List & Payment Methods Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "فواتير النشر الصادرة وسجل الإيصالات" : "Issued Invoices & Receipts"}</span>
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
                              ? "border-blue-500/40 bg-blue-500/5 shadow-sm"
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
                                  ? (isRtl ? "الإيصال قيد المراجعة والتدقيق ⏳" : "Receipt Under Review") 
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

                          {/* Rejection notice if present */}
                          {inv.rejectionReason && (
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                              <strong>{isRtl ? "⚠️ ملاحظة تدقيق الإدارة المالية (تم رفض الإيصال السابق):" : "Finance Rejection Note:"}</strong>
                              <p className="text-[11px] leading-relaxed">{inv.rejectionReason}</p>
                            </div>
                          )}

                          {/* Footer with receipt preview & actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{isRtl ? "تاريخ الإصدار:" : "Date:"} {inv.createdAt}</span>
                              {inv.paymentMethod && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  • {inv.paymentMethod}
                                </span>
                              )}
                              {inv.receiptReference && (
                                <Badge variant="outline" className="text-[10px] font-mono bg-background">
                                  {isRtl ? "مرجع:" : "Ref:"} {inv.receiptReference}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setViewReceiptModalInvoice(inv)}
                                className="h-8 px-3 rounded-xl font-bold text-xs gap-1.5 border-border hover:bg-muted"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-500" />
                                <span>
                                  {inv.receiptImageUrl || inv.status === "paid" 
                                    ? (isRtl ? "معاينة صورة الإيصال والملاحظات" : "View Receipt & Notes") 
                                    : (isRtl ? "تفاصيل الفاتورة والمستندات" : "Invoice Details")}
                                </span>
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const ext = inv.receiptFileType === "application/pdf" ? ".pdf" : ".png";
                                  downloadFileOrDataUrl(inv.receiptImageUrl || generateOfficialReceiptSvg(inv), inv.receiptFileName || `إيصال_${inv.invoiceNumber}${ext}`);
                                }}
                                className="h-8 px-2.5 rounded-xl font-bold text-xs gap-1 border-border hover:bg-muted"
                                title={isRtl ? "تحميل ملف الإيصال" : "Download Slip"}
                              >
                                <Download className="w-3.5 h-3.5 text-amber-500" />
                              </Button>

                              {inv.status === "unpaid" && (
                                <Button 
                                  onClick={() => {
                                    setTransferInvoiceTarget(inv.id);
                                    setTransferAmountInput(inv.amount.toString());
                                    window.scrollTo({ top: 380, behavior: "smooth" });
                                  }}
                                  size="sm" 
                                  className="h-8 px-3.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                                >
                                  {isRtl ? "رفع إيصال هذه الفاتورة ➔" : "Pay & Upload Receipt"}
                                </Button>
                              )}
                            </div>
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
          <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <span>{isRtl ? "التواصل الداخلي المباشر مع إدارة المنصة" : "Direct Editorial & Admin Messaging"}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRtl 
                    ? "قناة مراسلة آمنة ومباشرة مع فريق دار عبيد لمناقشة تعديلات المخطوطات، تصميم الأغلفة، والتدقيق والتحكيم"
                    : "Secure direct messaging with Dar Obeid editors regarding manuscripts, covers, proofreading, and peer-review."}
                </p>
              </div>

              {/* Quick Status Pill */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant="outline" className="h-8 px-3 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isRtl ? "فريق التحرير والتدقيق متصل 🟢" : "Editorial Team Online"}</span>
                </Badge>
              </div>
            </div>

            <Card className="border-2 border-border/80 shadow-2xl bg-card rounded-3xl overflow-hidden flex flex-col h-[650px] relative">
              
              {/* Chat Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 border-b border-border/70 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center font-black text-lg shadow-sm border border-white/20">
                      🏢
                    </div>
                    <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background ring-2 ring-emerald-500/20 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-foreground">
                        {isRtl ? "إدارة دار عبيد للنشر والتوزيع" : "Dar Obeid Publishing Administration"}
                      </span>
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-black px-1.5 py-0">
                        {isRtl ? "المقر الرئيسي" : "Official HQ"}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <span>{isRtl ? "قسم التدقيق، التحكيم، والإشراف الفني • الرد خلال دقائق" : "Peer-review, editorial & design desk • Replies within minutes"}</span>
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Badge variant="outline" className="text-[10px] rounded-lg border-border font-bold">
                    {messages.length} {isRtl ? "رسالة" : "msgs"}
                  </Badge>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-muted/10 selection:bg-amber-500 selection:text-white">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl shadow-xs">
                      💬
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-sm font-black text-foreground">
                        {isRtl ? "لا توجد رسائل سابقة" : "No messages yet"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {isRtl 
                          ? "يمكنك كتابة أي استفسار أو إرسال ملاحظات أو ملفات مباشرة لفريق دار عبيد عبر الصندوق بالأسفل." 
                          : "Start the conversation by typing your inquiry or sending an attachment below."}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAuthor = msg.sender === "author";
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 items-end ${isAuthor ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 mb-1">
                          {isAuthor ? (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden border border-white/20">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={authorProfile.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>✍️</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center text-xs font-black shadow-xs border border-border">
                              🏢
                            </div>
                          )}
                        </div>

                        {/* Message Bubble Container */}
                        <div className={`flex flex-col max-w-[85%] sm:max-w-xl ${isAuthor ? "items-end" : "items-start"}`}>
                          
                          {/* Sender name & time */}
                          <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold ${isAuthor ? "flex-row-reverse text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                            <span>{msg.senderName}</span>
                            <span className="text-[10px] text-muted-foreground/80 font-normal">({msg.senderTitle})</span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">· {msg.timestamp}</span>
                          </div>
                          
                          {/* Main Bubble */}
                          <div className={`p-4 rounded-3xl text-xs sm:text-[13px] leading-relaxed shadow-sm transition-all border ${
                            isAuthor 
                              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-600 rounded-ee-sm" 
                              : "bg-card text-foreground border-border/90 rounded-es-sm dark:bg-card/90"
                          }`}>
                            
                            {/* Message Text (always clearly visible with proper line-wrapping) */}
                            <p className="whitespace-pre-wrap font-medium break-words leading-relaxed select-text">
                              {msg.text}
                            </p>

                            {/* Attachment Card if present */}
                            {msg.attachmentName && (
                              <div 
                                onClick={() => {
                                  setSelectedAttachment({
                                    fileName: msg.attachmentName,
                                    fileUrl: msg.attachmentUrl,
                                    senderName: msg.senderName,
                                    timestamp: msg.timestamp,
                                    messageText: msg.text
                                  });
                                  setShowAttachmentModal(true);
                                }}
                                className={`mt-3 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold cursor-pointer transition-all border ${
                                  isAuthor 
                                    ? "bg-white/15 hover:bg-white/25 text-white border-white/20" 
                                    : "bg-muted/70 hover:bg-muted text-foreground border-border/80 shadow-2xs"
                                }`}
                                title={isRtl ? "اضغط لمعاينة وتحميل المرفق" : "Click to view / download"}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAuthor ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="truncate text-start">
                                    <span className="truncate block font-black text-[11px] sm:text-xs">{msg.attachmentName}</span>
                                    <span className="text-[10px] opacity-80 font-normal">{isRtl ? "مرفق مستند / ملف" : "Document Attachment"}</span>
                                  </div>
                                </div>
                                <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1 ${
                                  isAuthor ? "bg-white/20 text-white" : "bg-background border border-border text-foreground"
                                }`}>
                                  <Download className="w-3 h-3" />
                                  <span>{isRtl ? "معاينة وتحميل" : "View"}</span>
                                </span>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-card/95 border-t border-border/70 backdrop-blur-sm">
                
                {/* Active attachment pill preview */}
                {chatAttachmentName && (
                  <div className="flex items-center justify-between p-2.5 mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-bold text-foreground truncate">{chatAttachmentName}</span>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 font-normal">
                        {isRtl ? "جاهز للإرسال" : "Ready"}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setChatAttachmentName("");
                        setChatAttachmentUrl("");
                      }} 
                      className="h-7 w-7 p-0 rounded-xl hover:bg-rose-500/10 hover:text-rose-600"
                      title={isRtl ? "إلغاء المرفق" : "Cancel attachment"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={chatFileInputRef}
                  onChange={handleChatFileUpload}
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                />

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  
                  {/* File Attachment Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={isUploadingChatFile}
                    className="h-11 w-11 p-0 rounded-2xl border-border hover:bg-muted hover:border-amber-500/40 text-muted-foreground hover:text-foreground shrink-0 transition-all shadow-2xs"
                    title={isRtl ? "إرفاق ملف أو مستند (PDF / Word / صورة)" : "Attach document or image"}
                  >
                    {isUploadingChatFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Input field */}
                  <Input 
                    placeholder={isRtl ? "اكتب استفسارك أو ملاحظتك لإدارة دار عبيد للنشر والتوزيع..." : "Type your message to Dar Obeid team..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="h-11 rounded-2xl text-xs sm:text-sm border-border bg-muted/30 focus-visible:ring-amber-500/40 flex-1 px-4 shadow-2xs"
                  />

                  {/* Send Button */}
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!chatInput.trim() && !chatAttachmentName}
                    className="h-11 px-5 sm:px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md gap-2 shrink-0 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 rtl:-scale-x-100" />
                    <span>{isRtl ? "إرسال" : "Send"}</span>
                  </Button>
                </form>

                {/* Helper hint */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 px-1">
                  <span>{isRtl ? "💡 يمكنك إرفاق مسودات، استفسارات، أو طلبات تعديل الغلاف والتحكيم" : "You can attach drafts, inquiries, or cover design notes"}</span>
                  <span className="hidden sm:inline font-mono">End-to-End Encrypted 🔒</span>
                </div>
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

            {/* 📚 كتالوج كتبي المنشورة بالمتجر والأسعار المعتمدة من إدارة المتجر */}
            <Card className="border-2 border-amber-500/30 shadow-md bg-gradient-to-r from-amber-500/5 via-background to-orange-500/5 rounded-3xl overflow-hidden">
              <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    🏬
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <span>{isRtl ? "كتالوج كتبي المنشورة بالمتجر وتحديثات الأسعار من إدارة المتجر" : "Live Store Catalog & Admin Price Control"}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                        {isRtl ? "متصل باستوديو المتجر ⚡" : "Studio Synced"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRtl 
                        ? "الأسعار الرسمية المحددة والمعتمدة من قبل إدارة متجر كتب دار عبيد (Dar Obeid Bookstore Studio) مع احتساب حصة المؤلف فورياً."
                        : "Official live pricing set by Dar Obeid bookstore management with real-time royalty calculations."}
                    </CardDescription>
                  </div>
                </div>

                <Link to="/book-store" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تصفح متجر الكتب 🌐" : "Visit Public Store"}</span>
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {authorStoreBooks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs font-semibold">
                    {isRtl ? "لا توجد كتب مدرجة بالمتجر حالياً. بمجرد موافقة الإدارة وتسعير المخطوطة في استوديو المتجر ستظهر هنا مباشرة." : "No books listed in the store yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {authorStoreBooks.map((book) => {
                      const bookSales = sales.filter((s) => s.bookCode === book.code);
                      const copiesSold = bookSales.length;
                      const bookEarnings = bookSales.reduce((acc, s) => acc + s.authorEarnings, 0);

                      return (
                        <div key={book.id} className="p-4 rounded-2xl bg-card border-2 border-border/80 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-xs">
                          <div className="flex items-start gap-3.5">
                            <img 
                              src={book.cover_url} 
                              alt={book.title_ar} 
                              className="w-16 h-22 rounded-xl object-cover border border-border/70 shadow-sm shrink-0 bg-slate-900"
                            />
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                  {book.code}
                                </span>
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                                  {isRtl ? "معتمد بالمتجر 🟢" : "Live in Store"}
                                </Badge>
                              </div>

                              <h4 className="font-black text-xs text-foreground line-clamp-2 leading-snug">
                                {book.title_ar}
                              </h4>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {book.category_ar} • {book.pages} صفحة • ISBN: {book.isbn}
                              </p>
                            </div>
                          </div>

                          {/* Live Prices Set by Bookstore Studio */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground block">{isRtl ? "سعر النسخة الرقمية (E-Book):" : "Digital Price:"}</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-foreground">{book.price_digital} ج.م</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                  (ربحك 70%: {Math.round(book.price_digital * 0.70)} ج.م)
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground block">{isRtl ? "سعر النسخة الورقية (مطبوع):" : "Print Price:"}</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-foreground">{book.price_print} ج.م</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                                  (ربحك 30%: {Math.round(book.price_print * 0.30)} ج.م)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Performance Footer */}
                          <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground pt-1 border-t border-border/50">
                            <span>
                              {isRtl ? "النسخ المباعة:" : "Sold:"} <strong className="text-foreground">{copiesSold} نسخة</strong>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {isRtl ? "أرباحك من هذا الكتاب:" : "Royalties:"} {bookEarnings} ج.م
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales Table with Official Invoices */}
            <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? "سجل مبيعات الكتب المباشرة وتوزيع العوائد وفواتير البيع" : "Live Book Sales Roster & Official Invoices"}</span>
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  {isRtl ? `إجمالي العمليات المنفذة: ${sales.length} عملية شراء` : `${sales.length} sales records`}
                </span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {sales.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto text-xl">
                      📊
                    </div>
                    <p className="text-sm font-black text-foreground">
                      {isRtl ? "لا توجد مبيعات مسجلة حتى الآن" : "No sales records yet"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {isRtl 
                        ? "فور شراء القراء لكتبكم المعتمدة عبر متجر الكتب (سواءً بنسخ رقمية أو ورقية)، ستظهر العمليات وفواتير البيع ونسب أرباحكم هنا لحظياً."
                        : "Once readers purchase your published books from the store, sales records, invoices, and your author royalties will appear here in real-time."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-start">
                    <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-black">
                      <tr>
                        <th className="p-3.5 text-start">{isRtl ? "الكتاب / الكود" : "Book / Code"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "صيغة البيع" : "Format"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "سعر البيع" : "Sale Price"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "نسبة وربح المؤلف" : "Author Royalty"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "المشتري / رقم الطلب" : "Buyer / Order"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "التاريخ" : "Date"}</th>
                        <th className="p-3.5 text-start">{isRtl ? "الإجراءات / فاتورة البيع" : "Actions / Invoice"}</th>
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
                              {s.format === "digital" ? "رقمي 📱 (70%)" : "ورقي 📖 (30%)"}
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
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSaleForInvoice(s);
                                  setShowSaleInvoiceModal(true);
                                }}
                                className="h-7 px-2.5 rounded-xl font-bold text-[11px] gap-1 border-border hover:bg-muted"
                                title={isRtl ? "معاينة الفاتورة الرسمية" : "View Invoice"}
                              >
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span>{isRtl ? "عرض الفاتورة" : "Invoice"}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const invoiceSvg = generateOfficialBookSaleInvoiceSvg(s);
                                  downloadFileOrDataUrl(invoiceSvg, `فاتورة_${s.orderNumber}_${s.bookCode}.svg`);
                                }}
                                className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                                title={isRtl ? "تحميل الفاتورة" : "Download"}
                              >
                                <Download className="w-3.5 h-3.5 text-amber-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
                {payouts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground font-semibold">
                    {isRtl 
                      ? "لا توجد طلبات سحب سابقة. يمكنك تقديم طلب سحب فور توفر رصيد أرباح متاح."
                      : "No past payout requests. You can submit a payout request once balance is available."}
                  </div>
                ) : (
                  payouts.map((pay) => (
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
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: 📜 العقود الرسمية واتفاقيات النشر والتوزيع (Contracts) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "contracts" && (
          contracts.length === 0 ? (
            <Card className="rounded-3xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-background p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-sm animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 mx-auto flex items-center justify-center border border-amber-500/30 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs px-3 py-1">
                  {isRtl ? "🔒 صفحة العقود مقفلة حالياً" : "🔒 Contracts Page Locked"}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {isRtl ? "لا تفتح صفحة العقود إلا بعد إصدار عقد من إدارة المنصة" : "Contracts will open once issued by administration"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  {isRtl 
                    ? "تخضع المخطوطات والملفات المرفوعة حالياً لفحص لجان القراءة والتحكيم بدار عبيد للنشر والتوزيع. فور قبول المخطوطة وإصدار العقد الرسمي المعتمد من قبل الإدارة، ستفتح هذه الصفحة تلقائياً لتتمكنوا من مراجعة البنود ونسب الأرباح والتوقيع الرقمي المعتمد."
                    : "Once your submitted manuscript is accepted and an official contract is issued by Dar Obeid administration, this page will unlock for review and digital signature."}
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={() => handleTabChange("overview")}
                  className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs rounded-xl px-6 h-10 shadow-md"
                >
                  <Home className="w-4 h-4 me-2" />
                  {isRtl ? "العودة إلى لوحة المخطوطات الرئيسية" : "Back to Dashboard"}
                </Button>
              </div>
            </Card>
          ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 end-0 p-8 opacity-10 pointer-events-none">
                <FileSignature className="w-48 h-48 text-indigo-600" />
              </div>
              <div className="space-y-2 relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-indigo-600 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                    {isRtl ? "اتفاقيات معتمدة 📜" : "Official Contracts"}
                  </Badge>
                  <Badge variant="outline" className="border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {isRtl ? "عوائد 70% للرقمي و 30% للمطبوع 💰" : "70% Digital / 30% Print Royalty"}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {isRtl ? "العقود الرسمية واتفاقيات النشر والتوزيع" : "Official Publishing & Distribution Agreements"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isRtl 
                    ? "عقود واتفاقيات النشر والطباعة المحررة رسمياً بينكم وبين دار عبيد للنشر والتوزيع لحفظ كافة حقوق الملكية الفكرية، توزيع العوائد المالية، وتوثيق الاعتماد الرقمي الملزم للطرفين."
                    : "Official publishing and distribution agreements between you and Dar Obeid Publishing to safeguard intellectual property rights and royalty shares."}
                </p>
              </div>
            </Card>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xs text-muted-foreground font-bold">{isRtl ? "إجمالي العقود" : "Total Contracts"}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{contracts.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileSignature className="w-5 h-5" />
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xs text-muted-foreground font-bold">{isRtl ? "عقود موثقة وسارية" : "Signed & Active"}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {contracts.filter(c => c.status === "signed").length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xs text-muted-foreground font-bold">{isRtl ? "بانتظار توقيعكم واعتمادكم" : "Pending Your Signature"}</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {contracts.filter(c => c.status === "pending_signature").length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xs text-muted-foreground font-bold">{isRtl ? "نسبة الأرباح المقررة" : "Your Royalties"}</p>
                  <p className="text-sm font-black text-foreground mt-1">70% رقمي • 30% ورقي</p>
                  <p className="text-[10px] text-muted-foreground">{isRtl ? "قيد فوري مع كل عملية بيع" : "Instant Wallet Credit"}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Scroll className="w-5 h-5" />
                </div>
              </Card>
            </div>

            {/* Contracts List */}
            {contracts.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-2 border-border/80 bg-card p-12 text-center space-y-3">
                <FileSignature className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <h3 className="font-bold text-base text-foreground">
                  {isRtl ? "لا توجد عقود صادرة حالياً" : "No contracts issued yet"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {isRtl 
                    ? "فور مراجعة مخطوطاتكم واعتمادها من قبل لجان التحكيم بدار عبيد للنشر والتوزيع، سيتم إصدار عقد النشر وإرساله هنا للاطلاع عليه وتوقيعه رقمياً."
                    : "Once your manuscript is reviewed and accepted by Dar Obeid, your publishing agreement will appear here for review and digital signature."}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {contracts.map((cnt) => {
                  const isPending = cnt.status === "pending_signature";
                  const isSigned = cnt.status === "signed";

                  return (
                    <Card 
                      key={cnt.id} 
                      className={`rounded-3xl border-2 transition-all p-5 space-y-4 ${
                        isPending 
                          ? "border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-card to-background shadow-lg shadow-amber-500/5" 
                          : "border-border/80 bg-card hover:border-indigo-500/40 shadow-md"
                      }`}
                    >
                      {/* Top Badges & Contract Number */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white font-mono text-xs font-black shadow-xs">
                              {cnt.contractNumber}
                            </Badge>
                            <Badge className={
                              isSigned 
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold"
                                : isPending
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-black animate-pulse"
                                : "bg-destructive/15 text-destructive text-[10px] font-bold"
                            }>
                              {isSigned 
                                ? (isRtl ? "عقد موثق وموقع رسمياً ✅" : "Signed & Official")
                                : isPending
                                ? (isRtl ? "بانتظار توقيعك واعتمادك الرقمي ⏳" : "Awaiting Your Signature")
                                : (isRtl ? "مرفوض ❌" : "Rejected")}
                            </Badge>
                          </div>
                          <h3 className="font-black text-base text-foreground line-clamp-1 mt-1">
                            {cnt.bookTitle}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                            <span>🏷️ {cnt.category}</span>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {cnt.publishType === "both" ? (isRtl ? "ورقي ورقمي" : "Print & Digital") : cnt.publishType === "digital" ? (isRtl ? "رقمي فقط" : "Digital") : (isRtl ? "ورقي فقط" : "Print")}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground text-end">
                          <span className="block font-mono">📅 {cnt.issueDate}</span>
                          <span className="text-[10px] text-muted-foreground">{isRtl ? "تاريخ الإصدار" : "Issue Date"}</span>
                        </div>
                      </div>

                      {/* Financial & Terms Breakdown */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/40 border border-border/60 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "عائد الرقمي E-Book" : "Digital"}</span>
                          <span className="font-black text-indigo-600 text-sm">{cnt.digitalRoyaltyRate}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "عائد الورقي المطبوع" : "Print"}</span>
                          <span className="font-black text-amber-600 text-sm">{cnt.printRoyaltyRate}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "مدة العقد" : "Duration"}</span>
                          <span className="font-black text-foreground text-sm">{cnt.rightsDurationYears} {isRtl ? "سنوات" : "Years"}</span>
                        </div>
                      </div>

                      {/* Status Notice Box */}
                      {isPending ? (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-semibold">
                              {isRtl 
                                ? "أصدرت إدارة دار عبيد للنشر والتوزيع هذا العقد لمؤلفكم. يرجى قراءة بنود الاتفاقية والموافقة عليها والتوقيع الرقمي لاعتماد العقد والحصول على نسختكم الموثقة فورياً."
                                : "Dar Obeid has issued this contract. Please review terms and apply your digital signature."}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleOpenContractReview(cnt)}
                            className="w-full h-10 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md gap-2 active:scale-98 transition-all"
                          >
                            <FileSignature className="w-4 h-4" />
                            <span>{isRtl ? "قراءة بنود الاتفاقية والتوقيع الرقمي ✍️" : "Review Terms & Sign Digitally"}</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isRtl ? "عقد سارٍ وموثق رقمياً بين الطرفين" : "Active & Verified Agreement"}</span>
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{cnt.signedDate}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {isRtl ? "الموقع المعتمد: " : "Signed by: "}
                            <span className="font-bold text-foreground">{cnt.authorSignature?.signatureText || cnt.authorName}</span>
                            {cnt.authorSignature?.ipOrRef && (
                              <span className="font-mono ms-2 text-[10px]">({cnt.authorSignature.ipOrRef})</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons for Signed Contract */}
                      {isSigned && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap w-full">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContractForView(cnt);
                                setShowContractViewModal(true);
                              }}
                              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 flex-1 bg-card hover:bg-muted"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>{isRtl ? "معاينة العقد" : "View"}</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleDownloadAuthorContract(cnt)}
                              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{isRtl ? "تحميل النسخة (SVG)" : "Download"}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintAuthorContract(cnt)}
                              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 flex-1 bg-card hover:bg-muted"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-500" />
                              <span>{isRtl ? "طباعة" : "Print"}</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          )
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: View Uploaded Payment Receipt & Invoice Statement */}
      {/* ------------------------------------------------------------- */}
      <ReceiptAuditModal
        open={!!viewReceiptModalInvoice}
        onOpenChange={(open) => {
          if (!open) setViewReceiptModalInvoice(null);
        }}
        invoice={viewReceiptModalInvoice}
        isAdminView={false}
        isRtl={isRtl}
      />

      {/* ── Dialog: Internal Chat Attachment Viewer Modal ── */}
      <AttachmentViewerModal
        open={showAttachmentModal}
        onOpenChange={setShowAttachmentModal}
        fileName={selectedAttachment?.fileName}
        fileUrl={selectedAttachment?.fileUrl}
        senderName={selectedAttachment?.senderName}
        timestamp={selectedAttachment?.timestamp}
        messageText={selectedAttachment?.messageText}
        isRtl={isRtl}
      />

      {/* 🧾 MODAL: View & Download Book Sale Invoice */}
      <BookSaleInvoiceModal
        open={showSaleInvoiceModal}
        onOpenChange={setShowSaleInvoiceModal}
        sale={selectedSaleForInvoice}
        isRtl={isRtl}
      />

      {/* ✏️ نافذة تعديل بيانات وملفات المخطوطة وإعادة إرسالها للتحكيم */}
      <Dialog open={showEditSubmissionModal} onOpenChange={setShowEditSubmissionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-4">
          {editingSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>{isRtl ? "تعديل المرفقات والبيانات وإعادة الإرسال" : "Edit Attachments & Resubmit"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? "يمكنكم تعديل النبذة، واستبدال ملف الكتاب والغلاف بناءً على ملاحظات هيئة التدقيق ثم إعادة إرسالها فوراً."
                    : "Update synopsis, manuscript file, or cover based on review feedback and resubmit."}
                </DialogDescription>
              </DialogHeader>

              {/* Notice of admin feedback if present */}
              {editingSubmission.adminFeedback && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-800 dark:text-amber-300 space-y-1.5 text-xs text-start">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📋 {isRtl ? "ملاحظات هيئة التحكيم والتدقيق المطلوب معالجتها:" : "Editorial Board Notes to Address:"}</span>
                  </div>
                  <p className="font-semibold text-foreground/90 bg-card p-2.5 rounded-xl border border-amber-500/20 leading-relaxed shadow-xs">
                    "{editingSubmission.adminFeedback}"
                  </p>
                </div>
              )}

              <form onSubmit={handleSaveEditSubmission} className="space-y-4 text-start">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "عنوان الكتاب / المؤلف *" : "Title *"}</Label>
                  <Input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs bg-muted/20"
                  />
                </div>

                {/* Category & Publish Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "التصنيف *" : "Category *"}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="دراسات وأبحاث أكاديمية">دراسات وأبحاث أكاديمية</SelectItem>
                        <SelectItem value="أطروحات ورسائل جامعية">أطروحات ورسائل جامعية</SelectItem>
                        <SelectItem value="كتب جامعية ومناهج">كتب جامعية ومناهج</SelectItem>
                        <SelectItem value="أدب وروايات">أدب وروايات</SelectItem>
                        <SelectItem value="فكر وفلسفة">فكر وفلسفة</SelectItem>
                        <SelectItem value="علوم وتكنولوجيا">علوم وتكنولوجيا</SelectItem>
                        <SelectItem value="تاريخ وتراث">تاريخ وتراث</SelectItem>
                        <SelectItem value="إدارة واقتصاد">إدارة واقتصاد</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "نوع النشر *" : "Publish Type *"}</Label>
                    <Select value={editPublishType} onValueChange={(v: PublishType) => setEditPublishType(v)}>
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">{isRtl ? "ورقي + رقمي (مزدوج)" : "Print + Digital"}</SelectItem>
                        <SelectItem value="digital">{isRtl ? "رقمي فقط (E-Book)" : "Digital Only"}</SelectItem>
                        <SelectItem value="print">{isRtl ? "ورقي فقط (مطبوع)" : "Print Only"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Synopsis */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">{isRtl ? "نبذة وملخص المؤلف / الفهرس *" : "Synopsis *"}</Label>
                  <Textarea 
                    value={editSynopsis}
                    onChange={(e) => setEditSynopsis(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl text-xs bg-muted/20 border-border"
                  />
                </div>

                {/* Pages & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "عدد الصفحات التقديري" : "Page Count"}</Label>
                    <Input 
                      type="number"
                      value={editPageCount}
                      onChange={(e) => setEditPageCount(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-muted/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{isRtl ? "اللغة" : "Language"}</Label>
                    <Select value={editLanguage} onValueChange={setEditLanguage}>
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/20">
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

                {/* Replace Files Section */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
                  <span className="text-xs font-black block text-foreground">
                    📎 {isRtl ? "استبدال أو إعادة رفع الملفات:" : "Replace Attached Files:"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Cover Upload */}
                    <div className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-2 text-center">
                      <ImageIcon className="w-6 h-6 text-amber-500 mx-auto" />
                      <span className="text-xs font-bold block">{isRtl ? "تحديث صورة الغلاف" : "Update Cover"}</span>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditCoverFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setEditCoverImageUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] h-8 rounded-lg cursor-pointer bg-muted/10"
                      />
                      {(editCoverImageUrl || editCoverFileName) && (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-bold truncate">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{editCoverFileName || (isRtl ? "غلاف معتمد ومحفوظ" : "Cover Loaded")}</span>
                        </div>
                      )}
                    </div>

                    {/* Manuscript File Upload */}
                    <div className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-2 text-center">
                      <FileText className="w-6 h-6 text-blue-500 mx-auto" />
                      <span className="text-xs font-bold block">{isRtl ? "استبدال ملف الكتاب (PDF / Word)" : "Update Manuscript (PDF / Word)"}</span>
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditManuscriptFileName(file.name);
                            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                            setEditManuscriptFileSize(`${sizeMB} MB`);
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setEditManuscriptFileUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] h-8 rounded-lg cursor-pointer bg-muted/10"
                      />
                      {editManuscriptFileName && (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-bold truncate">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{editManuscriptFileName} ({editManuscriptFileSize})</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditSubmissionModal(false)}
                    className="rounded-xl text-xs font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={savingEditSubmission}
                    className="rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-2"
                  >
                    {savingEditSubmission ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isRtl ? "تعديل المرفقات وإعادة الإرسال ➔" : "Update Attachments & Resubmit ➔"}</span>
                  </Button>
                </DialogFooter>

              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 👤 نافذة عرض وتفاصيل البيانات الشخصية والملف الأكاديمي للمؤلف */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 space-y-5" dir={dir}>
          <DialogHeader className="text-start space-y-1.5">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5 text-foreground">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center font-black shadow-md">
                <User className="w-5 h-5" />
              </div>
              <span>{isRtl ? "البيانات الشخصية والملف الأكاديمي للمؤلف" : "Author Academic & Personal Profile"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isRtl 
                ? "سجل بيانات الهوية، الرتبة العلمية، كود المؤلف المعتمد، وحسابات سداد مستحقات النشر والمبيعات."
                : "Official academic identity, accreditation status, author code, and payout details."}
            </DialogDescription>
          </DialogHeader>

          {/* Profile Hero Block */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-amber-500/20 shrink-0 overflow-hidden border-2 border-white/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={authorProfile.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>✍️</span>
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg sm:text-xl font-black text-foreground">{authorProfile.fullName}</h3>
                <Badge className="bg-amber-500 text-white font-mono font-bold text-xs px-2.5 py-0.5 shadow-xs">
                  {isRtl ? "كود المؤلف:" : "Code:"} {authorProfile.authorCode}
                </Badge>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isRtl ? "حساب معتمد وموثق رسمياً" : "Verified Author"}</span>
                </Badge>
              </div>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                {authorProfile.academicTitleLabel} • {authorProfile.specialization}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{authorProfile.institution || (isRtl ? "جامعة المنوفية" : "University")}</span>
                <span>•</span>
                <Stamp className="w-3.5 h-3.5 text-rose-500" />
                <span>{isRtl ? "الناشر: دار عبيد للنشر والتوزيع" : "Publisher: Dar Obeid"}</span>
              </p>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <span>📧</span>
                <span>{isRtl ? "البريد الإلكتروني المعتمد" : "Email"}</span>
              </span>
              <p className="text-xs font-black text-foreground font-mono">{authorProfile.email}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <span>📱</span>
                <span>{isRtl ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}</span>
              </span>
              <p className="text-xs font-black text-foreground font-mono">{authorProfile.phone}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <span>🎓</span>
                <span>{isRtl ? "الرتبة والتخصص الأكاديمي" : "Title & Specialization"}</span>
              </span>
              <p className="text-xs font-black text-foreground">{authorProfile.academicTitleLabel} - {authorProfile.specialization}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <span>🗓️</span>
                <span>{isRtl ? "تاريخ تسجيل الحساب" : "Registration Date"}</span>
              </span>
              <p className="text-xs font-black text-foreground font-mono">{authorProfile.joinedDate}</p>
            </div>
          </div>

          {/* Bio / النبذة الأكاديمية */}
          {authorProfile.bio && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-1.5 text-start">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <span>✍️</span>
                <span>{isRtl ? "النبذة التعريفية والسيرة الأكاديمية:" : "Academic Biography:"}</span>
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {authorProfile.bio}
              </p>
            </div>
          )}

          {/* Verification & Documents Status */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-start">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "حالة المستندات والتحقق الرسمي:" : "Document Verification Status:"}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-foreground">
                  {isRtl ? "بطاقة الهوية الوطنية: معتمدة ومطابقة" : "National ID: Verified"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-background/80 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-foreground">
                  {isRtl ? "المؤهلات الأكاديمية: مدققة رسمياً" : "Credentials: Validated"}
                </span>
              </div>
            </div>
          </div>

          {/* Bank & Payout Info */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2 text-start">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? "بيانات التحويل وسحب المستحقات:" : "Payout & Banking Details:"}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">{isRtl ? "اسم المستفيد البنكي" : "Account Holder"}</span>
                <span className="font-bold text-foreground">{authorProfile.bankDetails?.accountHolder || authorProfile.fullName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">{isRtl ? "البنك / المحفظة" : "Bank / Wallet"}</span>
                <span className="font-bold text-foreground">{authorProfile.bankDetails?.bankName || "البنك الأهلي المصري"}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowProfileModal(false);
                setPasswordModalOpen(true);
              }}
              className="rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isRtl ? "تغيير كلمة المرور" : "Change Password"}</span>
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowProfileModal(false)}
              className="rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground px-5"
            >
              {isRtl ? "إغلاق النافذة" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Review and Digitally Sign Publishing Contract ── */}
      <Dialog open={showContractReviewModal} onOpenChange={setShowContractReviewModal}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
          {selectedContractForReview && (
            <form onSubmit={handleSignContractSubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <DialogTitle className="text-base font-black flex items-center gap-2 text-foreground">
                    <FileSignature className="w-5 h-5 text-indigo-600" />
                    <span>{isRtl ? `عقد طبع ونشر وتوزيع مصنف فكري: ${selectedContractForReview.contractNumber}` : `Publishing Agreement: ${selectedContractForReview.contractNumber}`}</span>
                  </DialogTitle>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-mono text-xs font-bold">
                    {selectedContractForReview.contractNumber}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? "يرجى قراءة بنود العقد الرسمي المعتمد من دار عبيد للنشر والتوزيع والموافقة عليها والتوقيع رقمياً."
                    : "Please read the official agreement terms and sign digitally."}
                </DialogDescription>
              </DialogHeader>

              {/* Parties and Subject Information */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "الطرف الأول (الناشر):" : "Party 1 (Publisher):"}</span>
                    <span className="font-black text-foreground">دار عبيد للنشر والتوزيع (ش.ذ.م.م)</span>
                    <span className="text-[10px] text-muted-foreground block">سجل تجاري 104928 • القاهرة، مصر</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "الطرف الثاني (المؤلف):" : "Party 2 (Author):"}</span>
                    <span className="font-black text-foreground">{selectedContractForReview.authorName}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">الكود: {selectedContractForReview.authorCode}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold">{isRtl ? "المصنف الفكري موضوع العقد:" : "Work Title:"}</span>
                  <span className="font-black text-sm text-indigo-600 block">"{selectedContractForReview.bookTitle}"</span>
                  <span className="text-[11px] text-muted-foreground">التصنيف الأكاديمي: {selectedContractForReview.category}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-card border border-border/60 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{isRtl ? "عائد الرقمي E-Book" : "Digital"}</span>
                    <span className="font-black text-indigo-600">{selectedContractForReview.digitalRoyaltyRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{isRtl ? "عائد المطبوع الورقي" : "Print"}</span>
                    <span className="font-black text-amber-600">{selectedContractForReview.printRoyaltyRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{isRtl ? "مدة العقد" : "Duration"}</span>
                    <span className="font-black text-foreground">{selectedContractForReview.rightsDurationYears} {isRtl ? "سنوات" : "Years"}</span>
                  </div>
                </div>
              </div>

              {/* Full Legal Clauses Reader */}
              <div className="p-4 rounded-2xl bg-background border border-border/80 max-h-56 overflow-y-auto space-y-3 text-xs leading-relaxed text-muted-foreground font-medium">
                <div>
                  <h4 className="font-black text-foreground text-xs mb-1">
                    {isRtl ? "البند الأول (حقوق النشر والتوزيع الحصري):" : "Clause 1 (Exclusive Rights):"}
                  </h4>
                  <p>
                    {isRtl 
                      ? `يمنح الطرف الثاني الطرف الأول الحق الحصري في طباعة ونشر وترجمة وتوزيع المصنف ورقياً وإلكترونياً في جميع أنحاء العالم لمدة (${selectedContractForReview.rightsDurationYears} سنوات) قابلة للتجديد التلقائي لمدد مماثلة.`
                      : "Author grants publisher exclusive distribution rights."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-foreground text-xs mb-1">
                    {isRtl ? "البند الثاني (عوائد المؤلف ونسب الأرباح):" : "Clause 2 (Royalties):"}
                  </h4>
                  <p>
                    {isRtl 
                      ? `يستحق الطرف الثاني نسبة عوائد قدرها (${selectedContractForReview.digitalRoyaltyRate}%) من سعر بيع النسخ الرقمية، ونسبة قدرها (${selectedContractForReview.printRoyaltyRate}%) من سعر بيع النسخ الورقية. وتضاف الأرباح لمحفظة المؤلف مباشرة وفورياً مع كل عملية شراء.`
                      : "Author earns royalties instantly upon completed orders."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-foreground text-xs mb-1">
                    {isRtl ? "البند الثالث (التزامات دار النشر):" : "Clause 3 (Publisher Duties):"}
                  </h4>
                  <p>
                    {isRtl 
                      ? "تلتزم دار عبيد بالتدقيق اللغوي الأكاديمي، تنسيق الكتاب، إخراج الغلاف، استخراج الترقيم الدولي (ISBN)، الإيداع القانوني، وإدارة الحملات التسويقية."
                      : "Publisher is responsible for editing, design, ISBN, and marketing."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-foreground text-xs mb-1">
                    {isRtl ? "البند الرابع (الملكية الفكرية والأصالة العلمية):" : "Clause 4 (IP & Authorship):"}
                  </h4>
                  <p>
                    {isRtl 
                      ? "يقر الطرف الثاني بأنه صاحب الحق الفكري الحصري والوحيد للمصنف، وأنه عمل أصيل لا يتضمن أي انتهاك لحقوق الغير، ويتحمل كامل المسؤولية الأدبية والقانونية."
                      : "Author warrants that the work is original."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-foreground text-xs mb-1">
                    {isRtl ? "البند الخامس (الاعتماد الرقمي وحجية العقد):" : "Clause 5 (Digital Validity):"}
                  </h4>
                  <p>
                    {isRtl 
                      ? "يُعد التوقيع الرقمي للمؤلف عبر حسابه المعتمد في منصة UNIGATES إقراراً صريحاً وموافقة نهائية وملزمة ونافذة قانوناً لكافة بنود هذا العقد، ويحق لكلا الطرفين تحميل النسخة الرسمية فور الاعتماد."
                      : "Digital signature is legally binding."}
                  </p>
                </div>
              </div>

              {/* Publisher Seal & Signature Box */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center shrink-0">
                    📜
                  </span>
                  <div>
                    <span className="font-black text-emerald-800 dark:text-emerald-300 block">
                      {isRtl ? "اعتماد وخاتم دار عبيد للنشر والتوزيع (مفعل)" : "Publisher Seal Verified"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedContractForReview.adminSignature.signedByName} • {selectedContractForReview.adminSignature.sealNumber}
                    </span>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  {isRtl ? "موقع ومختوم ✓" : "Sealed"}
                </Badge>
              </div>

              {/* Author Signature & Declarations */}
              <div className="space-y-3 p-4 rounded-2xl bg-card border-2 border-indigo-500/40 text-xs">
                <h4 className="font-black text-foreground flex items-center gap-1.5 text-xs">
                  <span>✍️</span>
                  <span>{isRtl ? "إقرار واعتماد التوقيع الرقمي للمؤلف:" : "Author Digital Signature:"}</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Checkbox 
                      id="contract-agree-1" 
                      checked={authorAgreedTerms1} 
                      onCheckedChange={(c) => setAuthorAgreedTerms1(Boolean(c))}
                      className="mt-0.5 rounded-md"
                    />
                    <label htmlFor="contract-agree-1" className="cursor-pointer text-muted-foreground leading-relaxed select-none font-semibold">
                      {isRtl 
                        ? "أقر بأنني صاحب المصنف الأصلي وأوافق بالكامل على كافة بنود النشر والتوزيع ونسب الأرباح الواردة في هذا العقد."
                        : "I confirm authorship and agree to all terms and royalty percentages."}
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox 
                      id="contract-agree-2" 
                      checked={authorAgreedTerms2} 
                      onCheckedChange={(c) => setAuthorAgreedTerms2(Boolean(c))}
                      className="mt-0.5 rounded-md"
                    />
                    <label htmlFor="contract-agree-2" className="cursor-pointer text-muted-foreground leading-relaxed select-none font-semibold">
                      {isRtl 
                        ? "أوافق على اعتماد توقيعي الرقمي الصادر من حسابي الموثق كإقرار نهائي وملزم قانوناً بموجب لوائح النشر المعتمدة."
                        : "I agree that my digital signature constitutes a binding agreement."}
                    </label>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="font-bold text-foreground">{isRtl ? "الاسم الكامل للاعتماد والتوقيع الرقمي: *" : "Full Legal Name: *"}</Label>
                  <Input 
                    value={authorSignatureInput}
                    onChange={(e) => setAuthorSignatureInput(e.target.value)}
                    required
                    placeholder={authorProfile.fullName}
                    className="h-10 rounded-xl text-xs font-bold border-indigo-500/30"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    {isRtl ? `سيتم تسجيل التوقيع وتاريخ اليوم (${new Date().toLocaleDateString("ar-EG")}) والرقم المرجعي على النسخة الرسمية.` : "Signature stamp will be applied."}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowContractReviewModal(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={!authorAgreedTerms1 || !authorAgreedTerms2 || !authorSignatureInput.trim() || signingContract}
                  className="rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 gap-2 shadow-md cursor-pointer"
                >
                  {signingContract ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جارٍ التوثيق الرقمي..." : "Signing..."}</span>
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4" />
                      <span>{isRtl ? "أوافق وأوقع رقمياً على العقد ➔" : "Sign & Accept Contract"}</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Author View Official Contract Modal ── */}
      <Dialog open={showContractViewModal} onOpenChange={setShowContractViewModal}>
        <DialogContent className="max-w-3xl rounded-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
          {selectedContractForView && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <DialogTitle className="text-base font-black flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-600" />
                    <span>{isRtl ? `معاينة العقد الرسمي: ${selectedContractForView.contractNumber}` : `Contract ${selectedContractForView.contractNumber}`}</span>
                  </DialogTitle>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold text-xs">
                    {isRtl ? "عقد معتمد وموقع رسمياً ✅" : "Signed"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl ? "النسخة الرسمية المعتمدة والمختومة من دار عبيد للنشر والتوزيع ومنصة UNIGATES." : "Official agreement document."}
                </DialogDescription>
              </DialogHeader>

              {/* High-Resolution SVG Contract Preview */}
              <div className="rounded-2xl border-2 border-border/80 p-2 bg-muted/20 overflow-hidden shadow-inner flex justify-center">
                <img 
                  src={generateSampleContractSvg(selectedContractForView)} 
                  alt="Official Contract" 
                  className="w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-border/60 bg-white"
                />
              </div>

              <DialogFooter className="gap-2 pt-2 flex items-center justify-between flex-wrap">
                <Button variant="outline" onClick={() => setShowContractViewModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePrintAuthorContract(selectedContractForView)}
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isRtl ? "طباعة العقد" : "Print"}</span>
                  </Button>
                  <Button
                    onClick={() => handleDownloadAuthorContract(selectedContractForView)}
                    className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تحميل النسخة المعتمدة (SVG)" : "Download Copy"}</span>
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NasherDashboard;
