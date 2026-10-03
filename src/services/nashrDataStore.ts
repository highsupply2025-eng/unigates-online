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
    adminFeedback: "تمت مراجعة المخطوطة والتدقيق اللغوي وتنسيق الغلاف الرسمي من قبل دار عبيد. الكتاب معتمد ومدرج بمتجر UNIGATES.",
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
    synopsis: "مخطوطة بحثية حديثة تتناول الأطر التشريعية والأخلاقية لاستخدام خوارزميات الذكاء الاصطناعي في النزاعات والعلاقات الدولية.",
    pageCount: 320,
    language: "العربية",
    status: "pending_review",
    submissionDate: "2026-09-20",
    adminFeedback: "المخطوطة قيد الفحص الأكاديمي ولجنة القراءة والتقييم الفني في دار عبيد للنشر.",
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

export class NashrDataStore {
  // Author Profile
  static getAuthorProfile(): AuthorProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTHOR);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DEMO_AUTHOR;
  }

  static saveAuthorProfile(profile: AuthorProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_AUTHOR, JSON.stringify(profile));
  }

  static updatePassword(newPassword: string): boolean {
    const profile = this.getAuthorProfile();
    profile.isTemporaryPassword = false;
    this.saveAuthorProfile(profile);
    return true;
  }

  // Submissions
  static getSubmissions(): ManuscriptSubmission[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }

  static addSubmission(submission: Omit<ManuscriptSubmission, "id" | "submissionDate" | "status">): ManuscriptSubmission {
    const list = this.getSubmissions();
    const newSub: ManuscriptSubmission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submissionDate: new Date().toISOString().split("T")[0],
      status: "pending_review",
      adminFeedback: "تم إرسال المخطوطة بنجاح إلى إدارة دار عبيد للنشر للمراجعة والتدقيق والاعتماد."
    };
    list.unshift(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    return newSub;
  }

  // Invoices
  static getInvoices(): NashrInvoice[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    return INITIAL_INVOICES;
  }

  static uploadPaymentReceipt(invoiceId: string, receiptImageUrl: string, paymentMethod: string): void {
    const list = this.getInvoices();
    const index = list.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
      list[index].receiptImageUrl = receiptImageUrl;
      list[index].paymentMethod = paymentMethod;
      list[index].status = "under_review";
      list[index].paymentDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));
    }
  }

  // Messages
  static getMessages(): NashrMessage[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  }

  static sendMessage(text: string, attachmentName?: string, attachmentUrl?: string): NashrMessage {
    const list = this.getMessages();
    const author = this.getAuthorProfile();
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
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(list));
    return newMsg;
  }

  // Sales & Royalties (20%)
  static getSales(): BookSaleRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
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
  static getPayouts(): PayoutRequest[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(INITIAL_PAYOUTS));
    return INITIAL_PAYOUTS;
  }

  static requestPayout(amount: number, payoutMethod: any, accountDetails: string, currency = "EGP"): PayoutRequest {
    const list = this.getPayouts();
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
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(list));
    return newReq;
  }
}
