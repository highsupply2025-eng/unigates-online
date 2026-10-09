import React, { useState, useEffect } from "react";
import { NashrInvoice } from "@/types/nashr";
import { 
  downloadFileOrDataUrl, 
  generateOfficialReceiptSvg, 
  printOfficialInvoiceOrReceipt 
} from "@/services/nashrReceiptHelper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Download, 
  Printer, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Copy, 
  Check, 
  FileCheck,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: NashrInvoice | null;
  isAdminView?: boolean;
  onApprove?: (invoice: NashrInvoice) => void;
  onReject?: (invoice: NashrInvoice, reason: string) => void;
  isRtl?: boolean;
}

export const ReceiptAuditModal: React.FC<ReceiptAuditModalProps> = ({
  open,
  onOpenChange,
  invoice,
  isAdminView = false,
  onApprove,
  onReject,
  isRtl = true
}) => {
  const { toast } = useToast();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>("");

  // Reset states whenever invoice opens
  useEffect(() => {
    if (open) {
      setZoomLevel(1);
      setRotation(0);
      setImageError(false);
      setShowRejectForm(false);
      setRejectionReasonText("");
      setCopiedRef(false);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const isPdf = 
    invoice.receiptFileType === "application/pdf" || 
    (invoice.receiptFileName && invoice.receiptFileName.toLowerCase().endsWith(".pdf")) ||
    (invoice.receiptImageUrl && invoice.receiptImageUrl.startsWith("data:application/pdf"));

  // Determine actual image source to render
  let displayImageSrc = invoice.receiptImageUrl;
  if (!displayImageSrc || imageError) {
    displayImageSrc = generateOfficialReceiptSvg(invoice);
  }

  const handleCopyReference = () => {
    if (!invoice.receiptReference) return;
    navigator.clipboard.writeText(invoice.receiptReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    toast({
      title: isRtl ? "تم نسخ رقم العملية" : "Copied Reference",
      description: invoice.receiptReference
    });
  };

  const handleDownload = () => {
    const ext = isPdf ? ".pdf" : displayImageSrc?.startsWith("data:image/svg+xml") ? ".svg" : ".png";
    const filename = invoice.receiptFileName || `إيصال_سداد_${invoice.invoiceNumber}${ext}`;
    downloadFileOrDataUrl(displayImageSrc || "", filename);
    toast({
      title: isRtl ? "جاري تحميل الملف" : "Downloading File",
      description: filename
    });
  };

  const handleDownloadInvoiceStatement = () => {
    if (invoice.invoicePdfUrl) {
      downloadFileOrDataUrl(invoice.invoicePdfUrl, invoice.invoiceFileName || `فاتورة_${invoice.invoiceNumber}.pdf`);
    } else {
      printOfficialInvoiceOrReceipt(invoice);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReasonText.trim()) {
      toast({
        title: isRtl ? "يرجى كتابة سبب الرفض" : "Reason required",
        description: isRtl ? "اكتب توضيحاً للمؤلف بسبب عدم مطابقة الإيصال." : "Please provide rejection notes.",
        variant: "destructive"
      });
      return;
    }
    if (onReject) {
      onReject(invoice, rejectionReasonText.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 space-y-4">
        
        {/* Modal Header */}
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <span>
                    {isAdminView 
                      ? (isRtl ? "فحص وتدقيق إيصال السداد والمستندات المالية" : "Verify Payment Slip & Finance Documents")
                      : (isRtl ? "تفاصيل الفاتورة وإيصال السداد المالي" : "Invoice & Payment Receipt Details")}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs font-mono">
                  {invoice.invoiceNumber} • {invoice.createdAt}
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={
                invoice.status === "paid" 
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs py-1 px-3" 
                  : invoice.status === "under_review"
                  ? "bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs py-1 px-3"
                  : "bg-destructive/15 text-destructive border-destructive/30 text-xs py-1 px-3"
              }>
                {invoice.status === "paid" 
                  ? (isRtl ? "تم التحصيل والاعتماد ✅" : "Paid & Verified") 
                  : invoice.status === "under_review" 
                  ? (isRtl ? "قيد المراجعة والمطابقة ⏳" : "Under Review") 
                  : (isRtl ? "بانتظار السداد ⚠️" : "Unpaid")}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar: Zoom, Rotate, Download, Print */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/70 text-xs">
          <div className="flex items-center gap-1.5">
            {!isPdf && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                  className="h-8 w-8 p-0 rounded-xl"
                  title={isRtl ? "تكبير (+)" : "Zoom In"}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="h-8 w-8 p-0 rounded-xl"
                  title={isRtl ? "تصغير (-)" : "Zoom Out"}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="h-8 w-8 p-0 rounded-xl"
                  title={isRtl ? "تدوير 90 درجة" : "Rotate"}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  className="h-8 px-2 text-[11px] rounded-xl font-bold"
                  title={isRtl ? "إعادة ضبط العرض" : "Reset Zoom"}
                >
                  <RotateCcw className="w-3 h-3 me-1" />
                  <span>100%</span>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 ms-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? "تحميل الإيصال 📥" : "Download Slip"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => printOfficialInvoiceOrReceipt(invoice)}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              <span>{isRtl ? "طباعة الإيصال 🖨️" : "Print Voucher"}</span>
            </Button>

            {displayImageSrc && (
              <a
                href={displayImageSrc}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted text-muted-foreground"
                title={isRtl ? "عرض في نافذة منفصلة" : "Open in new window"}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Preview & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* File / Image Preview Container (7 Cols) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="text-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "مستند الإيصال وإشعار التحويل البنكي:" : "Transfer Receipt Document:"}</span>
              </span>
              {invoice.receiptFileName && (
                <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                  {invoice.receiptFileName} {invoice.receiptFileSize ? `(${invoice.receiptFileSize})` : ""}
                </span>
              )}
            </div>

            <div className="rounded-2xl border-2 border-border/80 bg-slate-950 p-3 min-h-[360px] flex items-center justify-center relative overflow-hidden group shadow-inner">
              
              {isPdf ? (
                /* PDF File Document Card */
                <div className="text-center p-8 space-y-4 max-w-sm">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">{invoice.receiptFileName || "إيصال_سداد_بنكي.pdf"}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? "مستند PDF رسمي تم إرفاقه مع عملية السداد" : "Official PDF Payment Receipt"}
                    </p>
                    {invoice.receiptFileSize && (
                      <span className="inline-block mt-1 font-mono text-[11px] text-amber-400">
                        {invoice.receiptFileSize}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isRtl ? "تحميل ملف الـ PDF 📥" : "Download PDF"}</span>
                    </Button>
                    <a
                      href={invoice.receiptImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-900"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isRtl ? "فتح المستند" : "Open PDF"}</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Image / SVG Receipt with Pan & Zoom */
                <div 
                  className="w-full flex items-center justify-center overflow-auto transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={displayImageSrc}
                    alt="Receipt Slip"
                    onError={() => {
                      // Seamless fallback to high-res SVG receipt voucher
                      setImageError(true);
                    }}
                    className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-xl border border-slate-800"
                  />
                </div>
              )}

              {/* Watermark note */}
              <div className="absolute bottom-2 start-2 end-2 text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 font-mono">
                  {imageError || displayImageSrc?.startsWith("data:image/svg+xml")
                    ? "إشعار رقمي رسمي معتمد من الإدارة المالية"
                    : "صورة الإيصال المرفوعة من صاحب المعاملة"}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Metadata & Written Notes (5 Cols) */}
          <div className="lg:col-span-5 space-y-3.5 text-xs">
            
            {/* Core Info Cards */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
              <span className="text-xs font-black text-foreground block border-b border-border/60 pb-1.5">
                📌 {isRtl ? "بيانات المعاملة المالية:" : "Transaction Details:"}
              </span>

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{isRtl ? "المؤلف:" : "Author:"}</span>
                  </span>
                  <span className="font-bold text-foreground text-end">{invoice.authorName}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{isRtl ? "العمل / المخطوطة:" : "Work:"}</span>
                  </span>
                  <span className="font-bold text-foreground text-end max-w-[200px] truncate" title={invoice.manuscriptTitle}>
                    {invoice.manuscriptTitle}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    <span>{isRtl ? "مبلغ الفاتورة المطلوب:" : "Amount:"}</span>
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                    {invoice.amount} {invoice.currency}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{isRtl ? "وسيلة التحويل:" : "Method:"}</span>
                  <span className="font-bold text-foreground">{invoice.paymentMethod || "تحويل بنكي رسمي"}</span>
                </div>

                {invoice.receiptReference && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">{isRtl ? "رقم المرجع / العملية:" : "Reference #:"}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                        {invoice.receiptReference}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyReference}
                        className="h-6 w-6 p-0 rounded-md"
                        title={isRtl ? "نسخ رقم العملية" : "Copy"}
                      >
                        {copiedRef ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                )}

                {invoice.receiptUploadedAt && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{isRtl ? "تاريخ ووقت الرفع:" : "Uploaded:"}</span>
                    </span>
                    <span className="text-muted-foreground font-mono">{invoice.receiptUploadedAt}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Author Written Notes Card */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                💬 {isRtl ? "ملاحظات المحول المكتوبة:" : "Author's Written Notes:"}
              </span>
              <p className="text-xs text-foreground leading-relaxed bg-background/80 p-2.5 rounded-xl border border-amber-500/20 whitespace-pre-wrap">
                {invoice.receiptNotes || invoice.description || (isRtl ? "لا توجد ملاحظات كتابية إضافية من المحول." : "No additional notes provided.")}
              </p>
            </div>

            {/* Admin / Finance Notes or Rejection Reason if any */}
            {invoice.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-1.5 text-destructive">
                <span className="text-xs font-black flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isRtl ? "ملاحظة وتوجيه الإدارة المالية (سبب الرفض):" : "Finance Rejection Reason:"}</span>
                </span>
                <p className="text-xs leading-relaxed bg-background/80 p-2.5 rounded-xl border border-destructive/20 font-medium">
                  {invoice.rejectionReason}
                </p>
              </div>
            )}

            {/* Admin Attached Invoice Document if present */}
            {invoice.invoiceFileName && (
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{invoice.invoiceFileName}</span>
                    <span className="text-[10px] text-muted-foreground">{invoice.invoiceFileSize || "مستند فاتورة"}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadInvoiceStatement}
                  className="h-7 px-2 text-[10px] font-bold rounded-lg border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                >
                  <Download className="w-3 h-3 me-1" />
                  <span>{isRtl ? "تحميل" : "Download"}</span>
                </Button>
              </div>
            )}

            {/* Reject with Reason Form (For Admin) */}
            {isAdminView && showRejectForm && (
              <div className="p-3.5 rounded-2xl bg-card border-2 border-destructive/40 space-y-2.5 animate-in fade-in">
                <Label className="text-xs font-black text-destructive flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isRtl ? "سبب عدم قبول الإيصال الموجه للمؤلف: *" : "Rejection Reason Note: *"}</span>
                </Label>
                <div className="flex flex-wrap gap-1">
                  {[
                    "صورة الإيصال غير واضحة",
                    "المبلغ غير مطابق للفاتورة",
                    "رقم العملية غير موجود",
                    "الحوالة باسم شخص آخر"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReasonText(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder={isRtl ? "اكتب تفاصيل سبب الرفض ليتم إرساله للمؤلف في تنبيه فوري..." : "Explain why receipt was rejected..."}
                  rows={2}
                  className="text-xs rounded-xl"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRejectForm(false)}
                    className="h-7 px-2 text-xs"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleConfirmReject}
                    className="h-7 px-3 text-xs font-bold rounded-xl"
                  >
                    {isRtl ? "تأكيد الرفض وإشعار المؤلف" : "Confirm Reject"}
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Action Footer */}
        <DialogFooter className="gap-2 pt-3 border-t border-border/60">
          {isAdminView ? (
            <>
              {!showRejectForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="w-3.5 h-3.5 me-1" />
                  <span>{isRtl ? "رفض الإيصال مع كتابة سبب ❌" : "Reject with Reason"}</span>
                </Button>
              )}
              
              <Button
                onClick={() => {
                  if (onApprove) onApprove(invoice);
                }}
                className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? "اعتماد السداد المالي وتأكيد التحصيل ✅" : "Approve & Mark Paid"}</span>
              </Button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? "تحميل ملف الإيصال" : "Download Slip"}</span>
              </Button>

              <Button
                variant="default"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-bold px-6"
              >
                {isRtl ? "إغلاق" : "Close"}
              </Button>
            </div>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
