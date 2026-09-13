import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface InstitutionIdentity {
  institutionId: string;
  institutionType: "college" | "institute";
  institutionName: string;
  subscriptionPlan: string;
}

interface CacheEntry {
  email: string;
  identity: InstitutionIdentity;
  fetchedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STORAGE_CACHE_KEY = "unigates_inst_identity_cache";

function getInitialCachedIdentity(): CacheEntry | null {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;
  try {
    const raw = sessionStorage.getItem(STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheEntry;
      if (parsed && Date.now() - parsed.fetchedAt < CACHE_TTL) {
        cached = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

let cached: CacheEntry | null = getInitialCachedIdentity();

export interface UseInstitutionIdentityOptions {
  /** When false, the hook stays silent (no redirect) if the user isn't an institution admin. */
  redirectOnMissing?: boolean;
}

export function useInstitutionIdentity(options?: UseInstitutionIdentityOptions) {
  const redirectOnMissing = options?.redirectOnMissing !== false;
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<InstitutionIdentity | null>(() =>
    getInitialCachedIdentity()?.identity ?? null
  );
  const [loading, setLoading] = useState(!getInitialCachedIdentity());

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const sessionRes = await supabase.auth.getSession();
        let user = sessionRes.data.session?.user;
        if (!user) {
          const userRes = await supabase.auth.getUser();
          user = userRes.data.user;
        }

        if (!user || cancelled) {
          if (!cancelled) {
            if (redirectOnMissing) navigate("/login");
            else setLoading(false);
          }
          return;
        }

        const email = (user.email || "").toLowerCase();

        // Return cached data if same user and fresh
        const currentCache = getInitialCachedIdentity();
        if (currentCache && currentCache.email === email) {
          if (!cancelled) {
            setIdentity(currentCache.identity);
            setLoading(false);
          }
          return;
        }

        // Query college registrations
        const { data: college, error: collegeErr } = await supabase
          .from("college_registrations")
          .select("id, college_name, subscription_plan")
          .ilike("email", email)
          .eq("status", "approved")
          .maybeSingle();

        if (cancelled) return;

        if (collegeErr) throw collegeErr;

        if (college) {
          const id: InstitutionIdentity = {
            institutionId: college.id,
            institutionType: "college",
            institutionName: college.college_name || "",
            subscriptionPlan: college.subscription_plan || "free",
          };
          const entry: CacheEntry = { email, identity: id, fetchedAt: Date.now() };
          cached = entry;
          try {
            sessionStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(entry));
          } catch {
            // ignore
          }
          setIdentity(id);
          setLoading(false);
          return;
        }

        // Fallback to institute registrations
        const { data: institute, error: instituteErr } = await supabase
          .from("institute_registrations")
          .select("id, institute_name, subscription_plan")
          .ilike("email", email)
          .eq("status", "approved")
          .maybeSingle();

        if (cancelled) return;

        if (instituteErr) throw instituteErr;

        if (institute) {
          const id: InstitutionIdentity = {
            institutionId: institute.id,
            institutionType: "institute",
            institutionName: institute.institute_name || "",
            subscriptionPlan: institute.subscription_plan || "free",
          };
          const entry: CacheEntry = { email, identity: id, fetchedAt: Date.now() };
          cached = entry;
          try {
            sessionStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(entry));
          } catch {
            // ignore
          }
          setIdentity(id);
          setLoading(false);
          return;
        }

        setLoading(false);
        if (redirectOnMissing) navigate("/login");
      } catch {
        if (!cancelled) {
          setLoading(false);
          if (redirectOnMissing) navigate("/login");
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [navigate, redirectOnMissing]);

  return { identity, loading };
}
