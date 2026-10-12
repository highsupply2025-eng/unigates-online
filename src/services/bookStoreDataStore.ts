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
import { NashrDataStore } from "./nashrDataStore";

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

// Initial Catalog: Empty in anticipation of real books uploaded by verified publishers & authors
export const INITIAL_BOOKS_CATALOG: BookStoreItem[] = [];

// Default Initial Purchases for Reader Demo
const INITIAL_PURCHASED_BOOKS: PurchasedBook[] = [];

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

export const INITIAL_DEMO_ORDERS: BookOrder[] = [
  {
    id: "ord-9921",
    orderNumber: "ORD-2026-9921",
    userId: "buyer-inst-01",
    userEmail: "library@feps.cu.edu.eg",
    userName: "مكتبة كلية الاقتصاد - جامعة القاهرة",
    items: [
      {
        bookId: "bk-dar-001",
        bookCode: "BK-DAR-4491",
        bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
        bookCover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        format: "print",
        price: 220,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 66,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 220,
    shippingFee: 35,
    platformFee: 44,
    totalAmount: 255,
    currency: "EGP",
    status: "completed",
    paymentMethod: "bank_transfer",
    createdAt: "2026-09-28 11:30",
    shippingAddress: {
      fullName: "مكتبة كلية الاقتصاد - جامعة القاهرة",
      phone: "+20 100 223 4455",
      country: "مصر",
      city: "الجيزة، جامعة القاهرة",
      streetAddress: "مبنى كلية الاقتصاد والعلوم السياسية، الدور الثاني",
      deliveryMethod: "express"
    }
  },
  {
    id: "ord-9915",
    orderNumber: "ORD-2026-9915",
    userId: "buyer-sa-02",
    userEmail: "dr.khaled@ksu.edu.sa",
    userName: "د. خالد السعيد - الرياض",
    items: [
      {
        bookId: "bk-dar-001",
        bookCode: "BK-DAR-4491",
        bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
        bookCover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        format: "print",
        price: 220,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 66,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 220,
    shippingFee: 80,
    platformFee: 44,
    totalAmount: 300,
    currency: "EGP",
    status: "completed",
    paymentMethod: "credit_card",
    createdAt: "2026-09-27 15:45",
    shippingAddress: {
      fullName: "د. خالد السعيد",
      phone: "+966 50 123 4567",
      country: "السعودية",
      city: "الرياض، الدرعية",
      streetAddress: "مجمع أعضاء هيئة التدريس، جامعة الملك سعود",
      deliveryMethod: "express"
    }
  },
  {
    id: "ord-9918",
    orderNumber: "ORD-2026-9918",
    userId: "buyer-res-03",
    userEmail: "ahmed.mamdouh@gmail.com",
    userName: "أحمد ممدوح (باحث ماجستير)",
    items: [
      {
        bookId: "bk-dar-006",
        bookCode: "BK-DAR-8821",
        bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
        bookCover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
        format: "digital",
        price: 85,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 60,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 85,
    shippingFee: 0,
    platformFee: 17,
    totalAmount: 85,
    currency: "EGP",
    status: "completed",
    paymentMethod: "instapay",
    createdAt: "2026-09-27 09:12"
  },
  {
    id: "ord-9916",
    orderNumber: "ORD-2026-9916",
    userId: "buyer-sa-04",
    userEmail: "sara.abdelaziz@ksu.edu.sa",
    userName: "سارة عبد العزيز (جامعة الملك سعود)",
    items: [
      {
        bookId: "bk-dar-006",
        bookCode: "BK-DAR-8821",
        bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
        bookCover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
        format: "digital",
        price: 85,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 60,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 85,
    shippingFee: 0,
    platformFee: 17,
    totalAmount: 85,
    currency: "EGP",
    status: "completed",
    paymentMethod: "apple_pay",
    createdAt: "2026-09-26 18:20"
  },
  {
    id: "ord-9905",
    orderNumber: "ORD-2026-9905",
    userId: "buyer-delta-05",
    userEmail: "procurement@delta.edu.eg",
    userName: "معهد الدلتا العالي للهندسة والتكنولوجيا",
    items: [
      {
        bookId: "bk-dar-001",
        bookCode: "BK-DAR-4491",
        bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
        bookCover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        format: "print",
        price: 220,
        quantity: 2,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 132,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 440,
    shippingFee: 45,
    platformFee: 88,
    totalAmount: 485,
    currency: "EGP",
    status: "completed",
    paymentMethod: "bank_transfer",
    createdAt: "2026-09-24 13:05",
    shippingAddress: {
      fullName: "معهد الدلتا العالي",
      phone: "+20 50 223 9988",
      country: "مصر",
      city: "المنصورة، الدقهلية",
      streetAddress: "طريق المنصورة الدائري، مجمع المعاهد",
      deliveryMethod: "express"
    }
  },
  {
    id: "ord-9892",
    orderNumber: "ORD-2026-9892",
    userId: "buyer-eng-06",
    userEmail: "ibrahim.youssef@aucegypt.edu",
    userName: "م. إبراهيم يوسف (باحث مستقل)",
    items: [
      {
        bookId: "bk-dar-006",
        bookCode: "BK-DAR-8821",
        bookTitle: "دليل الباحث الأكاديمي للنشر الدولي المحكم",
        bookCover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
        format: "digital",
        price: 85,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 60,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 85,
    shippingFee: 0,
    platformFee: 17,
    totalAmount: 85,
    currency: "EGP",
    status: "completed",
    paymentMethod: "instapay",
    createdAt: "2026-09-22 21:10"
  },
  {
    id: "ord-9884",
    orderNumber: "ORD-2026-9884",
    userId: "buyer-merc-07",
    userEmail: "library@merc-center.org",
    userName: "مركز بحوث الشرق الأوسط والدراسات المستقبلية",
    items: [
      {
        bookId: "bk-dar-001",
        bookCode: "BK-DAR-4491",
        bookTitle: "مستقبل الحوكمة الرقمية في الجامعات والمؤسسات العربية",
        bookCover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
        format: "print",
        price: 220,
        quantity: 1,
        authorCode: "AUT-7890",
        authorName: "أ.د. عبد الرحمن المنشاوي",
        authorRoyalty: 66,
        publisherName: "دار عبيد للنشر والتوزيع"
      }
    ],
    subtotal: 220,
    shippingFee: 35,
    platformFee: 44,
    totalAmount: 255,
    currency: "EGP",
    status: "completed",
    paymentMethod: "vodafone_cash",
    createdAt: "2026-09-20 16:40",
    shippingAddress: {
      fullName: "مركز بحوث الشرق الأوسط",
      phone: "+20 100 445 6677",
      country: "مصر",
      city: "القاهرة، مدينة نصر",
      streetAddress: "شارع الطيران، بجوار مركز المؤتمرات",
      deliveryMethod: "express"
    }
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
      const parsed: BookStoreItem[] = JSON.parse(stored);
      // Purge legacy mock demo books if present
      const cleaned = parsed.filter(b => !b.id.startsWith("bk-dar-00"));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(cleaned));
      }
      return cleaned;
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

  static updateBookInCatalog(id: string, updates: Partial<BookStoreItem>): BookStoreItem | null {
    const catalog = this.getCatalog();
    const item = catalog.find(b => b.id === id || b.code === id);
    if (!item) return null;
    const oldDigitalPrice = item.price_digital;
    const oldPrintPrice = item.price_print;
    Object.assign(item, updates);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("bookstore-updated"));
    }

    // If price was updated by Store Admin, notify the author in their dashboard
    if (
      (updates.price_digital !== undefined && updates.price_digital !== oldDigitalPrice) ||
      (updates.price_print !== undefined && updates.price_print !== oldPrintPrice)
    ) {
      const authorId = item.author_id || "auth-2026-001";
      const digitalText = updates.price_digital !== undefined ? `النسخة الرقمية: ${updates.price_digital} ج.م (ربح المؤلف 70% = ${Math.round(Number(updates.price_digital) * 0.7)} ج.م)` : "";
      const printText = updates.price_print !== undefined ? `النسخة الورقية: ${updates.price_print} ج.م (ربح المؤلف 30% = ${Math.round(Number(updates.price_print) * 0.3)} ج.م)` : "";
      const priceSummary = [digitalText, printText].filter(Boolean).join(" | ");
      try {
        NashrDataStore.sendAdminMessageToAuthor(
          authorId,
          `🏷️ إشعار من إدارة متجر الكتب: قام مدير المتجر بتحديث تسعير مؤلفكم ("${item.title_ar}") إلى: [${priceSummary}]. تم تطبيق السعر الجديد في المتجر فورياً.`
        );
      } catch (e) {
        console.error("Failed to notify author of price update:", e);
      }
    }

    return item;
  }

  static removeBookFromCatalog(id: string): void {
    const catalog = this.getCatalog();
    const filtered = catalog.filter(b => b.id !== id && b.code !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(filtered));
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
    if (typeof window === "undefined") return INITIAL_DEMO_ORDERS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DEMO_ORDERS));
        return INITIAL_DEMO_ORDERS;
      }
      const parsed: BookOrder[] = JSON.parse(stored);
      // If user had previous stale demo orders lacking author orders, merge them
      const hasAuthorOrders = parsed.some(o => o.items.some(it => it.bookCode === "BK-DAR-4491" || it.authorCode === "AUT-7890"));
      if (!hasAuthorOrders) {
        const merged = [...INITIAL_DEMO_ORDERS, ...parsed.filter(p => !INITIAL_DEMO_ORDERS.some(d => d.id === p.id))];
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  }

  static createOrder(order: BookOrder): void {
    const orders = this.getOrders();
    orders.unshift(order);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    // Auto-credit author royalties in NashrDataStore if any item belongs to an author
    try {
      const catalog = this.getCatalog();
      order.items.forEach(item => {
        const book = catalog.find(b => b.id === item.bookId || b.code === item.bookCode);
        const authorCode = item.authorCode || book?.author_code;
        const authorId = book?.author_id;
        const royaltyRate = item.format === "digital" ? 70 : 30;
        const itemQuantity = item.quantity || 1;
        const itemPrice = item.price || (item.format === "digital" ? book?.price_digital : book?.price_print) || 100;
        const totalItemGross = itemPrice * itemQuantity;
        const authorEarnings = Math.round(totalItemGross * (royaltyRate / 100));

        if (authorCode || authorId) {
          NashrDataStore.recordSaleForAuthor({
            bookCode: item.bookCode || book?.code || "BK-DAR-STORE",
            bookTitle: item.bookTitle || book?.title_ar || "مؤلف منشور بالمتجر",
            format: item.format,
            salePrice: totalItemGross,
            authorRoyaltyPercentage: royaltyRate,
            authorEarnings,
            buyerName: order.userName || "قارئ متجر UNIGATES",
            orderNumber: order.orderNumber,
            date: new Date().toISOString().split("T")[0],
            authorCode,
            authorId
          });
        }
      });
    } catch (e) {
      console.error("[BookStoreDataStore] Error crediting author sale:", e);
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
