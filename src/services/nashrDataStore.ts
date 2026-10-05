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

  static getAllAuthors(): AuthorProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALL_AUTHORS);
      let list: AuthorProfile[] = saved ? JSON.parse(saved) : [DEFAULT_DEMO_AUTHOR];
      const current = this.getAuthorProfile();
      if (current && !list.some(a => a.id === current.id)) {
        list.push(current);
      }
      return list;
    } catch (e) {
      console.error(e);
      return [DEFAULT_DEMO_AUTHOR];
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

  static updatePassword(newPassword: string): boolean {
    const profile = this.getAuthorProfile();
    profile.isTemporaryPassword = false;
    this.saveAuthorProfile(profile);
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
  // Submissions
  static getAllSubmissions(): ManuscriptSubmission[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }

  static getSubmissions(authorId?: string): ManuscriptSubmission[] {
    const all = this.getAllSubmissions();
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    const targetCode = author.authorCode;
    return all.filter(s => s.authorId === targetId || (targetCode && s.authorCode === targetCode));
  }

  static addSubmission(submission: Omit<ManuscriptSubmission, "id" | "submissionDate" | "status">): ManuscriptSubmission {
    const list = this.getAllSubmissions();
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
  static getAllInvoices(): NashrInvoice[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    return INITIAL_INVOICES;
  }

  static getInvoices(authorId?: string): NashrInvoice[] {
    const all = this.getAllInvoices();
    const author = this.getAuthorProfile();
    const targetId = authorId || author.id;
    return all.filter(inv => inv.authorId === targetId);
  }

  static uploadPaymentReceipt(invoiceId: string, receiptImageUrl: string, paymentMethod: string): void {
    const list = this.getAllInvoices();
    const index = list.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
      list[index].receiptImageUrl = receiptImageUrl;
      list[index].paymentMethod = paymentMethod;
      list[index].status = "under_review";
      list[index].paymentDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(list));
    }
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

  static verifyInvoiceReceipt(invoiceId: string, approved: boolean): NashrInvoice | null {
    const all = this.getAllInvoices();
    const inv = all.find(i => i.id === invoiceId);
    if (!inv) return null;
    inv.status = approved ? "paid" : "unpaid";
    if (approved) {
      inv.paymentDate = new Date().toISOString().split("T")[0];
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
