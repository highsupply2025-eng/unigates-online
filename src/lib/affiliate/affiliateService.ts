export interface AffiliateProfile {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  referralCode: string;
  commissionRate: number; // default 20%
  walletBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingPayout: number;
  payoutMethod: string;
  payoutAccountDetails: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

export interface ReferredLecturer {
  id: string;
  affiliateId: string;
  lecturerName: string;
  lecturerEmail: string;
  coursesCount: number;
  totalStudentsEnrolled: number;
  totalRevenueGenerated: number;
  totalCommissionGenerated: number;
  joinedAt: string;
}

export interface AffiliateCommissionRecord {
  id: string;
  affiliateId: string;
  courseId: string;
  courseTitle: string;
  lecturerName: string;
  studentName: string;
  studentEmail?: string;
  coursePrice: number;
  commissionRate: number; // 20%
  commissionEarned: number;
  status: "approved" | "pending" | "paid";
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  affiliateId: string;
  amount: number;
  method: string;
  accountDetails: string;
  status: "pending" | "approved" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
}

const STORAGE_AFFILIATE_KEY = "unigates_current_affiliate";
const STORAGE_AFFILIATE_DATA_PREFIX = "unigates_affiliate_data_";

/**
 * Generate a unique, professional referral code
 */
export function generateReferralCode(prefix = "UG"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

/**
 * Calculate affiliate commission (20% by default)
 */
export function calculateAffiliateCommission(amount: number, rate = 20): number {
  if (amount <= 0) return 0;
  return Number(((amount * rate) / 100).toFixed(2));
}

/**
 * Build the customized invitation link for lecturers
 */
export function buildLecturerInviteLink(referralCode: string): string {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://unigates.online";
  return `${origin}/courses/signup?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Build a ready-to-send WhatsApp invitation message for instructors
 */
export function buildWhatsAppInviteMessage(referralCode: string, affiliateName: string, isRtl = true): string {
  const link = buildLecturerInviteLink(referralCode);
  if (isRtl) {
    return `مرحباً بك يا دكتور / أستاذ،\n\nأدعوك للانضمام إلى منصة UNIGATES الأكاديمية ونشر دوراتك ومحاضراتك للطلاب في كافة أنحاء الوطن العربي، مع نظام متطور للبث المباشر والشهادات المعتمدة.\n\nسجّل حسابك الآن عبر الرابط التالي:\n${link}`;
  }
  return `Hello Professor / Instructor,\n\nI invite you to join the UNIGATES educational platform to publish your courses & reach thousands of students across the region.\n\nRegister your instructor account here:\n${link}`;
}

/**
 * Save current affiliate profile in session/local storage
 */
export function saveCurrentAffiliate(affiliate: AffiliateProfile): void {
  try {
    localStorage.setItem(STORAGE_AFFILIATE_KEY, JSON.stringify(affiliate));
    localStorage.setItem(`${STORAGE_AFFILIATE_DATA_PREFIX}${affiliate.id}`, JSON.stringify(affiliate));
  } catch {
    // ignore
  }
}

/**
 * Get current logged in affiliate profile
 */
export function getCurrentAffiliate(): AffiliateProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_AFFILIATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AffiliateProfile;
  } catch {
    return null;
  }
}

/**
 * Logout affiliate
 */
export function logoutAffiliate(): void {
  try {
    localStorage.removeItem(STORAGE_AFFILIATE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get sample initial data for demonstration/new affiliate
 */
export function getSampleAffiliateData(affiliate: AffiliateProfile) {
  const sampleLecturers: ReferredLecturer[] = [
    {
      id: "lec-1",
      affiliateId: affiliate.id,
      lecturerName: "د. طارق المنشاوي",
      lecturerEmail: "tariq.elmenshawy@unigates.online",
      coursesCount: 3,
      totalStudentsEnrolled: 48,
      totalRevenueGenerated: 24000,
      totalCommissionGenerated: 4800,
      joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: "lec-2",
      affiliateId: affiliate.id,
      lecturerName: "أ.د. منى عبد الرحمن",
      lecturerEmail: "mona.abdelrahman@unigates.online",
      coursesCount: 2,
      totalStudentsEnrolled: 32,
      totalRevenueGenerated: 16000,
      totalCommissionGenerated: 3200,
      joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  const sampleCommissions: AffiliateCommissionRecord[] = [
    {
      id: "comm-1",
      affiliateId: affiliate.id,
      courseId: "course-101",
      courseTitle: "دبلوم الذكاء الاصطناعي التطبيقي وإدارة البيانات",
      lecturerName: "د. طارق المنشاوي",
      studentName: "أحمد حسام الشريف",
      studentEmail: "ahmed.h@example.com",
      coursePrice: 850,
      commissionRate: 20,
      commissionEarned: 170,
      status: "approved",
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "comm-2",
      affiliateId: affiliate.id,
      courseId: "course-102",
      courseTitle: "القيادة الأكاديمية والتحول الرقمي للجامعات",
      lecturerName: "أ.د. منى عبد الرحمن",
      studentName: "سارة عبد العزيز السالم",
      studentEmail: "sara.salem@example.com",
      coursePrice: 1200,
      commissionRate: 20,
      commissionEarned: 240,
      status: "approved",
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
    {
      id: "comm-3",
      affiliateId: affiliate.id,
      courseId: "course-103",
      courseTitle: "التسويق الرقمي وإدارة الحملات الإعلانية",
      lecturerName: "د. طارق المنشاوي",
      studentName: "محمود يوسف التميمي",
      studentEmail: "m.tamimi@example.com",
      coursePrice: 650,
      commissionRate: 20,
      commissionEarned: 130,
      status: "approved",
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ];

  return {
    lecturers: sampleLecturers,
    commissions: sampleCommissions,
  };
}
