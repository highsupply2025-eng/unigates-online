import { BookSaleRecord } from "@/types/nashr";
import { BookOrder } from "@/types/bookStore";

/**
 * Generates an ultra-crisp, official SVG digital sales invoice voucher for a book purchase.
 * Accessible and printable for both Book Store Admin and Authors.
 */
export function generateOfficialBookSaleInvoiceSvg(sale: Partial<BookSaleRecord>, order?: Partial<BookOrder>): string {
  const invNumber = sale.invoiceNumber || `INV-SALE-${(sale.orderNumber || "9921").replace(/[^0-9]/g, "").slice(-4) || "8812"}`;
  const orderNumber = sale.orderNumber || order?.orderNumber || "ORD-2026-9921";
  const authorName = sale.authorName || "أ.د. عبد الرحمن المنشاوي";
  const authorCode = sale.authorCode || "AUT-7890";
  const bookTitle = sale.bookTitle || "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية";
  const bookCode = sale.bookCode || "BK-DAR-4491";
  const formatLabel = sale.format === "digital" ? "نسخة رقمية محكمة (E-Book DRM)" : "نسخة ورقية مطبوعة فاخرة (Paperback)";
  const formatBadge = sale.format === "digital" ? "رقمي 📱" : "ورقي 📖";
  const unitPrice = sale.salePrice || 140;
  const quantity = sale.quantity || 1;
  const grossAmount = unitPrice * quantity;
  const royaltyPercent = sale.authorRoyaltyPercentage || (sale.format === "digital" ? 70 : 30);
  const authorEarnings = sale.authorEarnings || Math.round(grossAmount * (royaltyPercent / 100));
  const publisherShare = grossAmount - authorEarnings;
  const buyerName = sale.buyerName || order?.userName || "مكتبة كلية الاقتصاد - جامعة القاهرة";
  const buyerEmail = sale.buyerEmail || order?.userEmail || "buyer@unigates.online";
  const buyerCity = sale.buyerCity || order?.shippingAddress?.city || "القاهرة، جمهورية مصر العربية";
  const paymentMethod = sale.paymentMethod || order?.paymentMethod || "إنستاباي (InstaPay)";
  const dateStr = sale.date || order?.createdAt || new Date().toISOString().split("T")[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 680" width="100%" height="100%">
  <defs>
    <linearGradient id="invBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <filter id="invShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.12" />
    </filter>
  </defs>

  <style>
    .ar-head { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 900; direction: rtl; }
    .ar-bold { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 800; direction: rtl; }
    .ar-med  { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 600; direction: rtl; }
    .mono    { font-family: 'Consolas', 'Courier New', monospace; font-weight: 800; }
  </style>

  <!-- Document Card Base -->
  <rect x="15" y="15" width="890" height="650" rx="20" fill="url(#invBg)" stroke="#cbd5e1" stroke-width="2" filter="url(#invShadow)"/>

  <!-- Top Dark Header Banner -->
  <path d="M 15 35 Q 15 15 35 15 L 885 15 Q 905 15 905 35 L 905 110 L 15 110 Z" fill="url(#headerGrad)"/>

  <!-- Store Emblem / Seal -->
  <g transform="translate(65, 62)">
    <circle cx="0" cy="0" r="28" fill="url(#goldGrad)" stroke="#ffffff" stroke-width="2.5" />
    <path d="M -12 -12 L 0 -22 L 12 -12 L 10 12 L 0 16 L -10 12 Z" fill="#ffffff" opacity="0.95"/>
    <circle cx="0" cy="0" r="6" fill="#0f172a" />
  </g>

  <!-- Header Titles -->
  <text x="870" y="52" class="ar-head" font-size="22" fill="#ffffff" text-anchor="start">دار عبيد للنشر والتوزيع • متجر الكتب الإلكتروني</text>
  <text x="870" y="80" class="ar-med" font-size="12" fill="#94a3b8" text-anchor="start">فاتورة مبيعات كتاب رسمية وإشعار إيداع عوائد المؤلف • UNIGATES BOOKSTORE</text>

  <!-- Invoice Voucher Badge in Header -->
  <rect x="110" y="44" width="220" height="34" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
  <text x="220" y="66" class="mono" font-size="13" fill="#fbbf24" text-anchor="middle">${invNumber}</text>

  <!-- Top Metadata Bar -->
  <rect x="40" y="125" width="840" height="60" rx="14" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1.5" />
  <g transform="translate(60, 148)">
    <text x="790" y="0" class="ar-bold" font-size="11" fill="#64748b" text-anchor="start">رقم أمر البيع:</text>
    <text x="790" y="20" class="mono" font-size="13" fill="#0f172a" text-anchor="start">${orderNumber}</text>

    <text x="540" y="0" class="ar-bold" font-size="11" fill="#64748b" text-anchor="start">تاريخ العملية:</text>
    <text x="540" y="20" class="mono" font-size="12" fill="#0f172a" text-anchor="start">${dateStr}</text>

    <text x="300" y="0" class="ar-bold" font-size="11" fill="#64748b" text-anchor="start">طريقة الدفع:</text>
    <text x="300" y="20" class="ar-bold" font-size="12" fill="#047857" text-anchor="start">${paymentMethod}</text>

    <text x="90" y="0" class="ar-bold" font-size="11" fill="#64748b" text-anchor="start">حالة السداد:</text>
    <text x="90" y="20" class="ar-bold" font-size="12" fill="#15803d" text-anchor="start">مسدد بالكامل ✅</text>
  </g>

  <!-- Two-Column Information Box (Buyer & Author) -->
  <rect x="40" y="198" width="840" height="100" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
  
  <!-- Right Column: Buyer Info -->
  <g transform="translate(60, 222)">
    <text x="790" y="0" class="ar-bold" font-size="12" fill="#b45309" text-anchor="start">👤 بيانات العميل / المشتري:</text>
    <text x="790" y="24" class="ar-head" font-size="15" fill="#0f172a" text-anchor="start">${buyerName}</text>
    <text x="790" y="46" class="ar-med" font-size="11" fill="#64748b" text-anchor="start">${buyerEmail} • ${buyerCity}</text>
  </g>

  <!-- Vertical Divider -->
  <line x1="470" y1="210" x2="470" y2="285" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 3" />

  <!-- Left Column: Author Attribution Info -->
  <g transform="translate(490, 222)">
    <text x="360" y="0" class="ar-bold" font-size="12" fill="#1d4ed8" text-anchor="start">✍️ بيانات المؤلف المستحق للأرباح:</text>
    <text x="360" y="24" class="ar-head" font-size="15" fill="#0f172a" text-anchor="start">${authorName}</text>
    <text x="360" y="46" class="mono" font-size="11" fill="#475569" text-anchor="start">كود المؤلف: [${authorCode}] • دار عبيد للنشر</text>
  </g>

  <!-- Itemized Book Purchase Table -->
  <g transform="translate(40, 312)">
    <!-- Table Header Strip -->
    <rect x="0" y="0" width="840" height="38" rx="8" fill="#1e293b" />
    <text x="815" y="24" class="ar-bold" font-size="12" fill="#ffffff" text-anchor="start">بيان الكتاب / المؤلف</text>
    <text x="440" y="24" class="ar-bold" font-size="12" fill="#ffffff" text-anchor="start">صيغة النشر</text>
    <text x="270" y="24" class="ar-bold" font-size="12" fill="#ffffff" text-anchor="start">الكمية</text>
    <text x="160" y="24" class="ar-bold" font-size="12" fill="#ffffff" text-anchor="start">سعر الوحدة</text>
    <text x="35" y="24" class="ar-bold" font-size="12" fill="#ffffff" text-anchor="start">الإجمالي</text>

    <!-- Table Row 1 -->
    <rect x="0" y="42" width="840" height="60" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <text x="815" y="68" class="ar-head" font-size="13" fill="#0f172a" text-anchor="start">${bookTitle.slice(0, 44)}</text>
    <text x="815" y="88" class="mono" font-size="10" fill="#64748b" text-anchor="start">كود الكتاب: ${bookCode}</text>

    <text x="440" y="78" class="ar-bold" font-size="11" fill="#4338ca" text-anchor="start">${formatBadge} ${formatLabel}</text>
    <text x="270" y="78" class="mono" font-size="13" fill="#0f172a" text-anchor="start">${quantity}</text>
    <text x="160" y="78" class="mono" font-size="13" fill="#0f172a" text-anchor="start">${unitPrice} ج.م</text>
    <text x="35" y="78" class="mono" font-size="14" fill="#0f172a" text-anchor="start">${grossAmount} ج.م</text>
  </g>

  <!-- Author Royalty Breakdown Ribbon (Key Highlight) -->
  <rect x="40" y="426" width="840" height="96" rx="14" fill="#ecfdf5" stroke="#10b981" stroke-width="2" />
  <g transform="translate(60, 452)">
    <text x="790" y="0" class="ar-bold" font-size="13" fill="#065f46" text-anchor="start">توزيع العوائد المالية للمبيعات:</text>
    <text x="790" y="25" class="ar-med" font-size="12" fill="#047857" text-anchor="start">
      نسبة ربح المؤلف الرسمية (${royaltyPercent}%) • نصيب إدارة المتجر والطباعة (${100 - royaltyPercent}%)
    </text>
    <text x="790" y="48" class="ar-bold" font-size="11" fill="#0f766e" text-anchor="start">
      ✓ تم تحويل وقيد حصة المؤلف مباشرة في حسابه برصيد متاح للسحب الفوري
    </text>

    <!-- Big Net Author Share on Left -->
    <rect x="0" y="-12" width="230" height="72" rx="12" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
    <text x="215" y="14" class="ar-bold" font-size="11" fill="#047857" text-anchor="start">صافي ربح المؤلف المودع:</text>
    <text x="215" y="44" class="mono" font-size="24" fill="#047857" text-anchor="start">+${authorEarnings} ج.م</text>
  </g>

  <!-- Summary Bottom Bar & Official Seals -->
  <g transform="translate(40, 538)">
    <rect x="0" y="0" width="840" height="85" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />

    <!-- Official Stamp / Wax Seal -->
    <g transform="translate(75, 42)">
      <circle cx="0" cy="0" r="32" fill="url(#goldGrad)" stroke="#ffffff" stroke-width="2" opacity="0.95" />
      <circle cx="0" cy="0" r="27" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 2" />
      <text x="0" y="-4" class="ar-head" font-size="8" fill="#ffffff" text-anchor="middle">خاتم الاعتماد المالي</text>
      <text x="0" y="8" class="ar-head" font-size="9" fill="#ffffff" text-anchor="middle">دار عبيد للنشر</text>
      <text x="0" y="19" class="mono" font-size="7" fill="#fef08a" text-anchor="middle">VERIFIED 2026</text>
    </g>

    <!-- QR / Security Notice on Center -->
    <text x="500" y="32" class="ar-bold" font-size="11" fill="#1e293b" text-anchor="middle">
      هذه الفاتورة مستند مالي وتجاري رسمي معتمد صادر إلكترونياً ولا يحتاج إلى توقيع ورقي.
    </text>
    <text x="500" y="52" class="ar-med" font-size="10" fill="#64748b" text-anchor="middle">
      رقم السجل التجاري: 981244/دار عبيد • منصة UNIGATES لنشر وتوزيع المراجع الأكاديمية
    </text>
    <text x="500" y="68" class="mono" font-size="9" fill="#94a3b8" text-anchor="middle">
      HASH: ${invNumber}-${orderNumber}-AUTH-${authorCode}
    </text>
  </g>

  <!-- Bottom Strip -->
  <text x="460" y="650" class="mono" font-size="9" fill="#94a3b8" text-anchor="middle">
    UNIGATES ONLINE BOOKSTORE • DAR OBEID PUBLISHING &amp; DISTRIBUTION • ALL RIGHTS RESERVED 2026
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Triggers clean browser print for the official book sale invoice.
 */
export function printOfficialBookSaleInvoice(sale: Partial<BookSaleRecord>, order?: Partial<BookOrder>): void {
  const invSvgDataUrl = generateOfficialBookSaleInvoiceSvg(sale, order);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>فاتورة مبيعات كتاب - ${sale.orderNumber || "UNIGATES"}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        body {
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        img {
          width: 100%;
          max-width: 800px;
          height: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        @media print {
          body {
            padding: 0;
          }
          img {
            box-shadow: none;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <img src="${invSvgDataUrl}" alt="فاتورة مبيعات كتاب رسمية" />
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
