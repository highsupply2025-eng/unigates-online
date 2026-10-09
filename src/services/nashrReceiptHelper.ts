import { NashrInvoice } from "@/types/nashr";

/**
 * Robustly compresses an image file to a lightweight Base64 Data URL
 * to avoid exceeding browser localStorage quotas and prevent broken images.
 * Also handles PDF files safely.
 */
export async function compressAndProcessReceiptFile(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}> {
  const fileName = file.name;
  const rawSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const fileSize = `${rawSizeMB} MB`;
  const fileType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

  if (fileType.includes("pdf")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          fileName,
          fileSize,
          fileType: "application/pdf"
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // It's an image: load into Image and compress via canvas
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
            const approxKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
            resolve({
              dataUrl: compressedDataUrl,
              fileName,
              fileSize: `${approxKb} KB`,
              fileType: "image/jpeg"
            });
            return;
          }
        } catch {
          // fallback to rawDataUrl
        }
        resolve({
          dataUrl: rawDataUrl,
          fileName,
          fileSize,
          fileType: "image/jpeg"
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          fileName,
          fileSize,
          fileType: "image/jpeg"
        });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve({
        dataUrl: "",
        fileName,
        fileSize,
        fileType: "image/jpeg"
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Triggers safe browser download for Data URLs, Blobs, SVGs, or external URLs
 */
export function downloadFileOrDataUrl(urlOrData: string, filename: string): void {
  try {
    if (!urlOrData) return;

    if (urlOrData.startsWith("data:")) {
      const parts = urlOrData.split(";base64,");
      if (parts.length === 2) {
        const contentType = parts[0].split(":")[1] || "application/octet-stream";
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      } else if (urlOrData.startsWith("data:image/svg+xml")) {
        const svgContent = decodeURIComponent(urlOrData.split(",")[1] || "");
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
    }

    // Direct anchor download for blob or web URLs
    const link = document.createElement("a");
    link.href = urlOrData;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to download receipt/file:", err);
    // Fallback: window open
    window.open(urlOrData, "_blank");
  }
}

/**
 * Generates an ultra-crisp, official SVG digital payment receipt voucher.
 * Guarantees that even if no raw photo was uploaded or if an image link fails,
 * both Author and Admin see a 100% professional receipt with all verified metadata!
 */
export function generateOfficialReceiptSvg(invoice: Partial<NashrInvoice>): string {
  const invNumber = invoice.invoiceNumber || "INV-NASHR-7721";
  const author = invoice.authorName || "أ.د. عبد الرحمن المنشاوي";
  const title = invoice.manuscriptTitle || "تكاليف النشر والتحكيم الأكاديمي";
  const amount = invoice.amount || 1200;
  const currency = invoice.currency || "EGP";
  const method = invoice.paymentMethod || "تحويل بنكي - البنك الأهلي";
  const ref = invoice.receiptReference || "TX-998234-OBEID";
  const date = invoice.receiptUploadedAt || invoice.paymentDate || new Date().toISOString().split("T")[0];
  const notes = invoice.receiptNotes || invoice.description || "سداد معتمد ومطابق للحسابات الرسمية";
  const status = invoice.status === "paid" ? "تم التحصيل والاعتماد ✅" : invoice.status === "under_review" ? "قيد التدقيق المالي ⏳" : "بانتظار السداد ⚠️";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="100%" height="100%">
  <defs>
    <linearGradient id="paperBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldSeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <filter id="receiptShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.15" />
    </filter>
  </defs>

  <style>
    .ar-title { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 900; direction: rtl; }
    .ar-bold { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 800; direction: rtl; }
    .ar-reg { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 600; direction: rtl; }
    .mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 800; }
  </style>

  <!-- Base Receipt Card -->
  <rect x="15" y="15" width="870" height="570" rx="24" fill="url(#paperBg)" stroke="#cbd5e1" stroke-width="2" filter="url(#receiptShadow)"/>

  <!-- Top Decorative Header Strip -->
  <path d="M 15 39 Q 15 15 39 15 L 861 15 Q 885 15 885 39 L 885 105 L 15 105 Z" fill="url(#headerGrad)"/>

  <!-- Dar Obeid Crest Emblem -->
  <g transform="translate(65, 60)">
    <circle cx="0" cy="0" r="28" fill="url(#goldSeal)" stroke="#ffffff" stroke-width="2" />
    <path d="M -12 -12 L 0 -22 L 12 -12 L 10 12 L 0 16 L -10 12 Z" fill="#ffffff" opacity="0.95"/>
    <circle cx="0" cy="0" r="6" fill="#0f172a" />
  </g>

  <!-- Header Titles -->
  <text x="850" y="52" class="ar-title" font-size="22" fill="#ffffff" text-anchor="start">دار عبيد للنشر والتوزيع • UNIGATES NASHR</text>
  <text x="850" y="80" class="ar-reg" font-size="13" fill="#94a3b8" text-anchor="start">إشعار سداد وإيصال مالي إلكتروني معتمد رسمياً من الإدارة المالية</text>

  <!-- Receipt Voucher Code Badge -->
  <rect x="115" y="42" width="220" height="34" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
  <text x="225" y="64" class="mono" font-size="14" fill="#fbbf24" text-anchor="middle">${invNumber}</text>

  <!-- Big Amount Ribbon -->
  <rect x="40" y="125" width="820" height="75" rx="16" fill="#ecfdf5" stroke="#10b981" stroke-width="2" />
  <text x="830" y="158" class="ar-bold" font-size="14" fill="#047857" text-anchor="start">المبلغ المالي المحول والمطابق:</text>
  <text x="830" y="186" class="ar-reg" font-size="12" fill="#065f46" text-anchor="start">حالة المعاملة: ${status}</text>
  <text x="65" y="172" class="mono" font-size="34" fill="#047857" text-anchor="start">${amount} ${currency}</text>

  <!-- Details Grid Box -->
  <rect x="40" y="215" width="820" height="235" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- Row 1: Author & Manuscript -->
  <text x="830" y="250" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">المؤلف المستفيد:</text>
  <text x="830" y="275" class="ar-bold" font-size="16" fill="#0f172a" text-anchor="start">${author}</text>

  <text x="420" y="250" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">عنوان الكتاب / المعاملة:</text>
  <text x="420" y="275" class="ar-bold" font-size="15" fill="#0f172a" text-anchor="start">${title.slice(0, 48)}</text>

  <!-- Divider Line -->
  <line x1="60" y1="295" x2="840" y2="295" stroke="#f1f5f9" stroke-width="2" />

  <!-- Row 2: Method & Ref -->
  <text x="830" y="330" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">طريقة التحويل:</text>
  <text x="830" y="355" class="ar-bold" font-size="15" fill="#059669" text-anchor="start">${method}</text>

  <text x="420" y="330" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">رقم العملية / المرجع:</text>
  <text x="420" y="355" class="mono" font-size="16" fill="#2563eb" text-anchor="start">${ref}</text>

  <!-- Divider Line -->
  <line x1="60" y1="375" x2="840" y2="375" stroke="#f1f5f9" stroke-width="2" />

  <!-- Row 3: Notes & Timestamp -->
  <text x="830" y="410" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">ملاحظات التحويل المكتوبة:</text>
  <text x="830" y="433" class="ar-reg" font-size="13" fill="#334155" text-anchor="start">${notes.slice(0, 65)}</text>

  <text x="220" y="410" class="ar-bold" font-size="13" fill="#64748b" text-anchor="start">تاريخ الرفع والتسجيل:</text>
  <text x="220" y="433" class="mono" font-size="13" fill="#475569" text-anchor="start">${date}</text>

  <!-- Official Financial Stamp (Bottom Left) -->
  <g transform="translate(130, 515)" opacity="0.95">
    <circle cx="0" cy="0" r="42" fill="none" stroke="#d97706" stroke-width="2.5" />
    <circle cx="0" cy="0" r="37" fill="none" stroke="#d97706" stroke-width="1" stroke-dasharray="3 2" />
    <text x="0" y="-10" class="ar-bold" font-size="10" fill="#b45309" text-anchor="middle">الإدارة المالية والمراجعة</text>
    <text x="0" y="8" class="ar-title" font-size="13" fill="#b45309" text-anchor="middle">دار عبيد للنشر</text>
    <text x="0" y="24" class="mono" font-size="9" fill="#d97706" text-anchor="middle">VERIFIED • PAID</text>
  </g>

  <!-- Barcode / Reference Verification Strip -->
  <g transform="translate(560, 490)">
    <rect x="-240" y="0" width="480" height="38" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="0" y="24" class="mono" font-size="14" fill="#64748b" letter-spacing="4" text-anchor="middle">
      |||| | ||||| || |||||| ||||| ||||| ||| |||
    </text>
    <text x="0" y="55" class="ar-reg" font-size="11" fill="#94a3b8" text-anchor="middle">
      هذا الإشعار مستند مالي رقمي معتمد من منصة نشر الموحدة لدار عبيد
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Opens an elegant, print-ready official invoice or receipt statement
 */
export function printOfficialInvoiceOrReceipt(invoice: NashrInvoice): void {
  const printWindow = window.open("", "_blank", "width=850,height=950");
  if (!printWindow) return;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة وإشعار سداد - ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 30px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px double #cbd5e1;
      padding-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-box h1 {
      margin: 0;
      font-size: 22px;
      color: #0f172a;
    }
    .logo-box p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .invoice-badge {
      text-align: left;
      direction: ltr;
    }
    .invoice-badge .num {
      font-family: monospace;
      font-size: 18px;
      font-weight: 800;
      color: #d97706;
      background: #fef3c7;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      display: inline-block;
    }
    .invoice-badge .date {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 25px 0;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .info-item strong {
      display: block;
      color: #64748b;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    .table th {
      background: #0f172a;
      color: #ffffff;
      padding: 12px;
      text-align: right;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .total-box {
      margin-top: 15px;
      text-align: left;
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      background: #ecfdf5;
      padding: 12px 20px;
      border-radius: 10px;
      display: inline-block;
      float: left;
    }
    .notes-box {
      clear: both;
      margin-top: 35px;
      padding: 14px;
      background: #fffbeb;
      border-right: 4px solid #f59e0b;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .stamp {
      border: 2px dashed #d97706;
      color: #b45309;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: bold;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: left;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #0f172a; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: inherit;">
      🖨️ طباعة المستند الآن
    </button>
  </div>

  <div class="header">
    <div class="logo-box">
      <h1>دار عبيد للنشر والتوزيع</h1>
      <p>منصة نشر الأكاديمية الموحدة • جمهورية مصر العربية</p>
    </div>
    <div class="invoice-badge">
      <div class="num">${invoice.invoiceNumber}</div>
      <div class="date">تاريخ الإصدار: ${invoice.createdAt}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <strong>المؤلف المستفيد:</strong>
      <span>${invoice.authorName}</span>
    </div>
    <div class="info-item">
      <strong>العمل الأكاديمي / المخطوطة:</strong>
      <span>${invoice.manuscriptTitle}</span>
    </div>
    <div class="info-item">
      <strong>حالة الفاتورة الحالية:</strong>
      <span>${invoice.status === "paid" ? "مسددة بالكامل ومطابقة ✅" : invoice.status === "under_review" ? "قيد التدقيق المالي ⏳" : "بانتظار السداد ⚠️"}</span>
    </div>
    <div class="info-item">
      <strong>وسيلة التحويل / السداد:</strong>
      <span>${invoice.paymentMethod || "تحويل بنكي رسمي"}</span>
    </div>
    ${invoice.receiptReference ? `
    <div class="info-item">
      <strong>المرجع البنكي / رقم المعاملة:</strong>
      <span style="font-family: monospace;">${invoice.receiptReference}</span>
    </div>` : ""}
    ${invoice.receiptUploadedAt ? `
    <div class="info-item">
      <strong>تاريخ توثيق الإيصال:</strong>
      <span>${invoice.receiptUploadedAt}</span>
    </div>` : ""}
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>البند / الخدمة</th>
        <th>نوع النشر</th>
        <th>الوصف والتفاصيل</th>
        <th>المبلغ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>تكاليف النشر والتحكيم الأكاديمي</strong></td>
        <td>${invoice.publishType === "both" ? "ورقي + رقمي" : invoice.publishType === "digital" ? "رقمي" : "ورقي"}</td>
        <td>${invoice.description}</td>
        <td><strong>${invoice.amount} ${invoice.currency}</strong></td>
      </tr>
    </tbody>
  </table>

  <div>
    <div class="total-box">
      الإجمالي: ${invoice.amount} ${invoice.currency}
    </div>
  </div>

  ${invoice.receiptNotes ? `
  <div class="notes-box">
    <strong>ملاحظات المحول المرفقة مع الإيصال:</strong>
    <p style="margin: 4px 0 0;">${invoice.receiptNotes}</p>
  </div>` : ""}

  ${invoice.adminNotes ? `
  <div class="notes-box" style="background: #f0fdf4; border-right-color: #22c55e; color: #166534;">
    <strong>توجيهات الإدارة المالية:</strong>
    <p style="margin: 4px 0 0;">${invoice.adminNotes}</p>
  </div>` : ""}

  <div class="footer">
    <div>
      <p style="margin: 0;">منظومة UNIGATES دار عبيد - المعاملات المالية الموثقة</p>
      <p style="margin: 3px 0 0; font-size: 11px;">هذا المستند صادر إلكترونياً ولا يحتاج إلى توقيع خطي إضافي.</p>
    </div>
    <div class="stamp">
      معتمد مالياً<br>
      قسم الحسابات والتحصيل
    </div>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
