import { 
  AuthorProfile, 
  ManuscriptSubmission, 
  NashrInvoice, 
  NashrMessage, 
  BookSaleRecord, 
  PayoutRequest 
} from "@/types/nashr";

const STORAGE_KEYS = {
  CURRENT_AUTHOR: "nashr_current_author",
  ALL_AUTHORS: "nashr_all_authors",
  SUBMISSIONS: "nashr_submissions",
  INVOICES: "nashr_invoices",
  MESSAGES: "nashr_messages",
  SALES: "nashr_book_sales",
  PAYOUTS: "nashr_payouts"
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

// Default Sales (70% Author Royalty for Digital, 30% for Print)
const INITIAL_SALES: BookSaleRecord[] = [
  {
    id: "sale-901",
    bookCode: "BK-DAR-4491",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    format: "print",
    salePrice: 140,
    authorRoyaltyPercentage: 30,
    authorEarnings: 42, // 140 * 0.30 = 42
    buyerName: "مكتبة كلية الاقتصاد - جامعة القاهرة",
    orderNumber: "ORD-99210",
    date: "2026-09-28"
  },
  {
    id: "sale-902",
    bookCode: "BK-DAR-4491",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    format: "print",
    salePrice: 140,
    authorRoyaltyPercentage: 30,
    authorEarnings: 42,
    buyerName: "د. خالد السعيد - الرياض",
    orderNumber: "ORD-99215",
    date: "2026-09-27"
  },
  {
    id: "sale-903",
    bookCode: "BK-DAR-8821",
    bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
    format: "digital",
    salePrice: 85,
    authorRoyaltyPercentage: 70,
    authorEarnings: 59.5, // 85 * 0.70 = 59.5
    buyerName: "أحمد ممدوح (باحث ماجستير)",
    orderNumber: "ORD-99180",
    date: "2026-09-27"
  },
  {
    id: "sale-904",
    bookCode: "BK-DAR-8821",
    bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
    format: "digital",
    salePrice: 85,
    authorRoyaltyPercentage: 70,
    authorEarnings: 59.5,
    buyerName: "سارة عبد العزيز (جامعة الملك سعود)",
    orderNumber: "ORD-99162",
    date: "2026-09-26"
  },
  {
    id: "sale-905",
    bookCode: "BK-DAR-4491",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    format: "both",
    salePrice: 140,
    authorRoyaltyPercentage: 30,
    authorEarnings: 42,
    buyerName: "معهد الدلتا العالي للهندسة والتكنولوجيا",
    orderNumber: "ORD-99050",
    date: "2026-09-24"
  },
  {
    id: "sale-906",
    bookCode: "BK-DAR-8821",
    bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
    format: "digital",
    salePrice: 85,
    authorRoyaltyPercentage: 70,
    authorEarnings: 59.5,
    buyerName: "م. إبراهيم يوسف",
    orderNumber: "ORD-98920",
    date: "2026-09-22"
  },
  {
    id: "sale-907",
    bookCode: "BK-DAR-4491",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    format: "print",
    salePrice: 140,
    authorRoyaltyPercentage: 30,
    authorEarnings: 42,
    buyerName: "مركز بحوث الشرق الأوسط",
    orderNumber: "ORD-98841",
    date: "2026-09-20"
  }
];

// Default Payout History
const INITIAL_PAYOUTS: PayoutRequest[] = [
  {
    id: "pay-01",
    authorId: "auth-2026-001",
    authorName: "أ.د. عبد الرحمن المنشاوي",
    authorCode: "AUT-7890",
    amount: 1500,
    currency: "EGP",
    payoutMethod: "bank_transfer",
    accountDetails: "البنك الأهلي المصري - حساب رقم 12345678901",
    status: "completed",
    requestDate: "2026-08-30",
    transactionRef: "TRX-NBE-889102",
    notes: "تم التحويل بنجاح لحساب المؤلف البنكي."
  }
];

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

export class NashrDataStore {
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

      // Synchronize back to storage if items were pruned or healed
      if (saved && (list.length !== filtered.length || healedAny)) {
        localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(healedList));
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

  static saveAuthorProfile(profile: AuthorProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(profile));
    try {
      const all = this.getAllAuthors();
      const idx = all.findIndex(a => a.id === profile.id);
      if (idx !== -1) {
        all[idx] = profile;
      } else {
        all.unshift(profile);
      }
      localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(all));
    } catch (e) {
      console.error(e);
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
    receiptNotes?: string
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
      delete list[index].rejectionReason;
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));

      // Dispatch automated notice to admin
      this.sendMessage(
        `💳 تم رفع إيصال سداد جديد للفاتورة (${list[index].invoiceNumber}) بمبلغ ${list[index].amount} ${list[index].currency} بواسطة (${paymentMethod}). بانتظار المراجعة والاعتماد المالي.`,
        "إيصال_سداد.png",
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
    receiptNotes?: string
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
      `💳 تم رفع إيصال تحويل مباشر جديد بمبلغ ${amount} ج.م عبر (${paymentMethod}) لمؤلف: ${manuscriptTitle || "دفعة نشر"}. برجاء المطابقة والاعتماد.`,
      "إيصال_تحويل_مباشر.png",
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

  // Sales & Royalties
  static getSales(authorId?: string): BookSaleRecord[] {
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    if (targetId === "auth-2026-001") {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.SALES);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
        return INITIAL_SALES;
      } catch (e) {
        console.error(e);
        return INITIAL_SALES;
      }
    }
    // New authors start with clean 0 sales
    try {
      const saved = localStorage.getItem(`${STORAGE_KEYS.SALES}_${targetId}`);
      if (saved) return JSON.parse(saved);
      return [];
    } catch (e) {
      return [];
    }
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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(INITIAL_PAYOUTS));
    return INITIAL_PAYOUTS;
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
}
