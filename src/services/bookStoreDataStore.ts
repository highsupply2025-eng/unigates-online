import { 
  BookStoreItem, 
  PurchasedBook, 
  BookOrder, 
  PublisherProfile, 
  PublisherSaleRecord, 
  PublisherPayoutRequest,
  CartItem,
  ShippingAddress,
  FlashSalePromotion,
  BookReadingHeatmap,
  AntiCounterfeitQRVerification,
  PublishingContract,
  BookPassSubscription,
  LiveCourierTrackingOrder,
  ReaderRewardsAccount
} from "@/types/bookStore";

const STORAGE_KEYS = {
  CATALOG: "unigates_bookstore_catalog",
  PURCHASES: "unigates_bookstore_purchased_books",
  ORDERS: "unigates_bookstore_orders",
  CART: "unigates_bookstore_cart",
  PUBLISHER_PROFILE: "unigates_bookstore_publisher_profile",
  PUBLISHER_SALES: "unigates_bookstore_publisher_sales",
  PUBLISHER_PAYOUTS: "unigates_bookstore_publisher_payouts",
  READER_PROFILE: "unigates_bookstore_reader_profile",
  READING_GOAL: "unigates_bookstore_reading_goal",
  WISHLIST: "unigates_bookstore_wishlist",
  CURRENT_USER: "unigates_bookstore_current_session",
};

// Initial Rich Catalog
export const INITIAL_BOOKS_CATALOG: BookStoreItem[] = [
  {
    id: "bk-dar-001",
    code: "BK-DAR-4491",
    title_ar: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    title_en: "Future of Digital Governance in Arab Universities & Institutions",
    author_ar: "أ.د. عبد الرحمن المنشاوي",
    author_en: "Prof. Dr. Abdelrahman El-Minshawi",
    publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
    publisher_en: "Dar Obeid Publishing & Distribution",
    publisher_id: "pub-obeid-001",
    category: "academic",
    category_ar: "مراجع ودراسات أكاديمية",
    category_en: "Academic Studies & References",
    description_ar: "دراسة شاملة وتطبيقية حول رقمنة سلاسل الاعتماد الأكاديمي، تأمين الاختبارات الجامعية، وتطوير آليات التدريس الذكي في ظل الثورة الصناعية الرابعة.",
    description_en: "A comprehensive and applied study on digitizing academic accreditation chains, securing university exams, and smart education under Industry 4.0.",
    price_digital: 140,
    price_print: 220,
    currency: "EGP",
    pages: 284,
    format: "both",
    cover_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    isbn: "978-977-90-8812-4",
    rating: 4.9,
    reviews_count: 38,
    publish_year: 2026,
    is_bestseller: true,
    is_featured: true,
    stock_print: 45,
    full_content_chapters: [
      {
        id: "ch-1",
        title_ar: "الفصل الأول: مدخل إلى الحوكمة الرقمية الجامعية وتحديات الاعتماد",
        title_en: "Chapter 1: Introduction to University Digital Governance & Accreditation",
        content_ar: `تعتبر الحوكمة الرقمية في الجامعات الركيزة الأساسية لضمان جودة التعليم وموثوقية مخرجات التعلم الأكاديمي. إن التحول من العمليات الورقية التقليدية إلى سلاسل الاعتماد الرقمية المشفرة لم يعد مجرد رفاهية تكنولوجية، بل أصبح ضرورة ملحة لمكافحة تسريب الاختبارات وتزوير الشهادات والدرجات.

في هذا الفصل نستعرض الأطر التنظيمية المعاصرة في كبريات الجامعات العالمية، وكيف استطاعت منظومات مثل UNIGATES أن تقيم جدار حماية صارم يربط بين العميد والوكلاء ورؤساء الأقسام وأعضاء هيئة التدريس في توقيع إلكتروني متعدد المفاتيح المشفرة.

المحاور التفصيلية:
1. تعريف الحوكمة المؤسسية في التعليم العالي.
2. آليات التوثيق وسجلات التدقيق المالي والأكاديمي (Audit Trails).
3. تقليل الأخطاء البشرية وسرعة اعتماد جداول الحصص والمحاضرات.`,
        content_en: `Digital governance in higher education represents the foundational pillar for ensuring academic excellence and student credential integrity. Transitioning from legacy paperwork to encrypted digital validation chains has become vital for eliminating exam leaks and grade tampering.`
      },
      {
        id: "ch-2",
        title_ar: "الفصل الثاني: سلاسل التوقيع الرقمي الصارم ومتطلبات الأمان",
        title_en: "Chapter 2: Multi-Key Cryptographic Approval Chains",
        content_ar: `تستلزم سلاسل الاعتماد الرقمي للاختبارات الجامعية نمطاً صارماً ومتسلسلاً (Sequential Cryptographic Handshake). تبدأ العملية عندما يقوم أستاذ المادة برفع بنك الأسئلة المعتمد، ولا يمكن إرساله للطلاب أو تنزيل ملفاته إلا بعد توقيع رئيس القسم المعني، ثم وكيل الكلية لشئون التعليم والطلاب، وأخيراً التوقيع السيادي لعميد الكلية أو مدير المعهد.

هذا التدفق يمنح المؤسسة مناعة مطلقة ضد أي محاولات تسريب أو تعديل في الدرجات، ويخلق سجلاً تاريخياً لا يمكن مسحه أو التلاعب به.`,
        content_en: `Cryptographic approval chains enforce a strict, unskippable workflow: Lecturer -> Department Head -> Vice Dean -> Dean/Director. No student can view an exam before all signatures are fully validated.`
      },
      {
        id: "ch-3",
        title_ar: "الفصل الثالث: استطلاعات الجودة المجهولة وأثرها على تقييم الأساتذة",
        title_en: "Chapter 3: Anonymous Quality Feedback & Faculty Assessment",
        content_ar: `من أهم ركائز الحوكمة الحديثة حماية هوية الطالب أثناء تقييم المقررات وأعضاء هيئة التدريس. تتيح الخوارزميات المجهولة حذف كافة المعرفات (Student ID, IP Address, Session ID) من سجلات الاستطلاع، مما يشجع الطلاب على الإدلاء بآرائهم بنزاهة تامة دون خوف من التأثير على درجاتهم.`,
        content_en: `Protecting student identities in evaluation surveys is a core mandate of modern governance, enabling 100% objective performance feedback.`
      }
    ]
  },
  {
    id: "bk-dar-002",
    code: "BK-DAR-1082",
    title_ar: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
    title_en: "Generative AI in Modern Healthcare & Clinical Diagnostics",
    author_ar: "د. هدى عبد العزيز السعيد",
    author_en: "Dr. Hoda Abdelaziz El-Saeed",
    publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
    publisher_en: "Dar Obeid Publishing & Distribution",
    publisher_id: "pub-obeid-001",
    category: "technology",
    category_ar: "الذكاء الاصطناعي والطب",
    category_en: "AI & Medical Technology",
    description_ar: "دليل طبي وتقني متقدم للأطباء والباحثين حول استخدام النماذج اللغوية الكبيرة وتحليل الصور الطبية بالذكاء الاصطناعي مع مراعاة أخلاقيات المهنة وخصوصية المرضى.",
    description_en: "An advanced medical and technical guide for doctors and clinical researchers on LLMs and medical imaging diagnostics.",
    price_digital: 180,
    price_print: 275,
    currency: "EGP",
    pages: 340,
    format: "both",
    cover_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
    isbn: "978-977-90-9943-1",
    rating: 5.0,
    reviews_count: 52,
    publish_year: 2026,
    is_bestseller: true,
    is_featured: true,
    stock_print: 60,
    full_content_chapters: [
      {
        id: "ch-1",
        title_ar: "الفصل الأول: ثورة الذكاء الاصطناعي في الطب التشخيصي",
        title_en: "Chapter 1: AI Revolution in Clinical Diagnostics",
        content_ar: `يشهد القطاع الطبي تحولاً جذرياً بفضل خوارزميات الرؤية الحاسوبية والنماذج التوليدية القادرة على فحص آلاف الأشعات المقطعية والرنين المغناطيسي في ثوانٍ معدودة بدقة تضاهي أمهر الاستشاريين.

يهدف هذا الكتاب إلى تمكين الطبيب العربي من استيعاب هذه الأدوات دون الحاجة إلى خلفية برمجية معقدة، مع التركيز على التطبيقات السريرية الفعلية.`,
        content_en: `Medical diagnostics is undergoing a paradigm shift powered by computer vision and multimodal generative models.`
      }
    ]
  },
  {
    id: "bk-dar-003",
    code: "BK-DAR-3320",
    title_ar: "إدارة المشاريع الاحترافية PMP وفق الدليل السابع",
    title_en: "PMP Project Management Master Guide (PMBOK 7th Ed)",
    author_ar: "م. طارق يوسف الشناوي",
    author_en: "Eng. Tarek Youssef El-Shennawy",
    publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
    publisher_en: "Dar Obeid Publishing & Distribution",
    publisher_id: "pub-obeid-001",
    category: "business",
    category_ar: "إدارة الأعمال والقيادة",
    category_en: "Business & Project Management",
    description_ar: "المرجع الشامل والمعتمد لاجتياز اختبار PMP الدولي، متضمناً أحدث استراتيجيات إدارة المشاريع الرشيقة (Agile) والتقليدية ودراسات حالة من السوق العربي.",
    description_en: "The master guide for passing the PMP exam with Agile practices and real-world Middle Eastern case studies.",
    price_digital: 160,
    price_print: 250,
    currency: "EGP",
    pages: 410,
    format: "both",
    cover_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    isbn: "978-977-90-7718-9",
    rating: 4.8,
    reviews_count: 64,
    publish_year: 2025,
    is_bestseller: false,
    is_featured: true,
    stock_print: 30,
    full_content_chapters: [
      {
        id: "ch-1",
        title_ar: "الفصل الأول: مبادئ إدارة المشاريع الـ 12 ونظام تسليم القيمة",
        title_en: "Chapter 1: The 12 Principles of Project Management",
        content_ar: `يركز الإصدار السابع لمعهد PMI على المبادئ والسلوكيات بدلاً من العمليات الخطية الصارمة. إن إدراك القيمة وتوجيه الفريق نحو تحقيق الأثر هو جوهر النجاح الإداري.`,
        content_en: `PMBOK 7 shifts the focus to 12 core stewardship and delivery principles rather than strict linear processes.`
      }
    ]
  },
  {
    id: "bk-dar-004",
    code: "BK-DAR-8802",
    title_ar: "هندسة البرمجيات السحابية وبناء النظم الموزعة",
    title_en: "Cloud Software Engineering & Microservices Architecture",
    author_ar: "د. سامي فوزي النجار",
    author_en: "Dr. Sami Fawzy El-Naggar",
    publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
    publisher_en: "Dar Obeid Publishing & Distribution",
    publisher_id: "pub-obeid-001",
    category: "programming",
    category_ar: "البرمجة وهندسة البرمجيات",
    category_en: "Programming & Cloud Architecture",
    description_ar: "كيف تبني نظماً سحابية تتحمل ملايين المستخدمين بالتزامن، مع شرح معماريات Microservices و Docker و Kubernetes والأمان العالي.",
    description_en: "Designing scalable distributed systems handling millions of concurrent users using microservices and Kubernetes.",
    price_digital: 190,
    price_print: 290,
    currency: "EGP",
    pages: 380,
    format: "both",
    cover_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    isbn: "978-977-90-5521-0",
    rating: 4.9,
    reviews_count: 29,
    publish_year: 2026,
    is_bestseller: true,
    is_featured: false,
    stock_print: 25,
    full_content_chapters: [
      {
        id: "ch-1",
        title_ar: "الفصل الأول: من النظم الأحادية إلى المعماريات الموزعة",
        title_en: "Chapter 1: From Monoliths to Scalable Distributed Architecture",
        content_ar: `تعتبر قابلية التوسع والمرونة حجر الزاوية في بناء منصات التعليم والخدمات الرقمية المعاصرة. يتناول هذا الفصل تفكيك التطبيقات الكبيرة إلى خدمات ميكروية مستقلة.`,
        content_en: `Scalability and fault tolerance dictate modern software design, transitioning monolithic apps to isolated services.`
      }
    ]
  },
  {
    id: "bk-dar-005",
    code: "BK-DAR-9914",
    title_ar: "سيكولوجية التفكير الإبداعي ومهارات القرن الحادي والعشرين",
    title_en: "Psychology of Creative Thinking & 21st Century Cognitive Skills",
    author_ar: "أ.د. نادية محمود الخولي",
    author_en: "Prof. Dr. Nadia Mahmoud El-Kholy",
    publisher_ar: "دار عبيد للنشر والتوزيع والطباعة",
    publisher_en: "Dar Obeid Publishing & Distribution",
    publisher_id: "pub-obeid-001",
    category: "humanities",
    category_ar: "العلوم الإنسانية وتطوير الذات",
    category_en: "Humanities & Cognitive Development",
    description_ar: "تحليل علمي لتطوير مهارات التفكير النقدي وحل المشكلات المعقدة والذكاء العاطفي لطلاب الجامعات والمهنيين.",
    description_en: "A scientific exploration of critical thinking, problem-solving, and emotional intelligence for academics and professionals.",
    price_digital: 110,
    price_print: 175,
    currency: "EGP",
    pages: 220,
    format: "both",
    cover_url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
    isbn: "978-977-90-6644-2",
    rating: 4.7,
    reviews_count: 41,
    publish_year: 2025,
    is_bestseller: false,
    is_featured: false,
    stock_print: 50,
    full_content_chapters: [
      {
        id: "ch-1",
        title_ar: "الفصل الأول: بنية العقل البشري والأنماط المعرفية الحديثة",
        title_en: "Chapter 1: Cognitive Frameworks and Creative Synthesis",
        content_ar: `إن الإبداع ليس هبة فطرية عشوائية، بل مهارة معرفية قابلة للتدريب والتطوير من خلال تمارين تفكيك الافتراضات والتفكير التوليدي.`,
        content_en: `Creativity is a trainable cognitive muscle developed through hypothesis testing and divergent thinking.`
      }
    ]
  }
];

// Default Initial Purchases for Reader Demo
const INITIAL_PURCHASED_BOOKS: PurchasedBook[] = [
  {
    id: "purch-001",
    orderId: "ORD-2026-9041",
    bookId: "bk-dar-001",
    book: INITIAL_BOOKS_CATALOG[0],
    purchaseDate: "2026-03-20",
    format: "digital",
    amountPaid: 140,
    currency: "EGP",
    lastReadChapterIndex: 0,
    lastReadProgress: 45,
    isOfflineAvailable: true,
    bookmarks: [1, 2],
    readingNotes: [
      {
        id: "note-1",
        chapterIndex: 0,
        text: "نقطة هامة: سلاسل الاعتماد الرقمي تمنع تسريب أسئلة الامتحانات بنسبة 100%.",
        date: "2026-03-22"
      }
    ]
  },
  {
    id: "purch-002",
    orderId: "ORD-2026-8812",
    bookId: "bk-dar-002",
    book: INITIAL_BOOKS_CATALOG[1],
    purchaseDate: "2026-03-25",
    format: "digital",
    amountPaid: 180,
    currency: "EGP",
    lastReadChapterIndex: 0,
    lastReadProgress: 15,
    isOfflineAvailable: true,
    bookmarks: [1],
    readingNotes: []
  }
];

// Initial Publisher Demo Profile
export const DEFAULT_PUBLISHER_PROFILE: PublisherProfile = {
  id: "pub-obeid-001",
  publisherCode: "PUB-OBEID-99",
  companyName: "دار عبيد للنشر والتوزيع والطباعة",
  contactPerson: "أ. محمود عبيد التميمي",
  email: "darobeid@unigates.online",
  phone: "+20 102 998 8776",
  licenseNumber: "LIC-EGY-2026-449",
  commercialRecord: "CR-1049281",
  city: "القاهرة",
  country: "جمهورية مصر العربية",
  bio: "دار نشر أكاديمية رائدة متخصصة في طباعة ونشر المراجع الجامعية، الدراسات التكنولوجية، والمؤلفات الفكرية، معتمدة لدى منصة UNIGATES برقم ترخيص دولي.",
  logoUrl: "",
  joinedDate: "2025-11-01",
  platformCommissionRate: 0.20,
  payoutMethod: "bank_transfer",
  bankAccount: {
    bankName: "البنك التجاري الدولي CIB",
    accountHolder: "مؤسسة دار عبيد للطباعة والنشر",
    ibanOrNumber: "EG92001000000000492810029"
  }
};

// Initial Publisher Sales Records
const INITIAL_PUBLISHER_SALES: PublisherSaleRecord[] = [
  {
    id: "sale-101",
    orderNumber: "ORD-2026-9041",
    orderDate: "2026-03-20 14:30",
    bookId: "bk-dar-001",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    buyerName: "أحمد مصطفى كامل",
    format: "digital",
    quantity: 1,
    grossAmount: 140,
    platformShare: 28, // 20%
    publisherShare: 112, // 80%
    status: "completed"
  },
  {
    id: "sale-102",
    orderNumber: "ORD-2026-8812",
    orderDate: "2026-03-25 10:15",
    bookId: "bk-dar-002",
    bookTitle: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
    buyerName: "د. سارة المنشاوي",
    format: "digital",
    quantity: 1,
    grossAmount: 180,
    platformShare: 36, // 20%
    publisherShare: 144, // 80%
    status: "completed"
  },
  {
    id: "sale-103",
    orderNumber: "ORD-2026-7731",
    orderDate: "2026-03-28 19:40",
    bookId: "bk-dar-001",
    bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
    buyerName: "د. إبراهيم شكري",
    format: "print",
    quantity: 2,
    grossAmount: 440,
    platformShare: 88, // 20%
    publisherShare: 352, // 80%
    status: "completed"
  },
  {
    id: "sale-104",
    orderNumber: "ORD-2026-6620",
    orderDate: "2026-03-29 11:20",
    bookId: "bk-dar-003",
    bookTitle: "إدارة المشاريع الاحترافية PMP وفق الدليل السابع",
    buyerName: "م. خالد الأنصاري",
    format: "print",
    quantity: 1,
    grossAmount: 250,
    platformShare: 50, // 20%
    publisherShare: 200, // 80%
    status: "pending_settlement"
  }
];

export class BookStoreDataStore {
  // 1. Catalog operations
  static getCatalog(): BookStoreItem[] {
    if (typeof window === "undefined") return INITIAL_BOOKS_CATALOG;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(INITIAL_BOOKS_CATALOG));
        return INITIAL_BOOKS_CATALOG;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_BOOKS_CATALOG;
    }
  }

  static getBookById(id: string): BookStoreItem | undefined {
    const catalog = this.getCatalog();
    return catalog.find(b => b.id === id || b.code === id);
  }

  static addBookToCatalog(book: BookStoreItem): void {
    const catalog = this.getCatalog();
    catalog.unshift(book);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
    }
  }

  // 2. Reader purchases and library
  static getPurchasedBooks(): PurchasedBook[] {
    if (typeof window === "undefined") return INITIAL_PURCHASED_BOOKS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASED_BOOKS));
        return INITIAL_PURCHASED_BOOKS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_PURCHASED_BOOKS;
    }
  }

  static addPurchasedBook(bookItem: BookStoreItem, format: "digital" | "print", orderId: string, amount: number): PurchasedBook {
    const list = this.getPurchasedBooks();
    const newPurchase: PurchasedBook = {
      id: `purch-${Date.now()}`,
      orderId,
      bookId: bookItem.id,
      book: bookItem,
      purchaseDate: new Date().toISOString().split("T")[0],
      format,
      amountPaid: amount,
      currency: bookItem.currency,
      lastReadChapterIndex: 0,
      lastReadProgress: 0,
      isOfflineAvailable: true,
      bookmarks: [],
      readingNotes: []
    };
    list.unshift(newPurchase);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(list));
    }
    return newPurchase;
  }

  static updateReadingProgress(purchasedId: string, chapterIndex: number, progressPercent: number): void {
    const list = this.getPurchasedBooks();
    const item = list.find(p => p.id === purchasedId);
    if (item) {
      item.lastReadChapterIndex = chapterIndex;
      item.lastReadProgress = progressPercent;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(list));
      }
    }
  }

  static addReadingNote(purchasedId: string, chapterIndex: number, text: string): void {
    const list = this.getPurchasedBooks();
    const item = list.find(p => p.id === purchasedId);
    if (item) {
      if (!item.readingNotes) item.readingNotes = [];
      item.readingNotes.push({
        id: `note-${Date.now()}`,
        chapterIndex,
        text,
        date: new Date().toISOString().split("T")[0]
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(list));
      }
    }
  }

  // 3. Orders history
  static getOrders(): BookOrder[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!stored) {
        const demoOrders: BookOrder[] = [
          {
            id: "ord-9041",
            orderNumber: "ORD-2026-9041",
            userId: "reader-demo",
            userEmail: "reader@unigates.online",
            userName: "قارئ متميز",
            items: [
              {
                bookId: "bk-dar-001",
                bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
                bookCover: INITIAL_BOOKS_CATALOG[0].cover_url,
                format: "digital",
                price: 140,
                quantity: 1,
                publisherName: "دار عبيد للنشر والتوزيع"
              }
            ],
            subtotal: 140,
            shippingFee: 0,
            platformFee: 28,
            totalAmount: 140,
            currency: "EGP",
            status: "completed",
            paymentMethod: "credit_card",
            createdAt: "2026-03-20 14:30"
          },
          {
            id: "ord-8812",
            orderNumber: "ORD-2026-8812",
            userId: "reader-demo",
            userEmail: "reader@unigates.online",
            userName: "قارئ متميز",
            items: [
              {
                bookId: "bk-dar-002",
                bookTitle: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
                bookCover: INITIAL_BOOKS_CATALOG[1].cover_url,
                format: "digital",
                price: 180,
                quantity: 1,
                publisherName: "دار عبيد للنشر والتوزيع"
              }
            ],
            subtotal: 180,
            shippingFee: 0,
            platformFee: 36,
            totalAmount: 180,
            currency: "EGP",
            status: "completed",
            paymentMethod: "instapay",
            createdAt: "2026-03-25 10:15"
          }
        ];
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(demoOrders));
        return demoOrders;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static createOrder(order: BookOrder): void {
    const orders = this.getOrders();
    orders.unshift(order);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  }

  // 4. Cart management
  static getCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CART);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addToCart(book: BookStoreItem, format: "digital" | "print", quantity = 1, shippingOption: "standard" | "express" | "same_day" = "standard"): void {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.book.id === book.id && item.format === format);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ book, format, quantity, shippingOption });
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }
  }

  static removeFromCart(bookId: string, format: "digital" | "print"): void {
    let cart = this.getCart();
    cart = cart.filter(item => !(item.book.id === bookId && item.format === format));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }
  }

  static clearCart(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CART);
    }
  }

  // 5. Publisher Operations
  static getPublisherProfile(): PublisherProfile {
    if (typeof window === "undefined") return DEFAULT_PUBLISHER_PROFILE;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUBLISHER_PROFILE);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.PUBLISHER_PROFILE, JSON.stringify(DEFAULT_PUBLISHER_PROFILE));
        return DEFAULT_PUBLISHER_PROFILE;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PUBLISHER_PROFILE;
    }
  }

  static updatePublisherProfile(profile: PublisherProfile): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PUBLISHER_PROFILE, JSON.stringify(profile));
    }
  }

  static getPublisherSales(): PublisherSaleRecord[] {
    if (typeof window === "undefined") return INITIAL_PUBLISHER_SALES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUBLISHER_SALES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.PUBLISHER_SALES, JSON.stringify(INITIAL_PUBLISHER_SALES));
        return INITIAL_PUBLISHER_SALES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_PUBLISHER_SALES;
    }
  }

  static addPublisherSale(sale: PublisherSaleRecord): void {
    const sales = this.getPublisherSales();
    sales.unshift(sale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PUBLISHER_SALES, JSON.stringify(sales));
    }
  }

  static getPublisherPayouts(): PublisherPayoutRequest[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUBLISHER_PAYOUTS);
      if (!stored) {
        const demoPayouts: PublisherPayoutRequest[] = [
          {
            id: "pay-101",
            requestNumber: "PAY-2026-004",
            publisherId: "pub-obeid-001",
            amount: 5000,
            currency: "EGP",
            method: "تحويل بنكي (CIB)",
            accountDetails: "EG92001000000000492810029",
            status: "processed",
            requestedAt: "2026-03-01",
            processedAt: "2026-03-03",
            notes: "تم التحويل بنجاح لحساب مؤسسة دار عبيد."
          }
        ];
        localStorage.setItem(STORAGE_KEYS.PUBLISHER_PAYOUTS, JSON.stringify(demoPayouts));
        return demoPayouts;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static requestPublisherPayout(amount: number, method: string, accountDetails: string): PublisherPayoutRequest {
    const payouts = this.getPublisherPayouts();
    const newReq: PublisherPayoutRequest = {
      id: `payout-${Date.now()}`,
      requestNumber: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      publisherId: "pub-obeid-001",
      amount,
      currency: "EGP",
      method,
      accountDetails,
      status: "pending",
      requestedAt: new Date().toISOString().split("T")[0],
    };
    payouts.unshift(newReq);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PUBLISHER_PAYOUTS, JSON.stringify(payouts));
    }
    return newReq;
  }

  static getPublisherFinancialSummary() {
    const sales = this.getPublisherSales();
    const payouts = this.getPublisherPayouts();

    const grossSales = sales.reduce((acc, s) => acc + s.grossAmount, 0);
    const platformCommission = sales.reduce((acc, s) => acc + s.platformShare, 0); // 20%
    const totalEarnings = sales.reduce((acc, s) => acc + s.publisherShare, 0); // 80%

    const paidOut = payouts
      .filter(p => p.status === "processed" || p.status === "approved")
      .reduce((acc, p) => acc + p.amount, 0);

    const pendingPayouts = payouts
      .filter(p => p.status === "pending")
      .reduce((acc, p) => acc + p.amount, 0);

    const availableBalance = Math.max(0, totalEarnings - paidOut - pendingPayouts);

    const completedSalesCount = sales.filter(s => s.status === "completed").length;
    const pendingSalesCount = sales.filter(s => s.status === "pending_settlement").length;

    return {
      grossSales,
      platformCommissionRate: "20%",
      platformCommission,
      totalEarnings, // 80%
      paidOut,
      pendingPayouts,
      availableBalance,
      totalSalesCount: sales.length,
      completedSalesCount,
      pendingSalesCount,
      currency: "EGP"
    };
  }

  // 6. Reader Wishlist & Reading Goals
  // 6. Reader Wishlist & Price Drop Alerts & Reading Goals
  static getWishlist(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return stored ? JSON.parse(stored) : ["bk-dar-003", "bk-dar-004"];
    } catch {
      return [];
    }
  }

  static toggleWishlist(bookId: string): boolean {
    const list = this.getWishlist();
    const index = list.indexOf(bookId);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
      added = false;
    } else {
      list.push(bookId);
      added = true;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    }
    return added;
  }

  static getWishlistAlerts() {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("unigates_bookstore_wishlist_alerts");
      if (!stored) {
        const initialAlerts = [
          {
            id: "alt-1",
            bookId: "bk-dar-003",
            bookTitle: "إدارة المشاريع الاحترافية PMP وفق الدليل السابع",
            type: "price_drop",
            oldPrice: 200,
            newPrice: 160,
            discountPercent: 20,
            date: "2026-03-30",
            isRead: false,
            message_ar: "انخفاض في السعر! أصبح كتاب «إدارة المشاريع PMP» بسعر 160 EGP بدلاً من 200 EGP (خصم 20%).",
            message_en: "Price drop! PMP Project Management is now 160 EGP (20% OFF)."
          },
          {
            id: "alt-2",
            bookId: "bk-dar-004",
            bookTitle: "هندسة البرمجيات السحابية وبناء النظم الموزعة",
            type: "new_edition",
            date: "2026-03-29",
            isRead: false,
            message_ar: "طبعة جديدة منقحة! صدرت الطبعة الثانية 2026 لكتاب «هندسة البرمجيات السحابية» متضمنة فصولاً جديدة في Kubernetes.",
            message_en: "New 2026 Edition released for Cloud Software Engineering with new Kubernetes chapters."
          },
          {
            id: "alt-3",
            bookId: "bk-dar-001",
            bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
            type: "in_stock",
            date: "2026-03-28",
            isRead: true,
            message_ar: "توفرت طبعة ورقية فاخرة جديدة للشحن السريع لباب المنزل.",
            message_en: "Deluxe print copies are back in stock for express doorstep shipping."
          }
        ];
        localStorage.setItem("unigates_bookstore_wishlist_alerts", JSON.stringify(initialAlerts));
        return initialAlerts;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static markAlertAsRead(alertId: string) {
    const alerts = this.getWishlistAlerts();
    const item = alerts.find((a: any) => a.id === alertId);
    if (item) {
      item.isRead = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("unigates_bookstore_wishlist_alerts", JSON.stringify(alerts));
      }
    }
  }

  static getReadingChallenge() {
    if (typeof window === "undefined") {
      return {
        targetBooks: 15,
        completedBooks: 5,
        totalMinutesRead: 480,
        weeklyTargetMinutes: 120,
        weeklyMinutesDone: 85,
        currentStreakDays: 6,
        longestStreakDays: 14,
        favoriteGenre: "المراجع الأكاديمية والذكاء الاصطناعي",
        achievements: [
          {
            id: "ach-1",
            title_ar: "القارئ الرقمي الأول",
            title_en: "First Digital E-Book",
            desc_ar: "أتممت قراءة أول كتاب رقمي مشفر بنظام DRM كاملاً بنجاح.",
            desc_en: "Finished reading your first DRM-protected e-book.",
            icon: "BookOpen",
            isUnlocked: true,
            unlockedAt: "2026-02-14"
          },
          {
            id: "ach-2",
            title_ar: "شغف المعرفة (6 أيام متتالية)",
            title_en: "Reading Habit (6-Day Streak)",
            desc_ar: "قراءة يومية منتظمة لأكثر من 20 دقيقة لمدة 6 أيام متواصلة.",
            desc_en: "Daily reading sessions for 6 consecutive days.",
            icon: "Flame",
            isUnlocked: true,
            unlockedAt: "2026-03-28"
          },
          {
            id: "ach-3",
            title_ar: "المستكشف الأكاديمي (5 كتب)",
            title_en: "Academic Explorer (5 Titles)",
            desc_ar: "إنجاز قراءة 5 كتب متخصصة من منشورات دار عبيد.",
            desc_en: "Completed reading 5 specialized Dar Obeid titles.",
            icon: "Award",
            isUnlocked: true,
            unlockedAt: "2026-03-25"
          },
          {
            id: "ach-4",
            title_ar: "ختام التحدي السنوي (15 كتاباً)",
            title_en: "Master of Challenge (15 Books)",
            desc_ar: "إتمام قراءة 15 كتاباً خلال عام 2026 مع شهادة تقدير رقمية.",
            desc_en: "Complete 15 books within 2026 and earn an accredited certificate.",
            icon: "Trophy",
            isUnlocked: false
          }
        ]
      };
    }
    try {
      const stored = localStorage.getItem("unigates_bookstore_reading_challenge");
      if (!stored) {
        const initialChallenge = {
          targetBooks: 15,
          completedBooks: 5,
          totalMinutesRead: 480,
          weeklyTargetMinutes: 120,
          weeklyMinutesDone: 85,
          currentStreakDays: 6,
          longestStreakDays: 14,
          favoriteGenre: "المراجع الأكاديمية والذكاء الاصطناعي",
          achievements: [
            {
              id: "ach-1",
              title_ar: "القارئ الرقمي الأول",
              title_en: "First Digital E-Book",
              desc_ar: "أتممت قراءة أول كتاب رقمي مشفر بنظام DRM كاملاً بنجاح.",
              desc_en: "Finished reading your first DRM-protected e-book.",
              icon: "BookOpen",
              isUnlocked: true,
              unlockedAt: "2026-02-14"
            },
            {
              id: "ach-2",
              title_ar: "شغف المعرفة (6 أيام متتالية)",
              title_en: "Reading Habit (6-Day Streak)",
              desc_ar: "قراءة يومية منتظمة لأكثر من 20 دقيقة لمدة 6 أيام متواصلة.",
              desc_en: "Daily reading sessions for 6 consecutive days.",
              icon: "Flame",
              isUnlocked: true,
              unlockedAt: "2026-03-28"
            },
            {
              id: "ach-3",
              title_ar: "المستكشف الأكاديمي (5 كتب)",
              title_en: "Academic Explorer (5 Titles)",
              desc_ar: "إنجاز قراءة 5 كتب متخصصة من منشورات دار عبيد.",
              desc_en: "Completed reading 5 specialized Dar Obeid titles.",
              icon: "Award",
              isUnlocked: true,
              unlockedAt: "2026-03-25"
            },
            {
              id: "ach-4",
              title_ar: "ختام التحدي السنوي (15 كتاباً)",
              title_en: "Master of Challenge (15 Books)",
              desc_ar: "إتمام قراءة 15 كتاباً خلال عام 2026 مع شهادة تقدير رقمية.",
              desc_en: "Complete 15 books within 2026 and earn an accredited certificate.",
              icon: "Trophy",
              isUnlocked: false
            }
          ]
        };
        localStorage.setItem("unigates_bookstore_reading_challenge", JSON.stringify(initialChallenge));
        return initialChallenge;
      }
      return JSON.parse(stored);
    } catch {
      return {
        targetBooks: 15,
        completedBooks: 5,
        totalMinutesRead: 480,
        weeklyTargetMinutes: 120,
        weeklyMinutesDone: 85,
        currentStreakDays: 6,
        longestStreakDays: 14,
        favoriteGenre: "المراجع الأكاديمية والذكاء الاصطناعي",
        achievements: []
      };
    }
  }

  static updateReadingChallengeTarget(targetBooks: number, weeklyTargetMinutes: number) {
    const chal = this.getReadingChallenge();
    chal.targetBooks = targetBooks;
    chal.weeklyTargetMinutes = weeklyTargetMinutes;
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_reading_challenge", JSON.stringify(chal));
    }
  }

  static logReadingSession(minutes: number) {
    const chal = this.getReadingChallenge();
    chal.totalMinutesRead += minutes;
    chal.weeklyMinutesDone += minutes;
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_reading_challenge", JSON.stringify(chal));
    }
  }

  static getReadingGoal() {
    const chal = this.getReadingChallenge();
    return { targetBooks: chal.targetBooks, completedBooks: chal.completedBooks, minutesReadToday: 35 };
  }

  // ==================== ADVANCED PUBLISHER STUDIO FEATURES ====================

  // 1. Dynamic Flash Sales & Promotions
  static getFlashSales(): FlashSalePromotion[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("unigates_bookstore_flash_sales");
      if (!stored) {
        const initialSales: FlashSalePromotion[] = [
          {
            id: "sale-001",
            bookId: "bk-dar-001",
            bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات التعليمية",
            discountPercentage: 25,
            originalPrice: 150,
            discountedPrice: 112.5,
            durationHours: 48,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            status: "active",
            notifiedWishlistCount: 68
          },
          {
            id: "sale-002",
            bookId: "bk-dar-002",
            bookTitle: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
            discountPercentage: 20,
            originalPrice: 180,
            discountedPrice: 144,
            durationHours: 24,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            status: "active",
            notifiedWishlistCount: 94
          }
        ];
        localStorage.setItem("unigates_bookstore_flash_sales", JSON.stringify(initialSales));
        return initialSales;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static createFlashSale(bookId: string, discountPercentage: number, durationHours: number): FlashSalePromotion {
    const catalog = this.getCatalog();
    const book = catalog.find((b) => b.id === bookId);
    const originalPrice = book ? book.price_digital : 150;
    const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));

    const newSale: FlashSalePromotion = {
      id: `sale-${Date.now()}`,
      bookId,
      bookTitle: book ? book.title_ar : "مرجع دار عبيد",
      discountPercentage,
      originalPrice,
      discountedPrice,
      durationHours,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
      status: "active",
      notifiedWishlistCount: Math.floor(Math.random() * 45) + 30
    };

    const sales = this.getFlashSales();
    const updatedSales = [newSale, ...sales];
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_flash_sales", JSON.stringify(updatedSales));
    }

    // Auto-dispatch price drop alerts to wishlist readers
    if (book) {
      const alertId = `alert-sale-${Date.now()}`;
      const alerts = this.getWishlistAlerts();
      alerts.unshift({
        id: alertId,
        bookId: book.id,
        bookTitle: book.title_ar,
        type: "exclusive_discount",
        oldPrice: originalPrice,
        newPrice: discountedPrice,
        discountPercent: discountPercentage,
        date: "الآن",
        isRead: false,
        message_ar: `🔥 عرض فلاش سيل محدود! خصم ${discountPercentage}% على كتاب «${book.title_ar}» لمدة ${durationHours} ساعة فقط.`,
        message_en: `🔥 Flash Sale Alert! ${discountPercentage}% OFF on "${book.title_en}" for ${durationHours} hours.`
      });
      localStorage.setItem("unigates_bookstore_wishlist_alerts", JSON.stringify(alerts));
    }

    return newSale;
  }

  // 2. Reading Heatmaps & In-Depth Chapter Analytics
  static getReadingHeatmap(bookId?: string): BookReadingHeatmap {
    return {
      bookId: bookId || "bk-dar-001",
      bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات التعليمية",
      totalUniqueReaders: 428,
      overallCompletionRate: 76.4,
      totalHoursRead: 1840,
      avgDailyMinutes: 38,
      chaptersAnalytics: [
        {
          chapterId: "ch-1",
          chapterTitleAr: "الفصل الأول: مدخل إلى حوكمة الجامعات والمؤسسات التعليمية",
          chapterTitleEn: "Chapter 1: Intro to University Governance",
          readersCount: 428,
          averageMinutesSpent: 28,
          completionRate: 94.2,
          dropoffRate: 5.8,
          highlightNotesCount: 312
        },
        {
          chapterId: "ch-2",
          chapterTitleAr: "الفصل الثاني: سلاسل التوقيع الرقمي الصارم ومتطلبات الأمان",
          chapterTitleEn: "Chapter 2: Cryptographic Approval Chains",
          readersCount: 395,
          averageMinutesSpent: 42,
          completionRate: 86.5,
          dropoffRate: 13.5,
          highlightNotesCount: 450
        },
        {
          chapterId: "ch-3",
          chapterTitleAr: "الفصل الثالث: استطلاعات الجودة المجهولة وأثرها على تقييم الأساتذة",
          chapterTitleEn: "Chapter 3: Anonymous Quality Feedback",
          readersCount: 327,
          averageMinutesSpent: 22,
          completionRate: 76.4,
          dropoffRate: 23.6,
          highlightNotesCount: 198
        }
      ]
    };
  }

  // 3. Anti-Counterfeit Print Serial & QR Verification
  static getAntiCounterfeitRecords(): AntiCounterfeitQRVerification[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("unigates_bookstore_qr_records");
      if (!stored) {
        const initialRecords: AntiCounterfeitQRVerification[] = [
          {
            serialNumber: "OBEID-2026-98741",
            bookId: "bk-dar-001",
            bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات التعليمية",
            edition: "الطبعة الأولى الفاخرة 2026",
            printBatchNumber: "BATCH-EG-04",
            printYear: 2026,
            publisherName: "دار عبيد للنشر والتوزيع والطباعة",
            isbn: "978-977-90-8812-4",
            isVerifiedAuthentic: true,
            verificationCount: 1,
            generatedDate: "2026-03-20",
            securityHash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
            distributionChannel: "المتجر الرسمي لمنصة UNIGATES — شحن مباشر"
          },
          {
            serialNumber: "OBEID-2026-98742",
            bookId: "bk-dar-002",
            bookTitle: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
            edition: "الطبعة الأكاديمية المعتمدة",
            printBatchNumber: "BATCH-EG-08",
            printYear: 2026,
            publisherName: "دار عبيد للنشر والتوزيع والطباعة",
            isbn: "978-977-90-9943-1",
            isVerifiedAuthentic: true,
            verificationCount: 2,
            generatedDate: "2026-03-22",
            securityHash: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            distributionChannel: "المكتبات الجامعية المعتمدة — جناح معرض القاهرة للكتاب"
          }
        ];
        localStorage.setItem("unigates_bookstore_qr_records", JSON.stringify(initialRecords));
        return initialRecords;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static generatePrintQRBatch(bookId: string, count: number, edition: string, batchNumber: string): AntiCounterfeitQRVerification[] {
    const catalog = this.getCatalog();
    const book = catalog.find((b) => b.id === bookId);
    const existing = this.getAntiCounterfeitRecords();
    const newRecords: AntiCounterfeitQRVerification[] = [];

    for (let i = 0; i < count; i++) {
      const serialNum = `OBEID-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      newRecords.push({
        serialNumber: serialNum,
        bookId: book ? book.id : "bk-dar-001",
        bookTitle: book ? book.title_ar : "مؤلفات دار عبيد",
        edition: edition || "الطبعة الرسمية الأولى",
        printBatchNumber: batchNumber || `BATCH-EG-${Math.floor(10 + Math.random() * 90)}`,
        printYear: 2026,
        publisherName: "دار عبيد للنشر والتوزيع والطباعة",
        isbn: book ? book.isbn : "978-977-90-0000-0",
        isVerifiedAuthentic: true,
        verificationCount: 0,
        generatedDate: new Date().toISOString().split("T")[0],
        securityHash: `SHA256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        distributionChannel: "مستودعات الطباعة المعتمدة — دار عبيد & UNIGATES"
      });
    }

    const updated = [...newRecords, ...existing];
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_qr_records", JSON.stringify(updated));
    }
    return newRecords;
  }

  // ==================== CONTRACTS & DIGITAL LICENSING ====================
  static getContracts(): PublishingContract[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("unigates_bookstore_contracts");
      if (!stored) {
        const initialContracts: PublishingContract[] = [
          {
            id: "cnt-001",
            contractNumber: "UNIGATES-DAR-2026-001",
            bookId: "bk-dar-001",
            bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات التعليمية",
            authorName: "أ.د. عبد الرحمن المنشاوي",
            authorEmail: "author.manshawi@unigates.edu",
            authorNationalId: "28809151203491",
            publisherName: "دار عبيد للنشر والتوزيع والطباعة",
            adminRepresentative: "أ. محمد عبيد (رئيس مجلس الإدارة)",
            contractType: "comprehensive_both",
            royaltyPercentage: 80,
            advancePayment: 15000,
            startDate: "2026-01-15",
            endDate: "2029-01-14",
            status: "fully_executed",
            authorSignatureDate: "2026-01-18 14:30:00",
            adminSignatureDate: "2026-01-19 10:15:00",
            ipCertificateNumber: "EGY-IP-2026-8841",
            contractDocumentUrl: "/contracts/UNIGATES-DAR-2026-001.pdf",
            terms_ar: [
              "يمنح المؤلف دار عبيد للنشر حق النشر والتوزيع الحصري للنسخ الرقمية والورقية لمدة 3 سنوات.",
              "يحصل المؤلف والدار على نسبة 80% من صافي المبيعات وتستقطع منصة UNIGATES عمولة 20%.",
              "تلتزم المنصة بتطبيق معايير حماية الملكية الفكرية والـ DRM ومنع تصوير الشاشة.",
              "يتم صرف المستحقات المالية شهرياً عبر التحويل البنكي أو المنظومة الإلكترونية."
            ]
          },
          {
            id: "cnt-002",
            contractNumber: "UNIGATES-DAR-2026-002",
            bookId: "bk-dar-002",
            bookTitle: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
            authorName: "د. هدى عبد العزيز السعيد",
            authorEmail: "hoda.saeed@med.unigates.edu",
            authorNationalId: "29204051401284",
            publisherName: "دار عبيد للنشر والتوزيع والطباعة",
            adminRepresentative: "أ. محمد عبيد (رئيس مجلس الإدارة)",
            contractType: "comprehensive_both",
            royaltyPercentage: 80,
            advancePayment: 20000,
            startDate: "2026-02-01",
            endDate: "2029-01-31",
            status: "signed_by_author",
            authorSignatureDate: "2026-02-05 11:20:00",
            ipCertificateNumber: "EGY-IP-2026-9042",
            contractDocumentUrl: "/contracts/UNIGATES-DAR-2026-002.pdf",
            terms_ar: [
              "منح دار عبيد حقوق التوزيع الأكاديمي الشامل للجامعات والمستشفيات التعليمية.",
              "تطبيق منظومة الباركود والـ QR لمكافحة تزوير الطبعة الورقية الأولى.",
              "توفير فصول المعاينة الرقمية المشفرة لطلاب كليات الطب."
            ]
          }
        ];
        localStorage.setItem("unigates_bookstore_contracts", JSON.stringify(initialContracts));
        return initialContracts;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static signContractAsAdmin(contractId: string) {
    const contracts = this.getContracts();
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        return {
          ...c,
          status: "fully_executed" as const,
          adminSignatureDate: new Date().toISOString().replace("T", " ").substring(0, 19)
        };
      }
      return c;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_contracts", JSON.stringify(updated));
    }
  }

  static createDraftContract(contractData: Partial<PublishingContract>): PublishingContract {
    const contracts = this.getContracts();
    const newContract: PublishingContract = {
      id: `cnt-${Date.now()}`,
      contractNumber: `UNIGATES-DAR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      bookId: contractData.bookId || "bk-dar-001",
      bookTitle: contractData.bookTitle || "مرجع دار عبيد",
      authorName: contractData.authorName || "المؤلف",
      authorEmail: contractData.authorEmail || "author@example.com",
      authorNationalId: contractData.authorNationalId || "29000000000000",
      publisherName: "دار عبيد للنشر والتوزيع والطباعة",
      adminRepresentative: "إدارة دار عبيد & UNIGATES",
      contractType: contractData.contractType || "comprehensive_both",
      royaltyPercentage: 80,
      advancePayment: contractData.advancePayment || 10000,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
      status: "sent_to_author",
      ipCertificateNumber: `EGY-IP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      contractDocumentUrl: `/contracts/draft-${Date.now()}.pdf`,
      terms_ar: [
        "عقد ترخيص نشر رقمي وورقي رسمي معتمد بموجب قوانين حماية الملكية الفكرية.",
        "توزيع الإيرادات بنسبة 80% للمؤلف والدار و20% لمنصة UNIGATES.",
        "تلتزم المنصة بحماية الملفات الرقمية بنظام الـ DRM ومنع النسخ وتصوير الشاشة."
      ]
    };
    const updated = [newContract, ...contracts];
    if (typeof window !== "undefined") {
      localStorage.setItem("unigates_bookstore_contracts", JSON.stringify(updated));
    }
    return newContract;
  }

  // ==================== LIVE COURIER TRACKING (FREE) ====================
  static getLiveCourierTracking(orderNumber?: string): LiveCourierTrackingOrder {
    return {
      orderNumber: orderNumber || "UG-ORD-2026-9812",
      trackingNumber: "EXP-EGY-894102-CAI",
      buyerName: "د. طارق المنشاوي",
      phone: "+20 100 234 5678",
      destinationCity: "القاهرة الجديدة — التجمع الخامس",
      destinationAddress: "شارع التسعين الشمالي، بجوار مجمع الجامعات",
      courierName: "كابتن أحمد سامي (مندوب إكسبريس)",
      courierPhone: "01124890123",
      courierVehicle: "دراجة نارية مجهزة — شحنات فاخرة (رقم 8412 س ج)",
      estimatedDeliveryTime: "اليوم خلال 45 دقيقة (بين 04:30 م و 05:15 م)",
      currentLat: 30.0131,
      currentLng: 31.4398,
      destinationLat: 30.0245,
      destinationLng: 31.4589,
      status: "out_for_delivery",
      booksList: [
        {
          title: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات التعليمية",
          count: 1,
          cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
        },
        {
          title: "أساسيات وتطبيقات الذكاء الاصطناعي التوليدي في الرعاية الصحية",
          count: 1,
          cover: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
        }
      ],
      checkpoints: [
        {
          id: "cp-1",
          titleAr: "تم تأكيد الطلب وتجهيز الطرد الورقي",
          titleEn: "Order Packed & DRM Sealed",
          locationName: "مستودع دار عبيد — المنطقة الصناعية",
          timestamp: "اليوم 09:30 ص",
          status: "completed",
          descriptionAr: "تم فحص النسخ وتغليفها بطبقة حماية ضد الرطوبة وتثبيت كود الـ QR الأصلي."
        },
        {
          id: "cp-2",
          titleAr: "استلام مندوب الشحن السريع للطرد",
          titleEn: "Picked Up by Courier",
          locationName: "مركز الفرز واللوجستيات الرئيسي",
          timestamp: "اليوم 12:45 م",
          status: "completed",
          descriptionAr: "تم تسليم الشحنة للكابتن أحمد سامي وبدء خط سير التوصيل المباشر."
        },
        {
          id: "cp-3",
          titleAr: "الشحنة في طريقها إلى عنوانك (قريب من موقعك)",
          titleEn: "Out for Delivery (Nearby)",
          locationName: "محور محمد بن زايد — التجمع الخامس",
          timestamp: "اليوم 03:15 م",
          status: "current",
          descriptionAr: "المندوب على بعد 3.2 كم من وجهة التوصيل، يرجى الاستعداد للاستلام."
        },
        {
          id: "cp-4",
          titleAr: "التسليم للباب وتوقيع العميل",
          titleEn: "Delivered to Doorstep",
          locationName: "عنوانك المسجل",
          timestamp: "متوقع 04:45 م",
          status: "pending",
          descriptionAr: "سيتم تسليم الطرد وتأكيد الاستلام عبر رمز سري SMS."
        }
      ]
    };
  }

  // ==================== READER REWARDS & POINTS (COMING SOON) ====================
  static getReaderRewards(): ReaderRewardsAccount {
    if (typeof window === "undefined") {
      return {
        userId: "user-reader-001",
        pointsBalance: 840,
        tier: "Gold",
        totalPointsEarned: 1450,
        pointsFromReadingMinutes: 620,
        pointsFromPurchases: 830,
        pointEquivalentEGP: 84, // 840 points = 84 EGP
        transactions: []
      };
    }
    try {
      const stored = localStorage.getItem("unigates_bookstore_reader_rewards");
      if (!stored) {
        const initialRewards: ReaderRewardsAccount = {
          userId: "user-reader-001",
          pointsBalance: 840,
          tier: "Gold",
          totalPointsEarned: 1450,
          pointsFromReadingMinutes: 620,
          pointsFromPurchases: 830,
          pointEquivalentEGP: 84,
          transactions: [
            {
              id: "tx-1",
              descriptionAr: "إكمال 60 دقيقة قراءة في مرجع الحوكمة الرقمية",
              points: 60,
              type: "earned",
              date: "اليوم"
            },
            {
              id: "tx-2",
              descriptionAr: "شراء كتاب الذكاء الاصطناعي في الطب",
              points: 200,
              type: "earned",
              date: "أمس"
            },
            {
              id: "tx-3",
              descriptionAr: "استبدال نقاط بخصم 50 ج.م على سلة الشراء",
              points: -500,
              type: "redeemed",
              date: "منذ 3 أيام"
            }
          ]
        };
        localStorage.setItem("unigates_bookstore_reader_rewards", JSON.stringify(initialRewards));
        return initialRewards;
      }
      return JSON.parse(stored);
    } catch {
      return {
        userId: "user-reader-001",
        pointsBalance: 840,
        tier: "Gold",
        totalPointsEarned: 1450,
        pointsFromReadingMinutes: 620,
        pointsFromPurchases: 830,
        pointEquivalentEGP: 84,
        transactions: []
      };
    }
  }

  // ==================== USER AUTH & SESSION MANAGEMENT ====================
  static getCurrentSession(): { role: "reader" | "publisher"; name: string; email: string } | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Auto-purge any demo account so visitor sees proper Login / Sign Up options
      if (
        parsed?.name === "أحمد مصطفى" ||
        parsed?.name?.includes("أحمد مصطفى") ||
        parsed?.email?.includes("demo") ||
        parsed?.email?.includes("reader.demo") ||
        parsed?.isDemo
      ) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  static setCurrentSession(session: { role: "reader" | "publisher"; name: string; email: string }): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    }
  }

  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
}
