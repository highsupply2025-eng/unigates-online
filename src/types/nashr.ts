export type AcademicTitle = 
  | "prof" 
  | "dr" 
  | "lecturer" 
  | "researcher" 
  | "author" 
  | "expert" 
  | "translator";

export type PublishType = "digital" | "print" | "both";

export interface AuthorProfile {
  id: string;
  authorCode: string;
  fullName: string;
  academicTitle: AcademicTitle;
  academicTitleLabel: string;
  specialization: string;
  institution?: string;
  email: string;
  phone: string;
  bio?: string;
  avatarUrl?: string;
  nationalIdUrl?: string;
  qualificationUrls?: string[];
  agreedToTerms?: boolean;
  isTemporaryPassword?: boolean;
  joinedDate: string;
  bankDetails?: {
    accountHolder: string;
    bankName: string;
    ibanOrAccount: string;
    electronicWallet?: string;
  };
}

export interface ManuscriptSubmission {
  id: string;
  authorId: string;
  authorName: string;
  authorCode: string;
  title: string;
  category: string;
  publishType: PublishType;
  coverImage?: string;
  manuscriptFile?: {
    name: string;
    size: string;
    type: string;
  };
  introVideo?: {
    name: string;
    url?: string;
  };
  synopsis: string;
  pageCount: number;
  language: string;
  status: "pending_review" | "approved" | "rejected" | "in_print" | "published";
  submissionDate: string;
  adminFeedback?: string;
  storeBookCode?: string;
  storeUrl?: string;
  priceEstimate?: number;
}

export interface NashrInvoice {
  id: string;
  invoiceNumber: string;
  authorId: string;
  authorName: string;
  manuscriptTitle: string;
  amount: number;
  currency: string;
  publishType: PublishType;
  description: string;
  status: "unpaid" | "under_review" | "paid";
  receiptImageUrl?: string;
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
}

export interface NashrMessage {
  id: string;
  sender: "author" | "admin";
  senderName: string;
  senderTitle?: string;
  text: string;
  attachmentName?: string;
  attachmentUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface BookSaleRecord {
  id: string;
  bookCode: string;
  bookTitle: string;
  format: "digital" | "print" | "both";
  salePrice: number;
  authorRoyaltyPercentage: 20; // Fixed 20%
  authorEarnings: number;
  buyerName: string;
  orderNumber: string;
  date: string;
}

export interface PayoutRequest {
  id: string;
  authorId: string;
  authorName: string;
  authorCode: string;
  amount: number;
  currency: string;
  payoutMethod: "bank_transfer" | "instapay" | "vodafone_cash" | "stc_pay" | "paypal";
  accountDetails: string;
  status: "pending" | "completed" | "rejected";
  requestDate: string;
  transactionRef?: string;
  notes?: string;
}
