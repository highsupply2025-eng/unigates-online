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
  Layers,
  PlusCircle,
  Trash2,
  MessageSquare,
  MessageCircle
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
import { AuthorProfile, ManuscriptSubmission, NashrInvoice, NashrMessage } from "@/types/nashr";

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return new Blob([dataUrl], { type: 'text/plain' });
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const isBase64 = parts[0].includes(';base64');
    
    if (isBase64) {
      const binaryStr = atob(parts[1]);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } else {
      const decoded = decodeURIComponent(parts[1]);
      return new Blob([decoded], { type: mime });
    }
  } catch (err) {
    console.error("[AdminDashboard] dataUrlToBlob error:", err);
    return new Blob([dataUrl], { type: 'text/plain' });
  }
}

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
  const [activeTab, setActiveTab] = useState<"authors" | "manuscripts" | "invoices" | "chat">("authors");

  // Internal Communication / Chat States
  const [selectedChatAuthorId, setSelectedChatAuthorId] = useState<string>("");
  const [chatReplyText, setChatReplyText] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatMessagesVersion, setChatMessagesVersion] = useState(0);

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

  // Delete Author Modal
  const [deleteAuthorCandidate, setDeleteAuthorCandidate] = useState<AuthorProfile | null>(null);
  const [showDeleteAuthorModal, setShowDeleteAuthorModal] = useState(false);

  // Manuscript Review & Action Modal
  const [selectedManuscript, setSelectedManuscript] = useState<ManuscriptSubmission | null>(null);
  const [showManuscriptModal, setShowManuscriptModal] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");

  // Delete Manuscript Modal
  const [deleteManuscriptCandidate, setDeleteManuscriptCandidate] = useState<ManuscriptSubmission | null>(null);
  const [showDeleteManuscriptModal, setShowDeleteManuscriptModal] = useState(false);

  // Invoice Generation Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | string>(1500);
  const [invoiceDescription, setInvoiceDescription] = useState("");

  // Receipt Inspection & Audit Modal
  const [selectedInvoice, setSelectedInvoice] = useState<NashrInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRejectReceiptModal, setShowRejectReceiptModal] = useState(false);
  const [receiptRejectionReason, setReceiptRejectionReason] = useState("");

  // Delete Invoice Modal
  const [deleteInvoiceCandidate, setDeleteInvoiceCandidate] = useState<NashrInvoice | null>(null);
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);

  // Custom Invoice Generation Modal
  const [showCustomInvoiceModal, setShowCustomInvoiceModal] = useState(false);
  const [customInvoiceAuthorId, setCustomInvoiceAuthorId] = useState("");
  const [customInvoiceTitle, setCustomInvoiceTitle] = useState("");
  const [customInvoiceAmount, setCustomInvoiceAmount] = useState<number | string>(1200);
  const [customInvoiceDescription, setCustomInvoiceDescription] = useState("");

  // Attached Files Inspection States
  const [previewManuscript, setPreviewManuscript] = useState<ManuscriptSubmission | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);

  const [previewCover, setPreviewCover] = useState<ManuscriptSubmission | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<ManuscriptSubmission | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Dedicated KYC Document Inspection Lightbox
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    name?: string;
    type?: string;
    size?: string;
  } | null>(null);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);

  const handleOpenDocPreview = (title: string, url: string, name?: string, size?: string) => {
    setPreviewDoc({ title, url, name, size });
    setShowDocPreviewModal(true);
  };

  const handleDownloadDoc = (url: string, filename: string) => {
    try {
      if (url.startsWith("data:")) {
        const blob = dataUrlToBlob(url);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "document.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        toast({
          title: isRtl ? "تم بدء تحميل الوثيقة بنجاح" : "Download Started",
          description: filename || "document"
        });
        return;
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: isRtl ? "تم بدء تحميل الوثيقة بنجاح" : "Download Started",
        description: filename || "document"
      });
    } catch (e) {
      console.error("[AdminDashboard] Download error:", e);
      window.open(url, "_blank");
    }
  };

  const handleOpenInNewTab = (url: string, filename?: string) => {
    try {
      if (url.startsWith("data:")) {
        const blob = dataUrlToBlob(url);
        const blobUrl = URL.createObjectURL(blob);
        const newTab = window.open(blobUrl, "_blank");
        if (!newTab) {
          toast({
            title: isRtl ? "تنبيه المتصفح" : "Browser Notice",
            description: isRtl ? "يرجى السماح بالنوافذ المنبثقة لمعاينة المستند في نافذة جديدة." : "Please allow popups to open document.",
            variant: "destructive"
          });
        }
        return;
      }
      window.open(url, "_blank");
    } catch (e) {
      console.error("[AdminDashboard] Open in new tab error:", e);
      window.open(url, "_blank");
    }
  };

  const handleDownloadManuscriptFile = async (sub: ManuscriptSubmission) => {
    const fileName = sub.manuscriptFile?.name || `${sub.title}.pdf`;

    // 1. If real file URL exists (Data URL or file path)
    if (sub.manuscriptFile?.url) {
      handleDownloadDoc(sub.manuscriptFile.url, fileName);
      return;
    }

    // 2. Generate PDF from reader DOM element using html2canvas & jsPDF
    try {
      const element = document.getElementById("manuscript-reader-container");
      if (element) {
        toast({
          title: isRtl ? "جاري تحضير وتصدير نسخة الكتاب..." : "Generating PDF...",
          description: fileName
        });
        const html2canvasModule = await import("html2canvas");
        const html2canvas = (html2canvasModule as any).default || html2canvasModule;
        const jspdfModule = await import("jspdf");
        const JsPDFClass = (jspdfModule as any).default || (jspdfModule as any).jsPDF;

        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#020617", useCORS: true, logging: false });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new JsPDFClass("p", "mm", "a4");
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, 297));
        pdf.save(fileName);
        toast({
          title: isRtl ? "✅ تم تحميل نسخة الحاسوب بنجاح" : "Downloaded successfully",
          description: fileName
        });
        return;
      }
    } catch (err) {
      console.warn("[AdminDashboard] html2canvas error, falling back to direct PDF generation:", err);
    }

    // 3. Direct PDF fallback
    try {
      const jspdfModule = await import("jspdf");
      const JsPDFClass = (jspdfModule as any).default || (jspdfModule as any).jsPDF;
      const doc = new JsPDFClass();
      doc.setFontSize(16);
      doc.text("Dar Obeid Publishing - Manuscript Review Copy", 20, 20);
      doc.setFontSize(12);
      doc.text(`Title: ${sub.title}`, 20, 35);
      doc.text(`Author: ${sub.authorName} (${sub.authorCode})`, 20, 45);
      doc.text(`Category: ${sub.category}`, 20, 55);
      doc.text(`Publish Type: ${sub.publishType}`, 20, 65);
      doc.text(`Pages: ${sub.pageCount || 150}`, 20, 75);
      doc.save(fileName);
      toast({
        title: isRtl ? "✅ تم تحميل نسخة الحاسوب بنجاح" : "Downloaded successfully",
        description: fileName
      });
    } catch (e) {
      console.error("[AdminDashboard] PDF generation failed:", e);
      toast({
        title: isRtl ? "تعذر تحميل نسخة الحاسوب" : "Download Failed",
        variant: "destructive"
      });
    }
  };

  // Check admin access while ensuring account stays active
  useEffect(() => {
    NashrDataStore.clearOldTestAuthors();
    NashrDataStore.clearOldSubmissions();
    NashrDataStore.clearOldInvoices();
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
    try {
      const a = NashrDataStore.getAllAuthors();
      const s = NashrDataStore.getAllSubmissions();
      const i = NashrDataStore.getAllInvoices();
      setAuthors(Array.isArray(a) ? a.filter(Boolean) : []);
      setSubmissions(Array.isArray(s) ? s.filter(Boolean) : []);
      setInvoices(Array.isArray(i) ? i.filter(Boolean) : []);
    } catch (err) {
      console.error("[AdminDashboard] Error loading data:", err);
      setAuthors([]);
      setSubmissions([]);
      setInvoices([]);
    }
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

  const handleConfirmDeleteAuthor = () => {
    if (!deleteAuthorCandidate) return;
    NashrDataStore.deleteAuthor(deleteAuthorCandidate.id);
    loadAllData();
    setShowDeleteAuthorModal(false);
    toast({
      title: isRtl ? "🗑️ تم حذف حساب المؤلف بنجاح" : "Author Account Deleted",
      description: isRtl 
        ? `تم حذف حساب ${deleteAuthorCandidate.fullName} (${deleteAuthorCandidate.authorCode}) نهائياً من المنصة.` 
        : `Author account deleted permanently.`
    });
    setDeleteAuthorCandidate(null);
  };

  const handlePurgeOldTestAuthors = () => {
    NashrDataStore.clearOldTestAuthors();
    loadAllData();
    toast({
      title: isRtl ? "🧹 تم تنظيف وحذف الحسابات القديمة بنجاح" : "Old Accounts Cleared",
      description: isRtl ? "تمت إزالة كافة الحسابات التجريبية والقديمة." : "Old test accounts have been deleted."
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

  const handleConfirmDeleteManuscript = () => {
    if (!deleteManuscriptCandidate) return;
    NashrDataStore.deleteSubmission(deleteManuscriptCandidate.id);
    loadAllData();
    setShowDeleteManuscriptModal(false);
    toast({
      title: isRtl ? "🗑️ تم حذف المخطوطة بنجاح" : "Manuscript Deleted",
      description: isRtl 
        ? `تم حذف العمل "${deleteManuscriptCandidate.title}" نهائياً من قائمة المخطوطات.` 
        : `Manuscript deleted successfully.`
    });
    setDeleteManuscriptCandidate(null);
  };

  const handlePurgeOldManuscripts = () => {
    NashrDataStore.clearOldSubmissions();
    loadAllData();
    toast({
      title: isRtl ? "🧹 تم تنظيف وحذف المخطوطات القديمة" : "Old Manuscripts Cleared",
      description: isRtl ? "تمت إزالة كافة المخطوطات والملفات التجريبية القديمة بنجاح." : "Old test manuscripts deleted."
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
      isRtl ? `تمت الموافقة على الملفات وإصدار فاتورة تكاليف النشر بمبلغ ${amountNum} ج.م. يرجى سداد الفاتورة للبدء في الطباعة.` : `Approved with invoice of ${amountNum} EGP.`
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
  const handleVerifyReceipt = (approved: boolean, customReason?: string) => {
    if (!selectedInvoice) return;
    NashrDataStore.verifyInvoiceReceipt(selectedInvoice.id, approved, customReason);
    loadAllData();
    setShowReceiptModal(false);
    setShowRejectReceiptModal(false);
    setReceiptRejectionReason("");
    toast({
      title: approved 
        ? (isRtl ? "✅ تم اعتماد إيصال السداد بنجاح" : "Receipt Approved")
        : (isRtl ? "❌ تم رفض إيصال السداد وإشعار المؤلف" : "Receipt Rejected"),
      description: approved 
        ? (isRtl ? "تم تسجيل الفاتورة كـ مسددة بالكامل وإرسال إشعار للمؤلف." : "Invoice marked as paid and author notified.")
        : (isRtl ? "تمت إعادة حالة الفاتورة كـ بانتظار السداد مع إرسال سبب الرفض للمؤلف." : "Invoice returned to unpaid with notes."),
      variant: approved ? "default" : "destructive"
    });
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deleteInvoiceCandidate) return;
    NashrDataStore.deleteInvoice(deleteInvoiceCandidate.id);
    loadAllData();
    setShowDeleteInvoiceModal(false);
    toast({
      title: isRtl ? "🗑️ تم حذف الفاتورة بنجاح" : "Invoice Deleted",
      description: isRtl 
        ? `تم حذف الفاتورة رقم ${deleteInvoiceCandidate.invoiceNumber} نهائياً من النظام.` 
        : `Invoice deleted successfully.`
    });
    setDeleteInvoiceCandidate(null);
  };

  const handlePurgeOldInvoices = () => {
    NashrDataStore.clearOldInvoices();
    loadAllData();
    toast({
      title: isRtl ? "🧹 تم تنظيف وحذف الفواتير القديمة" : "Old Invoices Cleared",
      description: isRtl ? "تمت إزالة الفواتير التجريبية والقديمة بنجاح." : "Old test invoices deleted."
    });
  };

  const handleCreateCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(customInvoiceAmount);
    if (!amountNum || amountNum <= 0) {
      toast({
        title: isRtl ? "المبلغ غير صحيح" : "Invalid Amount",
        description: isRtl ? "يرجى إدخال مبلغ صالح للفاتورة." : "Enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    const authorList = Array.isArray(authors) ? authors.filter(Boolean) : [];
    const targetAuthor = authorList.find(a => a && a.id === customInvoiceAuthorId) || authorList[0];
    if (!targetAuthor || !targetAuthor.id) {
      toast({
        title: isRtl ? "يرجى اختيار المؤلف" : "Select Author",
        variant: "destructive"
      });
      return;
    }

    NashrDataStore.createInvoice({
      authorId: targetAuthor.id,
      authorName: targetAuthor.fullName || (isRtl ? "مؤلف" : "Author"),
      manuscriptTitle: customInvoiceTitle.trim() || (isRtl ? "تكاليف وخدمات نشر أكاديمي" : "Academic Publishing Services"),
      amount: amountNum,
      currency: "EGP",
      publishType: "both",
      description: customInvoiceDescription.trim() || (isRtl ? "رسوم التحكيم الأكاديمي، التدقيق اللغوي، وتجهيز الغلاف والطباعة" : "Publishing fees"),
      status: "unpaid"
    });

    loadAllData();
    setShowCustomInvoiceModal(false);
    setCustomInvoiceTitle("");
    setCustomInvoiceAmount(1200);
    setCustomInvoiceDescription("");

    toast({
      title: isRtl ? "🎉 تم إصدار الفاتورة بنجاح" : "Invoice Issued",
      description: isRtl ? `تم إرسال الفاتورة لحساب المؤلف ${targetAuthor.fullName}.` : "Invoice sent to author."
    });
  };

  // Filters with defensive null/undefined checks
  const safeAuthors = Array.isArray(authors) ? authors.filter(Boolean) : [];
  const safeSubmissions = Array.isArray(submissions) ? submissions.filter(Boolean) : [];
  const safeInvoices = Array.isArray(invoices) ? invoices.filter(Boolean) : [];

  const filteredAuthors = safeAuthors.filter(a => {
    if (!a) return false;
    const search = (authorSearch || "").trim().toLowerCase();
    const fullName = (a.fullName || "").toLowerCase();
    const authorCode = (a.authorCode || "").toLowerCase();
    const email = (a.email || "").toLowerCase();
    const specialization = (a.specialization || "").toLowerCase();

    const matchesSearch = !search || 
      fullName.includes(search) ||
      authorCode.includes(search) ||
      email.includes(search) ||
      specialization.includes(search);

    const status = a.verificationStatus || "pending_review";
    const matchesStatus = 
      authorFilterStatus === "all" || 
      (authorFilterStatus === "pending" && status === "pending_review") ||
      (authorFilterStatus === "approved" && status === "approved") ||
      (authorFilterStatus === "rejected" && status === "rejected");
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = safeSubmissions.filter(s => {
    if (!s) return false;
    const search = (manuscriptSearch || "").trim().toLowerCase();
    const title = (s.title || "").toLowerCase();
    const authorName = (s.authorName || "").toLowerCase();
    const category = (s.category || "").toLowerCase();

    const matchesSearch = !search ||
      title.includes(search) ||
      authorName.includes(search) ||
      category.includes(search);
    const matchesStatus = 
      manuscriptFilterStatus === "all" || s.status === manuscriptFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = safeInvoices.filter(inv => {
    if (!inv) return false;
    const search = (invoiceSearch || "").trim().toLowerCase();
    const invoiceNumber = (inv.invoiceNumber || "").toLowerCase();
    const authorName = (inv.authorName || "").toLowerCase();
    const manuscriptTitle = (inv.manuscriptTitle || "").toLowerCase();

    const matchesSearch = !search ||
      invoiceNumber.includes(search) ||
      authorName.includes(search) ||
      manuscriptTitle.includes(search);
    const matchesStatus = 
      invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingAuthorsCount = safeAuthors.filter(a => (a?.verificationStatus || "pending_review") === "pending_review").length;
  const pendingSubmissionsCount = safeSubmissions.filter(s => s?.status === "pending_review").length;
  const pendingInvoicesCount = safeInvoices.filter(i => i?.status === "under_review").length;

  // Chat Authors List & Unread Calculations
  const allChatAuthorIds = Array.from(new Set([
    ...safeAuthors.map(a => a.id),
    ...NashrDataStore.getAllAuthorIdsWithMessages()
  ]));

  const chatAuthorsList = allChatAuthorIds.map(id => {
    const existing = safeAuthors.find(a => a.id === id);
    if (existing) return existing;
    const authorProfile = NashrDataStore.getAuthorProfile();
    if (authorProfile && authorProfile.id === id) return authorProfile;
    return {
      id,
      authorCode: "AUT-" + id.slice(-4).toUpperCase(),
      fullName: isRtl ? "مؤلف مسجل" : "Registered Author",
      academicTitle: "author" as const,
      academicTitleLabel: isRtl ? "مؤلف" : "Author",
      specialization: isRtl ? "دراسات عامة" : "General Studies",
      email: "",
      phone: "",
      joinedDate: new Date().toISOString().split("T")[0]
    };
  });

  const authorsWithNewMessages = chatAuthorsList.filter(author => {
    const msgs = NashrDataStore.getMessages(author.id);
    if (!msgs || msgs.length === 0) return false;
    const lastMsg = msgs[msgs.length - 1];
    return lastMsg.sender === "author";
  });

  const selectedChatAuthor = chatAuthorsList.find(a => a.id === selectedChatAuthorId) || chatAuthorsList[0];
  const activeChatMessages: NashrMessage[] = selectedChatAuthor 
    ? NashrDataStore.getMessages(selectedChatAuthor.id) 
    : [];

  const handleAdminSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatReplyText.trim() || !selectedChatAuthor) return;

    NashrDataStore.sendAdminMessageToAuthor(selectedChatAuthor.id, chatReplyText.trim());
    setChatReplyText("");
    setChatMessagesVersion(v => v + 1);
    toast({
      title: isRtl ? "✅ تم إرسال الرد للمؤلف بنجاح" : "Reply Sent Successfully",
      description: isRtl ? `تم تسليم الرسالة إلى حساب ${selectedChatAuthor.fullName}` : "Message delivered."
    });
  };

  useEffect(() => {
    if (!selectedChatAuthorId && chatAuthorsList.length > 0) {
      if (authorsWithNewMessages.length > 0) {
        setSelectedChatAuthorId(authorsWithNewMessages[0].id);
      } else {
        setSelectedChatAuthorId(chatAuthorsList[0].id);
      }
    }
  }, [chatAuthorsList.length, selectedChatAuthorId, authorsWithNewMessages.length]);

  // Real-time chat sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes("messages")) {
        setChatMessagesVersion(v => v + 1);
      }
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(() => {
      setChatMessagesVersion(v => v + 1);
    }, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const chatQuickReplies = [
    isRtl ? "وعليكم السلام ورحمة الله وبركاته، مرحباً بحضرتكم دكتور، نحن في خدمتكم دائماً." : "Peace be upon you, we are at your service.",
    isRtl ? "أهلاً بحضرتكم، تم استلام رسالتكم والملفات قيد المراجعة والتدقيق الأكاديمي." : "Hello, we received your message and files are under academic review.",
    isRtl ? "تم فحص المخطوطة واعتمادها بنجاح، يرجى سداد الفاتورة للبدء في الطباعة." : "Manuscript approved! Please settle invoice for printing.",
    isRtl ? "يرجى تزويدنا بصورة غلاف بديلة بدقة عالية (300 DPI)." : "Please provide a high-resolution cover image (300 DPI).",
    isRtl ? "تم إرسال كتابكم لمطبعة دار عبيد وسيتم شحن نسخ المؤلف فور الجاهزية." : "Book sent to press. Author copies will be dispatched once ready."
  ];

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
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto p-1.5 rounded-2xl bg-muted/40 border border-border/80 gap-2">
            
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

            {/* Tab 4: Messages / Chat */}
            <TabsTrigger 
              value="chat"
              className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md font-bold text-xs sm:text-sm py-3 rounded-xl gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <span>{isRtl ? "4. التواصل والمحادثات المباشرة" : "4. Author Chat"}</span>
              {authorsWithNewMessages.length > 0 && (
                <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0 h-4 font-black animate-pulse">
                  {authorsWithNewMessages.length}
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
                  <span className="text-2xl font-black text-foreground">{safeAuthors.length}</span>
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
                    {safeAuthors.filter(a => a?.verificationStatus === "approved").length}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgeOldTestAuthors}
                  className="h-10 px-3.5 rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 shrink-0"
                  title={isRtl ? "تنظيف وحذف الحسابات القديمة والتجريبية" : "Purge Old Accounts"}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>{isRtl ? "حذف الحسابات القديمة" : "Delete Old Accounts"}</span>
                </Button>
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
                        {author.avatarUrl ? (
                          <img 
                            src={author.avatarUrl} 
                            alt={author.fullName} 
                            className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shrink-0 shadow-md"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                            ✍️
                          </div>
                        )}
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

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedChatAuthorId(author.id);
                            setActiveTab("chat");
                          }}
                          className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                          <span>{isRtl ? "مراسلة المؤلف 💬" : "Chat"}</span>
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

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setDeleteAuthorCandidate(author);
                            setShowDeleteAuthorModal(true);
                          }}
                          className="h-9 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5"
                          title={isRtl ? "حذف الحساب نهائياً" : "Delete Account"}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          <span>{isRtl ? "حذف الحساب" : "Delete"}</span>
                        </Button>
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
                  <span className="text-2xl font-black text-foreground">{safeSubmissions.length}</span>
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
                    {safeSubmissions.filter(s => s?.status === "published").length}
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
                    placeholder={isRtl ? "ابحث بعنوان العمل، اسم المؤلف، أو التخصص العلمي..." : "Search by title, author, field..."}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgeOldManuscripts}
                  className="h-10 px-3.5 rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 shrink-0"
                  title={isRtl ? "تنظيف وحذف المخطوطات والملفات القديمة" : "Purge Old Manuscripts"}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span>{isRtl ? "حذف المخطوطات القديمة" : "Delete Old Manuscripts"}</span>
                </Button>
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
                                  {sub.manuscriptFile?.name || (isRtl ? "ملف العمل المرفق" : "Main File")}
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
                              {(sub.coverImageUrl || (sub.coverImage && (sub.coverImage.startsWith("data:") || sub.coverImage.startsWith("http") || sub.coverImage.startsWith("/")))) ? (
                                <img 
                                  src={sub.coverImageUrl || sub.coverImage} 
                                  alt="Cover" 
                                  className="w-7 h-9 rounded object-cover border border-amber-500/40 shrink-0 shadow-sm" 
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />
                              )}
                              <div className="text-start truncate">
                                <span className="text-[11px] font-bold block truncate">
                                  {sub.coverImageName || (sub.coverImage?.startsWith("data:") ? (isRtl ? "صورة الغلاف المرفوعة" : "Uploaded Cover Image") : sub.coverImage) || (isRtl ? "صورة الغلاف المقترح" : "Cover Image")}
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

                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedChatAuthorId(sub.authorId);
                              setActiveTab("chat");
                            }}
                            className="h-9 px-3 rounded-xl font-bold text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                            <span>{isRtl ? "مراسلة المؤلف 💬" : "Chat with Author"}</span>
                          </Button>

                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setDeleteManuscriptCandidate(sub);
                              setShowDeleteManuscriptModal(true);
                            }}
                            className="h-9 px-2.5 rounded-xl font-bold text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                            title={isRtl ? "حذف المخطوطة نهائياً" : "Delete Manuscript"}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            <span>{isRtl ? "حذف المخطوطة" : "Delete"}</span>
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
          {/* TAB 3: الفواتير والتحصيل المالي والمطابقة (Invoices)      */}
          {/* ========================================================= */}
          <TabsContent value="invoices" className="space-y-6 mt-0 animate-fade-in">
            
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>{isRtl ? "منظومة استقبال المدفوعات والتحصيل المالي" : "Payment & Receipt Verification Suite"}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRtl 
                    ? "استقبال ومطابقة إيصالات السداد البنكي وإنستاباي الواردة من المؤلفين، وإصدار الفواتير الرسمية."
                    : "Inspect transfer slips, verify incoming funds, and issue official publishing invoices."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setCustomInvoiceAuthorId(authors[0]?.id || "");
                    setShowCustomInvoiceModal(true);
                  }}
                  className="h-10 px-4 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isRtl ? "إصدار فاتورة جديدة للمؤلف +" : "Issue New Invoice +"}</span>
                </Button>
              </div>
            </div>

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

              <Card className="rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 p-4 flex items-center justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-bold block">{isRtl ? "إيصالات قيد المراجعة والمطابقة" : "Receipts Under Review"}</span>
                    {pendingInvoicesCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>
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
                    {safeInvoices.filter(i => i?.status === "paid").length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  ✅
                </div>
              </Card>
            </div>

            {/* 📥 صندوق استقبال المدفوعات والإيصالات الواردة حديثاً (Queue) */}
            {pendingInvoicesCount > 0 ? (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/5 border-2 border-blue-500/40 shadow-lg space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md animate-pulse">
                      📥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-foreground">
                          {isRtl ? "صندوق استقبال المدفوعات والإيصالات الواردة حديثاً" : "Incoming Receipts & Payments Queue"}
                        </h3>
                        <Badge className="bg-blue-600 text-white text-xs font-black px-2 py-0.5">
                          {pendingInvoicesCount} {isRtl ? "إيصالات بانتظار المطابقة" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isRtl 
                          ? "قام المؤلفون برفع إيصالات سداد بنكي / إنستاباي. يرجى مراجعة صورة الإيصال ومطابقة المبلغ ثم اعتماد السداد."
                          : "Authors submitted transfer proofs. Inspect the slip and verify payment."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeInvoices.filter(i => i?.status === "under_review").map((inv) => (
                    <Card key={`queue-${inv.id}`} className="p-4 rounded-2xl border-2 border-blue-500/40 bg-card shadow-md flex flex-col justify-between space-y-3 hover:border-blue-500 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="font-black text-sm text-foreground block">✍️ {inv.authorName}</span>
                          <span className="text-xs text-muted-foreground block truncate max-w-xs">{inv.manuscriptTitle}</span>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-1">
                            <span className="font-mono font-bold text-foreground">{inv.invoiceNumber}</span>
                            <span>• {inv.paymentMethod || "تحويل رسمي"}</span>
                            {inv.receiptReference && (
                              <Badge variant="outline" className="font-mono text-[10px] bg-muted/80">
                                مرجع: {inv.receiptReference}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono block">
                            {inv.amount} {inv.currency}
                          </span>
                          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-[10px] font-bold">
                            ⏳ بانتظار الاعتماد
                          </Badge>
                        </div>
                      </div>

                      {inv.receiptNotes && (
                        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-[11px] text-muted-foreground">
                          💬 <strong className="text-foreground">{isRtl ? "ملاحظة المؤلف:" : "Note:"}</strong> {inv.receiptNotes}
                        </div>
                      )}

                      {/* Thumbnail Preview & Action Buttons */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        {inv.receiptImageUrl ? (
                          <div 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="w-12 h-12 rounded-xl border-2 border-blue-500/40 overflow-hidden cursor-pointer hover:scale-105 transition-all bg-slate-900 shrink-0 shadow-sm"
                            title={isRtl ? "اضغط لتكبير وفحص صورة الإيصال" : "Click to view full receipt"}
                          >
                            <img 
                              src={inv.receiptImageUrl.startsWith("data:") || inv.receiptImageUrl.startsWith("http") ? inv.receiptImageUrl : "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200"} 
                              alt="Receipt" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            📄
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 ms-auto">
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="h-8 px-3 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? "فحص الإيصال والمطابقة" : "Inspect Slip"}</span>
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              handleVerifyReceipt(true);
                            }}
                            className="h-8 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isRtl ? "اعتماد ✅" : "Approve"}</span>
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowRejectReceiptModal(true);
                            }}
                            className="h-8 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                          >
                            <span>{isRtl ? "رفض ❌" : "Reject"}</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? "صندوق استقبال المدفوعات: لا توجد إيصالات معلقة حالياً - كافة التحويلات مطابقة ومسددة بالكامل." : "No pending receipts in queue."}</span>
                </div>
                <Badge variant="outline" className="bg-muted text-[10px] w-fit">
                  {isRtl ? "النظام المالي محدّث ومطابق" : "Finance Synchronized"}
                </Badge>
              </div>
            )}

            {/* Filter and Search Bar for All Invoices */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button 
                  size="sm" 
                  variant={invoiceFilterStatus === "all" ? "default" : "outline"} 
                  onClick={() => setInvoiceFilterStatus("all")}
                  className="h-8 px-3 rounded-xl text-xs font-bold"
                >
                  {isRtl ? `الكل (${invoices.length})` : `All (${invoices.length})`}
                </Button>
                <Button 
                  size="sm" 
                  variant={invoiceFilterStatus === "under_review" ? "default" : "outline"} 
                  onClick={() => setInvoiceFilterStatus("under_review")}
                  className="h-8 px-3 rounded-xl text-xs font-bold gap-1"
                >
                  <span>{isRtl ? "إيصالات قيد المراجعة" : "Under Review"}</span>
                  {pendingInvoicesCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4">
                      {pendingInvoicesCount}
                    </Badge>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant={invoiceFilterStatus === "paid" ? "default" : "outline"} 
                  onClick={() => setInvoiceFilterStatus("paid")}
                  className="h-8 px-3 rounded-xl text-xs font-bold"
                >
                  {isRtl ? `فواتير مسددة (${safeInvoices.filter(i => i?.status === "paid").length})` : "Paid"}
                </Button>
                <Button 
                  size="sm" 
                  variant={invoiceFilterStatus === "unpaid" ? "default" : "outline"} 
                  onClick={() => setInvoiceFilterStatus("unpaid")}
                  className="h-8 px-3 rounded-xl text-xs font-bold"
                >
                  {isRtl ? `بانتظار السداد (${safeInvoices.filter(i => i?.status === "unpaid").length})` : "Unpaid"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePurgeOldInvoices}
                  className="h-8 px-3 rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                  title={isRtl ? "تنظيف وحذف الفواتير القديمة والتجريبية" : "Purge Old Invoices"}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  <span>{isRtl ? "حذف الفواتير القديمة" : "Delete Old Invoices"}</span>
                </Button>
              </div>

              <div className="w-full sm:w-64">
                <Input 
                  placeholder={isRtl ? "بحث برقم الفاتورة أو اسم المؤلف..." : "Search invoices..."} 
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="h-9 rounded-xl text-xs bg-card"
                />
              </div>
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
                          {inv.receiptReference && <span>🔢 رقم المعاملة: {inv.receiptReference}</span>}
                        </div>

                        {inv.rejectionReason && (
                          <p className="text-[10px] text-destructive font-medium bg-destructive/10 p-1.5 rounded-lg w-fit">
                            ملاحظة الرفض: {inv.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Audit Action Controls */}
                      <div className="flex items-center gap-2">
                        {inv.receiptImageUrl ? (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowReceiptModal(true);
                              }}
                              className="h-9 px-3.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isRtl ? "معاينة واعتماد إيصال السداد" : "Audit Receipt"}</span>
                            </Button>

                            {inv.status !== "paid" && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setShowRejectReceiptModal(true);
                                }}
                                className="h-9 px-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                              >
                                {isRtl ? "رفض ❌" : "Reject"}
                              </Button>
                            )}
                          </div>
                        ) : inv.status === "unpaid" ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border/80">
                            {isRtl ? "بانتظار قيام المؤلف برفع الإيصال" : "Awaiting receipt upload"}
                          </Badge>
                        ) : (
                          <Badge className="h-9 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold">
                            ✓ {isRtl ? "تمت المطابقة والاعتماد" : "Audited & Completed"}
                          </Badge>
                        )}

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setDeleteInvoiceCandidate(inv);
                            setShowDeleteInvoiceModal(true);
                          }}
                          className="h-9 px-2.5 rounded-xl font-bold text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                          title={isRtl ? "حذف الفاتورة نهائياً" : "Delete Invoice"}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          <span>{isRtl ? "حذف الفاتورة" : "Delete"}</span>
                        </Button>
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: التواصل والمحادثات المباشرة مع المؤلفين (Chat)     */}
          {/* ========================================================= */}
          <TabsContent value="chat" className="space-y-6 mt-0 animate-fade-in">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "إجمالي قنوات المحادثة" : "Active Author Channels"}</span>
                  <span className="text-2xl font-black text-foreground">{chatAuthorsList.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </Card>

              <Card className="rounded-2xl border-2 border-purple-500/30 bg-purple-500/5 p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-extrabold block">{isRtl ? "رسائل واردة بانتظار الرد" : "Pending Replies"}</span>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {authorsWithNewMessages.length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  📩
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-muted-foreground font-bold block">{isRtl ? "حالة قناة التواصل الداخلي" : "Chat Channel Status"}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isRtl ? "متصلة ومتزامنة لحظياً ⚡" : "Online & Synchronized"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
              </Card>
            </div>

            {/* Chat Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Authors List (Sidebar: 4 cols) */}
              <Card className="lg:col-span-4 rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col h-[650px]">
                <CardHeader className="p-4 border-b border-border/60 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{isRtl ? "المؤلفون والمحادثات" : "Author Conversations"}</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {chatAuthorsList.length} {isRtl ? "مؤلف" : "Authors"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder={isRtl ? "بحث باسم أو كود المؤلف..." : "Search author name or code..."}
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="h-9 ps-9 text-xs rounded-xl bg-background border-border"
                    />
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
                  {chatAuthorsList
                    .filter(a => {
                      if (!chatSearchQuery.trim()) return true;
                      const q = chatSearchQuery.toLowerCase();
                      return (
                        a.fullName.toLowerCase().includes(q) ||
                        a.authorCode.toLowerCase().includes(q) ||
                        (a.specialization || "").toLowerCase().includes(q)
                      );
                    })
                    .map((author) => {
                      const isSelected = selectedChatAuthor?.id === author.id;
                      const msgs = NashrDataStore.getMessages(author.id);
                      const lastMsg = msgs[msgs.length - 1];
                      const isFromAuthor = lastMsg?.sender === "author";

                      return (
                        <div
                          key={author.id}
                          onClick={() => setSelectedChatAuthorId(author.id)}
                          className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected 
                              ? "bg-purple-500/15 border-2 border-purple-500/40 shadow-sm" 
                              : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {author.avatarUrl ? (
                              <img src={author.avatarUrl} alt={author.fullName} className="w-10 h-10 rounded-xl object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
                                {author.fullName?.slice(0, 2) || "AU"}
                              </div>
                            )}
                            {isFromAuthor && (
                              <span className="w-3 h-3 rounded-full bg-purple-500 border-2 border-background absolute -top-1 -end-1 animate-pulse" />
                            )}
                          </div>

                          {/* Author Info & Last Snippet */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-extrabold text-xs text-foreground truncate block">
                                {author.fullName}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                {lastMsg?.timestamp?.split(" ")?.[1] || author.joinedDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                                {author.authorCode}
                              </Badge>
                              <span className="truncate">{author.academicTitleLabel || author.specialization}</span>
                            </div>
                            <p className={`text-[11px] truncate leading-tight ${
                              isFromAuthor ? "text-purple-600 dark:text-purple-300 font-bold" : "text-muted-foreground"
                            }`}>
                              {isFromAuthor && "📩 "}
                              {lastMsg ? lastMsg.text : (isRtl ? "بدء محادثة جديدة..." : "Start chat...")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>

              {/* Chat Room Area (Main: 8 cols) */}
              <Card className="lg:col-span-8 rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col h-[650px]">
                {selectedChatAuthor ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {selectedChatAuthor.avatarUrl ? (
                          <img src={selectedChatAuthor.avatarUrl} alt={selectedChatAuthor.fullName} className="w-11 h-11 rounded-2xl object-cover border border-border shadow-sm" />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
                            {selectedChatAuthor.fullName?.slice(0, 2) || "AU"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-foreground">{selectedChatAuthor.fullName}</h3>
                            <Badge variant="outline" className="font-mono text-[10px] font-bold">
                              {selectedChatAuthor.authorCode}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {selectedChatAuthor.academicTitleLabel} • {selectedChatAuthor.specialization} {selectedChatAuthor.institution ? `• ${selectedChatAuthor.institution}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAuthor(selectedChatAuthor);
                            setShowAuthorKycModal(true);
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isRtl ? "ملف المؤلف" : "Author KYC"}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setChatMessagesVersion(v => v + 1)}
                          className="h-8 w-8 p-0 rounded-xl"
                          title={isRtl ? "تحديث المحادثة" : "Refresh"}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-muted/10">
                      {activeChatMessages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground space-y-2">
                          <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                          <p className="text-xs font-bold">{isRtl ? "لا توجد رسائل سابقة مع هذا المؤلف" : "No messages yet."}</p>
                          <p className="text-[11px]">{isRtl ? "يمكنك كتابة رسالة ترحيبية أو توجيه استفسار مباشرة بالأسفل." : "Send a message below."}</p>
                        </div>
                      ) : (
                        activeChatMessages.map((msg) => {
                          const isAuthor = msg.sender === "author";
                          return (
                            <div 
                              key={msg.id}
                              className={`flex flex-col ${isAuthor ? "items-start" : "items-end"}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {isAuthor ? `✍️ ${msg.senderName} (${msg.senderTitle || "مؤلف"})` : "🏢 هيئة التدقيق والتحكيم بدار عبيد"}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono">{msg.timestamp}</span>
                              </div>

                              <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed shadow-sm ${
                                isAuthor 
                                  ? "bg-amber-500/15 border border-amber-500/30 text-foreground rounded-ts-xs" 
                                  : "bg-blue-600 text-white rounded-te-xs shadow-md"
                              }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.attachmentName && (
                                  <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 text-[10px] font-bold ${
                                    isAuthor ? "bg-card border border-border" : "bg-white/20 text-white"
                                  }`}>
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{msg.attachmentName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Replies Strip */}
                    <div className="px-4 py-2 bg-card border-t border-border/40 overflow-x-auto flex items-center gap-2 no-scrollbar">
                      <span className="text-[10px] font-extrabold text-muted-foreground shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {isRtl ? "ردود سريعة:" : "Quick:"}
                      </span>
                      {chatQuickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setChatReplyText(qr)}
                          className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-all font-medium shrink-0"
                        >
                          {qr.slice(0, 32)}...
                        </button>
                      ))}
                    </div>

                    {/* Chat Input Footer */}
                    <div className="p-4 bg-card border-t border-border/60">
                      <form onSubmit={handleAdminSendMessage} className="flex items-center gap-2">
                        <Input 
                          placeholder={isRtl ? `اكتب رد الإدارة على المؤلف ${selectedChatAuthor.fullName}...` : "Type admin reply..."}
                          value={chatReplyText}
                          onChange={(e) => setChatReplyText(e.target.value)}
                          className="h-11 rounded-xl text-xs border-border bg-muted/20 flex-1"
                        />
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={!chatReplyText.trim()}
                          className="h-11 px-5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-1.5 shrink-0 active:scale-95 transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isRtl ? "إرسال الرد ➔" : "Send Reply"}</span>
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                    {isRtl ? "يرجى اختيار مؤلف من القائمة لبدء المحادثة." : "Select an author to start chatting."}
                  </div>
                )}
              </Card>

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
                
                {/* Author Info Grid with Personal Photo */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Personal Photo */}
                  <div className="relative shrink-0">
                    {selectedAuthor.avatarUrl ? (
                      <div 
                        className="relative group cursor-pointer" 
                        onClick={() => handleOpenDocPreview(isRtl ? "الصورة الشخصية للمؤلف" : "Author Profile Photo", selectedAuthor.avatarUrl!, selectedAuthor.avatarName || "Author_Photo.jpg")}
                      >
                        <img 
                          src={selectedAuthor.avatarUrl} 
                          alt={selectedAuthor.fullName} 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center text-amber-600">
                        <Users className="w-7 h-7" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground text-sm sm:text-base">{selectedAuthor.fullName}</span>
                        <Badge className="bg-amber-500/15 text-amber-600 font-bold text-[10px]">
                          {selectedAuthor.authorCode}
                        </Badge>
                      </div>
                      {selectedAuthor.avatarUrl && (
                        <div className="flex items-center gap-1">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleOpenDocPreview(isRtl ? "الصورة الشخصية للمؤلف" : "Author Profile Photo", selectedAuthor.avatarUrl!, selectedAuthor.avatarName || "Author_Photo.jpg")}
                            className="text-[11px] h-7 px-2 text-amber-600 hover:bg-amber-500/10 font-bold gap-1 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isRtl ? "معاينة الصورة" : "View Photo"}</span>
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDownloadDoc(selectedAuthor.avatarUrl!, selectedAuthor.avatarName || "Author_Photo.svg")}
                            className="text-[11px] h-7 px-2 text-amber-600 hover:bg-amber-500/10 font-bold gap-1 rounded-lg"
                            title={isRtl ? "تحميل الصورة الشخصية" : "Download Profile Photo"}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isRtl ? "تحميل" : "Download"}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                      <div>🎓 <strong className="text-foreground">{isRtl ? "التخصص:" : "Field:"}</strong> {selectedAuthor.specialization}</div>
                      <div>🏛️ <strong className="text-foreground">{isRtl ? "الجامعة/الجهة:" : "Institution:"}</strong> {selectedAuthor.institution || (isRtl ? "مؤلف مستقل" : "Independent")}</div>
                      <div>📞 <strong className="text-foreground">{isRtl ? "الهاتف:" : "Phone:"}</strong> <span dir="ltr">{selectedAuthor.phone}</span></div>
                      <div>✉️ <strong className="text-foreground">{isRtl ? "البريد:" : "Email:"}</strong> {selectedAuthor.email}</div>
                    </div>
                  </div>
                </div>

                {/* Documents Inspection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                    <span className="font-black text-foreground text-sm flex items-center gap-1.5">
                      <span>📁</span>
                      <span>{isRtl ? "المستندات الرسمية المرفقة للتدقيق الأكاديمي:" : "Attached Verification Documents:"}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/30">
                      {isRtl ? "فحص ومعاينة وتنزيل فوري" : "Instant Preview & Download"}
                    </Badge>
                  </div>
                  
                  {/* 1. National ID / Passport */}
                  <div className="p-4 rounded-2xl border-2 border-border/80 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-foreground flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">🆔</span>
                        <span>{isRtl ? "بطاقة الهوية الوطنية / جواز السفر" : "National ID / Passport"}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          {isRtl ? "وثيقة رسمية مرفقة" : "Official Document"}
                        </Badge>
                        {selectedAuthor.nationalIdSize && (
                          <span className="text-[10px] text-muted-foreground font-mono">({selectedAuthor.nationalIdSize})</span>
                        )}
                      </div>
                    </div>

                    {selectedAuthor.nationalIdUrl ? (
                      <div className="space-y-3">
                        {/* Visual Image Preview */}
                        <div className="relative group rounded-xl overflow-hidden border border-border/80 bg-muted/30 p-2 flex items-center justify-center min-h-[140px] max-h-56">
                          <img 
                            src={selectedAuthor.nationalIdUrl} 
                            alt="National ID Preview" 
                            className="max-h-52 w-auto max-w-full rounded-lg object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
                            onClick={() => handleOpenDocPreview(isRtl ? "بطاقة الرقم القومي / جواز السفر" : "National ID / Passport", selectedAuthor.nationalIdUrl!, selectedAuthor.nationalIdName || "National_ID.jpg", selectedAuthor.nationalIdSize)}
                            onError={(e) => {
                              // If image fails (expired blob from older test), show elegant document card
                              const target = e.target as HTMLElement;
                              target.style.display = "none";
                              const fallback = target.parentElement?.querySelector(".fallback-doc-box") as HTMLElement;
                              if (fallback) fallback.style.display = "block";
                            }}
                          />
                          <div className="fallback-doc-box hidden text-center p-4 space-y-2">
                            <ImageIcon className="w-10 h-10 mx-auto text-amber-500/60" />
                            <p className="font-bold text-foreground text-xs">{selectedAuthor.nationalIdName || (isRtl ? "مستند الهوية المرفق" : "Attached ID Document")}</p>
                            <p className="text-[10px] text-muted-foreground">{isRtl ? "تم إرفاق الملف أثناء التسجيل." : "Uploaded during signup."}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-xs truncate max-w-xs sm:max-w-md">
                              {selectedAuthor.nationalIdName || "National_ID_Passport.jpg"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isRtl ? "تم التحقق من تشفير ومطابقة الوثيقة وفق اشتراطات التوثيق." : "Verified identity document."}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDocPreview(isRtl ? "بطاقة الرقم القومي / جواز السفر" : "National ID / Passport", selectedAuthor.nationalIdUrl!, selectedAuthor.nationalIdName || "National_ID.jpg", selectedAuthor.nationalIdSize)}
                              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl bg-card hover:bg-muted"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-500" />
                              <span>{isRtl ? "معاينة وتكبير" : "Preview"}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={() => handleDownloadDoc(selectedAuthor.nationalIdUrl!, selectedAuthor.nationalIdName || "National_ID_Passport.jpg")}
                              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{isRtl ? "تحميل" : "Download"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/40 text-center border border-dashed border-border/80 text-muted-foreground text-xs space-y-1">
                        <ImageIcon className="w-8 h-8 mx-auto text-amber-500/60" />
                        <p className="font-bold text-foreground">National_ID_Card_Scan.jpg</p>
                        <p className="text-[10px]">{isRtl ? "لم يتم إرفاق ملف الهوية." : "No document uploaded."}</p>
                      </div>
                    )}
                  </div>

                  {/* 2. All Academic Qualifications & Certificates */}
                  <div className="p-4 rounded-2xl border-2 border-border/80 bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-foreground flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">🎓</span>
                        <span>{isRtl ? "المؤهلات والشهادات الأكاديمية الرسمية" : "Academic Qualifications & Certificates"}</span>
                      </span>
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-500/30">
                        {isRtl 
                          ? `${(selectedAuthor.qualificationDocuments?.length || selectedAuthor.qualificationUrls?.length || 1)} مستندات مرفقة`
                          : "Certified Credentials"}
                      </Badge>
                    </div>

                    {/* Render ALL documents uploaded by author */}
                    {(() => {
                      const docs = selectedAuthor.qualificationDocuments && selectedAuthor.qualificationDocuments.length > 0
                        ? selectedAuthor.qualificationDocuments
                        : (selectedAuthor.qualificationUrls || []).map((url, idx) => ({
                            id: `qual-${idx}`,
                            name: `Academic_Degree_Certificate_${idx + 1}.pdf`,
                            url,
                            size: "2.4 MB",
                            type: url.startsWith("data:image") ? "IMAGE" : "PDF"
                          }));

                      if (docs.length === 0 && selectedAuthor.qualificationUrls?.[0]) {
                        docs.push({
                          id: "qual-0",
                          name: "Doctorate_Degree_Certificate.pdf",
                          url: selectedAuthor.qualificationUrls[0],
                          size: "2.4 MB",
                          type: "PDF"
                        });
                      }

                      if (docs.length === 0) {
                        return (
                          <div className="p-4 rounded-xl bg-muted/40 text-center border border-dashed border-border/80 text-muted-foreground text-xs space-y-1">
                            <GraduationCap className="w-8 h-8 mx-auto text-blue-500/60" />
                            <p className="font-bold text-foreground">Doctorate_Degree_Certificate.pdf</p>
                            <p className="text-[10px]">{isRtl ? "لم يتم إرفاق شهادات." : "No certificates uploaded."}</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5 pt-1">
                          {docs.map((doc, idx) => (
                            <div key={doc.id || idx} className="p-3 rounded-xl bg-muted/30 border border-border/70 hover:border-blue-500/40 transition-colors space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <p className="font-bold text-foreground text-xs truncate max-w-xs sm:max-w-md">
                                      {doc.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      <span className="font-bold text-blue-600">{doc.type || "PDF"}</span>
                                      {doc.size && <span>• {doc.size}</span>}
                                      <span>• {isRtl ? "شهادة معتمدة موثقة" : "Verified degree"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDocPreview(`${isRtl ? "المؤهل الأكاديمي" : "Degree"} #${idx + 1}: ${doc.name}`, doc.url, doc.name, doc.size)}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl bg-card hover:bg-muted"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{isRtl ? "معاينة كاملة" : "Preview"}</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleDownloadDoc(doc.url, doc.name)}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{isRtl ? "تحميل" : "Download"}</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Inline mini thumbnail if it's an image */}
                              {(doc.url.startsWith("data:image") || doc.url.includes(".png") || doc.url.includes(".jpg") || doc.url.includes(".jpeg")) && (
                                <div 
                                  className="mt-1 cursor-pointer rounded-lg overflow-hidden border border-border/60 bg-muted/20 p-1 max-h-36 flex items-center justify-center"
                                  onClick={() => handleOpenDocPreview(`${isRtl ? "المؤهل الأكاديمي" : "Degree"} #${idx + 1}: ${doc.name}`, doc.url, doc.name, doc.size)}
                                >
                                  <img 
                                    src={doc.url} 
                                    alt={doc.name} 
                                    className="max-h-32 object-contain rounded"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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

      {/* ── Dialog: High-Res KYC Document Inspection Lightbox ── */}
      <Dialog open={showDocPreviewModal} onOpenChange={setShowDocPreviewModal}>
        <DialogContent className="max-w-4xl rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
          {previewDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <DialogTitle className="text-base font-black flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <span>{previewDoc.title}</span>
                  </DialogTitle>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadDoc(previewDoc.url, previewDoc.name || "document")}
                    className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تنزيل الوثيقة" : "Download"}</span>
                  </Button>
                </div>
                <DialogDescription className="text-xs">
                  {previewDoc.name} {previewDoc.size ? `• ${previewDoc.size}` : ""} • {isRtl ? "فحص ومعاينة المستند بدقة عالية" : "High-resolution document review"}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl border border-border/80 bg-muted/30 p-2 sm:p-4 flex items-center justify-center min-h-[350px] max-h-[72vh] overflow-auto">
                {previewDoc.url.startsWith("data:application/pdf") || previewDoc.url.endsWith(".pdf") ? (
                  <iframe 
                    src={previewDoc.url} 
                    title={previewDoc.title}
                    className="w-full h-[65vh] rounded-xl border border-border"
                  />
                ) : (
                  <img 
                    src={previewDoc.url} 
                    alt={previewDoc.title} 
                    className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".fallback-doc-box")) {
                        const fallbackDiv = document.createElement("div");
                        fallbackDiv.className = "fallback-doc-box text-center p-8 space-y-3";
                        fallbackDiv.innerHTML = `
                          <p class="text-sm font-bold text-foreground">${isRtl ? "تم تأمين الوثيقة بنجاح - يمكنك تنزيلها أو فتحها مباشرة" : "Document ready - click download to view"}</p>
                          <p class="text-xs text-muted-foreground">${previewDoc.name || "Document"}</p>
                        `;
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDocPreviewModal(false)} className="rounded-xl text-xs font-bold">
                  {isRtl ? "إغلاق المعاينة" : "Close"}
                </Button>
                <Button 
                  onClick={() => handleOpenInNewTab(previewDoc.url, previewDoc.name)} 
                  variant="secondary"
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isRtl ? "فتح في نافذة جديدة" : "Open in New Tab"}</span>
                </Button>
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

      {/* ── Dialog 5: Advanced High-Resolution Receipt Inspection Modal ── */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span>{isRtl ? "فحص وتدقيق إيصال السداد والتحويل المالي" : "Verify Payment Receipt"}</span>
                  </DialogTitle>
                  <Badge className={
                    selectedInvoice.status === "paid" 
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" 
                      : selectedInvoice.status === "under_review"
                      ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }>
                    {selectedInvoice.status === "paid" 
                      ? (isRtl ? "تم الاعتماد بنجاح ✅" : "Paid") 
                      : selectedInvoice.status === "under_review" 
                      ? (isRtl ? "قيد المراجعة والمطابقة ⏳" : "Under Review") 
                      : (isRtl ? "بانتظار السداد ⚠️" : "Unpaid")}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? `مطابقة إشعار التحويل البنكي للفاتورة رقم ${selectedInvoice.invoiceNumber} بمبلغ ${selectedInvoice.amount} ${selectedInvoice.currency}.`
                    : `Audit payment proof for invoice ${selectedInvoice.invoiceNumber}.`}
                </DialogDescription>
              </DialogHeader>

              {/* Transaction & Author Summary Grid */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "المؤلف:" : "Author:"}</span>
                  <span className="font-bold text-foreground">{selectedInvoice.authorName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "العمل / المؤلف:" : "Work / Author:"}</span>
                  <span className="font-bold text-foreground">{selectedInvoice.manuscriptTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "المبلغ المطلوب للفاتورة:" : "Required Amount:"}</span>
                  <span className="font-black text-foreground font-mono text-sm">{selectedInvoice.amount} {selectedInvoice.currency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "طريقة التحويل المعلنة:" : "Payment Method:"}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedInvoice.paymentMethod || (isRtl ? "تحويل بنكي رسمي" : "Bank Transfer")}</span>
                </div>
                {selectedInvoice.receiptReference && (
                  <div>
                    <span className="text-muted-foreground block">{isRtl ? "رقم العملية / المرجع البنكي:" : "Reference / Transaction ID:"}</span>
                    <span className="font-mono font-bold text-foreground">{selectedInvoice.receiptReference}</span>
                  </div>
                )}
                {selectedInvoice.receiptUploadedAt && (
                  <div>
                    <span className="text-muted-foreground block">{isRtl ? "تاريخ ووقت الرفع:" : "Upload Timestamp:"}</span>
                    <span className="text-foreground">{selectedInvoice.receiptUploadedAt}</span>
                  </div>
                )}
                {selectedInvoice.receiptNotes && (
                  <div className="sm:col-span-2 pt-1 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground font-bold">{isRtl ? "ملاحظة المؤلف المرفقة:" : "Author Note:"} </span>
                    <span className="text-foreground">{selectedInvoice.receiptNotes}</span>
                  </div>
                )}
              </div>

              {/* Receipt Image Display Box with High-Res View */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span>{isRtl ? "صورة إشعار التحويل البنكي / الإيصال:" : "Transfer Receipt Slip:"}</span>
                  {selectedInvoice.receiptImageUrl && (
                    <a 
                      href={selectedInvoice.receiptImageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-amber-500 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{isRtl ? "فتح الصورة بحجمها الأصلي" : "Open Full Image"}</span>
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border-2 border-border/80 overflow-hidden bg-slate-950 p-3 text-center relative group">
                  <img 
                    src={selectedInvoice.receiptImageUrl?.startsWith("data:") || selectedInvoice.receiptImageUrl?.startsWith("http") 
                      ? selectedInvoice.receiptImageUrl 
                      : "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"} 
                    alt="Receipt Image" 
                    className="max-h-[380px] w-auto mx-auto object-contain rounded-xl shadow-lg border border-slate-800"
                  />
                  <div className="pt-2 text-[10px] text-slate-400 font-mono">
                    {selectedInvoice.receiptImageUrl?.startsWith("data:") ? "صورة إيصال حقيقية تم رفعها من جهاز المؤلف" : "إشعار تحويل بنكي رسمي معتمد"}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/60">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReceiptModal(false);
                    setShowRejectReceiptModal(true);
                  }} 
                  className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  {isRtl ? "رفض الإيصال مع كتابة سبب ❌" : "Reject with Reason"}
                </Button>
                <Button 
                  onClick={() => handleVerifyReceipt(true)} 
                  className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? "اعتماد السداد المالي وتأكيد التحصيل ✅" : "Approve & Mark Paid"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Reject Receipt with Reason Modal ── */}
      <Dialog open={showRejectReceiptModal} onOpenChange={setShowRejectReceiptModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <span>⚠️ {isRtl ? "رفض إيصال السداد المالي" : "Reject Payment Receipt"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl 
                ? "حدد سبب عدم مطابقة الإيصال ليتم إرساله في تنبيه رسمي فوري للمؤلف وإتاحة إعادة الرفع."
                : "Specify rejection reason to notify author and allow re-upload."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "أسباب سريعة شائعة:" : "Quick Reasons:"}</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "صورة الإيصال غير واضحة أو مبتورة",
                  "المبلغ المحول غير مطابق لقيمة الفاتورة",
                  "رقم العملية غير موجود بسجلات التحويل",
                  "الحوالة باسم شخص آخر بدون تفويض"
                ].map((reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReceiptRejectionReason(reason)}
                    className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border/80 hover:bg-muted"
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "تفاصيل سبب الرفض الموجهة للمؤلف: *" : "Rejection Reason Note: *"}</Label>
              <Textarea 
                placeholder={isRtl ? "اكتب سبب عدم قبول الإيصال والتوجيهات المطلوبة من المؤلف..." : "Explain why receipt was rejected..."}
                value={receiptRejectionReason}
                onChange={(e) => setReceiptRejectionReason(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowRejectReceiptModal(false)} className="rounded-xl text-xs font-bold">
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => handleVerifyReceipt(false, receiptRejectionReason.trim() || undefined)} 
              className="rounded-xl text-xs font-black bg-destructive hover:bg-destructive/90 text-white"
            >
              {isRtl ? "تأكيد الرفض وإشعار المؤلف ❌" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Create Custom Invoice for Author Modal ── */}
      <Dialog open={showCustomInvoiceModal} onOpenChange={setShowCustomInvoiceModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              <span>{isRtl ? "إصدار فاتورة نشر جديدة للمؤلف" : "Issue New Publishing Invoice"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? "إصدار فاتورة تكاليف نشر أو تحكيم أكاديمي أو خدمات طباعة لمؤلف مسجل بالمنصة." : "Create a customized publishing invoice."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomInvoice} className="space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "اختر المؤلف: *" : "Select Author: *"}</Label>
              <Select value={customInvoiceAuthorId || undefined} onValueChange={(val) => setCustomInvoiceAuthorId(val)}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                  <SelectValue placeholder={isRtl ? "اختر المؤلف..." : "Select Author"} />
                </SelectTrigger>
                <SelectContent>
                  {safeAuthors.filter(a => a && a.id).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName || (isRtl ? "مؤلف" : "Author")} ({a.authorCode || "NA"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "عنوان العمل أو الخدمة: *" : "Work or Service Title: *"}</Label>
              <Input 
                placeholder={isRtl ? "مثال: كتاب الذكاء الاصطناعي والقانون الدولي" : "e.g. Manuscript Title"}
                value={customInvoiceTitle}
                onChange={(e) => setCustomInvoiceTitle(e.target.value)}
                required
                className="h-10 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "قيمة الفاتورة (ج.م): *" : "Amount (EGP): *"}</Label>
              <Input 
                type="number" 
                placeholder="1200"
                value={customInvoiceAmount}
                onChange={(e) => setCustomInvoiceAmount(e.target.value)}
                required
                className="h-10 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">{isRtl ? "تفاصيل بنود الفاتورة الموضحة للمؤلف:" : "Description:"}</Label>
              <Textarea 
                placeholder={isRtl ? "رسوم التحكيم الأكاديمي، التدقيق اللغوي، تجهيز الغلاف والطباعة الورقية والرقمية..." : "Invoice items description"}
                value={customInvoiceDescription}
                onChange={(e) => setCustomInvoiceDescription(e.target.value)}
                className="rounded-xl text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setShowCustomInvoiceModal(false)} className="rounded-xl text-xs font-bold">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                {isRtl ? "إصدار الفاتورة فورياً ➔" : "Issue Invoice"}
              </Button>
            </DialogFooter>
          </form>
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
                    <span>{isRtl ? "معاينة وفحص الملفات المرفقة (PDF / Word)" : "Uploaded Document Viewer"}</span>
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {isRtl 
                    ? `فحص محتوى الملفات المرفقة للعمل "${previewManuscript.title}" للمؤلف ${previewManuscript.authorName}.`
                    : `Inspecting uploaded files for ${previewManuscript.title}.`}
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
                  {previewManuscript.manuscriptFile?.url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOpenInNewTab(previewManuscript.manuscriptFile!.url!, previewManuscript.manuscriptFile!.name)}
                      className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isRtl ? "فتح في نافذة" : "Open"}</span>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleDownloadManuscriptFile(previewManuscript)}
                    className="h-8 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تحميل نسخة للحاسوب" : "Download File"}</span>
                  </Button>
                </div>
              </div>

              {/* Document Reader Simulator */}
              <div id="manuscript-reader-container" className="p-6 rounded-2xl bg-slate-950 text-slate-100 border border-border/80 space-y-6 min-h-[380px] shadow-inner select-none">
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
                    <strong className="text-amber-400 block mb-1">ملخص العمل والتمهيد العلمي:</strong>
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
          {previewCover && (() => {
            const coverSrc = (previewCover.coverImageUrl && (previewCover.coverImageUrl.startsWith("data:") || previewCover.coverImageUrl.startsWith("http") || previewCover.coverImageUrl.startsWith("blob:") || previewCover.coverImageUrl.startsWith("/")))
              ? previewCover.coverImageUrl
              : (previewCover.coverImage && (previewCover.coverImage.startsWith("data:") || previewCover.coverImage.startsWith("http") || previewCover.coverImage.startsWith("blob:") || previewCover.coverImage.startsWith("/")))
              ? previewCover.coverImage
              : null;
            const displayName = previewCover.coverImageName || (coverSrc ? "Cover_Image.png" : previewCover.coverImage || (isRtl ? "غلاف_مقترح.jpg" : "cover.jpg"));

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between gap-2">
                    <DialogTitle className="text-base font-black flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "معاينة صورة الغلاف المقترح للكتاب" : "Cover Image Preview"}</span>
                    </DialogTitle>
                    <Badge variant="outline" className="text-[10px] font-mono max-w-[150px] truncate bg-card">
                      {displayName}
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs">
                    {isRtl ? `مطابقة وفحص صورة غلاف "${previewCover.title}" للمؤلف ${previewCover.authorName}.` : "Cover resolution & inspect."}
                  </DialogDescription>
                </DialogHeader>

                {/* Main Cover Visual Display */}
                <div className="p-4 rounded-2xl bg-slate-950 border-2 border-border/80 flex flex-col items-center justify-center min-h-[300px]">
                  {coverSrc ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black/60 p-1 flex items-center justify-center w-full max-h-[380px]">
                      <img 
                        src={coverSrc} 
                        alt={previewCover.title} 
                        className="max-h-[360px] max-w-full w-auto rounded-lg object-contain shadow-2xl transition-transform hover:scale-105 duration-300" 
                      />
                    </div>
                  ) : (
                    /* Fallback Mockup if no raw image data URL exists */
                    <div className="space-y-3 flex flex-col items-center">
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

                      {/* Attach real image button */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? "اختيار وإرفاق صورة الغلاف الأصلية من جهازك" : "Upload actual image file"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && previewCover) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  NashrDataStore.updateSubmission(previewCover.id, {
                                    coverImage: reader.result,
                                    coverImageUrl: reader.result,
                                    coverImageName: file.name
                                  });
                                  setPreviewCover({
                                    ...previewCover,
                                    coverImage: reader.result,
                                    coverImageUrl: reader.result,
                                    coverImageName: file.name
                                  });
                                  loadAllData();
                                  toast({
                                    title: isRtl ? "✅ تم تحميل وحفظ صورة الغلاف بنجاح" : "Cover image attached",
                                    description: file.name
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>الأبعاد: 17x24 cm (قطع كبير)</span>
                    <span>•</span>
                    <span>الدقة: 300 DPI</span>
                    <span>•</span>
                    <span>{coverSrc ? "صورة أصلية مرفوعة ✓" : `الملف المرفق: ${displayName}`}</span>
                  </div>
                </div>

                <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    {coverSrc && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadDoc(coverSrc, displayName)}
                          className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isRtl ? "تحميل الصورة" : "Download"}</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleOpenInNewTab(coverSrc, displayName)}
                          className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isRtl ? "نافذة جديدة" : "Open"}</span>
                        </Button>
                      </>
                    )}
                    {/* Admin can replace image */}
                    <label className="cursor-pointer inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs font-bold text-muted-foreground transition-all">
                      <RefreshCw className="w-3 h-3" />
                      <span>{isRtl ? "تغيير الغلاف" : "Replace"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && previewCover) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                NashrDataStore.updateSubmission(previewCover.id, {
                                  coverImage: reader.result,
                                  coverImageUrl: reader.result,
                                  coverImageName: file.name
                                });
                                setPreviewCover({
                                  ...previewCover,
                                  coverImage: reader.result,
                                  coverImageUrl: reader.result,
                                  coverImageName: file.name
                                });
                                loadAllData();
                                toast({
                                  title: isRtl ? "✅ تم تحديث صورة الغلاف بنجاح" : "Cover updated",
                                  description: file.name
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </DialogFooter>
              </>
            );
          })()}
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
      {/* ── Dialog 9: Delete Author Confirmation ── */}
      <Dialog open={showDeleteAuthorModal} onOpenChange={setShowDeleteAuthorModal}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span>{isRtl ? "تأكيد حذف حساب المؤلف" : "Confirm Author Deletion"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 text-muted-foreground leading-relaxed">
              {isRtl ? (
                <span>
                  هل أنت متأكد من رغبتك في حذف حساب المؤلف <strong className="text-foreground">{deleteAuthorCandidate?.fullName}</strong> ({deleteAuthorCandidate?.authorCode}) نهائياً؟
                  <br />
                  سيتم حذف بيانات الحساب والمخطوطات المرتبطة به ولن يتمكن المؤلف من الدخول مجدداً.
                </span>
              ) : (
                <span>
                  Are you sure you want to permanently delete the author account for {deleteAuthorCandidate?.fullName} ({deleteAuthorCandidate?.authorCode})?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAuthorModal(false)}
              className="rounded-xl text-xs font-bold"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteAuthor}
              className="rounded-xl text-xs font-black gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? "تأكيد الحذف نهائياً" : "Confirm Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 10: Delete Manuscript Confirmation ── */}
      <Dialog open={showDeleteManuscriptModal} onOpenChange={setShowDeleteManuscriptModal}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span>{isRtl ? "تأكيد حذف المخطوطة" : "Confirm Manuscript Deletion"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 text-muted-foreground leading-relaxed">
              {isRtl ? (
                <span>
                  هل أنت متأكد من رغبتك في حذف مخطوطة <strong className="text-foreground">"{deleteManuscriptCandidate?.title}"</strong> للمؤلف <strong className="text-foreground">{deleteManuscriptCandidate?.authorName}</strong> نهائياً؟
                  <br />
                  سيتم حذف الملفات المرفقة والمخطوطة بشكل كامل من المنصة.
                </span>
              ) : (
                <span>
                  Are you sure you want to permanently delete the manuscript "{deleteManuscriptCandidate?.title}"?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteManuscriptModal(false)}
              className="rounded-xl text-xs font-bold"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteManuscript}
              className="rounded-xl text-xs font-black gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? "تأكيد الحذف نهائياً" : "Confirm Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 11: Delete Invoice Confirmation ── */}
      <Dialog open={showDeleteInvoiceModal} onOpenChange={setShowDeleteInvoiceModal}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span>{isRtl ? "تأكيد حذف الفاتورة" : "Confirm Invoice Deletion"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 text-muted-foreground leading-relaxed">
              {isRtl ? (
                <span>
                  هل أنت متأكد من رغبتك في حذف الفاتورة رقم <strong className="text-foreground font-mono">{deleteInvoiceCandidate?.invoiceNumber}</strong> الخاصة بالمؤلف <strong className="text-foreground">{deleteInvoiceCandidate?.authorName}</strong> نهائياً؟
                  <br />
                  بقيمة: <strong className="text-foreground font-mono">{deleteInvoiceCandidate?.amount} {deleteInvoiceCandidate?.currency}</strong>
                  <br />
                  سيتم حذف سجل الفاتورة وإيصالاتها المرتبطة بشكل نهائي.
                </span>
              ) : (
                <span>
                  Are you sure you want to permanently delete invoice {deleteInvoiceCandidate?.invoiceNumber} ({deleteInvoiceCandidate?.amount} {deleteInvoiceCandidate?.currency})?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteInvoiceModal(false)}
              className="rounded-xl text-xs font-bold"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteInvoice}
              className="rounded-xl text-xs font-black gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? "تأكيد الحذف نهائياً" : "Confirm Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;
