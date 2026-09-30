export type BookFormat = "digital" | "print" | "both";

export interface BookStoreItem {
  id: string;
  code: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  publisher_ar: string;
  publisher_en: string;
  publisher_id?: string;
  category: string;
  category_ar: string;
  category_en: string;
  description_ar: string;
  description_en: string;
  price_digital: number;
  price_print: number;
  currency: string;
  pages: number;
  format: BookFormat;
  cover_url: string;
  sample_pages?: string[];
  full_content_chapters?: {
    id: string;
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
  }[];
  isbn: string;
  rating: number;
  reviews_count: number;
  publish_year: number;
  is_bestseller?: boolean;
  is_featured?: boolean;
  stock_print?: number;
}

export interface PurchasedBook {
  id: string;
  orderId: string;
  bookId: string;
  book: BookStoreItem;
  purchaseDate: string;
  format: "digital" | "print";
  amountPaid: number;
  currency: string;
  lastReadChapterIndex?: number;
  lastReadProgress?: number;
  isOfflineAvailable?: boolean;
  bookmarks?: number[];
  readingNotes?: { id: string; chapterIndex: number; text: string; date: string }[];
}

export interface CartItem {
  book: BookStoreItem;
  format: "digital" | "print";
  quantity: number;
  shippingOption?: "standard" | "express" | "same_day";
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  streetAddress: string;
  postalCode?: string;
  notes?: string;
  deliveryMethod: "standard" | "express" | "vip_doorstep";
}

export interface BookOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: {
    bookId: string;
    bookTitle: string;
    bookCover: string;
    format: "digital" | "print";
    price: number;
    quantity: number;
    publisherId?: string;
    publisherName?: string;
  }[];
  subtotal: number;
  shippingFee: number;
  platformFee: number; // 20%
  totalAmount: number;
  currency: string;
  status: "completed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "credit_card" | "instapay" | "fawry" | "vodafone_cash" | "apple_pay" | "cod";
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  createdAt: string;
}

export interface PublisherProfile {
  id: string;
  publisherCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  licenseNumber: string;
  commercialRecord?: string;
  city: string;
  country: string;
  bio: string;
  logoUrl?: string;
  joinedDate: string;
  platformCommissionRate: 0.20; // 20% platform fee
  payoutMethod: "bank_transfer" | "instapay" | "vodafone_cash" | "paypal";
  bankAccount: {
    bankName: string;
    accountHolder: string;
    ibanOrNumber: string;
  };
}

export interface PublisherSaleRecord {
  id: string;
  orderNumber: string;
  orderDate: string;
  bookId: string;
  bookTitle: string;
  buyerName: string;
  format: "digital" | "print";
  quantity: number;
  grossAmount: number;
  platformShare: number; // 20%
  publisherShare: number; // 80%
  status: "completed" | "pending_settlement" | "refunded";
}

export interface PublisherPayoutRequest {
  id: string;
  requestNumber: string;
  publisherId: string;
  amount: number;
  currency: string;
  method: string;
  accountDetails: string;
  status: "pending" | "approved" | "processed" | "rejected";
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface WishlistAlert {
  id: string;
  bookId: string;
  bookTitle: string;
  type: "price_drop" | "new_edition" | "in_stock" | "exclusive_discount";
  oldPrice?: number;
  newPrice?: number;
  discountPercent?: number;
  date: string;
  isRead: boolean;
  message_ar: string;
  message_en: string;
}

export interface ReadingChallengeData {
  targetBooks: number;
  completedBooks: number;
  totalMinutesRead: number;
  weeklyTargetMinutes: number;
  weeklyMinutesDone: number;
  currentStreakDays: number;
  longestStreakDays: number;
  favoriteGenre: string;
  achievements: {
    id: string;
    title_ar: string;
    title_en: string;
    desc_ar: string;
    desc_en: string;
    icon: string;
    unlockedAt?: string;
    isUnlocked: boolean;
  }[];
}
