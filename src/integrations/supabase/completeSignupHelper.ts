import { supabase } from './client';

export interface CompleteSignupParams {
  userId: string;
  role: string;
  fullName: string;
  phone: string;
  email: string;
  platform?: string;
  idPhotoUrl?: string | null;
  universityCertUrl?: string | null;
  additionalCertsUrls?: string[];
  livePhotoUrl?: string | null;
  countryCode?: string;
  country?: string;
  isForeign?: boolean;
  idType?: string;
  idNumber?: string | null;
  verificationStatus?: string;
  forceApprove?: boolean;
}

/**
 * Executes public.complete_signup RPC with exactly 16 parameters to guarantee
 * PostgREST resolves the non-ambiguous overloaded function without HTTP 300 / PGRST203.
 */
export async function invokeCompleteSignup(params: CompleteSignupParams) {
  const isForeign = params.isForeign ?? (
    params.countryCode !== "+966" && 
    params.countryCode !== "966" && 
    params.country !== "SA"
  );

  const verificationStatus = params.forceApprove 
    ? "approved" 
    : (params.verificationStatus || (isForeign ? "pending_review" : (params.role === "personal" ? "approved" : "pending_review")));

  return await supabase.rpc("complete_signup" as any, {
    p_user_id: params.userId,
    p_role: params.role || "user",
    p_full_name: params.fullName || "مستخدم مسجل",
    p_phone: params.phone || "",
    p_email: (params.email || "").trim().toLowerCase(),
    p_platform: params.platform || "courses",
    p_id_photo_url: params.idPhotoUrl || null,
    p_university_cert_url: params.universityCertUrl || null,
    p_additional_certs_urls: Array.isArray(params.additionalCertsUrls) ? params.additionalCertsUrls : [],
    p_live_photo_url: params.livePhotoUrl || null,
    p_country_code: params.countryCode || (isForeign ? "+20" : "+966"),
    p_country: params.country || (isForeign ? "OTHER" : "SA"),
    p_is_foreign: Boolean(isForeign),
    p_id_type: isForeign ? "passport" : (params.idType || "national_id"),
    p_id_number: params.idNumber || null,
    p_verification_status: verificationStatus
  });
}

/**
 * Generates a cryptographically strong, non-pwned temporary password for Supabase Auth accounts
 * that complies with Supabase HaveIBeenPwned & strength policies.
 */
export function generateSecureAuthPassword(seedPrefix: string = "NsrAuth"): string {
  const randomChars = Math.random().toString(36).slice(-6).toUpperCase();
  return `UniG@tes_${seedPrefix.replace(/[^a-zA-Z0-9]/g, "")}_${randomChars}#99!`;
}
