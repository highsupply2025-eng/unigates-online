import { supabase } from "@/integrations/supabase/client";

export type UserVerificationStatus = 
  | "pending_review" 
  | "unverified" 
  | "under_review" 
  | "approved" 
  | "rejected";

export type IdentificationType = "national_id" | "iqama" | "passport";

export interface UserRegistrationPayload {
  userId?: string;
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  countryCode: string;
  country?: string;
  isForeign?: boolean;
  idType?: IdentificationType;
  idNumber?: string;
  role: string;
  platform?: string;
  idPhotoUrl?: string;
  universityCertUrl?: string;
  additionalCertsUrls?: string[];
  livePhotoUrl?: string;
  verificationStatus?: UserVerificationStatus;
}

export interface AdminUserListItem {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  countryCode: string;
  country: string;
  isForeign: boolean;
  idType: IdentificationType;
  idNumber?: string;
  verificationStatus: UserVerificationStatus;
  approved: boolean;
  idPhotoUrl?: string;
  universityCertUrl?: string;
  livePhotoUrl?: string;
  createdAt: string;
}

export class UserRegistrationController {
  /**
   * Saudi Arabia National Identity / Iqama format:
   * 10 numerical digits starting with 1 (Saudi Citizen) or 2 (Resident Iqama).
   */
  private static readonly SAUDI_ID_REGEX = /^[12]\d{9}$/;

  /**
   * International Passport regex:
   * 5 to 15 alphanumeric characters.
   */
  private static readonly PASSPORT_REGEX = /^[A-Z0-9]{5,15}$/i;

  /**
   * International Phone regex:
   * 6 to 15 digits.
   */
  private static readonly INTL_PHONE_REGEX = /^\d{6,15}$/;

  /**
   * Validates registration data.
   * If the user is from outside Saudi Arabia (non-+966 country code, foreign country, or passport):
   * Local Saudi National Identity / Nafath gateway validation is BYPASSED.
   */
  public static validateRegistration(payload: UserRegistrationPayload): {
    isValid: boolean;
    isForeign: boolean;
    assignedStatus: UserVerificationStatus;
    errorMessage?: string;
  } {
    const rawCountryCode = (payload.countryCode || "").trim();
    const rawCountry = (payload.country || "SA").trim().toUpperCase();
    const idType = payload.idType || "national_id";

    // Detect if account is international
    const isForeign = 
      payload.isForeign === true ||
      (rawCountryCode !== "" && rawCountryCode !== "+966") ||
      rawCountry !== "SA" ||
      idType === "passport";

    const cleanPhone = (payload.phone || "").replace(/\D/g, "");

    // 1. Validate Phone Number
    if (isForeign) {
      if (!this.INTL_PHONE_REGEX.test(cleanPhone)) {
        return {
          isValid: false,
          isForeign: true,
          assignedStatus: "unverified",
          errorMessage: "رقم الهاتف الدولي يجب أن يتكون من 6 إلى 15 رقماً."
        };
      }
    } else {
      // Local Saudi phone validation: 9 digits starting with 5 (e.g. 5XXXXXXXX)
      if (cleanPhone.length !== 9 || !cleanPhone.startsWith("5")) {
        return {
          isValid: false,
          isForeign: false,
          assignedStatus: "pending_review",
          errorMessage: "رقم الجوال السعودي يجب أن يتكون من 9 أرقام ويبدأ بـ 5 (مثال: 5XXXXXXXX)."
        };
      }
    }

    // 2. Validate Identity Document (Saudi ID vs. International Passport)
    if (payload.idNumber) {
      const cleanId = payload.idNumber.trim();
      if (isForeign) {
        // BYPASS Saudi National Identity check; validate passport format
        if (!this.PASSPORT_REGEX.test(cleanId)) {
          return {
            isValid: false,
            isForeign: true,
            assignedStatus: "unverified",
            errorMessage: "رقم جواز السفر الدولي يجب أن يتكون من 5 إلى 15 حرفاً ورقماً إنجليزياً."
          };
        }
      } else {
        // Saudi domestic identity validation
        if (!this.SAUDI_ID_REGEX.test(cleanId)) {
          return {
            isValid: false,
            isForeign: false,
            assignedStatus: "pending_review",
            errorMessage: "رقم الهوية الوطنية أو الإقامة السعودية يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2."
          };
        }
      }
    }

    // 3. Determine status: International accounts are always saved as 'pending_review' or 'unverified'
    // for manual audit and verification by the admin.
    const assignedStatus: UserVerificationStatus = isForeign 
      ? (payload.verificationStatus || "pending_review") 
      : (payload.role === "personal" ? "approved" : "pending_review");

    return {
      isValid: true,
      isForeign,
      assignedStatus
    };
  }

  /**
   * Completes registration workflow and stores into public.profiles / user_roles.
   */
  public static async completeRegistration(payload: UserRegistrationPayload): Promise<{
    success: boolean;
    userId?: string;
    isForeign: boolean;
    verificationStatus: UserVerificationStatus;
    error?: string;
  }> {
    const validation = this.validateRegistration(payload);
    if (!validation.isValid) {
      return {
        success: false,
        isForeign: validation.isForeign,
        verificationStatus: validation.assignedStatus,
        error: validation.errorMessage
      };
    }

    try {
      const fullPhone = `${payload.countryCode}${payload.phone.replace(/\D/g, "")}`;

      // Call database RPC with international parameters
      const { data, error } = await supabase.rpc("complete_signup" as any, {
        p_user_id: payload.userId,
        p_role: payload.role,
        p_full_name: payload.fullName,
        p_phone: fullPhone,
        p_email: payload.email.toLowerCase().trim(),
        p_platform: payload.platform || "courses",
        p_id_photo_url: payload.idPhotoUrl || null,
        p_university_cert_url: payload.universityCertUrl || null,
        p_additional_certs_urls: payload.additionalCertsUrls || [],
        p_live_photo_url: payload.livePhotoUrl || null,
        p_country_code: payload.countryCode || "+966",
        p_country: validation.isForeign ? (payload.country || "OTHER") : "SA",
        p_is_foreign: validation.isForeign,
        p_id_type: validation.isForeign ? "passport" : (payload.idType || "national_id"),
        p_id_number: payload.idNumber || null,
        p_verification_status: validation.assignedStatus
      });

      if (error) {
        console.error("[UserRegistrationController] complete_signup error:", error);
        return {
          success: false,
          isForeign: validation.isForeign,
          verificationStatus: validation.assignedStatus,
          error: error.message
        };
      }

      return {
        success: true,
        userId: payload.userId,
        isForeign: validation.isForeign,
        verificationStatus: validation.assignedStatus
      };
    } catch (err: any) {
      console.error("[UserRegistrationController] Exception:", err);
      return {
        success: false,
        isForeign: validation.isForeign,
        verificationStatus: validation.assignedStatus,
        error: err?.message || "Unexpected registration failure"
      };
    }
  }

  /**
   * Database Query: Fetches all pending, under_review, unverified, and international users
   * to display in the Admin Dashboard for manual review and approval.
   */
  public static async fetchAdminPendingUsers(options?: {
    onlyForeign?: boolean;
    searchQuery?: string;
    platform?: string; // strictly defaults to 'courses' for the publishing dashboard
  }): Promise<AdminUserListItem[]> {
    try {
      const targetPlatform = (options?.platform !== undefined ? options.platform : "courses").trim().toLowerCase();

      // 1. Attempt database RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_pending_users" as any, {
        p_only_foreign: options?.onlyForeign ?? false,
        p_search: options?.searchQuery?.trim() || null,
        p_platform: targetPlatform || null
      });

      const isDeletedTombstone = (uid: string, email?: string) => {
        try {
          const raw = localStorage.getItem("nashr_deleted_authors_tombstones");
          if (!raw) return false;
          const set = new Set(JSON.parse(raw));
          if (uid && (set.has(uid.toLowerCase()) || set.has(`auth-${uid.toLowerCase()}`))) return true;
          if (email && set.has(email.toLowerCase())) return true;
        } catch {}
        return false;
      };

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData
          .filter((row: any) => {
            if (isDeletedTombstone(row.user_id, row.email)) return false;
            if (!targetPlatform) return true;
            const p = (row.platform || "").trim().toLowerCase();
            const r = (row.role || "").trim().toLowerCase();
            if (targetPlatform === "publishing" || targetPlatform === "nashr") {
              if (["student", "dean", "vice_dean", "department_head", "faculty", "lecturer"].includes(r)) return false;
              return p === "publishing" || p.startsWith("nashr") || r === "publisher" || r === "author";
            }
            return p === targetPlatform;
          })
          .map((row: any) => ({
            userId: row.user_id,
            fullName: row.full_name || "مستخدم مسجل",
            email: row.email || "",
            phone: row.phone || "",
            role: row.role || "user",
            platform: row.platform || targetPlatform || "publishing",
            countryCode: row.country_code || "+966",
            country: row.country || "SA",
            isForeign: Boolean(row.is_foreign),
            idType: (row.id_type as IdentificationType) || "national_id",
            idNumber: row.id_number || undefined,
            verificationStatus: (row.verification_status as UserVerificationStatus) || "pending_review",
            approved: Boolean(row.approved),
            idPhotoUrl: row.id_photo_url || undefined,
            universityCertUrl: row.university_cert_url || undefined,
            livePhotoUrl: row.live_photo_url || undefined,
            createdAt: row.created_at || new Date().toISOString()
          }));
      }

      // 2. Direct query fallback across profiles and user_roles strictly filtered by targetPlatform
      let query = supabase
        .from("profiles")
        .select(`
          user_id,
          full_name,
          email,
          phone,
          role,
          platform,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (targetPlatform) {
        if (targetPlatform === "publishing" || targetPlatform === "nashr") {
          query = query.or(`platform.eq.publishing,platform.ilike.nashr%,role.eq.publisher,role.eq.author`);
        } else {
          query = query.eq("platform", targetPlatform);
        }
      }

      if (options?.searchQuery?.trim()) {
        const q = options.searchQuery.trim();
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      }

      const { data: profiles, error: profError } = await query;
      if (profError || !profiles) return [];

      // Query user roles to find unapproved or pending accounts
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, approved")
        .in("user_id", userIds);

      const rolesMap = new Map((roles || []).map((r) => [r.user_id, r]));

      const results: AdminUserListItem[] = [];

      for (const p of profiles) {
        if (isDeletedTombstone(p.user_id, p.email)) continue;
        const pPlatform = (p.platform || "").trim().toLowerCase();
        const userRole = rolesMap.get(p.user_id);
        const pRole = (userRole?.role || p.role || "").trim().toLowerCase();

        // Strict platform filter
        if (targetPlatform) {
          if (targetPlatform === "publishing" || targetPlatform === "nashr") {
            const isPublishing = pPlatform === "publishing" || pPlatform.startsWith("nashr") || pRole === "publisher" || pRole === "author";
            if (!isPublishing) continue;
            if (["student", "dean", "vice_dean", "department_head", "faculty", "lecturer"].includes(pRole)) continue;
          } else if (pPlatform !== targetPlatform) {
            continue;
          }
        }

        const isApproved = userRole?.approved ?? false;

        // Infer international status from phone prefix or platform metadata
        const phoneStr = p.phone || "";
        const isForeignPhone = phoneStr.length > 0 && !phoneStr.startsWith("+966") && !phoneStr.startsWith("00966");
        const countryCode = phoneStr.startsWith("+") ? phoneStr.slice(0, 4) : "+966";

        // Filter: Keep accounts that need review (unapproved, foreign, or pending)
        const needsReview = !isApproved || isForeignPhone;

        if (options?.onlyForeign && !isForeignPhone) {
          continue;
        }

        if (needsReview) {
          results.push({
            userId: p.user_id,
            fullName: p.full_name || "مستخدم مسجل",
            email: p.email,
            phone: p.phone || "",
            role: userRole?.role || p.role || "user",
            platform: p.platform || "courses",
            countryCode,
            country: isForeignPhone ? "OTHER" : "SA",
            isForeign: isForeignPhone,
            idType: isForeignPhone ? "passport" : "national_id",
            verificationStatus: isApproved ? "approved" : (isForeignPhone ? "unverified" : "pending_review"),
            approved: isApproved,
            createdAt: p.created_at
          });
        }
      }

      return results;
    } catch (err) {
      console.error("[UserRegistrationController] fetchAdminPendingUsers error:", err);
      return [];
    }
  }

  /**
   * Admin Action: Approve a user manually from the dashboard.
   */
  public static async approveUser(userId: string, role?: string): Promise<boolean> {
    try {
      // 1. Try RPC
      const { error: rpcErr } = await supabase.rpc("admin_approve_user" as any, {
        p_user_id: userId,
        p_role: role || null
      });

      if (!rpcErr) return true;

      // 2. Direct fallback
      await supabase
        .from("user_roles")
        .update({ approved: true })
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({ verification_status: "approved" } as any)
        .eq("user_id", userId);

      return true;
    } catch (e) {
      console.error("[UserRegistrationController] approveUser error:", e);
      return false;
    }
  }

  /**
   * Admin Action: Reject a user account with explanation notes.
   */
  public static async rejectUser(userId: string, reason?: string): Promise<boolean> {
    try {
      const { error: rpcErr } = await supabase.rpc("admin_reject_user" as any, {
        p_user_id: userId,
        p_rejection_reason: reason || "بيانات غير مستوفية للشروط"
      });

      if (!rpcErr) return true;

      await supabase
        .from("profiles")
        .update({ verification_status: "rejected" } as any)
        .eq("user_id", userId);

      await supabase
        .from("user_roles")
        .update({ approved: false })
        .eq("user_id", userId);

      return true;
    } catch (e) {
      console.error("[UserRegistrationController] rejectUser error:", e);
      return false;
    }
  }
}
