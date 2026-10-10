import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage, ALL_SUPPORTED_LANGUAGES, type Language } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  ArrowLeft,
  Bell,
  BookOpen,
  Clock,
  Edit3,
  MessageSquare,
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PenTool,
  ExternalLink,
  Info,
  Eye,
  Download,
  Layers,
  Globe,
  Sun,
  Moon,
  SunMoon,
  Monitor,
  LogOut,
  Check,
  Search,
  Filter,
  FileCheck,
  Calendar,
  Stamp,
  User,
  CreditCard,
  TrendingUp,
  Home
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { 
  NashrDataStore, 
  NashrSubmission, 
  NashrAuthorProfile, 
  NashrMessage, 
  NashrInvoice 
} from "@/services/nashrDataStore";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const NasherNewNotesPage = () => {
  const navigate = useNavigate();
  const { dir, language, setLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [authorProfile, setAuthorProfile] = useState<NashrAuthorProfile>(() => NashrDataStore.getAuthorProfile());
  const [avatarUrl, setAvatarUrl] = useState<string>(authorProfile.avatarUrl || "");
  const [submissions, setSubmissions] = useState<NashrSubmission[]>(() => NashrDataStore.getSubmissions());
  const [messages, setMessages] = useState<NashrMessage[]>(() => NashrDataStore.getMessages());
  const [invoices, setInvoices] = useState<NashrInvoice[]>(() => NashrDataStore.getInvoices());

  // Filter & Search states
  const [filterType, setFilterType] = useState<"all" | "manuscripts" | "admin_messages" | "action_needed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuLanguageOpen, setIsMenuLanguageOpen] = useState(false);
  const [isMenuThemeOpen, setIsMenuThemeOpen] = useState(false);

  // Edit Submission Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSub, setEditingSub] = useState<NashrSubmission | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editPageCount, setEditPageCount] = useState<number | string>(150);
  const [editCoverFileName, setEditCoverFileName] = useState("");
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [editManuscriptFileName, setEditManuscriptFileName] = useState("");
  const [editManuscriptFileUrl, setEditManuscriptFileUrl] = useState("");
  const [authorNoteReply, setAuthorNoteReply] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const refreshData = () => {
    const fresh = NashrDataStore.getAuthorProfile();
    setAuthorProfile(fresh);
    NashrDataStore.resolveAuthorAvatar(fresh).then((res) => {
      if (res) setAvatarUrl(res);
    });
    setSubmissions(NashrDataStore.getSubmissions());
    setMessages(NashrDataStore.getMessages());
    setInvoices(NashrDataStore.getInvoices());
  };

  useEffect(() => {
    refreshData();
    NashrDataStore.resolveAuthorAvatar(authorProfile).then((res) => {
      if (res) setAvatarUrl(res);
    });
    document.title = isRtl ? "ملاحظات جديدة | لوحة تحكم المؤلف - منصة نشر UNIGATES" : "New Review Notes | Author Dashboard - UNIGATES";
  }, [isRtl]);

  // Filter submissions that have active editorial feedback
  const feedbackSubmissions = submissions.filter((s) => Boolean(s.adminFeedback));
  // Messages from admin
  const adminMessages = messages.filter((m) => m.sender === "admin");
  // Invoices with admin notices
  const invoiceNotices = invoices.filter((inv) => Boolean(inv.adminNotes || inv.rejectionReason));

  // Combined notes filtered by search and filter type
  const filteredFeedbackSubmissions = feedbackSubmissions.filter((sub) => {
    if (filterType === "admin_messages") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sub.title?.toLowerCase().includes(q);
      const matchFeedback = sub.adminFeedback?.toLowerCase().includes(q);
      const matchCat = sub.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchFeedback && !matchCat) return false;
    }
    return true;
  });

  const filteredAdminMessages = adminMessages.filter((msg) => {
    if (filterType === "manuscripts") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = msg.text?.toLowerCase().includes(q);
      const matchSender = msg.senderName?.toLowerCase().includes(q);
      if (!matchText && !matchSender) return false;
    }
    return true;
  });

  // Open Edit Modal for a specific submission
  const handleOpenEdit = (sub: NashrSubmission) => {
    setEditingSub(sub);
    setEditTitle(sub.title || "");
    setEditCategory(sub.category || "مراجع أكاديمية");
    setEditSynopsis(sub.synopsis || "");
    setEditPageCount(sub.pageCount || 150);
    setEditCoverFileName(sub.coverImageName || "");
    setEditCoverImageUrl(sub.coverImageUrl || (typeof sub.coverImage === "string" ? sub.coverImage : "") || "");
    setEditManuscriptFileName(sub.manuscriptFile?.name || "");
    setEditManuscriptFileUrl(sub.manuscriptFile?.url || "");
    setAuthorNoteReply("");
    setShowEditModal(true);
  };

  // Save changes and resubmit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    if (!editTitle.trim() || !editSynopsis.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Details",
        description: isRtl ? "يرجى كتابة عنوان المؤلف والنبذة التعريفية." : "Please fill in title and synopsis.",
        variant: "destructive"
      });
      return;
    }

    setSavingEdit(true);
    setTimeout(() => {
      // If author added a reply, send it to the chat as well
      if (authorNoteReply.trim()) {
        NashrDataStore.addMessage({
          sender: "author",
          senderName: authorProfile.fullName,
          text: `[بخصوص ملاحظة ${editingSub.title}]: ${authorNoteReply.trim()}`,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          read: true
        });
      }

      NashrDataStore.updateSubmission(editingSub.id, {
        title: editTitle.trim(),
        category: editCategory,
        synopsis: editSynopsis.trim(),
        pageCount: Number(editPageCount) || 150,
        coverImage: editCoverImageUrl || editCoverFileName || editingSub.coverImage,
        coverImageUrl: editCoverImageUrl || editingSub.coverImageUrl,
        coverImageName: editCoverFileName || editingSub.coverImageName,
        manuscriptFile: editManuscriptFileName ? {
          name: editManuscriptFileName,
          size: editingSub.manuscriptFile?.size || "4.5 MB",
          type: editManuscriptFileName.endsWith(".docx") || editManuscriptFileName.endsWith(".doc") ? "WORD" : "PDF",
          url: editManuscriptFileUrl || editingSub.manuscriptFile?.url
        } : editingSub.manuscriptFile,
        status: "pending_review",
        adminFeedback: editingSub.adminFeedback
      });

      refreshData();
      setSavingEdit(false);
      setShowEditModal(false);
      setEditingSub(null);

      toast({
        title: isRtl ? "🎉 تم تحديث المخطوطة وإعادة إرسالها بنجاح!" : "Resubmitted Successfully!",
        description: isRtl
          ? "تم إرسال الملفات والبيانات المحدثة للجنة التحكيم بدار عبيد للاعتماد."
          : "Updated files sent to Dar Obeid editors."
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      
      {/* Top Navbar */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        
        {/* Right side in RTL: UNIGATES Branding & Dar Obeid Notes subtitle */}
        <div className="flex items-center gap-3">
          <Link to="/nashr/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-all">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                  UNIGATES
                </span>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] font-black px-1.5 py-0">
                  {isRtl ? "منصة نشر" : "Nashr"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-extrabold truncate max-w-[200px] sm:max-w-none transition-all duration-300">
                {isRtl ? "لوحة تحكم المؤلف • ملاحظات جديدة" : "Author Dashboard • New Review Notes"}
              </p>
            </div>
          </Link>
        </div>

        {/* Left side in RTL: Studio Hamburger Dropdown Menu + Language Toggle + Theme Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Studio Full Dropdown Navigation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs gap-2 border-none shadow-md shadow-amber-500/20 cursor-pointer hover:scale-105 transition-all"
              >
                <div className="flex flex-col gap-1 items-center justify-center">
                  <span className="w-4 h-0.5 bg-white rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white rounded-full"></span>
                </div>
                <span className="hidden sm:inline">{isRtl ? "قائمة الاستوديو" : "Studio Menu"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isRtl ? "start" : "end"} 
              className="w-80 sm:w-88 max-h-[85vh] overflow-y-auto rounded-3xl p-2.5 shadow-2xl border-2 border-border/80 bg-popover/95 backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95"
              dir={dir}
            >
              {/* Profile Card Header */}
              <DropdownMenuLabel className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl border border-amber-500/20 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md overflow-hidden border border-white/20">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={authorProfile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>✍️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-xs font-black text-foreground truncate">
                      {authorProfile.fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold truncate">
                      {authorProfile.academicTitleLabel} • {authorProfile.specialization}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 shrink-0">
                    {authorProfile.authorCode}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              {/* 1. الصفحة الرئيسية */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=home")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الصفحة الرئيسية" : "Main Dashboard"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {isRtl ? "الرئيسية 🏠" : "Home"}
                </Badge>
              </DropdownMenuItem>

              {/* 2. رفع مؤلفات جديدة */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=submit")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "رفع مؤلفات جديدة" : "New Submissions"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {submissions.length} {isRtl ? "مؤلف" : "Works"}
                </Badge>
              </DropdownMenuItem>

              {/* 3. المؤلفات المنشورة */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=published")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-blue-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "المؤلفات المنشورة" : "Published Works"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {submissions.filter(s => s.status === "published").length} {isRtl ? "منشور" : "Live"}
                </Badge>
              </DropdownMenuItem>

              {/* 4. الفواتير وطرق الدفع */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=payments")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الفواتير وطرق الدفع" : "Invoices & Payments"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {isRtl ? "سداد 💳" : "Pay"}
                </Badge>
              </DropdownMenuItem>

              {/* 5. التواصل وملاحظات التدقيق */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=chat")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "التواصل وملاحظات التدقيق" : "Review Notes & Chat"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {isRtl ? "محادثة 💬" : "Chat"}
                </Badge>
              </DropdownMenuItem>

              {/* 6. ملاحظات جديدة (الصفحة الحالية) */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/notes")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black border border-rose-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <span>{isRtl ? "ملاحظات جديدة" : "New Review Notes"}</span>
                </div>
                <Badge className="bg-rose-500 text-white text-[10px] font-black">
                  {feedbackSubmissions.length} {isRtl ? "واردة" : "Active"}
                </Badge>
              </DropdownMenuItem>

              {/* 7. مبيعات الكتب والأرباح */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=sales")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-teal-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "مبيعات الكتب والأرباح" : "Sales & Royalties"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {isRtl ? "أرباح 📈" : "Sales"}
                </Badge>
              </DropdownMenuItem>

              {/* 8. البيانات الشخصية وكلمة المرور */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/profile")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "البيانات الشخصية وكلمة المرور" : "Profile & Security"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-600">
                  {isRtl ? "عرض وإدارة 👤" : "Manage"}
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

          {/* Language Selector */}
          <LanguageSelectorDropdown className="h-10 px-3 text-xs bg-card/90 hover:bg-muted border-2 border-border/80 rounded-2xl font-black text-foreground tracking-wide shadow-xs" />

          {/* Theme Toggle (Dark / Light / System) */}
          <ThemeToggle className="h-10 w-10 p-0 rounded-2xl bg-card/90 hover:bg-muted border-2 border-border/80 shadow-xs" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-8 animate-fade-in">
        
        {/* Header Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? "مركز التواصل الأكاديمي والتحكيم الفوري" : "Academic Editorial Board & Directives"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {isRtl ? "صندوق ملاحظات التدقيق والتوجيهات الواردة من الإدارة" : "Editorial Notes & Administrative Directives"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-2xl leading-relaxed">
              {isRtl
                ? "هنا تجد كافة الملاحظات الفنية، التعديلات المطلوبة على المخطوطة، وتوجيهات لجان التحكيم وإدارة دار عبيد. يمكنك مراجعة الملاحظات، استبدال المرفقات، والرد الفوري عليها للاعتماد النهائي."
                : "Review all editorial notes, formatting directives, and official administrative notices directly from Dar Obeid publishers. Update files and reply instantly."}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => {
                refreshData();
                toast({
                  title: isRtl ? "تم تحديث الملاحظات 🔄" : "Notes Refreshed 🔄",
                  description: isRtl ? "تمت مزامنة كافة الملاحظات والتوجيهات من خوادم دار عبيد." : "Synced all directives from publisher servers."
                });
              }}
              variant="outline"
              className="h-11 px-4 rounded-2xl border-2 border-border/80 bg-card hover:bg-muted font-black text-xs gap-1.5 shadow-xs cursor-pointer hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? "تحديث" : "Refresh"}</span>
            </Button>
            <Link to="/nashr/dashboard?tab=chat">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-2xl border-2 border-border/80 bg-card hover:bg-muted font-black text-xs gap-2 shadow-xs cursor-pointer hover:scale-105 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span>{isRtl ? "محادثة الإدارة" : "Direct Chat"}</span>
              </Button>
            </Link>
            <Link to="/nashr/dashboard?tab=submit">
              <Button
                className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs gap-2 shadow-md cursor-pointer hover:scale-105 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isRtl ? "رفع مؤلف جديد" : "New Manuscript"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border-2 border-amber-500/30 shadow-md text-start space-y-1">
            <span className="text-[11px] font-black text-muted-foreground block">
              {isRtl ? "إجمالي التوجيهات والملاحظات" : "Total Directives"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 block">
              {feedbackSubmissions.length + adminMessages.length}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground block">
              {isRtl ? "ملاحظات تحكيم ورسائل إدارة" : "Editorial & Admin"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border-2 border-rose-500/30 shadow-md text-start space-y-1">
            <span className="text-[11px] font-black text-muted-foreground block">
              {isRtl ? "ملاحظات تتطلب إجراء" : "Action Required"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 block">
              {feedbackSubmissions.length}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground block">
              {isRtl ? "تعديل مرفقات أو بيانات" : "Pending revision"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border-2 border-purple-500/30 shadow-md text-start space-y-1">
            <span className="text-[11px] font-black text-muted-foreground block">
              {isRtl ? "توجيهات إدارية رسمية" : "Admin Messages"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 block">
              {adminMessages.length}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground block">
              {isRtl ? "رسائل توجيه من هيئة النشر" : "Official Directives"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border-2 border-emerald-500/30 shadow-md text-start space-y-1">
            <span className="text-[11px] font-black text-muted-foreground block">
              {isRtl ? "متوسط سرعة الاستجابة" : "Avg Response"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
              24 {isRtl ? "ساعة" : "hrs"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground block">
              {isRtl ? "تدقيق أكاديمي فوري" : "Fast academic audit"}
            </span>
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3 rounded-2xl bg-card border-2 border-border/80 shadow-md">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all ${
                filterType === "all"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "border-border/80 hover:bg-muted text-foreground"
              }`}
            >
              <span>{isRtl ? "جميع التوجيهات" : "All Directives"}</span>
              <Badge variant="secondary" className="text-[10px] font-black px-1.5 py-0">
                {feedbackSubmissions.length + adminMessages.length}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filterType === "manuscripts" ? "default" : "outline"}
              onClick={() => setFilterType("manuscripts")}
              className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all ${
                filterType === "manuscripts"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "border-border/80 hover:bg-muted text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isRtl ? "ملاحظات المخطوطات والتحكيم" : "Manuscript Notes"}</span>
              <Badge variant="secondary" className="text-[10px] font-black px-1.5 py-0">
                {feedbackSubmissions.length}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filterType === "admin_messages" ? "default" : "outline"}
              onClick={() => setFilterType("admin_messages")}
              className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all ${
                filterType === "admin_messages"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "border-border/80 hover:bg-muted text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isRtl ? "رسائل وتوجيهات الإدارة" : "Admin Messages"}</span>
              <Badge variant="secondary" className="text-[10px] font-black px-1.5 py-0">
                {adminMessages.length}
              </Badge>
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "ابحث في الملاحظات أو عنوان العمل..." : "Search directives or title..."}
              className="h-9 ps-9 pe-3 rounded-xl bg-background border-border text-xs font-bold"
            />
          </div>
        </div>

        {/* Section 1: Manuscript Feedback Directives */}
        {filteredFeedbackSubmissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-start">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl ? `ملاحظات التحكيم على المخطوطات (${filteredFeedbackSubmissions.length})` : `Manuscripts Directives (${filteredFeedbackSubmissions.length})`}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    {isRtl ? "انقر على «تعديل المرفقات وإعادة الإرسال» لحسم الملاحظة فورياً" : "Click Edit & Resubmit to resolve the directive"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {filteredFeedbackSubmissions.map((sub) => (
                <Card
                  key={sub.id}
                  className="border-2 border-amber-500/40 hover:border-amber-500/80 shadow-lg bg-card rounded-3xl overflow-hidden transition-all duration-200"
                >
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-border/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                        📬
                      </div>
                      <div className="space-y-0.5 text-start">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base sm:text-lg font-black text-foreground">
                            {sub.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-bold border-amber-500/40 text-amber-700 dark:text-amber-300">
                            {sub.category}
                          </Badge>
                          <Badge className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 shadow-xs animate-pulse">
                            {isRtl ? "ملاحظة واردة تتطلب تعديلاً 🔥" : "Action Required"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {isRtl ? "تاريخ الإرسال:" : "Submitted:"} {sub.submittedDate} • {sub.publishType === "both" ? "ورقي + رقمي" : sub.publishType === "digital" ? "رقمي فقط" : "ورقي فقط"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link to="/nashr/dashboard?tab=chat">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 px-3 rounded-xl font-black text-xs border-2 border-border/80 hover:bg-muted text-foreground gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                          <span>{isRtl ? "استفسار للإدارة" : "Chat Admin"}</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleOpenEdit(sub)}
                        className="h-10 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-1.5 hover:scale-105 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{isRtl ? "تعديل المرفقات وإعادة الإرسال ✏️" : "Edit & Resubmit"}</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4 text-start">
                    {/* The Direct Quote Box */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-foreground space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-black text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{isRtl ? "نص توجيه وملاحظة هيئة التحكيم والتدقيق (دار عبيد):" : "Dar Obeid Editorial Note:"}</span>
                        </span>
                        <Badge variant="outline" className="text-[10px] font-black border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                          {isRtl ? "توجيه رسمي معتمد" : "Official Directive"}
                        </Badge>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-card/90 border border-amber-500/20 shadow-xs">
                        <p className="text-sm sm:text-base font-bold leading-relaxed text-foreground">
                          💬 "{sub.adminFeedback}"
                        </p>
                      </div>

                      <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {isRtl
                            ? "المطلوب: مراجعة الملاحظة أعلاه، وتعديل المخطوطة أو الغلاف أو البيانات المطلوبة، والضغط على زر «تعديل المرفقات وإعادة الإرسال» لإتمام المراجعة."
                            : "Action: Review note, update manuscript or cover, and click 'Edit & Resubmit'."}
                        </span>
                      </div>
                    </div>

                    {/* Manuscript Meta Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "الملف المرفق الحالي" : "Current Manuscript"}</span>
                        <span className="font-black text-foreground truncate block">{sub.manuscriptFile?.name || "المخطوطة.pdf"}</span>
                        <span className="text-[10px] text-muted-foreground">{sub.manuscriptFile?.size || "4.5 MB"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "عدد الصفحات المقدر" : "Estimated Pages"}</span>
                        <span className="font-black text-foreground">{sub.pageCount || 150} {isRtl ? "صفحة" : "pages"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold block">{isRtl ? "حالة التعاقد" : "Publishing Agreement"}</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {sub.contractAccepted ? (isRtl ? "موقع إلكترونياً ✅" : "Signed") : (isRtl ? "بانتظار استكمال الاعتماد" : "Pending Sign")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Direct Administrative Directives & Chat Messages */}
        {filteredAdminMessages.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-start">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center font-black">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl ? `توجيهات ورسائل الإدارة الرسمية (${filteredAdminMessages.length})` : `Official Admin Messages (${filteredAdminMessages.length})`}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    {isRtl ? "رسائل وتوجيهات معتمدة واردة من مسؤولي دار عبيد للنشر" : "Direct publishing messages sent to your account"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredAdminMessages.map((msg) => (
                <Card
                  key={msg.id}
                  className="border-2 border-purple-500/30 hover:border-purple-500/60 shadow-md bg-card rounded-3xl overflow-hidden transition-all duration-200"
                >
                  <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                        🏛️
                      </div>
                      <div className="space-y-0.5 text-start">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm sm:text-base font-black text-foreground">
                            {msg.senderName || (isRtl ? "إدارة النشر والتدقيق الأكاديمي (دار عبيد)" : "Dar Obeid Editorial Board")}
                          </CardTitle>
                          <Badge className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5">
                            {isRtl ? "توجيه إداري 🏛️" : "Official Notice"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{msg.timestamp || (isRtl ? "اليوم" : "Today")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to="/nashr/dashboard?tab=chat">
                        <Button
                          size="sm"
                          className="h-9 px-3.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isRtl ? "فتح المحادثة والرد" : "Reply in Chat"}</span>
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 text-start space-y-3">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 shadow-xs">
                      <p className="text-sm font-bold leading-relaxed text-foreground whitespace-pre-line">
                        {msg.text}
                      </p>
                    </div>

                    {msg.attachmentName && (
                      <div className="inline-flex items-center gap-2 p-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-300">
                        <Paperclip className="w-4 h-4 text-purple-500" />
                        <span>{isRtl ? "مرفق إداري:" : "Attachment:"} {msg.attachmentName}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Empty State */}
        {filteredFeedbackSubmissions.length === 0 && filteredAdminMessages.length === 0 && (
          <Card className="border-2 border-border/80 shadow-lg bg-card rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
              ✨
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isRtl ? "لا توجد ملاحظات أو توجيهات تطابق البحث" : "No Directives Match Your Query"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto">
                {isRtl
                  ? "جميع مؤلفاتك قيد الإجراء أو تم اعتمادها بنجاح دون أي تعديلات مطلوبة. فور إرسال أي توجيه من هيئة التحكيم ستظهر هنا فوراً."
                  : "All your manuscripts are either approved or in regular review pipeline without pending revisions."}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setFilterType("all");
                  setSearchQuery("");
                }}
                className="h-10 px-5 rounded-xl font-black text-xs"
              >
                {isRtl ? "إعادة ضبط الفلاتر" : "Reset Filters"}
              </Button>
              <Link to="/nashr/dashboard">
                <Button className="h-10 px-6 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                  {isRtl ? "العودة للوحة الاستوديو" : "Return to Studio"}
                </Button>
              </Link>
            </div>
          </Card>
        )}

      </main>

      {/* Edit Submission Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-card border-2 border-border/80 shadow-2xl" dir={dir}>
          <DialogHeader className="text-start space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-lg">
                ✏️
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">
                  {isRtl ? "تعديل المرفقات وبيانات المؤلف وإعادة الإرسال" : "Edit & Resubmit Manuscript"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? "عدّل المخطوطة بناءً على توجيهات هيئة التحكيم وسيتم رفعها للاعتماد الفوري."
                    : "Update manuscript and files per editorial feedback."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingSub && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-start">
              
              {/* Feedback reminder */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200">
                <span className="block text-[10px] uppercase font-black text-amber-700 dark:text-amber-400">
                  {isRtl ? "الملاحظة المطلوب تعديلها:" : "Editorial Note to address:"}
                </span>
                💬 "{editingSub.adminFeedback}"
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">{isRtl ? "عنوان المؤلف *" : "Title *"}</Label>
                  <Input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border font-bold text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">{isRtl ? "التخصص *" : "Category *"}</Label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value="مراجع أكاديمية">{isRtl ? "مراجع أكاديمية" : "Academic"}</option>
                    <option value="هندسة الطيران">{isRtl ? "هندسة الطيران" : "Aviation"}</option>
                    <option value="برمجة وذكاء اصطناعي">{isRtl ? "برمجة وذكاء اصطناعي" : "Tech & AI"}</option>
                    <option value="إدارة أعمال">{isRtl ? "إدارة أعمال" : "Business"}</option>
                    <option value="علوم إنسانية">{isRtl ? "علوم إنسانية" : "Humanities"}</option>
                    <option value="مناهج مدرسية">{isRtl ? "مناهج مدرسية" : "K-12"}</option>
                  </select>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-foreground">{isRtl ? "النبذة التعريفية *" : "Synopsis *"}</Label>
                <Textarea 
                  value={editSynopsis}
                  onChange={(e) => setEditSynopsis(e.target.value)}
                  rows={3}
                  className="rounded-xl bg-background border-border font-bold text-xs"
                  required
                />
              </div>

              {/* Manuscript File Replacement */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                <Label className="text-xs font-black text-foreground block">
                  {isRtl ? "استبدال ملف المخطوطة (PDF أو Word)" : "Replace Manuscript File (PDF/DOCX)"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditManuscriptFileName(file.name);
                        setEditManuscriptFileUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="h-10 text-xs rounded-xl bg-background"
                  />
                </div>
                {editManuscriptFileName && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ {isRtl ? "الملف المحدد:" : "Selected:"} {editManuscriptFileName}
                  </p>
                )}
              </div>

              {/* Cover Image Replacement */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                <Label className="text-xs font-black text-foreground block">
                  {isRtl ? "استبدال صورة الغلاف (اختياري)" : "Replace Cover Image (Optional)"}
                </Label>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditCoverFileName(file.name);
                      setEditCoverImageUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="h-10 text-xs rounded-xl bg-background"
                />
                {editCoverFileName && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ {isRtl ? "الغلاف المحدد:" : "Selected Cover:"} {editCoverFileName}
                  </p>
                )}
              </div>

              {/* Author Reply Note to Admin */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <Label className="text-xs font-black text-foreground block">
                  {isRtl ? "ملاحظة أو رد موجه للإدارة وهيئة التحكيم (اختياري)" : "Reply Note to Admin (Optional)"}
                </Label>
                <Textarea 
                  value={authorNoteReply}
                  onChange={(e) => setAuthorNoteReply(e.target.value)}
                  placeholder={isRtl ? "أضف توضيحاً أو رداً على الملاحظة الواردة..." : "Add a clarification or reply..."}
                  rows={2}
                  className="rounded-xl bg-background border-border font-bold text-xs"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="h-11 px-4 rounded-xl font-bold text-xs"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="h-11 px-6 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-1.5"
                >
                  {savingEdit ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{savingEdit ? (isRtl ? "جاري الإرسال..." : "Sending...") : (isRtl ? "حفظ وإعادة الإرسال للتحكيم" : "Save & Resubmit")}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default NasherNewNotesPage;
