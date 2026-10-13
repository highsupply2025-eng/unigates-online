export type AcademicTitle = 
  | "prof" 
  | "dr" 
  | "lecturer" 
  | "researcher" 
  | "author" 
  | "expert" 
  | "translator";

export type PublishType = "digital" | "print" | "both";

export type AuthorVerificationStatus = 
  | "pending_review" 
  | "approved" 
  | "rejected" 
  | "unverified" 
  | "under_review";

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
  // Platform metadata
  platform?: string;
  // International / Foreign Registration
  isForeign?: boolean;
  idType?: "national_id" | "passport";
  passportNumber?: string;
  countryOfResidence?: string;
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
  coverImageUrl?: string;
  coverImageName?: string;
  manuscriptFile?: {
    name: string;
    size: string;
    type: string;
    url?: string;
  };
  introVideo?: {
    name: string;
    url?: string;
  };
  synopsis: string;
  pageCount: number;
  language: string;
  status: "pending_review" | "approved" | "rejected" | "in_print" | "published" | "ready_for_pricing";
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
  receiptFileName?: string;
  receiptFileSize?: string;
  receiptFileType?: string;
  receiptReference?: string;
  receiptNotes?: string;
  receiptUploadedAt?: string;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentDate?: string;
  invoicePdfUrl?: string;
  invoiceFileName?: string;
  invoiceFileSize?: string;
  adminNotes?: string;
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
  invoiceNumber?: string;
  buyerEmail?: string;
  buyerCity?: string;
  paymentMethod?: string;
  quantity?: number;
  authorName?: string;
  authorCode?: string;
  status?: string;
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

export interface AuthorContract {
  id: string;
  contractNumber: string; // e.g. "CNT-2026-0842"
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
  digitalRoyaltyRate: number; // default 70
  printRoyaltyRate: number; // default 30
  rightsDurationYears: number; // default 5
  exclusiveRights: boolean;
  advancePayment?: number;
  retailPriceEstimate?: number;
  status: "pending_signature" | "signed" | "rejected";
  issueDate: string;
  signedDate?: string;
  adminSignature: {
    signedByName: string;
    role: string;
    signedAt: string;
    sealNumber: string;
  };
  authorSignature?: {
    signatureText: string;
    signedAt: string;
    ipOrRef?: string;
  };
  specialConditions?: string;
  contractSvgUrl?: string;
}
