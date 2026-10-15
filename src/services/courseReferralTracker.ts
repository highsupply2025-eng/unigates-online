/**
 * UNIGATES Courses Platform - Instructor Referral & Attribution Tracker
 * 
 * Detects whether a student registered / purchased a course via an instructor's referral link
 * or directly from the platform, maintaining attribution for up to 30 days.
 */

export interface CourseReferralData {
  referralToken: string;
  instructorId?: string;
  courseId?: string;
  source: "instructor_referral" | "direct_platform";
  capturedAt: string;
  landingUrl?: string;
}

export interface StudentReferralStatus {
  isReferral: boolean;
  referralToken: string | null;
  instructorId: string | null;
  courseId: string | null;
  source: "instructor_referral" | "direct_platform";
  capturedAt?: string;
}

const STORAGE_KEY = "unigates_course_referral";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Inspects URL search parameters or full URL string to extract instructor referral tokens.
 * Supported query parameters:
 *  - ref
 *  - instructor
 *  - instructor_ref
 *  - instructor_id
 *  - token
 *  - affiliate
 */
export function captureCourseReferralFromUrl(searchParamsOrUrl?: URLSearchParams | string): CourseReferralData | null {
  if (typeof window === "undefined") return null;

  let params: URLSearchParams;
  if (!searchParamsOrUrl) {
    params = new URLSearchParams(window.location.search);
  } else if (typeof searchParamsOrUrl === "string") {
    const query = searchParamsOrUrl.includes("?") 
      ? searchParamsOrUrl.split("?")[1] 
      : searchParamsOrUrl;
    params = new URLSearchParams(query);
  } else {
    params = searchParamsOrUrl;
  }

  const token = 
    params.get("ref") || 
    params.get("instructor_ref") || 
    params.get("token") || 
    params.get("affiliate") || 
    params.get("instructor") || 
    null;

  const instructorId = params.get("instructor_id") || params.get("instructor") || undefined;
  const courseId = params.get("course_id") || params.get("course") || undefined;

  if (!token && !instructorId) {
    return null;
  }

  const referralData: CourseReferralData = {
    referralToken: (token || instructorId || "").trim().toUpperCase(),
    instructorId: instructorId ? instructorId.trim() : undefined,
    courseId: courseId ? courseId.trim() : undefined,
    source: "instructor_referral",
    capturedAt: new Date().toISOString(),
    landingUrl: typeof window !== "undefined" ? window.location.href : undefined,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(referralData));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(referralData));
  } catch (err) {
    console.warn("[CourseReferralTracker] Failed to persist referral data:", err);
  }

  return referralData;
}

/**
 * Retrieves the active course referral status for the current session/student.
 * Checks URL first, then stored referral in localStorage/sessionStorage within attribution window.
 */
export function getCourseReferralInfo(): StudentReferralStatus {
  if (typeof window === "undefined") {
    return {
      isReferral: false,
      referralToken: null,
      instructorId: null,
      courseId: null,
      source: "direct_platform",
    };
  }

  // 1. Try URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = 
    urlParams.get("ref") || 
    urlParams.get("instructor_ref") || 
    urlParams.get("token") || 
    urlParams.get("affiliate") || 
    urlParams.get("instructor");

  if (urlToken) {
    const fromUrl = captureCourseReferralFromUrl(urlParams);
    if (fromUrl) {
      return {
        isReferral: true,
        referralToken: fromUrl.referralToken,
        instructorId: fromUrl.instructorId || fromUrl.referralToken,
        courseId: fromUrl.courseId || null,
        source: "instructor_referral",
        capturedAt: fromUrl.capturedAt,
      };
    }
  }

  // 2. Check stored session / local storage
  try {
    const storedRaw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (storedRaw) {
      const data: CourseReferralData = JSON.parse(storedRaw);
      const capturedTime = new Date(data.capturedAt).getTime();
      const now = Date.now();

      // Check if within 30-day attribution window
      if (now - capturedTime <= ATTRIBUTION_WINDOW_MS && data.referralToken) {
        return {
          isReferral: true,
          referralToken: data.referralToken,
          instructorId: data.instructorId || data.referralToken,
          courseId: data.courseId || null,
          source: "instructor_referral",
          capturedAt: data.capturedAt,
        };
      } else {
        // Expired
        clearCourseReferral();
      }
    }
  } catch (err) {
    console.warn("[CourseReferralTracker] Stored referral parse notice:", err);
  }

  // 3. Fallback: Direct platform registration
  return {
    isReferral: false,
    referralToken: null,
    instructorId: null,
    courseId: null,
    source: "direct_platform",
  };
}

/**
 * Clears stored referral data (e.g. after successful redemption or expiration).
 */
export function clearCourseReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[CourseReferralTracker] Clear referral notice:", err);
  }
}

/**
 * Builds an instructor's referral link for a course or general courses portal.
 */
export function buildInstructorCourseInviteLink(instructorIdOrCode: string, courseId?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://unigates.online";
  const path = courseId ? `/courses?course=${encodeURIComponent(courseId)}&` : `/courses?`;
  return `${origin}${path}ref=${encodeURIComponent(instructorIdOrCode)}&instructor_id=${encodeURIComponent(instructorIdOrCode)}`;
}
