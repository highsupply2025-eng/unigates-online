export type AcademicTitle = 
  | "prof" 
  | "dr" 
  | "lecturer" 
  | "researcher" 
  | "author" 
  | "expert" 
  | "translator";

export type PublishType = "digital" | "print" | "both";

export type AuthorVerificationStatus = "pending_review" | "approved" | "rejected";

export interface AuthorDocumentItem {
  id?: string;
  name: string;
  url: string;
  size?: string;
  type?: string;
}

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
  avatarName?: string;
  nationalIdUrl?: string;
  nationalIdName?: string;
  nationalIdSize?: string;
  qualificationUrls?: string[];
  qualificationDocuments?: AuthorDocumentItem[];
  agreedToTerms?: boolean;
  isTemporaryPassword?: boolean;
  tempPassword?: string;
  permanentPassword?: string;
  verificationStatus?: AuthorVerificationStatus;
  verificationDate?: string;
  verificationNotes?: string;
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
  format?: "digital" | "print" | "both" | string;
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
  receiptReference?: string;
  receiptNotes?: string;
  receiptUploadedAt?: string;
  rejectionReason?: string;
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
  authorRoyaltyPercentage: number; // 70% for digital, 30% for print
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
