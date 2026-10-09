import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight, ArrowLeft, Bell, BookOpen, Clock, Edit3, MessageSquare,
  UploadCloud, FileText, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw,
  Sparkles, Send, Paperclip, ChevronLeft, ChevronRight, PenTool, ExternalLink,
  Info, Eye, Download, Layers
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { NashrDataStore, NashrSubmission, NashrAuthorProfile } from "@/services/nashrDataStore";

const NasherNewNotesPage = () => {
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [authorProfile, setAuthorProfile] = useState<NashrAuthorProfile>(() => NashrDataStore.getAuthorProfile());
  const [submissions, setSubmissions] = useState<NashrSubmission[]>(() => NashrDataStore.getSubmissions());
  const [selectedSubmission, setSelectedSubmission] = useState<NashrSubmission | null>(null);

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
  const [savingEdit, setSavingEdit] = useState(false);

  const refreshData = () => {
    setAuthorProfile(NashrDataStore.getAuthorProfile());
    setSubmissions(NashrDataStore.getSubmissions());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter submissions that have active editorial feedback
  const feedbackSubmissions = submissions.filter((s) => Boolean(s.adminFeedback));

  // Open Edit Modal for a specific submission
  const handleOpenEdit = (sub: NashrSubmission) => {
    setEditingSub(sub);
    setEditTitle(sub.title || "");
    setEditCategory(sub.category || "أكاديمي");
    setEditSynopsis(sub.synopsis || "");
    setEditPageCount(sub.pageCount || 150);
    setEditCoverFileName(sub.coverImageName || "");
    setEditCoverImageUrl(sub.coverImageUrl || (typeof sub.coverImage === "string" ? sub.coverImage : "") || "");
    setEditManuscriptFileName(sub.manuscriptFile?.name || "");
    setEditManuscriptFileUrl(sub.manuscriptFile?.url || "");
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
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/nashr/dashboard" className="flex items-center gap-2 group">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3.5 rounded-2xl border-2 border-border/80 bg-card hover:bg-muted font-black text-xs gap-2 shadow-xs group-hover:border-amber-500/50 transition-all"
            >
              <BackIcon className="w-4 h-4 text-amber-500 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform" />
              <span>{isRtl ? "العودة للوحة المؤلف" : "Back to Dashboard"}</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center font-black shadow-sm">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-foreground">
                  {isRtl ? "ملاحظات جديدة وتوجيهات التحكيم" : "Editorial Review Notes"}
                </span>
                <Badge className="bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] font-black px-2 py-0.2 shadow-xs">
                  {feedbackSubmissions.length > 0 ? (isRtl ? `${feedbackSubmissions.length} ملاحظات واردة` : `${feedbackSubmissions.length} Active`) : (isRtl ? "محدثة" : "Updated")}
                </Badge>
              </div>
              <span className="text-[10px] block font-bold text-muted-foreground">
                {isRtl ? "مركز توجيهات دار عبيد وهيئة التدقيق الأكاديمي" : "Dar Obeid Editorial Directives"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-10 w-10 p-0 rounded-2xl bg-card/90 hover:bg-muted border-2 border-border/80 shadow-xs" />
          <LanguageSelectorDropdown className="h-10 px-3 text-xs bg-card/90 hover:bg-muted border-2 border-border/80 rounded-2xl font-black text-foreground shadow-xs" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-6">
        
        {/* Header Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? "التواصل الأكاديمي والتحكيم الفوري" : "Academic Editorial Board"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {isRtl ? "صندوق ملاحظات التدقيق والتوجيهات الواردة" : "Editorial Notes & Review Directives"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-2xl leading-relaxed">
              {isRtl
                ? "هنا تجد كافة الملاحظات الفنية، التعديلات المطلوبة على المخطوطة، وتوجيهات لجان التحكيم بدار عبيد. يمكنك تعديل المرفقات وإعادة إرسالها مباشرة من هذا المكان للاعتماد النهائي."
                : "Review all editorial feedback, formatting requirements, and review notes directly from Dar Obeid publishers. Update and resubmit your manuscripts with ease."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link to="/nashr/dashboard?tab=chat">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-2xl border-2 border-border/80 bg-card hover:bg-muted font-black text-xs gap-2 shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span>{isRtl ? "المحادثة مع الإدارة" : "Direct Chat"}</span>
              </Button>
            </Link>
            <Link to="/nashr/dashboard?tab=submit">
              <Button
                className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs gap-2 shadow-md"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isRtl ? "رفع مؤلف جديد" : "New Manuscript"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Notes Content */}
        {feedbackSubmissions.length === 0 ? (
          <Card className="border-2 border-border/80 shadow-md bg-card rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              ✨
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isRtl ? "لا توجد ملاحظات تدقيق معلقة حالياً" : "No Pending Review Notes"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto">
                {isRtl
                  ? "جميع مؤلفاتك قيد الإجراء أو تم اعتمادها بنجاح دون أي تعديلات مطلوبة. فور إرسال أي توجيه من هيئة التحكيم ستظهر هنا فوراً."
                  : "All your manuscripts are either approved or in regular review pipeline without pending revisions."}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/nashr/dashboard">
                <Button className="h-10 px-6 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                  {isRtl ? "العودة للوحة التحكم الرئيسية" : "Return to Dashboard"}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm sm:text-base font-black text-foreground">
                  {isRtl ? `المؤلفات التي وردت عليها ملاحظات تدقيق (${feedbackSubmissions.length})` : `Manuscripts with Feedback (${feedbackSubmissions.length})`}
                </h2>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "انقر على «تعديل المرفقات» لإعادة الإرسال" : "Click Edit to update files"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {feedbackSubmissions.map((sub, idx) => (
                <Card
                  key={sub.id}
                  className="border-2 border-amber-500/40 hover:border-amber-500/70 shadow-lg bg-card rounded-3xl overflow-hidden transition-all duration-200"
                >
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-border/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
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
                          <Badge className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 shadow-xs">
                            {isRtl ? "ملاحظة واردة 🔥" : "Action Required"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {isRtl ? "تاريخ الإرسال:" : "Submitted:"} {sub.submittedDate} • {sub.publishType === "both" ? "ورقي + رقمي" : sub.publishType === "digital" ? "رقمي فقط" : "ورقي فقط"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenEdit(sub)}
                        className="h-10 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md gap-1.5 hover:scale-105 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{isRtl ? "تعديل المرفقات وإعادة الإرسال ✏️" : "Edit & Resubmit"}</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4 text-start">
                    {/* The Direct Quote Box */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-foreground space-y-2 shadow-xs">
                      <div className="flex items-center justify-between text-xs font-black text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{isRtl ? "نص توجيه وملاحظة هيئة التحكيم والتدقيق (دار عبيد):" : "Dar Obeid Editorial Note:"}</span>
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {isRtl ? "توجيه رسمي معتمد" : "Official Editorial Directive"}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-bold leading-relaxed bg-card/80 p-3.5 rounded-xl border border-amber-500/20 text-foreground">
                        💬 "{sub.adminFeedback}"
                      </p>
                      <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {isRtl
                            ? "المطلوب: مراجعة الملاحظة أعلاه، وتعديل المخطوطة أو الغلاف أو البيانات المطلوبة، والضغط على زر «تعديل المرفقات» لإعادة الإرسال."
                            : "Action: Review note, update manuscript or cover, and click 'Edit & Resubmit'."}
                        </span>
                      </div>
                    </div>

                    {/* Manuscript Meta Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
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
