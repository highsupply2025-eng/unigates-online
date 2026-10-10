import { 
  AuthorProfile, 
  ManuscriptSubmission, 
  NashrInvoice, 
  NashrMessage, 
  BookSaleRecord, 
  PayoutRequest,
  AuthorContract,
  PublishType
} from "@/types/nashr";
import { NashrFileStore } from "./nashrFileStore";

const STORAGE_KEYS = {
  CURRENT_AUTHOR: "nashr_current_author",
  ALL_AUTHORS: "nashr_all_authors",
  SUBMISSIONS: "nashr_submissions",
  INVOICES: "nashr_invoices",
  MESSAGES: "nashr_messages",
  SALES: "nashr_book_sales",
  PAYOUTS: "nashr_payouts",
  CONTRACTS: "nashr_author_contracts"
};

// Default Demo Author
export const DEFAULT_DEMO_AUTHOR: AuthorProfile = {
  id: "auth-2026-001",
  authorCode: "AUT-7890",
  fullName: "أ.د. عبد الرحمن المنشاوي",
  academicTitle: "prof",
  academicTitleLabel: "أستاذ دكتور",
  specialization: "العلوم السياسية والدراسات الاستراتيجية",
  institution: "جامعة القاهرة - كلية الاقتصاد والعلوم السياسية",
  email: "author@unigates.online",
  phone: "+20 100 123 4567",
  bio: "أستاذ الدراسات الاستراتيجية، مؤلف 8 كتب علمية وأكاديمية منشورة، وباحث مهتم بالتحول الجيوسياسي والذكاء الاصطناعي في التعليم العالي.",
  avatarUrl: "",
  isTemporaryPassword: true,
  verificationStatus: "approved",
  joinedDate: "2026-01-15",
  bankDetails: {
    accountHolder: "عبد الرحمن أحمد المنشاوي",
    bankName: "البنك الأهلي المصري",
    ibanOrAccount: "EG380002000100000012345678901",
    electronicWallet: "+201001234567"
  }
};

// Default Initial Submissions
const INITIAL_SUBMISSIONS: ManuscriptSubmission[] = [
  {
    id: "sub-101",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    title: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    category: "دراسات إدارية وأكاديمية",
    publishType: "both",
    synopsis: "دراسة شاملة وتطبيقية حول رقمنة سلاسل الاعتماد الأكاديمي، تأمين الاختبارات الجامعية، وتطوير آليات التدريس الذكي في ظل الثورة الصناعية الرابعة.",
    pageCount: 284,
    language: "العربية",
    status: "published",
    submissionDate: "2026-02-10",
    adminFeedback: "تمت مراجعة الملفات والتدقيق اللغوي وتنسيق الغلاف الرسمي من قبل دار عبيد. الكتاب معتمد ومدرج بمتجر UNIGATES.",
    storeBookCode: "BK-DAR-4491",
    storeUrl: "/book-store?code=BK-DAR-4491",
    priceEstimate: 140
  },
  {
    id: "sub-102",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    title: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
    category: "أدلة علمية وأكاديمية",
    publishType: "digital",
    synopsis: "دليل إرشادي خطوة بخطوة للأساتذة وطلاب الدراسات العليا لإعداد الأوراق البحثية، اختيار المجلات المصنفة (Scopus / WoS)، وإدارة الاستشهادات.",
    pageCount: 195,
    language: "العربية",
    status: "published",
    submissionDate: "2026-03-01",
    adminFeedback: "تم إدراج الإصدار الرقمي في متجر الكتب وتفعيل القراءة الفورية عبر تطبيقات UNIGATES.",
    storeBookCode: "BK-DAR-8821",
    storeUrl: "/book-store?code=BK-DAR-8821",
    priceEstimate: 85
  },
  {
    id: "sub-103",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    title: "الذكاء الاصطناعي والقانون الدولي الإنساني: تحديات السيادة والمسؤولية",
    category: "قانون وعلوم سياسية",
    publishType: "both",
    synopsis: "دراسة بحثية حديثة تتناول الأطر التشريعية والأخلاقية لاستخدام خوارزميات الذكاء الاصطناعي في النزاعات والعلاقات الدولية.",
    pageCount: 320,
    language: "العربية",
    status: "pending_review",
    submissionDate: "2026-09-20",
    adminFeedback: "الملفات قيد الفحص الأكاديمي ولجنة القراءة والتقييم الفني في دار عبيد للنشر.",
    priceEstimate: 160
  }
];

// Default Invoices
const INITIAL_INVOICES: NashrInvoice[] = [
  {
    id: "inv-2026-01",
    invoiceNumber: "INV-NASHR-7721",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    manuscriptTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    amount: 1850,
    currency: "EGP",
    publishType: "both",
    description: "رسوم التدقيق اللغوي الأكاديمي، تصميم الغلاف الحصري، وتنسيق الطباعة الفاخرة للنسخ الورقية والإيداع الرقمي.",
    status: "paid",
    paymentMethod: "تحويل بنكي - البنك الأهلي",
    paymentDate: "2026-02-14",
    receiptReference: "TX-EGY-781920",
    receiptNotes: "تم سداد رسوم التدقيق والغلاف عبر حساب البنك الأهلي المصري، مع التحية.",
    receiptUploadedAt: "2026-02-14 11:30 ص",
    createdAt: "2026-02-12"
  },
  {
    id: "inv-2026-02",
    invoiceNumber: "INV-NASHR-8910",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    manuscriptTitle: "الذكاء الاصطناعي والقانون الدولي الإنساني",
    amount: 1200,
    currency: "EGP",
    publishType: "both",
    description: "رسوم التحكيم العلمي والتجهيز الفني للنشر المزدوج (ورقي ورقمي) شاملة الرقم المعياري الدولي (ISBN).",
    status: "unpaid",
    createdAt: "2026-09-22"
  }
];

// Default Internal Chat Messages
const INITIAL_MESSAGES: NashrMessage[] = [
  {
    id: "msg-1",
    sender: "admin",
    senderName: "إدارة دار عبيد للنشر والتوزيع",
    senderTitle: "فريق الإشراف والتدقيق",
    text: "أهلاً ومرحباً بحضرتكم د. عبد الرحمن في منصة نشر الموحدة. يسعدنا استقبال مخطوطاتكم الأكاديمية ونحن في خدمتكم في أي استفسار يخص التحكيم، الغلاف، أو الطباعة.",
    timestamp: "2026-02-10 10:30 ص",
    read: true
  },
  {
    id: "msg-2",
    sender: "author",
    senderName: "أ.د. عبد الرحمن المنشاوي",
    senderTitle: "مؤلف",
    text: "شكراً جزيلاً لكم. قمت برفع مسودة كتاب 'مستقبل الحوكمة الرقمية'، وأرجو الاهتمام بجودة الورق والخطوط الأكاديمية المعتمدة في الهوامش والمراجع.",
    timestamp: "2026-02-10 11:15 ص",
    read: true
  },
  {
    id: "msg-3",
    sender: "admin",
    senderName: "إدارة دار عبيد للنشر والتوزيع",
    senderTitle: "رئيس قسم الإنتاج الفني",
    text: "تم استلام الملاحظة بدقة، وسيتم تزويدكم بنسخة تجريبية للغلاف والتنسيق الداخلي قبل البدء في سحب كميات الطباعة الورقية والإدراج في المتجر.",
    timestamp: "2026-02-11 02:45 م",
    read: true
  },
  {
    id: "msg-4",
    sender: "admin",
    senderName: "إدارة دار عبيد للنشر والتوزيع",
    senderTitle: "شئون المبيعات والمؤلفين",
    text: "نحيطكم علماً بأن مبيعات كتبكم في متجر الكتب تسير بشكل ممتاز ويتم قيد نسب الأرباح في محفظتكم لحظياً فور اكتمال كل طلب (70% للنسخ الرقمية و30% للنسخ المطبوعة).",
    timestamp: "2026-09-25 04:10 م",
    read: true
  }
];

// Default Sales (70% Author Royalty for Digital, 30% for Print) - clean slate for live orders
const INITIAL_SALES: BookSaleRecord[] = [];

// Default Payout History - clean slate for author payout requests
const INITIAL_PAYOUTS: PayoutRequest[] = [];

// Default Initial Official Publishing Contracts
export const INITIAL_CONTRACTS: AuthorContract[] = [
  {
    id: "cnt-101",
    contractNumber: "CNT-2026-0482",
    submissionId: "sub-101",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    category: "دراسات إدارية وأكاديمية",
    publishType: "both",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    digitalRoyaltyRate: 70,
    printRoyaltyRate: 30,
    rightsDurationYears: 5,
    exclusiveRights: true,
    retailPriceEstimate: 140,
    status: "signed",
    issueDate: "2026-02-12",
    signedDate: "2026-02-14",
    adminSignature: {
      signedByName: "د. عبيد بن عيسى",
      role: "المدير التنفيذي لدار عبيد للنشر والتوزيع",
      signedAt: "2026-02-12",
      sealNumber: "SEAL-DO-2026-01"
    },
    authorSignature: {
      signatureText: "أ.د. عبد الرحمن المنشاوي",
      signedAt: "2026-02-14 11:30 ص",
      ipOrRef: "DIGI-SIGN-9921"
    },
    specialConditions: "يشمل العقد الإدراج التلقائي في المنصة الرقمية ومتجر UNIGATES مع أولوية العرض في معارض الكتاب الدولية السنوية."
  },
  {
    id: "cnt-103",
    contractNumber: "CNT-2026-0915",
    submissionId: "sub-103",
    bookTitle: "الذكاء الاصطناعي والقانون الدولي الإنساني: تحديات السيادة والمسؤولية",
    category: "قانون وعلوم سياسية",
    publishType: "both",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    digitalRoyaltyRate: 70,
    printRoyaltyRate: 30,
    rightsDurationYears: 5,
    exclusiveRights: true,
    retailPriceEstimate: 160,
    status: "pending_signature",
    issueDate: "2026-10-10",
    adminSignature: {
      signedByName: "د. عبيد بن عيسى",
      role: "المدير التنفيذي لدار عبيد للنشر والتوزيع",
      signedAt: "2026-10-10",
      sealNumber: "SEAL-DO-2026-09"
    },
    specialConditions: "يحق للناشر البدء في تجهيز المخطوطة للطباعة الفاخرة فور توقيع المؤلف على هذا العقد."
  }
];

export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(",");
    const meta = parts[0];
    const data = parts[1] || "";
    const mimeMatch = meta.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/svg+xml";

    if (meta.includes(";base64")) {
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
    } else {
      const decodedData = decodeURIComponent(data);
      return new Blob([decodedData], { type: mime });
    }
  } catch (err) {
    console.error("[nashrDataStore] dataUrlToBlob error:", err);
    return new Blob([dataUrl], { type: "image/svg+xml" });
  }
}

export function generateSampleContractSvg(contract: AuthorContract): string {
  const contractNum = contract.contractNumber || "CNT-2026-0001";
  const authorName = contract.authorName || "المؤلف الكريم";
  const authorCode = contract.authorCode || "AUT-XXXX";
  const bookTitle = contract.bookTitle || "مصنف أكاديمي";
  const category = contract.category || "دراسات وأبحاث أكاديمية";
  const issueDate = contract.issueDate || "2026-10-10";
  const duration = contract.rightsDurationYears || 5;
  const digiRate = contract.digitalRoyaltyRate ?? 70;
  const printRate = contract.printRoyaltyRate ?? 30;
  const isSigned = contract.status === "signed";
  const signedDate = contract.signedDate || contract.authorSignature?.signedAt || "2026-10-10";
  const authorSignText = contract.authorSignature?.signatureText || authorName;
  const sealNum = contract.adminSignature?.sealNumber || "SEAL-DO-2026";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1320" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#fafbfd"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="0.5" opacity="0.6"/>
    </pattern>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.15"/>
    </filter>
  </defs>

  <style>
    .t-title { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 900; }
    .t-bold { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 800; }
    .t-semi { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 600; }
    .t-regular { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 400; }
    .t-mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 700; }
  </style>

  <!-- Page Background & Borders -->
  <rect x="0" y="0" width="900" height="1320" fill="url(#bgGrad)"/>
  <rect x="15" y="15" width="870" height="1290" fill="none" stroke="#d97706" stroke-width="2.5" opacity="0.6" rx="16"/>
  <rect x="25" y="25" width="850" height="1270" fill="none" stroke="#0f172a" stroke-width="1.5" rx="12"/>
  <rect x="26" y="26" width="848" height="1268" fill="url(#gridPattern)" rx="12"/>

  <!-- Official Header Band -->
  <g transform="translate(45, 45)">
    <text x="810" y="32" class="t-title" font-size="22" fill="#0f172a" text-anchor="end" direction="rtl">دار عبيد للنشر والتوزيع</text>
    <text x="810" y="54" class="t-semi" font-size="12" fill="#d97706" text-anchor="end" direction="rtl">مؤسسة نشر وطباعة وتوزيع معتمدة • عضو اتحاد الناشرين</text>
    <text x="810" y="72" class="t-regular" font-size="10.5" fill="#64748b" text-anchor="end" direction="rtl">بالشراكة مع منصة UNIGATES الأكاديمية الدولية</text>

    <!-- Center: Crest / Seal Icon -->
    <g transform="translate(405, 40)">
      <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="2.5" filter="url(#shadow)"/>
      <path d="M -14 10 L 0 -18 L 14 10 L 0 5 Z" fill="url(#goldGrad)"/>
      <circle cx="0" cy="-2" r="5" fill="#ffffff"/>
    </g>

    <!-- Left: Contract Number & Date -->
    <rect x="0" y="10" width="220" height="66" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
    <text x="15" y="32" class="t-mono" font-size="11" fill="#64748b">CONTRACT REF:</text>
    <text x="15" y="49" class="t-mono" font-size="13" font-weight="900" fill="#0f172a">${contractNum}</text>
    <text x="15" y="66" class="t-regular" font-size="10.5" fill="#64748b">تاريخ التحرير: ${issueDate}</text>
  </g>

  <!-- Horizontal Divider Line -->
  <line x1="45" y1="140" x2="855" y2="140" stroke="#0f172a" stroke-width="2"/>
  <line x1="45" y1="144" x2="855" y2="144" stroke="#d97706" stroke-width="1"/>

  <!-- Main Document Title Banner -->
  <g transform="translate(450, 185)">
    <rect x="-350" y="-24" width="700" height="48" rx="12" fill="url(#headerGrad)" filter="url(#shadow)"/>
    <text x="0" y="7" class="t-title" font-size="20" fill="#fbbf24" text-anchor="middle" direction="rtl">
      عقد طبع ونشر وتوزيع مصنّف فكري وأكاديمي
    </text>
  </g>
  <text x="450" y="224" class="t-mono" font-size="10" fill="#64748b" text-anchor="middle" letter-spacing="2">
    OFFICIAL PUBLISHING &amp; DISTRIBUTION AGREEMENT • DAR OBEID
  </text>

  <!-- Preamble -->
  <g transform="translate(855, 255)">
    <text x="0" y="0" class="t-semi" font-size="12" fill="#334155" text-anchor="end" direction="rtl">
      إنه في يوم المذكور أعلاه، تم الاتفاق بالتراضي التام والإيجاب والقبول بين كل من:
    </text>
  </g>

  <!-- Parties Box -->
  <g transform="translate(45, 275)">
    <rect x="0" y="0" width="810" height="135" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
    
    <!-- First Party -->
    <g transform="translate(790, 25)">
      <circle cx="0" cy="0" r="12" fill="#0f172a"/>
      <text x="0" y="4" class="t-bold" font-size="11" fill="#ffffff" text-anchor="middle">١</text>
      <text x="-20" y="4" class="t-bold" font-size="13" fill="#0f172a" text-anchor="end" direction="rtl">الطرف الأول (الناشر): دار عبيد للنشر والتوزيع (ش.ذ.م.م)</text>
      <text x="-20" y="24" class="t-regular" font-size="11" fill="#475569" text-anchor="end" direction="rtl">
        سجل تجاري: 104928 • يمثلها في هذا العقد: د. عبيد بن عيسى (المدير التنفيذي) • القاهرة، مصر.
      </text>
    </g>

    <line x1="20" y1="68" x2="790" y2="68" stroke="#f1f5f9" stroke-width="1.5"/>

    <!-- Second Party -->
    <g transform="translate(790, 92)">
      <circle cx="0" cy="0" r="12" fill="#d97706"/>
      <text x="0" y="4" class="t-bold" font-size="11" fill="#ffffff" text-anchor="middle">٢</text>
      <text x="-20" y="4" class="t-bold" font-size="13" fill="#0f172a" text-anchor="end" direction="rtl">الطرف الثاني (المؤلف): ${authorName}</text>
      <text x="-20" y="24" class="t-regular" font-size="11" fill="#475569" text-anchor="end" direction="rtl">
        كود المؤلف المعتمد: [${authorCode}] • صاحب ومؤلف المصنف موضوع هذا العقد والمتحمل لمسؤوليته الأدبية والعلمية.
      </text>
    </g>
  </g>

  <!-- Book Details Box -->
  <g transform="translate(45, 425)">
    <rect x="0" y="0" width="810" height="75" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="790" y="28" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">عنوان المصنف المعتمد:</text>
    <text x="790" y="52" class="t-title" font-size="15" fill="#d97706" text-anchor="end" direction="rtl">"${bookTitle}"</text>
    
    <text x="350" y="28" class="t-semi" font-size="11" fill="#64748b" text-anchor="end" direction="rtl">التصنيف الأكاديمي: ${category}</text>
    <text x="350" y="52" class="t-semi" font-size="11" fill="#047857" text-anchor="end" direction="rtl">طبيعة الإصدار: نشر رقمي وورقي معتمد (متجر الكتب والمعارض)</text>
  </g>

  <!-- Contract Clauses -->
  <g transform="translate(855, 530)">
    <text x="0" y="0" class="t-title" font-size="14" fill="#0f172a" text-anchor="end" direction="rtl">بنود وشروط الاتفاقية الملزمة:</text>

    <!-- Clause 1 -->
    <g transform="translate(0, 30)">
      <text x="0" y="0" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">البند الأول (حقوق النشر والتوزيع الحصري):</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        يمنح الطرف الثاني الطرف الأول الحق الحصري في طباعة ونشر وترجمة وتوزيع المصنف ورقياً وإلكترونياً في جميع أنحاء العالم لمدة (${duration} سنوات)
      </text>
      <text x="0" y="38" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        تبدأ من تاريخ توقيع هذا العقد، وتتجدد تلقائياً لمدد مماثلة ما لم يخطر أحد الطرفين الآخر كتابياً قبل الانتهاء بثلاثة أشهر.
      </text>
    </g>

    <!-- Clause 2 -->
    <g transform="translate(0, 95)">
      <text x="0" y="0" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">البند الثاني (عوائد المؤلف ونسب الأرباح):</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        يستحق الطرف الثاني (المؤلف) نسبة عوائد قدرها (${digiRate}%) من سعر بيع النسخ الرقمية الإلكترونية (E-Book) المباعة عبر المنصة،
      </text>
      <text x="0" y="38" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        ونسبة قدرها (${printRate}%) من سعر بيع النسخ الورقية المطبوعة. وتضاف حصة الأرباح لمحفظة المؤلف مباشرة وفورياً مع كل عملية بيع مؤكدة.
      </text>
    </g>

    <!-- Clause 3 -->
    <g transform="translate(0, 160)">
      <text x="0" y="0" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">البند الثالث (التزامات دار النشر - الطرف الأول):</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        تلتزم الدار بتقديم أعلى معايير الجودة للتدقيق اللغوي، التنسيق الداخلي الأكاديمي، إخراج الغلاف الرسمي، استخراج الرقم المعياري الدولي (ISBN)،
      </text>
      <text x="0" y="38" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        والإيداع القانوني المعتمد، والتسويق الإلكتروني عبر متجر UNIGATES والمشاركة في معارض الكتاب الدولية.
      </text>
    </g>

    <!-- Clause 4 -->
    <g transform="translate(0, 225)">
      <text x="0" y="0" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">البند الرابع (الملكية الفكرية والأصالة العلمية):</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        يقر الطرف الثاني بأنه صاحب الحق الفكري الحصري والوحيد للمصنف، وأنه عمل أصيل لا يتضمن أي انتهاك لحقوق ملكية فكرية لأي طرف ثالث،
      </text>
      <text x="0" y="38" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        ويتحمل الطرف الثاني كامل المسؤولية العلمية والأدبية والقانونية عن محتوى مؤلفه أمام كافة الجهات الرسمية والقضائية.
      </text>
    </g>

    <!-- Clause 5 -->
    <g transform="translate(0, 290)">
      <text x="0" y="0" class="t-bold" font-size="12" fill="#0f172a" text-anchor="end" direction="rtl">البند الخامس (الاعتماد الرقمي وحجية العقد):</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        يُعد توقيع المؤلف الرقمي عبر حسابه المعتمد في منصة UNIGATES إقراراً صريحاً وموافقة نهائية وملزمة ونافذة قانوناً لكافة بنود هذا العقد،
      </text>
      <text x="0" y="38" class="t-regular" font-size="11" fill="#334155" text-anchor="end" direction="rtl">
        وتحرر هذا العقد من نسختين إلكترونيتين موثقتين رقمياً ومختومتين يحصل كلا الطرفين على نسخته الرسمية فور الاعتماد.
      </text>
    </g>
  </g>

  <!-- Signatures & Seals Section -->
  <g transform="translate(45, 915)">
    <rect x="0" y="0" width="810" height="260" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
    
    <!-- Left Box: Admin Signature & Seal (Party 1) -->
    <g transform="translate(210, 35)">
      <text x="0" y="0" class="t-bold" font-size="14" fill="#0f172a" text-anchor="middle" direction="rtl">الطرف الأول: دار عبيد للنشر والتوزيع</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#64748b" text-anchor="middle" direction="rtl">د. عبيد بن عيسى - المدير التنفيذي</text>

      <!-- Official Gold & Green Seal -->
      <g transform="translate(0, 95)">
        <circle cx="0" cy="0" r="50" fill="#f8fafc" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="6 3"/>
        <circle cx="0" cy="0" r="42" fill="none" stroke="#047857" stroke-width="1.8"/>
        <text x="0" y="-22" class="t-bold" font-size="9" fill="#047857" text-anchor="middle">DAR OBEID PUBLISHING</text>
        <path d="M -12 0 L 0 -14 L 12 0 L 0 14 Z" fill="url(#goldGrad)"/>
        <text x="0" y="20" class="t-bold" font-size="9.5" fill="#0f172a" text-anchor="middle">خاتم الاعتماد الرسمي</text>
        <text x="0" y="32" class="t-mono" font-size="7.5" fill="#64748b" text-anchor="middle">${sealNum}</text>
      </g>

      <path d="M -60 185 Q -20 165, 10 180 T 60 175" fill="none" stroke="#0f172a" stroke-width="2.5"/>
      <text x="0" y="205" class="t-mono" font-size="9" fill="#16a34a" text-anchor="middle">OFFICIALLY SIGNED &amp; SEALED</text>
    </g>

    <!-- Center Separator -->
    <line x1="405" y1="20" x2="405" y2="240" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Right Box: Author Signature (Party 2) -->
    <g transform="translate(600, 35)">
      <text x="0" y="0" class="t-bold" font-size="14" fill="#0f172a" text-anchor="middle" direction="rtl">الطرف الثاني: المؤلف الأكاديمي</text>
      <text x="0" y="20" class="t-regular" font-size="11" fill="#64748b" text-anchor="middle" direction="rtl">${authorName}</text>

      ${isSigned ? `
      <!-- Author Verified Digital Signature Box -->
      <g transform="translate(0, 90)">
        <rect x="-140" y="-35" width="280" height="70" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
        <text x="0" y="-12" class="t-bold" font-size="12" fill="#047857" text-anchor="middle" direction="rtl">
          ✓ تم التوقيع والموافقة الرقمية
        </text>
        <text x="0" y="8" class="t-title" font-size="14" fill="#0f172a" text-anchor="middle" direction="rtl">
          ${authorSignText}
        </text>
        <text x="0" y="25" class="t-mono" font-size="9" fill="#059669" text-anchor="middle">
          DATE: ${signedDate}
        </text>
      </g>

      <g transform="translate(0, 185)">
        <rect x="-110" y="-12" width="220" height="24" rx="6" fill="#f1f5f9"/>
        <text x="0" y="4" class="t-mono" font-size="9.5" fill="#475569" text-anchor="middle">
          DIGITAL VERIFY: UNIGATES-AUTH-OK
        </text>
      </g>
      ` : `
      <!-- Pending Signature Box -->
      <g transform="translate(0, 95)">
        <rect x="-140" y="-40" width="280" height="80" rx="10" fill="#fffbeb" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/>
        <text x="0" y="-10" class="t-bold" font-size="13" fill="#b45309" text-anchor="middle" direction="rtl">
          بانتظار توقيع واعتماد المؤلف ⏳
        </text>
        <text x="0" y="14" class="t-regular" font-size="10.5" fill="#78350f" text-anchor="middle" direction="rtl">
          يتم التوقيع والموافقة إلكترونياً عبر المنصة
        </text>
      </g>
      <text x="0" y="195" class="t-semi" font-size="10" fill="#94a3b8" text-anchor="middle" direction="rtl">
        توقيع خطي / رقمي معتمد
      </text>
      `}
    </g>
  </g>

  <!-- Legal Footer Bar -->
  <g transform="translate(450, 1220)">
    <line x1="-405" y1="0" x2="405" y2="0" stroke="#cbd5e1" stroke-width="1"/>
    <text x="0" y="20" class="t-regular" font-size="9.5" fill="#64748b" text-anchor="middle" direction="rtl">
      دار عبيد للنشر والتوزيع • جمهورية مصر العربية • منصة UNIGATES • كافة الحقوق القانونية محفوظة • مستند رسمي ملزم
    </text>
    <text x="0" y="36" class="t-mono" font-size="8.5" fill="#94a3b8" text-anchor="middle">
      SECURE HASH: SHA256-${contractNum}-VERIFIED-DOC-AUTH
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const OLD_TEST_AUTHOR_CODES = [
  "AUT-7890",
  "AUT-8555",
  "AUT-7414",
  "AUT-4121",
  "AUT-4933",
  "AUT-9261",
  "auth-2026-001",
  "author-demo-1"
];

// ─────────────────────────────────────────────────────────────
// Robust Vector Document Generators (Permanent SVG Data URIs)
// ─────────────────────────────────────────────────────────────

export function generateSampleAuthorAvatarSvg(fullName?: string, academicTitle?: string): string {
  const safeName = (fullName || "د. السيد محمد عبيد").trim();
  const title = (academicTitle || "دكتور").trim();
  const words = safeName.split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map(w => w[0]).join(" ") || "UG";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <filter id="avatarShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="400" height="400" rx="36" fill="url(#bgGrad)" />
  <circle cx="200" cy="200" r="185" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.3" stroke-dasharray="8 6" />

  <circle cx="200" cy="175" r="115" fill="url(#circleGrad)" stroke="url(#goldGrad)" stroke-width="3.5" filter="url(#avatarShadow)" />

  <!-- Distinguished Academic Bust Silhouette -->
  <path d="M 115 275 C 115 220, 150 215, 200 215 C 250 215, 285 220, 285 275 Z" fill="#0f172a" />
  <path d="M 186 215 L 200 250 L 214 215 Z" fill="#ffffff" />
  <polygon points="196,224 204,224 202,255 198,255" fill="url(#goldGrad)" />
  <rect x="188" y="190" width="24" height="28" rx="6" fill="#cbd5e1" />
  <ellipse cx="200" cy="150" rx="42" ry="50" fill="#e2e8f0" />
  <path d="M 158 145 C 158 110, 242 110, 242 145 C 235 120, 165 120, 158 145 Z" fill="#334155" />
  <circle cx="186" cy="150" r="13" fill="none" stroke="#475569" stroke-width="2.5" />
  <circle cx="214" cy="150" r="13" fill="none" stroke="#475569" stroke-width="2.5" />
  <line x1="199" y1="150" x2="201" y2="150" stroke="#475569" stroke-width="2.5" />

  <!-- Author Name Banner -->
  <g transform="translate(200, 322)">
    <rect x="-145" y="-18" width="290" height="36" rx="18" fill="url(#goldGrad)" filter="url(#avatarShadow)"/>
    <text x="0" y="5" font-family="'Segoe UI', Tahoma, Arial, sans-serif" font-size="14" font-weight="900" fill="#0f172a" text-anchor="middle" direction="rtl">
      ${safeName}
    </text>
  </g>

  <!-- Title Pill -->
  <g transform="translate(200, 366)">
    <rect x="-90" y="-12" width="180" height="24" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <text x="0" y="4" font-family="'Segoe UI', Tahoma, Arial, sans-serif" font-size="11" font-weight="bold" fill="#f59e0b" text-anchor="middle" direction="rtl">
      ${title} • دار عبيد للنشر
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generateSampleNationalIdCardSvg(fullName?: string, authorCode?: string, specialization?: string): string {
  const safeName = (fullName || "د. السيد محمد عبيد").trim();
  const safeCode = (authorCode || "AUT-3111").replace(/\D/g, "") || "3111";
  const nationalIdNum = `2850915010${safeCode.padStart(4, "0").slice(-4)}`;
  const specText = (specialization || "عضو هيئة تدريس - باحث أكاديمي").trim();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="100%" height="100%">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eaf5f2" />
      <stop offset="50%" stop-color="#f4faf8" />
      <stop offset="100%" stop-color="#e2f0ec" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="50%" stop-color="#065f46" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="goldSeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 0 20 Q 20 0, 40 20 T 80 20" fill="none" stroke="#10b981" stroke-width="0.35" opacity="0.18"/>
      <path d="M 0 20 Q 20 40, 40 20 T 80 20" fill="none" stroke="#059669" stroke-width="0.35" opacity="0.18"/>
    </pattern>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter>
  </defs>

  <style>
    .ar-bold { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 800; direction: rtl; }
    .ar-reg { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 600; direction: rtl; }
    .mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 800; }
  </style>

  <!-- Card Border & Background -->
  <rect x="6" y="6" width="844" height="528" rx="28" fill="url(#cardBg)" stroke="#059669" stroke-width="3" filter="url(#cardShadow)"/>
  <rect x="14" y="14" width="828" height="512" rx="22" fill="url(#guilloche)"/>

  <!-- Official Header Bar -->
  <path d="M 14 36 Q 14 14 36 14 L 820 14 Q 842 14 842 36 L 842 85 L 14 85 Z" fill="url(#headerGrad)"/>

  <!-- Eagle of Saladin Crest (Center) -->
  <g transform="translate(428, 48)">
    <circle cx="0" cy="0" r="28" fill="url(#goldSeal)" stroke="#ffffff" stroke-width="1.5" />
    <path d="M -12 -12 L 0 -22 L 12 -12 L 10 10 L 0 16 L -10 10 Z" fill="#ffffff" opacity="0.95"/>
    <rect x="-6" y="-6" width="12" height="14" fill="#d97706" rx="2" />
  </g>

  <!-- Header Text -->
  <text x="815" y="46" class="ar-bold" font-size="22" fill="#ffffff" text-anchor="start">جمهورية مصر العربية</text>
  <text x="815" y="70" class="ar-reg" font-size="14" fill="#a7f3d0" text-anchor="start">وزارة الداخلية • قطاع مصلحة الأحوال المدنية</text>

  <text x="40" y="46" class="ar-bold" font-size="20" fill="#ffffff" text-anchor="start">بطاقة تحقيق الشخصية</text>
  <text x="40" y="68" class="mono" font-size="13" fill="#fbbf24" text-anchor="start">NATIONAL IDENTITY CARD</text>

  <line x1="20" y1="92" x2="836" y2="92" stroke="#059669" stroke-width="2" />

  <!-- Smart Chip -->
  <g transform="translate(50, 130)">
    <rect x="0" y="0" width="76" height="60" rx="10" fill="url(#goldSeal)" stroke="#b45309" stroke-width="1.5" />
    <line x1="0" y1="30" x2="76" y2="30" stroke="#78350f" stroke-width="1" />
    <line x1="38" y1="0" x2="38" y2="60" stroke="#78350f" stroke-width="1" />
    <circle cx="38" cy="30" r="12" fill="none" stroke="#78350f" stroke-width="1.2" />
  </g>

  <!-- Author Photo Box -->
  <g transform="translate(630, 115)">
    <rect x="0" y="0" width="180" height="225" rx="16" fill="#1e293b" stroke="#059669" stroke-width="2.5" />
    <circle cx="90" cy="85" r="45" fill="#f8fafc" />
    <path d="M 30 195 C 30 145, 60 140, 90 140 C 120 140, 150 145, 150 195 Z" fill="#047857" />
    <path d="M 80 140 L 90 165 L 100 140 Z" fill="#ffffff" />
    <circle cx="140" cy="45" r="22" fill="none" stroke="#34d399" stroke-width="1.5" opacity="0.75" stroke-dasharray="3 3"/>
    <text x="90" y="215" class="ar-bold" font-size="11" fill="#a7f3d0" text-anchor="middle">صورة معتمدة رقمياً</text>
  </g>

  <!-- Data Fields -->
  <g transform="translate(600, 125)">
    <text x="0" y="24" class="ar-reg" font-size="13" fill="#047857" text-anchor="start">الاسم الكامل:</text>
    <text x="0" y="58" class="ar-bold" font-size="24" fill="#0f172a" text-anchor="start">${safeName}</text>

    <text x="0" y="98" class="ar-reg" font-size="13" fill="#047857" text-anchor="start">المهنة / الصفة الأكاديمية:</text>
    <text x="0" y="126" class="ar-bold" font-size="17" fill="#1e293b" text-anchor="start">${specText}</text>

    <text x="0" y="165" class="ar-reg" font-size="13" fill="#047857" text-anchor="start">محل الإقامة والتسجيل:</text>
    <text x="0" y="190" class="ar-bold" font-size="16" fill="#334155" text-anchor="start">جمهورية مصر العربية • موثق بالمنظومة</text>
  </g>

  <!-- National ID Number Banner -->
  <g transform="translate(428, 385)">
    <rect x="-385" y="-22" width="770" height="48" rx="14" fill="#064e3b" stroke="#059669" stroke-width="2" />
    <text x="350" y="10" class="ar-bold" font-size="16" fill="#a7f3d0" text-anchor="start">الرقم القومي:</text>
    <text x="-350" y="12" class="mono" font-size="28" fill="#fbbf24" letter-spacing="8" text-anchor="start">${nationalIdNum}</text>
  </g>

  <!-- Machine Readable Zone (MRZ) -->
  <g transform="translate(428, 455)">
    <rect x="-385" y="-12" width="770" height="60" rx="10" fill="#0f172a" />
    <text x="0" y="16" class="mono" font-size="16" fill="#94a3b8" letter-spacing="4" text-anchor="middle">
      IDAR&lt;EGY&lt;${nationalIdNum}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;9
    </text>
    <text x="0" y="38" class="mono" font-size="16" fill="#94a3b8" letter-spacing="4" text-anchor="middle">
      8509153M3205188EGY&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;0
    </text>
  </g>

  <!-- Security Verification Watermark -->
  <g transform="translate(180, 260)" opacity="0.85">
    <circle cx="0" cy="0" r="38" fill="none" stroke="#059669" stroke-width="2" />
    <circle cx="0" cy="0" r="34" fill="none" stroke="#059669" stroke-width="1" stroke-dasharray="4 2" />
    <text x="0" y="-8" class="ar-bold" font-size="10" fill="#047857" text-anchor="middle">مصلحة الأحوال المدنية</text>
    <text x="0" y="8" class="ar-bold" font-size="11" fill="#059669" text-anchor="middle">وثيقة سارية معتمدة</text>
    <text x="0" y="22" class="mono" font-size="9" fill="#047857" text-anchor="middle">VERIFIED • OK</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generateSampleCertificateSvg(
  fullName?: string, 
  titleLabel?: string, 
  specialization?: string, 
  institution?: string, 
  certTitle?: string
): string {
  const safeName = (fullName || "د. السيد محمد عبيد").trim();
  const safeInst = (institution || "المجلس الأعلى للجامعات - جمهورية مصر العربية").trim();
  const safeSpec = (specialization || "العلوم الإنسانية والتربوية").trim();
  const displayCertTitle = certTitle || "شهادة منح درجة الدكتوراه الرسمية";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%">
  <defs>
    <linearGradient id="certBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffdfa" />
      <stop offset="50%" stop-color="#fdfaf2" />
      <stop offset="100%" stop-color="#f8f4e6" />
    </linearGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37" />
      <stop offset="25%" stop-color="#f3e5ab" />
      <stop offset="50%" stop-color="#aa771c" />
      <stop offset="75%" stop-color="#f3e5ab" />
      <stop offset="100%" stop-color="#8a5a00" />
    </linearGradient>
    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <filter id="certShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#1e293b" flood-opacity="0.3"/>
    </filter>
  </defs>

  <style>
    .font-title { font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', serif; font-weight: 900; direction: rtl; }
    .font-body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 600; direction: rtl; }
    .font-sub { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-weight: 700; direction: rtl; }
    .font-mono { font-family: 'Consolas', monospace; }
  </style>

  <!-- Parchment Base -->
  <rect x="10" y="10" width="980" height="680" rx="16" fill="url(#certBg)" filter="url(#certShadow)" />

  <!-- Outer Ornate Gold Border -->
  <rect x="25" y="25" width="950" height="650" rx="12" fill="none" stroke="url(#goldBorder)" stroke-width="8" />
  <rect x="38" y="38" width="924" height="624" rx="8" fill="none" stroke="#1e3a8a" stroke-width="2" />
  <rect x="44" y="44" width="912" height="612" rx="6" fill="none" stroke="url(#goldBorder)" stroke-width="1.5" stroke-dasharray="6 4" />

  <!-- Corner Ornaments -->
  <g fill="url(#goldBorder)">
    <polygon points="25,25 65,25 25,65" />
    <polygon points="975,25 935,25 975,65" />
    <polygon points="25,675 65,675 25,635" />
    <polygon points="975,675 935,675 975,635" />
  </g>

  <!-- Watermark in Center Background -->
  <g transform="translate(500, 350)" opacity="0.06">
    <circle cx="0" cy="0" r="180" fill="none" stroke="#1e3a8a" stroke-width="12" />
    <polygon points="0,-130 112,65 -112,65" fill="#1e3a8a" />
    <polygon points="0,130 112,-65 -112,-65" fill="#1e3a8a" />
  </g>

  <!-- Header Area -->
  <g transform="translate(500, 95)">
    <text x="0" y="0" class="font-sub" font-size="20" fill="#1e3a8a" text-anchor="middle">جمهورية مصر العربية</text>
    <text x="0" y="26" class="font-sub" font-size="16" fill="#475569" text-anchor="middle">وزارة التعليم العالي والبحث العلمي</text>
    <text x="0" y="52" class="font-title" font-size="22" fill="#0f172a" text-anchor="middle">${safeInst}</text>
  </g>

  <!-- Certificate Main Title -->
  <g transform="translate(500, 220)">
    <line x1="-240" y1="0" x2="240" y2="0" stroke="url(#goldBorder)" stroke-width="3" />
    <rect x="-160" y="-22" width="320" height="44" rx="8" fill="#1e3a8a" stroke="url(#goldBorder)" stroke-width="2" />
    <text x="0" y="9" class="font-title" font-size="24" fill="#fbbf24" text-anchor="middle">شهــــادة درجات عليا معتمدة</text>
  </g>

  <!-- Attestation Paragraph -->
  <g transform="translate(500, 290)">
    <text x="0" y="20" class="font-body" font-size="16" fill="#334155" text-anchor="middle">
      بناءً على موافقة مجلس الجامعة ولجنة المحكمين الأكاديمية المعتمدة
    </text>
    <text x="0" y="46" class="font-body" font-size="16" fill="#334155" text-anchor="middle">
      تشهد إدارة الكلية وشؤون الدراسات العليا والبحوث بأن السيد الدكتور /
    </text>
  </g>

  <!-- Candidate Name Banner -->
  <g transform="translate(500, 390)">
    <rect x="-260" y="-30" width="520" height="54" rx="14" fill="#f8fafc" stroke="url(#goldBorder)" stroke-width="2.5" />
    <text x="0" y="7" class="font-title" font-size="28" fill="#0f172a" text-anchor="middle">${safeName}</text>
  </g>

  <!-- Degree Award Text -->
  <g transform="translate(500, 465)">
    <text x="0" y="0" class="font-body" font-size="17" fill="#1e293b" text-anchor="middle">
      قد استوفى كافة المتطلبات العلمية والأطروحة البحثية المقررة ومُنح بموجبها:
    </text>
    <text x="0" y="32" class="font-title" font-size="23" fill="#b45309" text-anchor="middle">
      درجة دكتوراه الفلسفة في ${safeSpec}
    </text>
    <text x="0" y="60" class="font-body" font-size="14" fill="#047857" text-anchor="middle">
      بتقدير عام: مـــرتبة الشـرف الأولى • مع التوصية بنشر وتداول الأطروحة
    </text>
  </g>

  <!-- Golden Medal / Wax Seal on Left Bottom -->
  <g transform="translate(180, 565)">
    <path d="M -16 20 L -30 90 L -12 78 L 6 90 L -8 20 Z" fill="#991b1b" />
    <path d="M 16 20 L 30 90 L 12 78 L -6 90 L 8 20 Z" fill="#b91c1c" />
    <circle cx="0" cy="0" r="48" fill="url(#sealGrad)" stroke="#78350f" stroke-width="2" filter="url(#certShadow)" />
    <circle cx="0" cy="0" r="42" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 2" />
    <text x="0" y="-6" class="font-title" font-size="12" fill="#ffffff" text-anchor="middle">خاتم الاعتماد الرسمي</text>
    <text x="0" y="10" class="font-title" font-size="13" fill="#ffffff" text-anchor="middle">وزارة التعليم العالي</text>
    <text x="0" y="24" class="font-mono" font-size="9" fill="#fef08a" text-anchor="middle">VERIFIED 2026</text>
  </g>

  <!-- Signatures Section -->
  <g transform="translate(800, 560)">
    <text x="0" y="0" class="font-sub" font-size="14" fill="#1e3a8a" text-anchor="middle">عميد الكلية</text>
    <path d="M -50 25 Q -10 5, 20 28 T 60 18" fill="none" stroke="#0f172a" stroke-width="2" />
    <line x1="-60" y1="40" x2="60" y2="40" stroke="#cbd5e1" stroke-width="1" />
    <text x="0" y="55" class="font-body" font-size="11" fill="#64748b" text-anchor="middle">أ.د. وكيل الدراسات العليا</text>
  </g>

  <g transform="translate(500, 560)">
    <text x="0" y="0" class="font-sub" font-size="14" fill="#1e3a8a" text-anchor="middle">رئيس الجامعة</text>
    <path d="M -45 22 Q 0 8, 30 25 T 55 15" fill="none" stroke="#0f172a" stroke-width="2" />
    <line x1="-60" y1="40" x2="60" y2="40" stroke="#cbd5e1" stroke-width="1" />
    <text x="0" y="55" class="font-body" font-size="11" fill="#64748b" text-anchor="middle">اعتماد رسمي سارٍ</text>
  </g>

  <!-- Document Meta & Verification -->
  <g transform="translate(500, 642)">
    <text x="0" y="0" class="font-mono" font-size="11" fill="#64748b" text-anchor="middle">
      DOCUMENT-ID: EGY-HE-CERT • ISSUED: 2026-09-15 • VERIFICATION: UNIGATES-CERT-VALID
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─────────────────────────────────────────────────────────────
// Official Registered Seed Authors (Persisted across all devices)
// ─────────────────────────────────────────────────────────────
export const OFFICIAL_SEED_AUTHORS: AuthorProfile[] = [
  {
    id: "auth-4714",
    authorCode: "AUT-4714",
    fullName: "د. ايمن احمد محمد الدلوع",
    academicTitle: "dr",
    academicTitleLabel: "دكتور (د.)",
    specialization: "القانون والتشريعات والشريعة",
    institution: "جامعة الأزهر - كلية الشريعة والقانون",
    email: "dr.aymaneldlloa@gmail.com",
    phone: "+20 100 000 0000",
    bio: "دكتور وباحث في القانون والشريعة والتشريعات المقارنة وحقوق الملكية الفكرية، حاصل على الدكتوراه في الدراسات الفقهية والقانونية وله مؤلفات وأبحاث محكمة.",
    avatarUrl: generateSampleAuthorAvatarSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)"),
    avatarName: "د. أيمن أحمد الدلوع.jpg",
    nationalIdUrl: generateSampleNationalIdCardSvg("د. ايمن احمد محمد الدلوع", "AUT-4714", "القانون والتشريعات والشريعة"),
    nationalIdName: "بطاقة الرقم القومي - د. ايمن احمد محمد الدلوع.pdf",
    nationalIdSize: "1.4 MB",
    qualificationDocuments: [
      {
        id: "qual-4714-phd",
        name: "شهادة الدكتوراه في الشريعة والقانون.pdf",
        url: generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "القانون والتشريعات والشريعة", "جامعة الأزهر", "شهادة درجة الدكتوراه في الشريعة والقانون"),
        size: "2.5 MB",
        type: "PDF"
      },
      {
        id: "qual-4714-master",
        name: "شهادة الماجستير في التشريعات القانونية المقارنة.pdf",
        url: generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "التشريعات القانونية المقارنة", "كلية الحقوق", "شهادة درجة الماجستير في القانون المقارن"),
        size: "1.8 MB",
        type: "PDF"
      },
      {
        id: "qual-4714-licence",
        name: "شهادة الليسانس في الشريعة والقانون.pdf",
        url: generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "الشريعة والقانون", "كلية الشريعة والقانون", "شهادة الليسانس في الشريعة والقانون بتقدير ممتاز"),
        size: "1.2 MB",
        type: "PDF"
      },
      {
        id: "qual-4714-license",
        name: "كارنيه العضوية والترخيص الأكاديمي والمهني.pdf",
        url: generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "الترخيص الأكاديمي والمهني", "النقابة العامة", "وثيقة القيد والترخيص الأكاديمي والمهني"),
        size: "850 KB",
        type: "PDF"
      }
    ],
    qualificationUrls: [
      generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "القانون والتشريعات والشريعة", "جامعة الأزهر", "شهادة درجة الدكتوراه في الشريعة والقانون"),
      generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "التشريعات القانونية المقارنة", "كلية الحقوق", "شهادة درجة الماجستير في القانون المقارن"),
      generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "الشريعة والقانون", "كلية الشريعة والقانون", "شهادة الليسانس في الشريعة والقانون بتقدير ممتاز"),
      generateSampleCertificateSvg("د. ايمن احمد محمد الدلوع", "دكتور (د.)", "الترخيص الأكاديمي والمهني", "النقابة العامة", "وثيقة القيد والترخيص الأكاديمي والمهني")
    ],
    agreedToTerms: true,
    isTemporaryPassword: false,
    tempPassword: "NSR-9MT9QW",
    permanentPassword: "NSR-9MT9QW",
    verificationStatus: "pending_review",
    joinedDate: "2026-10-10"
  }
];

// ─────────────────────────────────────────────────────────────
// Author Document Self-Healing Function
// ─────────────────────────────────────────────────────────────

export function healAuthorDocuments(a: AuthorProfile): { healed: boolean; author: AuthorProfile } {
  let healed = false;
  const author: AuthorProfile = { ...a };

  // 1. Check avatarUrl (replace dead blob or missing avatar)
  const isAvatarDeadBlob = Boolean(author.avatarUrl && author.avatarUrl.startsWith("blob:"));
  const isAvatarMissing = !author.avatarUrl || author.avatarUrl.trim() === "";
  if (isAvatarDeadBlob || isAvatarMissing) {
    author.avatarUrl = generateSampleAuthorAvatarSvg(author.fullName, author.academicTitleLabel);
    author.avatarName = author.avatarName || "Author_Profile_Photo.svg";
    healed = true;
  }

  // 2. Check nationalIdUrl (replace dead blob or missing ID)
  const isIdDeadBlob = Boolean(author.nationalIdUrl && author.nationalIdUrl.startsWith("blob:"));
  const isIdMissing = !author.nationalIdUrl || author.nationalIdUrl.trim() === "";
  if (isIdDeadBlob || isIdMissing) {
    author.nationalIdUrl = generateSampleNationalIdCardSvg(author.fullName, author.authorCode, author.specialization);
    author.nationalIdName = author.nationalIdName || "National_ID_Card.svg";
    author.nationalIdSize = author.nationalIdSize || "1.8 MB";
    healed = true;
  }

  // 3. Check qualificationUrls & qualificationDocuments
  let qualDocs = author.qualificationDocuments && author.qualificationDocuments.length > 0
    ? [...author.qualificationDocuments]
    : [];

  if (qualDocs.length === 0 && author.qualificationUrls && author.qualificationUrls.length > 0) {
    qualDocs = author.qualificationUrls.map((url, idx) => ({
      id: `qual-${idx}`,
      name: `Academic_Degree_Certificate_${idx + 1}.svg`,
      url,
      size: "2.4 MB",
      type: "CERTIFICATE"
    }));
  }

  if (qualDocs.length === 0) {
    const certSvg = generateSampleCertificateSvg(
      author.fullName,
      author.academicTitleLabel || "دكتوراه",
      author.specialization,
      author.institution
    );
    qualDocs.push({
      id: "qual-0",
      name: "Doctorate_Degree_Certificate.svg",
      url: certSvg,
      size: "2.5 MB",
      type: "CERTIFICATE"
    });
    healed = true;
  } else {
    qualDocs = qualDocs.map((doc, idx) => {
      if (doc.url && doc.url.startsWith("blob:")) {
        healed = true;
        const certSvg = generateSampleCertificateSvg(
          author.fullName,
          author.academicTitleLabel || "دكتوراه",
          author.specialization,
          author.institution,
          doc.name
        );
        return {
          ...doc,
          url: certSvg,
          name: doc.name.endsWith(".svg") ? doc.name : `${doc.name.replace(/\.[^/.]+$/, "")}.svg`,
          type: "CERTIFICATE"
        };
      }
      return doc;
    });
  }

  author.qualificationDocuments = qualDocs;
  author.qualificationUrls = qualDocs.map(d => d.url);

  return { healed, author };
}

// Helper to asynchronously resolve and hydrate author avatar (from memory, IndexedDB, or permanent generator)
export async function resolveAuthorAvatar(author?: AuthorProfile | null): Promise<string> {
  if (!author) return "";

  // 1. If explicit idb: reference
  if (author.avatarUrl && author.avatarUrl.startsWith("idb:")) {
    const fileId = author.avatarUrl.replace("idb:", "");
    try {
      const fromStore = await NashrFileStore.getFile(fileId);
      if (fromStore) return fromStore;
    } catch (e) {
      console.warn("[resolveAuthorAvatar] idb fetch warning:", e);
    }
  }

  // 2. Check IndexedDB by author id (where signup saves av-${author.id})
  if (author.id) {
    try {
      const fromStore = await NashrFileStore.getFile(`av-${author.id}`);
      if (fromStore) return fromStore;
    } catch (e) {
      // ignore
    }
  }

  // 3. Direct valid image data URL or web URL
  if (author.avatarUrl && !author.avatarUrl.startsWith("blob:") && !author.avatarUrl.startsWith("idb:")) {
    return author.avatarUrl;
  }

  // 4. Default fallback generator
  return generateSampleAuthorAvatarSvg(author.fullName, author.academicTitleLabel);
}

export class NashrDataStore {
  static resolveAuthorAvatar = resolveAuthorAvatar;

  // Author Profile
  static getAuthorProfile(): AuthorProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTHOR);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.id) {
          const code = (parsed.authorCode || "").trim().toUpperCase();
          const id = (parsed.id || "").trim();
          if (!OLD_TEST_AUTHOR_CODES.includes(code) && !OLD_TEST_AUTHOR_CODES.includes(id)) {
            const { healed, author } = healAuthorDocuments(parsed);
            if (healed) {
              localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(author));
            }
            return author;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    const all = this.getAllAuthors();
    if (all.length > 0) return all[0];
    return DEFAULT_DEMO_AUTHOR;
  }

  static getAllAuthors(): AuthorProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALL_AUTHORS);
      let list: AuthorProfile[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed.filter(a => a && typeof a === "object" && a.id);
        }
      }

      // Filter out old test accounts requested for deletion by admin
      const filtered = list.filter(a => {
        if (!a || !a.id) return false;
        const code = (a.authorCode || "").trim().toUpperCase();
        const id = (a.id || "").trim();
        const name = (a.fullName || "").trim();
        if (OLD_TEST_AUTHOR_CODES.includes(code) || OLD_TEST_AUTHOR_CODES.includes(id)) return false;
        if (name.includes("المنشاوي") || name === "ؤؤؤ" || name === "m" || name.includes("hgsd]")) return false;
        return true;
      });

      // Heal documents for all authors (replace dead blobs, missing docs)
      let healedAny = false;
      const healedList = filtered.map(a => {
        const { healed, author } = healAuthorDocuments(a);
        if (healed) healedAny = true;
        return author;
      });

      // Ensure official registered authors (such as Dr. Ayman AUT-4714) are ALWAYS present
      OFFICIAL_SEED_AUTHORS.forEach(seed => {
        const exists = healedList.some(a => 
          (a.authorCode && a.authorCode.trim().toUpperCase() === seed.authorCode.toUpperCase()) ||
          a.id === seed.id ||
          (a.email && seed.email && a.email.trim().toLowerCase() === seed.email.toLowerCase())
        );
        if (!exists) {
          healedList.unshift(seed);
          healedAny = true;
        }
      });

      // Synchronize back to storage if items were pruned or healed
      if (saved && (list.length !== filtered.length || healedAny)) {
        try {
          localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(healedList));
        } catch (storageErr) {
          console.warn("[getAllAuthors] Storage sync warning:", storageErr);
        }
      }

      return healedList;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static deleteAuthor(authorId: string): void {
    try {
      const all = this.getAllAuthors();
      const updated = all.filter(a => a.id !== authorId && a.authorCode !== authorId);
      localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(updated));

      // Also clean CURRENT_AUTHOR if matching
      const current = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTHOR);
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed?.id === authorId || parsed?.authorCode === authorId) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTHOR);
        }
      }

      // Also clean submissions and invoices for this author
      const allSubs = this.getAllSubmissions();
      const updatedSubs = allSubs.filter(s => s.authorId !== authorId && s.authorCode !== authorId);
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updatedSubs));

      const allInvs = this.getAllInvoices();
      const updatedInvs = allInvs.filter(i => i.authorId !== authorId);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvs));
    } catch (e) {
      console.error(e);
    }
  }

  static clearOldTestAuthors(): void {
    try {
      const all = this.getAllAuthors();
      const updated = all.filter(a => {
        const code = (a.authorCode || "").trim().toUpperCase();
        const id = (a.id || "").trim();
        const name = (a.fullName || "").trim();
        if (OLD_TEST_AUTHOR_CODES.includes(code) || OLD_TEST_AUTHOR_CODES.includes(id)) return false;
        if (name.includes("المنشاوي") || name === "ؤؤؤ" || name === "m" || name.includes("hgsd]")) return false;
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(updated));

      const current = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTHOR);
      if (current) {
        const parsed = JSON.parse(current);
        const code = (parsed?.authorCode || "").trim().toUpperCase();
        const id = (parsed?.id || "").trim();
        const name = (parsed?.fullName || "").trim();
        if (OLD_TEST_AUTHOR_CODES.includes(code) || OLD_TEST_AUTHOR_CODES.includes(id) || name.includes("المنشاوي") || name === "ؤؤؤ" || name === "m" || name.includes("hgsd]")) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTHOR);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  static pruneAuthorForStorage(author: AuthorProfile): AuthorProfile {
    if (!author) return author;
    const isLarge = (str?: string) => Boolean(str && (str.length > 500 || str.startsWith("data:")));
    
    const qualDocs = (author.qualificationDocuments || []).map((doc, idx) => {
      const docId = doc.id || `qual-${author.id}-${idx}`;
      return {
        ...doc,
        id: docId,
        url: isLarge(doc.url) ? `idb:${docId}` : doc.url
      };
    });

    return {
      ...author,
      avatarUrl: isLarge(author.avatarUrl) ? `idb:av-${author.id}` : author.avatarUrl,
      nationalIdUrl: isLarge(author.nationalIdUrl) ? `idb:id-${author.id}` : author.nationalIdUrl,
      qualificationDocuments: qualDocs,
      qualificationUrls: qualDocs.map(d => d.url)
    };
  }

  static saveAuthorProfile(profile: AuthorProfile): void {
    if (!profile || !profile.id) return;

    // 1. Asynchronously persist all document and image files into IndexedDB
    try {
      const itemsToSave: { id: string; url: string }[] = [];
      if (profile.avatarUrl && profile.avatarUrl.length > 100) {
        itemsToSave.push({ id: `av-${profile.id}`, url: profile.avatarUrl });
      }
      if (profile.nationalIdUrl && profile.nationalIdUrl.length > 100) {
        itemsToSave.push({ id: `id-${profile.id}`, url: profile.nationalIdUrl });
      }
      profile.qualificationDocuments?.forEach(doc => {
        if (doc.id && doc.url && doc.url.length > 100) {
          itemsToSave.push({ id: doc.id, url: doc.url });
        }
      });
      if (itemsToSave.length > 0) {
        NashrFileStore.saveFiles(itemsToSave).catch(e => console.warn("[saveAuthorProfile] fileStore:", e));
      }
    } catch (e) {
      console.warn("[saveAuthorProfile] file persistence warning:", e);
    }

    // Always prune before writing to localStorage to prevent QuotaExceededError and RangeError
    const pruned = this.pruneAuthorForStorage(profile);

    // 2. Safely store CURRENT_AUTHOR (compact pruned version)
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(pruned));
    } catch (e) {
      console.warn("[saveAuthorProfile] Quota exceeded on CURRENT_AUTHOR:", e);
    }

    // 3. Save to ALL_AUTHORS (compact pruned version)
    try {
      const all = this.getAllAuthors();
      const idx = all.findIndex(a => a.id === profile.id || a.authorCode === profile.authorCode);
      if (idx !== -1) {
        all[idx] = pruned;
      } else {
        all.unshift(pruned);
      }
      const prunedAll = all.map(a => this.pruneAuthorForStorage(a));
      try {
        localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(prunedAll));
      } catch (quotaErr) {
        console.warn("[saveAuthorProfile] Quota exceeded on ALL_AUTHORS, keeping recent authors:", quotaErr);
        const compactAll = prunedAll.slice(0, 10);
        try {
          localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(compactAll));
        } catch (innerErr) {
          console.warn("[saveAuthorProfile] Secondary quota error:", innerErr);
        }
      }
    } catch (e) {
      console.error("[saveAuthorProfile] ALL_AUTHORS error:", e);
    }
  }

  static findAuthorByIdentifier(identifier: string): AuthorProfile | null {
    const clean = identifier.trim().toLowerCase();
    const all = this.getAllAuthors();
    const found = all.find(a => 
      a.authorCode.toLowerCase() === clean || 
      a.email.toLowerCase() === clean
    );
    if (found) return found;
    const current = this.getAuthorProfile();
    if (current && (current.authorCode.toLowerCase() === clean || current.email.toLowerCase() === clean)) {
      return current;
    }
    return null;
  }

  static updatePassword(newPassword: string, authorId?: string): boolean {
    const current = this.getAuthorProfile();
    const targetId = authorId || current.id;
    const all = this.getAllAuthors();
    const author = all.find(a => a.id === targetId) || (targetId === current.id ? current : null);

    if (author) {
      author.isTemporaryPassword = false;
      author.permanentPassword = newPassword;
      const idx = all.findIndex(a => a.id === targetId);
      if (idx !== -1) all[idx] = author;
      else all.push(author);
      localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(all));
    }

    if (current.id === targetId || !authorId) {
      current.isTemporaryPassword = false;
      current.permanentPassword = newPassword;
      localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(current));
    }

    return true;
  }

  static approveAuthor(authorId?: string): AuthorProfile {
    return this.setVerificationStatus("approved", undefined, authorId);
  }

  static setVerificationStatus(
    status: "pending_review" | "approved" | "rejected", 
    notes?: string,
    authorId?: string
  ): AuthorProfile {
    const current = this.getAuthorProfile();
    const targetId = authorId || current.id;

    const all = this.getAllAuthors();
    const author = all.find(a => a.id === targetId) || (targetId === current.id ? current : null);

    if (author) {
      author.verificationStatus = status;
      if (notes !== undefined) author.verificationNotes = notes;
      if (status === "approved") {
        author.verificationDate = new Date().toISOString().split("T")[0];
      }
      const idx = all.findIndex(a => a.id === targetId);
      if (idx !== -1) all[idx] = author;
      else all.push(author);
      localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(all));
    }

    if (current.id === targetId) {
      current.verificationStatus = status;
      if (notes !== undefined) current.verificationNotes = notes;
      if (status === "approved") {
        current.verificationDate = new Date().toISOString().split("T")[0];
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(current));
      return current;
    }

    return author || current;
  }

  // Submissions
  static getAllSubmissions(): ManuscriptSubmission[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      let list: ManuscriptSubmission[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed.filter(s => {
            if (!s || typeof s !== "object" || !s.id) return false;
            const authorCode = (s.authorCode || "").trim().toUpperCase();
            const authorId = (s.authorId || "").trim();
            const authorName = (s.authorName || "").trim();
            const title = (s.title || "").trim();
            const id = (s.id || "").trim();

            if (OLD_TEST_AUTHOR_CODES.includes(authorCode) || OLD_TEST_AUTHOR_CODES.includes(authorId)) return false;
            if (id === "sub-101" || id === "sub-102" || id === "sub-103" || id === "sub-1791204357620") return false;
            if (title.includes("غثغسغت") || title.includes("الحوكمة الرقمية") || title.includes("دليل الباحث") || title.includes("الذكاء الاصطناعي والقانون")) return false;
            if (authorName.includes("المنشاوي") || authorName.includes("مؤلف تجريبي")) return false;
            return true;
          });
        }
      }

      if (saved && list.length !== (JSON.parse(saved) || []).length) {
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
      }

      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static deleteSubmission(submissionId: string): void {
    try {
      const all = this.getAllSubmissions();
      const updated = all.filter(s => s.id !== submissionId);
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  static clearOldSubmissions(): void {
    try {
      const all = this.getAllSubmissions();
      const updated = all.filter(s => {
        if (!s || !s.id) return false;
        const authorCode = (s.authorCode || "").trim().toUpperCase();
        const authorId = (s.authorId || "").trim();
        const authorName = (s.authorName || "").trim();
        const title = (s.title || "").trim();
        const id = (s.id || "").trim();

        if (OLD_TEST_AUTHOR_CODES.includes(authorCode) || OLD_TEST_AUTHOR_CODES.includes(authorId)) return false;
        if (id === "sub-101" || id === "sub-102" || id === "sub-103" || id === "sub-1791204357620") return false;
        if (title.includes("غثغسغت") || title.includes("الحوكمة الرقمية") || title.includes("دليل الباحث") || title.includes("الذكاء الاصطناعي والقانون")) return false;
        if (authorName.includes("المنشاوي") || authorName.includes("مؤلف تجريبي")) return false;
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  static getSubmissions(authorId?: string): ManuscriptSubmission[] {
    const all = this.getAllSubmissions();
    const author = this.getAuthorProfile();
    const targetId = authorId || author?.id;
    const targetCode = author?.authorCode;
    return all.filter(s => s && (s.authorId === targetId || (targetCode && s.authorCode === targetCode)));
  }

  static addSubmission(submission: Omit<ManuscriptSubmission, "id" | "submissionDate" | "status">): ManuscriptSubmission {
    const list = this.getAllSubmissions();
    const newSub: ManuscriptSubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submissionDate: new Date().toISOString().split("T")[0],
      status: "pending_review",
      adminFeedback: "تم إرسال الملفات بنجاح إلى إدارة دار عبيد للنشر للمراجعة والتدقيق والاعتماد."
    };
    list.unshift(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    return newSub;
  }

  // Invoices
  static getAllInvoices(): NashrInvoice[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      let list: NashrInvoice[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed.filter(i => {
            if (!i || typeof i !== "object" || !i.id) return false;
            const authorId = (i.authorId || "").trim();
            const authorName = (i.authorName || "").trim();
            const invoiceNum = (i.invoiceNumber || "").trim().toUpperCase();
            const title = (i.manuscriptTitle || "").trim();
            const id = (i.id || "").trim();

            if (OLD_TEST_AUTHOR_CODES.includes(authorId)) return false;
            if (id === "inv-2026-01" || id === "inv-2026-02") return false;
            if (invoiceNum === "INV-NASHR-7721" || invoiceNum === "INV-NASHR-8910") return false;
            if (authorName.includes("المنشاوي") || title.includes("الحوكمة الرقمية") || title.includes("الذكاء الاصطناعي")) return false;
            return true;
          });
        }
      }

      if (saved && list.length !== (JSON.parse(saved) || []).length) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));
      }

      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static deleteInvoice(invoiceId: string): void {
    try {
      const all = this.getAllInvoices();
      const updated = all.filter(i => i.id !== invoiceId && i.invoiceNumber !== invoiceId);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  static clearOldInvoices(): void {
    try {
      const all = this.getAllInvoices();
      const updated = all.filter(i => {
        if (!i || !i.id) return false;
        const authorId = (i.authorId || "").trim();
        const authorName = (i.authorName || "").trim();
        const invoiceNum = (i.invoiceNumber || "").trim().toUpperCase();
        const title = (i.manuscriptTitle || "").trim();
        const id = (i.id || "").trim();

        if (OLD_TEST_AUTHOR_CODES.includes(authorId)) return false;
        if (id === "inv-2026-01" || id === "inv-2026-02") return false;
        if (invoiceNum === "INV-NASHR-7721" || invoiceNum === "INV-NASHR-8910") return false;
        if (authorName.includes("المنشاوي") || title.includes("الحوكمة الرقمية") || title.includes("الذكاء الاصطناعي")) return false;
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  static getInvoices(authorId?: string): NashrInvoice[] {
    const all = this.getAllInvoices();
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    return all.filter(inv => inv.authorId === targetId);
  }

  static uploadPaymentReceipt(
    invoiceId: string, 
    receiptImageUrl: string, 
    paymentMethod: string,
    receiptReference?: string,
    receiptNotes?: string,
    receiptFileName?: string,
    receiptFileSize?: string,
    receiptFileType?: string
  ): NashrInvoice | null {
    const list = this.getAllInvoices();
    const index = list.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
      list[index].receiptImageUrl = receiptImageUrl;
      list[index].paymentMethod = paymentMethod;
      list[index].status = "under_review";
      list[index].paymentDate = new Date().toISOString().split("T")[0];
      list[index].receiptUploadedAt = new Date().toLocaleString("ar-EG");
      if (receiptReference) list[index].receiptReference = receiptReference;
      if (receiptNotes) list[index].receiptNotes = receiptNotes;
      if (receiptFileName) list[index].receiptFileName = receiptFileName;
      if (receiptFileSize) list[index].receiptFileSize = receiptFileSize;
      if (receiptFileType) list[index].receiptFileType = receiptFileType;
      delete list[index].rejectionReason;
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));

      // Dispatch automated notice to admin
      this.sendMessage(
        `💳 تم رفع إيصال سداد جديد للفاتورة (${list[index].invoiceNumber}) بمبلغ ${list[index].amount} ${list[index].currency} بواسطة (${paymentMethod}). ملاحظات المؤلف: ${receiptNotes || "لا توجد ملاحظات إضافية"}. المرجع: ${receiptReference || "غير مدخل"}.`,
        receiptFileName || "إيصال_سداد.png",
        receiptImageUrl
      );

      return list[index];
    }
    return null;
  }

  static submitDirectReceipt(
    authorId: string,
    authorName: string,
    amount: number,
    paymentMethod: string,
    receiptImageUrl: string,
    manuscriptTitle?: string,
    receiptReference?: string,
    receiptNotes?: string,
    receiptFileName?: string,
    receiptFileSize?: string,
    receiptFileType?: string
  ): NashrInvoice {
    const list = this.getAllInvoices();
    const newInv: NashrInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-NASHR-${Math.floor(1000 + Math.random() * 9000)}`,
      authorId,
      authorName,
      manuscriptTitle: manuscriptTitle || "دفعة سداد وتكاليف نشر مباشرة",
      amount,
      currency: "EGP",
      publishType: "both",
      description: receiptNotes || "سداد مباشر / تحويل إيصال بنكي أو إنستاباي من قبل المؤلف",
      status: "under_review",
      receiptImageUrl,
      receiptFileName: receiptFileName || "إيصال_تحويل.png",
      receiptFileSize: receiptFileSize || "مرفق معتمد",
      receiptFileType: receiptFileType || "image/jpeg",
      receiptReference,
      receiptNotes,
      receiptUploadedAt: new Date().toLocaleString("ar-EG"),
      paymentMethod,
      paymentDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0]
    };
    list.unshift(newInv);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));

    // Send chat message
    this.sendMessage(
      `💳 تم رفع إيصال تحويل مباشر جديد بمبلغ ${amount} ج.م عبر (${paymentMethod}) لمؤلف: ${manuscriptTitle || "دفعة نشر"}. ملاحظات: ${receiptNotes || "بدون ملاحظات"}. المرجع: ${receiptReference || "قيد المطابقة"}.`,
      receiptFileName || "إيصال_تحويل_مباشر.png",
      receiptImageUrl
    );

    return newInv;
  }

  static updateSubmissionStatus(
    submissionId: string, 
    status: ManuscriptSubmission["status"], 
    adminFeedback?: string,
    storeBookCode?: string
  ): ManuscriptSubmission | null {
    const list = this.getAllSubmissions();
    const item = list.find(s => s.id === submissionId);
    if (!item) return null;
    item.status = status;
    if (adminFeedback !== undefined) item.adminFeedback = adminFeedback;
    if (storeBookCode) item.storeBookCode = storeBookCode;
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    return item;
  }

  static updateSubmission(
    submissionId: string, 
    updates: Partial<ManuscriptSubmission>
  ): ManuscriptSubmission | null {
    const list = this.getAllSubmissions();
    const item = list.find(s => s.id === submissionId);
    if (!item) return null;
    Object.assign(item, updates);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    return item;
  }

  static createInvoice(data: Omit<NashrInvoice, "id" | "invoiceNumber" | "createdAt">): NashrInvoice {
    const all = this.getAllInvoices();
    const newInv: NashrInvoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-NASHR-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().split("T")[0]
    };
    all.unshift(newInv);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(all));
    return newInv;
  }

  static verifyInvoiceReceipt(invoiceId: string, approved: boolean, rejectionReason?: string): NashrInvoice | null {
    const all = this.getAllInvoices();
    const inv = all.find(i => i.id === invoiceId);
    if (!inv) return null;
    inv.status = approved ? "paid" : "unpaid";
    if (approved) {
      inv.paymentDate = new Date().toISOString().split("T")[0];
      delete inv.rejectionReason;
      this.sendAdminMessageToAuthor(
        inv.authorId,
        `✅ إشعار مالي رسمي: تم التحقق بنجاح من إيصال السداد للفاتورة (${inv.invoiceNumber}) بمبلغ ${inv.amount} ${inv.currency} الخاصة بمؤلفكم "${inv.manuscriptTitle}". تم اعتماد العملية مالياً وإحالتها لمرحلة الإنتاج والطباعة.`
      );
    } else {
      inv.rejectionReason = rejectionReason || "إيصال التحويل غير مكتمل أو بيانات المعاملة غير واضحة. يرجى إعادة رفع صورة واضحة.";
      this.sendAdminMessageToAuthor(
        inv.authorId,
        `⚠️ إشعار تدقيق مالي: تم فحص إيصال السداد للفاتورة (${inv.invoiceNumber}) ولم تتم مطابقته بالكامل. السبب: ${inv.rejectionReason}. يرجى التكرم بإعادة رفع إشعار التحويل البنكي الصحيح.`
      );
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(all));
    return inv;
  }

  // Messages
  static getMessages(authorId?: string): NashrMessage[] {
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    try {
      const storageKey = `${STORAGE_KEYS.MESSAGES}_${targetId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);

      if (targetId === "auth-2026-001") {
        localStorage.setItem(storageKey, JSON.stringify(INITIAL_MESSAGES));
        return INITIAL_MESSAGES;
      }

      const welcomeMsg: NashrMessage = {
        id: `msg-welcome-${targetId}`,
        sender: "admin",
        senderName: "إدارة دار عبيد للنشر والتوزيع",
        senderTitle: "فريق الإشراف والتدقيق",
        text: `أهلاً ومرحباً بحضرتكم في منصة نشر الموحدة. تم تسجيل حسابكم بنجاح وهو الآن قيد التدقيق والمراجعة الأكاديمية. نحن بخدمتكم لأي استفسار عبر هذه المحادثة المباشرة.`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        read: true
      };
      const initial = [welcomeMsg];
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  static sendMessage(text: string, attachmentName?: string, attachmentUrl?: string): NashrMessage {
    const author = this.getAuthorProfile();
    const list = this.getMessages(author.id);
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    const newMsg: NashrMessage = {
      id: `msg-${Date.now()}`,
      sender: "author",
      senderName: author.fullName,
      senderTitle: author.academicTitleLabel || "مؤلف",
      text,
      attachmentName,
      attachmentUrl,
      timestamp: `${now.toISOString().split("T")[0]} ${timeStr}`,
      read: true
    };
    list.push(newMsg);
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${author.id}`, JSON.stringify(list));
    return newMsg;
  }

  static sendAdminMessageToAuthor(authorId: string, text: string, attachmentName?: string, attachmentUrl?: string): NashrMessage {
    const list = this.getMessages(authorId);
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    const newMsg: NashrMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: "admin",
      senderName: "هيئة التدقيق والتحكيم بدار عبيد",
      senderTitle: "إدارة النشر الأكاديمي",
      text,
      attachmentName,
      attachmentUrl,
      timestamp: `${now.toISOString().split("T")[0]} ${timeStr}`,
      read: false
    };
    list.push(newMsg);
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${authorId}`, JSON.stringify(list));
    return newMsg;
  }

  static getAllAuthorIdsWithMessages(): string[] {
    try {
      const ids: string[] = [];
      const prefix = `${STORAGE_KEYS.MESSAGES}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const id = key.substring(prefix.length);
          if (id && !ids.includes(id)) {
            ids.push(id);
          }
        }
      }
      return ids;
    } catch (e) {
      return [];
    }
  }

  // Sales & Royalties
  static getSales(authorId?: string): BookSaleRecord[] {
    const author = this.getAuthorProfile();
    const targetId = authorId || author?.id;
    const targetCode = author?.authorCode || "";

    // 1. Fetch saved direct sales for this author
    let savedDirectSales: BookSaleRecord[] = [];
    try {
      const storageKey = targetId === "auth-2026-001" ? STORAGE_KEYS.SALES : `${STORAGE_KEYS.SALES}_${targetId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        savedDirectSales = JSON.parse(saved);
        // Purge test sales
        const filtered = savedDirectSales.filter(s => {
          const bCode = s.bookCode || "";
          const oNum = s.orderNumber || "";
          const aCode = s.authorCode || "";
          const bName = s.buyerName || "";
          if (bCode === "BK-DAR-4491" || bCode === "BK-DAR-8821") return false;
          if (oNum.startsWith("ORD-2026-99") || oNum.startsWith("ORD-2026-98")) return false;
          if (aCode === "AUT-7890" || aCode === "auth-2026-001") return false;
          if (bName.includes("المنشاوي") || bName.includes("جامعة القاهرة") || bName.includes("معهد الدلتا")) return false;
          return true;
        });
        if (filtered.length !== savedDirectSales.length) {
          localStorage.setItem(storageKey, JSON.stringify(filtered));
          savedDirectSales = filtered;
        }
      }
    } catch (e) {
      console.error(e);
      savedDirectSales = [];
    }

    // Also purge global sales storage if it contains test entries
    try {
      const globalSaved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (globalSaved) {
        const parsed: BookSaleRecord[] = JSON.parse(globalSaved);
        const filtered = parsed.filter(s => {
          const bCode = s.bookCode || "";
          const oNum = s.orderNumber || "";
          const aCode = s.authorCode || "";
          const bName = s.buyerName || "";
          if (bCode === "BK-DAR-4491" || bCode === "BK-DAR-8821") return false;
          if (oNum.startsWith("ORD-2026-99") || oNum.startsWith("ORD-2026-98")) return false;
          if (aCode === "AUT-7890" || aCode === "auth-2026-001") return false;
          if (bName.includes("المنشاوي") || bName.includes("جامعة القاهرة") || bName.includes("معهد الدلتا")) return false;
          return true;
        });
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch live Bookstore orders from BookStoreDataStore (stored in "unigates_bookstore_orders")
    let storeOrdersSales: BookSaleRecord[] = [];
    try {
      const ordersRaw = localStorage.getItem("unigates_bookstore_orders");
      if (ordersRaw) {
        const parsedOrders: any[] = JSON.parse(ordersRaw);
        if (Array.isArray(parsedOrders)) {
          parsedOrders.forEach((ord) => {
            if (!ord || !Array.isArray(ord.items)) return;
            // Ignore mock demo orders
            const ordNum = ord.orderNumber || "";
            if (ordNum.startsWith("ORD-2026-99") || ordNum.startsWith("ORD-2026-98")) return;

            ord.items.forEach((item: any, idx: number) => {
              const itemAuthorCode = item.authorCode || "";
              const itemBookCode = item.bookCode || "";
              
              // Skip demo books
              if (itemBookCode === "BK-DAR-4491" || itemBookCode === "BK-DAR-8821") return;
              if (itemAuthorCode === "AUT-7890" || itemAuthorCode === "auth-2026-001") return;

              const isMatch = Boolean(
                (targetCode && itemAuthorCode === targetCode) ||
                (targetId && itemAuthorCode === targetId)
              );

              if (isMatch) {
                const royaltyRate = item.format === "digital" ? 70 : 30;
                const qty = item.quantity || 1;
                const price = item.price || 100;
                const gross = price * qty;
                const authorEarnings = typeof item.authorRoyalty === "number" ? item.authorRoyalty : Math.round(gross * (royaltyRate / 100));

                storeOrdersSales.push({
                  id: `sale-ord-${ord.id || ord.orderNumber}-${itemBookCode || idx}`,
                  bookCode: itemBookCode || "BK-DAR-4491",
                  bookTitle: item.bookTitle || "مؤلف منشور بالمتجر",
                  format: item.format || "digital",
                  salePrice: gross,
                  authorRoyaltyPercentage: royaltyRate,
                  authorEarnings,
                  buyerName: ord.userName || "قارئ متجر UNIGATES",
                  buyerEmail: ord.userEmail,
                  buyerCity: ord.shippingAddress?.city,
                  paymentMethod: ord.paymentMethod,
                  orderNumber: ord.orderNumber,
                  invoiceNumber: `INV-SALE-${(ord.orderNumber || "").replace(/[^0-9]/g, "").slice(-4) || "9921"}`,
                  date: (ord.createdAt || "").split(" ")[0] || new Date().toISOString().split("T")[0],
                  quantity: qty,
                  authorName: author.fullName,
                  authorCode: targetCode,
                  status: ord.status || "completed"
                });
              }
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to parse bookstore orders for sales synchronization:", err);
    }

    // 3. Merge without duplicate order numbers and book codes
    const combinedMap = new Map<string, BookSaleRecord>();
    // Priority to direct sales, then fill from store orders
    savedDirectSales.forEach(s => {
      combinedMap.set(`${s.orderNumber}_${s.bookCode}`, s);
    });
    storeOrdersSales.forEach(s => {
      const key = `${s.orderNumber}_${s.bookCode}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, s);
      }
    });

    const finalSales = Array.from(combinedMap.values());
    finalSales.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return finalSales;
  }

  static getFinancialSummary() {
    const sales = this.getSales();
    const payouts = this.getPayouts();

    const totalGrossSales = sales.reduce((sum, s) => sum + s.salePrice, 0);
    const totalAuthorRoyalties = sales.reduce((sum, s) => sum + s.authorEarnings, 0);
    const totalWithdrawn = payouts
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingWithdrawal = payouts
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, totalAuthorRoyalties - totalWithdrawn - pendingWithdrawal);

    const digitalCopiesSold = sales.filter(s => s.format === "digital").length;
    const printCopiesSold = sales.filter(s => s.format === "print" || s.format === "both").length;

    return {
      totalGrossSales,
      totalAuthorRoyalties,
      availableBalance,
      totalWithdrawn,
      pendingWithdrawal,
      totalCopiesSold: sales.length,
      digitalCopiesSold,
      printCopiesSold,
      digitalRoyaltyPercentage: 70,
      printRoyaltyPercentage: 30,
      royaltyPercentage: 70
    };
  }

  // Payouts
  static getAllPayouts(): PayoutRequest[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      if (saved) {
        const parsed: PayoutRequest[] = JSON.parse(saved);
        const filtered = parsed.filter(p => {
          if (!p) return false;
          const aId = p.authorId || "";
          const aCode = p.authorCode || "";
          const aName = p.authorName || "";
          if (aId === "auth-2026-001" || aCode === "AUT-7890" || aName.includes("المنشاوي")) return false;
          if (p.id === "pay-01") return false;
          return true;
        });
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(filtered));
        }
        return filtered;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static getPayouts(authorId?: string): PayoutRequest[] {
    const all = this.getAllPayouts();
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    return all.filter(p => p.authorId === targetId);
  }

  static requestPayout(amount: number, payoutMethod: any, accountDetails: string, currency = "EGP"): PayoutRequest {
    const all = this.getAllPayouts();
    const author = this.getAuthorProfile();
    const newReq: PayoutRequest = {
      id: `pay-${Date.now()}`,
      authorId: author.id,
      authorName: author.fullName,
      authorCode: author.authorCode,
      amount,
      currency,
      payoutMethod,
      accountDetails,
      status: "pending",
      requestDate: new Date().toISOString().split("T")[0],
      notes: "طلب السحب قيد المراجعة والتحويل من الإدارة المالية بدار عبيد."
    };
    all.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(all));
    return newReq;
  }

  // Bookstore Bridge: Get submissions transferred/ready for bookstore pricing
  static getSubmissionsPendingStore(): ManuscriptSubmission[] {
    const all = this.getAllSubmissions();
    return all.filter(s => s.status === "ready_for_pricing" || (s.status === "approved" && !s.storeBookCode));
  }

  // Bookstore Bridge: Transfer manuscript to bookstore studio for pricing
  static transferToBookStoreStudio(submissionId: string, adminNotes?: string): ManuscriptSubmission | null {
    const item = this.updateSubmissionStatus(
      submissionId, 
      "ready_for_pricing", 
      adminNotes || "تمت الموافقة على المخطوطة وإحالتها رسمياً لاستوديو متجر الكتب للتسعير واستكمال الوصف التسويقي والنشر."
    );
    return item;
  }

  // Bookstore Bridge: Record a real sale for an author by authorCode or authorId
  static recordSaleForAuthor(sale: {
    bookCode: string;
    bookTitle: string;
    format: "digital" | "print" | "both";
    salePrice: number;
    authorRoyaltyPercentage: number;
    authorEarnings: number;
    buyerName: string;
    orderNumber: string;
    date?: string;
    authorCode?: string;
    authorId?: string;
  }): BookSaleRecord {
    const authorProfile = this.getAuthorProfile();
    const targetAuthorId = sale.authorId || (sale.authorCode && sale.authorCode === authorProfile.authorCode ? authorProfile.id : authorProfile.id);

    const newRecord: BookSaleRecord = {
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookCode: sale.bookCode,
      bookTitle: sale.bookTitle,
      format: sale.format,
      salePrice: sale.salePrice,
      authorRoyaltyPercentage: sale.authorRoyaltyPercentage,
      authorEarnings: sale.authorEarnings,
      buyerName: sale.buyerName,
      orderNumber: sale.orderNumber,
      date: sale.date || new Date().toISOString().split("T")[0]
    };

    // 1. Save to global sales
    try {
      const savedGlobal = localStorage.getItem(STORAGE_KEYS.SALES);
      const listGlobal: BookSaleRecord[] = savedGlobal ? JSON.parse(savedGlobal) : [...INITIAL_SALES];
      listGlobal.unshift(newRecord);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(listGlobal));
    } catch (e) {
      console.error(e);
    }

    // 2. Save to author-specific sales
    if (targetAuthorId) {
      try {
        const authorKey = `${STORAGE_KEYS.SALES}_${targetAuthorId}`;
        const savedAuth = localStorage.getItem(authorKey);
        const listAuth: BookSaleRecord[] = savedAuth ? JSON.parse(savedAuth) : [];
        listAuth.unshift(newRecord);
        localStorage.setItem(authorKey, JSON.stringify(listAuth));
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Notify author via direct internal announcement message
    try {
      this.sendAdminMessageToAuthor(
        targetAuthorId,
        `🎉 إشعار مبيعات جديد: تم تسجيل عملية شراء لمؤلفكم "${sale.bookTitle}" (رقم الطلب: ${sale.orderNumber}) بصيغة (${sale.format === "digital" ? "رقمية E-Book" : "ورقية مطبوعة"}) بمبلغ ${sale.salePrice} ج.م. تمت إضافة حصتكم الأرباح (${sale.authorEarnings} ج.م) لرصيدكم المتاح فورياً!`
      );
    } catch (e) {
      console.error(e);
    }

    return newRecord;
  }

  // ─────────────────────────────────────────────────────────────
  // Contracts API (دار عبيد للنشر والتوزيع - عقود النشر المعتمدة)
  // ─────────────────────────────────────────────────────────────

  static getAllContracts(): AuthorContract[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
      if (saved) {
        const parsed: AuthorContract[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
    } catch (e) {}
    return [...INITIAL_CONTRACTS];
  }

  static getContracts(authorId?: string): AuthorContract[] {
    const all = this.getAllContracts();
    const currentAuthor = this.getAuthorProfile();
    const targetId = authorId || currentAuthor.id;
    return all.filter(c => c.authorId === targetId || (currentAuthor.authorCode && c.authorCode === currentAuthor.authorCode));
  }

  static getContractById(contractId: string): AuthorContract | undefined {
    const all = this.getAllContracts();
    return all.find(c => c.id === contractId);
  }

  static issueContract(data: {
    submissionId: string;
    bookTitle: string;
    category?: string;
    publishType: PublishType;
    authorId: string;
    authorName: string;
    authorCode: string;
    authorNationalId?: string;
    authorEmail?: string;
    authorPhone?: string;
    digitalRoyaltyRate?: number;
    printRoyaltyRate?: number;
    rightsDurationYears?: number;
    retailPriceEstimate?: number;
    specialConditions?: string;
  }): AuthorContract {
    const all = this.getAllContracts();
    const contractNumber = `CNT-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const today = new Date().toISOString().split("T")[0];

    const newContract: AuthorContract = {
      id: `cnt-${Date.now()}`,
      contractNumber,
      submissionId: data.submissionId,
      bookTitle: data.bookTitle,
      category: data.category || "دراسات وأبحاث أكاديمية",
      publishType: data.publishType,
      authorId: data.authorId,
      authorName: data.authorName,
      authorCode: data.authorCode,
      authorNationalId: data.authorNationalId,
      authorEmail: data.authorEmail,
      authorPhone: data.authorPhone,
      digitalRoyaltyRate: data.digitalRoyaltyRate ?? 70,
      printRoyaltyRate: data.printRoyaltyRate ?? 30,
      rightsDurationYears: data.rightsDurationYears ?? 5,
      exclusiveRights: true,
      retailPriceEstimate: data.retailPriceEstimate ?? 150,
      status: "pending_signature",
      issueDate: today,
      adminSignature: {
        signedByName: "د. عبيد بن عيسى",
        role: "المدير التنفيذي لدار عبيد للنشر والتوزيع",
        signedAt: today,
        sealNumber: `SEAL-DO-2026-${Math.floor(10 + Math.random() * 89)}`
      },
      specialConditions: data.specialConditions || "تم إعداد العقد وفق لائحة النشر والطباعة المعتمدة بدار عبيد للنشر والتوزيع."
    };

    all.unshift(newContract);
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(all));

    // Send direct notification message to the author
    try {
      this.sendAdminMessageToAuthor(
        data.authorId,
        `📜 تم إصدار عقد النشر والتوزيع الرسمي لمصنفكم "${data.bookTitle}" (رقم العقد: ${contractNumber}). يرجى الاطلاع على بنود العقد واعتماده بالتوقيع الرقمي من صفحة "العقود" في حسابكم.`
      );
    } catch (e) {
      console.error(e);
    }

    return newContract;
  }

  static signContract(contractId: string, authorSignatureText: string): AuthorContract | null {
    const all = this.getAllContracts();
    const idx = all.findIndex(c => c.id === contractId);
    if (idx === -1) return null;

    const todayStr = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const signedDateIso = new Date().toISOString().split("T")[0];

    all[idx] = {
      ...all[idx],
      status: "signed",
      signedDate: signedDateIso,
      authorSignature: {
        signatureText: authorSignatureText.trim(),
        signedAt: `${todayStr} - ${new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`,
        ipOrRef: `DIGI-SIGN-${Math.floor(1000 + Math.random() * 9000)}`
      }
    };

    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(all));

    // Send confirmation message to author
    try {
      this.sendAdminMessageToAuthor(
        all[idx].authorId,
        `🎉 تم توثيق وتوقيع عقد النشر والتوزيع رقم (${all[idx].contractNumber}) بنجاح! أصبح بإمكانكم الآن تحميل وطباعة النسخة الرسمية المعتمدة والمختومة من حسابكم في أي وقت.`
      );
    } catch (e) {
      console.error(e);
    }

    return all[idx];
  }

  static rejectContract(contractId: string, reason?: string): AuthorContract | null {
    const all = this.getAllContracts();
    const idx = all.findIndex(c => c.id === contractId);
    if (idx === -1) return null;

    all[idx] = {
      ...all[idx],
      status: "rejected",
      specialConditions: `${all[idx].specialConditions || ""}\n(تم رفض العقد: ${reason || "بناء على طلب المؤلف"})`
    };

    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(all));
    return all[idx];
  }

  static deleteContract(contractId: string): boolean {
    const all = this.getAllContracts();
    const filtered = all.filter(c => c.id !== contractId);
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(filtered));
    return true;
  }
}
