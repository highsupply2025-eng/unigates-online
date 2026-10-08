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
            return parsed;
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

      // Synchronize back to storage if items were pruned
      if (saved && list.length !== filtered.length) {
        localStorage.setItem(STORAGE_KEYS.ALL_AUTHORS, JSON.stringify(filtered));
      }

      return filtered;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(i => {
            if (!i || typeof i !== "object" || !i.id) return false;
            const authorId = (i.authorId || "").trim();
            if (OLD_TEST_AUTHOR_CODES.includes(authorId)) return false;
            return true;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
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
