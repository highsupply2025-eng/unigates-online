import React, { useState, useEffect } from "react";
import { BookSaleRecord } from "@/types/nashr";
import { BookOrder } from "@/types/bookStore";
import { 
  generateOfficialBookSaleInvoiceSvg, 
  printOfficialBookSaleInvoice 
} from "@/services/bookSaleInvoiceHelper";
import { downloadFileOrDataUrl } from "@/services/nashrReceiptHelper";
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
import { 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Copy, 
  Check, 
  FileText, 
  BookOpen, 
  DollarSign, 
  ShieldCheck, 
  ExternalLink,
  User,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookSaleInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: BookSaleRecord | null;
  order?: BookOrder | null;
  isRtl?: boolean;
}

export const BookSaleInvoiceModal: React.FC<BookSaleInvoiceModalProps> = ({
  open,
  onOpenChange,
  sale,
  order,
  isRtl = true
}) => {
  const { toast } = useToast();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);
  const [copiedOrder, setCopiedOrder] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setZoomLevel(1);
      setRotation(0);
      setCopiedInvoice(false);
      setCopiedOrder(false);
    }
  }, [open, sale]);

  if (!sale) return null;

  const invoiceNumber = sale.invoiceNumber || `INV-SALE-${(sale.orderNumber || "9921").replace(/[^0-9]/g, "").slice(-4) || "8812"}`;
  const invoiceSvgDataUrl = generateOfficialBookSaleInvoiceSvg(sale, order || undefined);

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
    toast({
      title: isRtl ? "تم نسخ رقم الفاتورة" : "Invoice number copied",
      description: invoiceNumber
    });
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(sale.orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
    toast({
      title: isRtl ? "تم نسخ رقم الطلب" : "Order number copied",
      description: sale.orderNumber
    });
  };

  const handleDownloadInvoice = () => {
    downloadFileOrDataUrl(invoiceSvgDataUrl, `فاتورة_مبيعات_${sale.orderNumber}_${sale.bookCode}.svg`);
    toast({
      title: isRtl ? "جاري تحميل الفاتورة الرسمية" : "Downloading official invoice",
      description: isRtl ? "تم حفظ نسخة الفاتورة الرقمية بنجاح." : "Saved SVG file."
    });
  };

  const handlePrint = () => {
    printOfficialBookSaleInvoice(sale, order || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-2 border-border shadow-2xl bg-card">
        
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-t-3xl border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                📄
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>{isRtl ? "فاتورة مبيعات كتاب رسمية معتمدة" : "Official Book Sale Invoice"}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-black">
                    {isRtl ? "معتمد ومسدد بالكامل ✓" : "Paid & Settled"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  {isRtl 
                    ? "إشعار بيع كتاب موثق صادر من إدارة متجر دار عبيد للنشر والتوزيع ومقيد في محفظة المؤلف"
                    : "Official sales voucher issued by Dar Obeid Bookstore"}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyInvoiceNumber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-amber-400 font-mono text-xs font-bold hover:bg-slate-700 transition-colors"
                title={isRtl ? "انقر لنسخ رقم الفاتورة" : "Click to copy"}
              >
                <span>{invoiceNumber}</span>
                {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-xs font-bold hover:bg-slate-700 transition-colors"
                title={isRtl ? "انقر لنسخ رقم الطلب" : "Click to copy"}
              >
                <span>{sale.orderNumber}</span>
                {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">{isRtl ? "الكتاب المباع:" : "Book:"}</span>
              <span className="font-bold text-foreground line-clamp-1" title={sale.bookTitle}>
                {sale.bookTitle}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{sale.bookCode}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">{isRtl ? "صيغة البيع:" : "Format:"}</span>
              <Badge className={
                sale.format === "digital" 
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-bold"
                  : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold"
              }>
                {sale.format === "digital" ? "رقمي E-Book (70%)" : "ورقي مطبوع (30%)"}
              </Badge>
              <span className="text-[10px] text-muted-foreground block">سعر الوحدة: {sale.salePrice} ج.م</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">{isRtl ? "المشتري / العميل:" : "Buyer:"}</span>
              <span className="font-bold text-foreground line-clamp-1">{sale.buyerName}</span>
              <span className="text-[10px] text-muted-foreground block font-mono">{sale.date}</span>
            </div>

            <div className="space-y-0.5 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">{isRtl ? "صافي أرباح المؤلف المودعة:" : "Author Royalties:"}</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                +{sale.authorEarnings} ج.م
              </span>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 block">
                ({sale.authorRoyaltyPercentage}% من إجمالي السعر)
              </span>
            </div>
          </div>

          {/* Interactive Document Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 border border-border/60">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground px-2">
                {isRtl ? "التحكم في العرض:" : "Controls:"}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
                className="h-8 w-8 p-0 rounded-lg"
                title={isRtl ? "تكبير" : "Zoom in"}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                className="h-8 w-8 p-0 rounded-lg"
                title={isRtl ? "تصغير" : "Zoom out"}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="h-8 w-8 p-0 rounded-lg"
                title={isRtl ? "تدوير مع عقارب الساعة" : "Rotate CW"}
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setZoomLevel(1); setRotation(0); }}
                className="h-8 px-2.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                {isRtl ? "إعادة ضبط" : "Reset"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 px-3 rounded-xl font-bold text-xs gap-1.5 border-border hover:bg-muted"
              >
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>{isRtl ? "طباعة الفاتورة 🖨️" : "Print"}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleDownloadInvoice}
                className="h-8 px-3.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRtl ? "تحميل الفاتورة 📥" : "Download Invoice"}</span>
              </Button>
            </div>
          </div>

          {/* Document Canvas Display */}
          <div className="rounded-2xl border-2 border-border/80 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 overflow-hidden flex items-center justify-center min-h-[380px] max-h-[560px]">
            <div 
              className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transformOrigin: "center center"
              }}
            >
              <img 
                src={invoiceSvgDataUrl} 
                alt="فاتورة مبيعات كتاب رسمية"
                className="w-full max-w-[760px] h-auto shadow-2xl rounded-xl border border-border/80 bg-white"
              />
            </div>
          </div>

          {/* Legal / Distribution Transparency Footer Note */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold">
                {isRtl ? "التدقيق المالي وقيد الأرباح:" : "Financial Audit & Credit:"}
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                {isRtl 
                  ? "يتم قيد عوائد المبيعات (70% للنسخ الرقمية و30% للنسخ الورقية) في محفظة المؤلف فوراً عند نجاح عملية الدفع بالمتجر. يمكن للمؤلف سحب الرصيد في أي وقت عبر الحساب البنكي أو إنستاباي أو المحافظ الإلكترونية."
                  : "Sales royalties (70% digital / 30% print) are immediately credited to author balance upon successful purchase settlement."}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-muted/30 border-t border-border/60 flex flex-row items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground">
            {invoiceNumber} • {sale.orderNumber}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 rounded-xl font-bold text-xs"
          >
            {isRtl ? "إغلاق النافذة" : "Close"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
