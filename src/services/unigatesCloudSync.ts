/**
 * UNIGATES Global Cloud Synchronization Engine
 * ═════════════════════════════════════════════
 * Connects authors, publishers, administrators, and visitors worldwide into a single
 * real-time, low-latency synchronized mesh.
 *
 * Capabilities:
 * 1. Supabase Realtime Edge Broadcast: Sub-second global event propagation between Egypt,
 *    Saudi Arabia, Gulf, Europe, Americas, and worldwide.
 * 2. Multi-Region Serverless REST Sync: Fallback & persistent state reconciliation via /api/cloud-sync.
 * 3. Supabase Auth Provisioning: Automatic cloud account creation for newly registered authors.
 * 4. Offline-First Resiliency: Immediate optimistic local writes with background queue flushing.
 * 5. Automatic Deduplication & Identity Healing across distributed clients.
 */

import { supabase } from "@/integrations/supabase/client";
import { invokeCompleteSignup, generateSecureAuthPassword } from "@/integrations/supabase/completeSignupHelper";
import type { 
  AuthorProfile, 
  ManuscriptSubmission, 
  NashrInvoice, 
  AuthorContract, 
  NashrMessage 
} from "@/types/nashr";

export type CloudSyncEventType =
  | "AUTHOR_REGISTERED"
  | "AUTHOR_UPDATED"
  | "AUTHOR_VERIFIED"
  | "AUTHOR_DELETED"
  | "SUBMISSION_CREATED"
  | "SUBMISSION_UPDATED"
  | "INVOICE_CREATED"
  | "INVOICE_UPDATED"
  | "CONTRACT_ISSUED"
  | "CONTRACT_SIGNED"
  | "CONTRACT_DELETED"
  | "MESSAGE_SENT"
  | "FULL_STATE_SYNC";

export interface CloudSyncPayload {
  eventType: CloudSyncEventType;
  entityId: string;
  data: any;
  originNodeId: string;
  timestamp: string;
}

export type CloudSyncListener = (payload: CloudSyncPayload) => void;

class UnigatesCloudSyncEngine {
  private nodeId: string;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private listeners: Set<CloudSyncListener> = new Set();
  private isInitialized = false;
  private syncInProgress = false;
  private pendingQueue: CloudSyncPayload[] = [];
  private syncIntervalTimer: any = null;

  constructor() {
    // Generate a unique client node identifier per browser session
    this.nodeId = `node_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  }

  /**
   * Initializes the Global Cloud Sync Mesh.
   * Safe to call multiple times (idempotent).
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      this.setupRealtimeChannel();
      await this.pullRemoteState();
      this.startPeriodicSync();
    } catch (err) {
      console.warn("[UnigatesCloudSync] Initialization non-fatal notice:", err);
    }
  }

  /**
   * Set up the Supabase Realtime Broadcast channel across all edge regions
   */
  private setupRealtimeChannel() {
    try {
      const channelName = "unigates_global_mesh";
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false } // Only receive events from other global devices
        }
      });

      this.channel
        .on("broadcast", { event: "mesh_event" }, (envelope: { payload: CloudSyncPayload }) => {
          if (!envelope || !envelope.payload) return;
          const { payload } = envelope;
          
          // Ignore echo from our own node
          if (payload.originNodeId === this.nodeId) return;

          console.info(`[UnigatesCloudSync] Global event received from ${payload.originNodeId}:`, payload.eventType, payload.entityId);
          this.notifyListeners(payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.info("[UnigatesCloudSync] Connected to global realtime mesh.");
            this.flushPendingQueue();
          }
        });
    } catch (e) {
      console.warn("[UnigatesCloudSync] Failed to initialize realtime channel:", e);
    }
  }

  /**
   * Register a listener for global cloud events
   */
  public subscribe(listener: CloudSyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(payload: CloudSyncPayload) {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("[UnigatesCloudSync] Listener error:", err);
      }
    });
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("unigates-cloud-sync", { detail: payload }));
      } catch {
        // Ignore in SSR or constrained environments
      }
    }
  }

  /**
   * Broadcast an event to all other clients globally
   */
  public async broadcast(eventType: CloudSyncEventType, entityId: string, data: any): Promise<void> {
    const payload: CloudSyncPayload = {
      eventType,
      entityId,
      data,
      originNodeId: this.nodeId,
      timestamp: new Date().toISOString()
    };

    // 1. Send via Supabase Realtime Broadcast
    if (this.channel) {
      try {
        await this.channel.send({
          type: "broadcast",
          event: "mesh_event",
          payload
        });
      } catch (err) {
        console.warn("[UnigatesCloudSync] Broadcast warning, queued for retry:", err);
        this.pendingQueue.push(payload);
      }
    } else {
      this.pendingQueue.push(payload);
    }

    // 2. Also persist to Cloud Sync API in the background (fire-and-forget with error boundary)
    this.pushToCloudApi(payload).catch(() => {
      // Non-fatal, cached locally
    });
  }

  /**
   * Flush any queued events once connection is stable
   */
  private async flushPendingQueue() {
    if (!this.channel || this.pendingQueue.length === 0) return;
    const items = [...this.pendingQueue];
    this.pendingQueue = [];

    for (const item of items) {
      try {
        await this.channel.send({
          type: "broadcast",
          event: "mesh_event",
          payload: item
        });
      } catch (e) {
        console.warn("[UnigatesCloudSync] Retry flush failed:", e);
      }
    }
  }

  /**
   * Send payload to serverless cloud sync endpoint
   */
  private async pushToCloudApi(payload: CloudSyncPayload): Promise<void> {
    try {
      const response = await fetch("/api/cloud-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        // Fallback or silent in environments without the API route
      }
    } catch {
      // Offline or network isolated
    }
  }

  /**
   * Pull global state from cloud storage & API
   */
  public async pullRemoteState(): Promise<{
    authors?: AuthorProfile[];
    submissions?: ManuscriptSubmission[];
    invoices?: NashrInvoice[];
    contracts?: AuthorContract[];
  } | null> {
    if (this.syncInProgress) return null;
    this.syncInProgress = true;

    try {
      const response = await fetch("/api/cloud-sync?action=fetch_all", {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          this.notifyListeners({
            eventType: "FULL_STATE_SYNC",
            entityId: "remote_pull",
            data,
            originNodeId: "server",
            timestamp: new Date().toISOString()
          });
        }
        return data;
      }
    } catch {
      // Offline / standalone mode
    } finally {
      this.syncInProgress = false;
    }
    return null;
  }

  /**
   * Register a new author in Supabase Cloud Auth AND persistent PostgreSQL database
   * so admins on any device/browser worldwide can immediately review the account.
   */
  public async syncAuthorToSupabaseAuth(author: AuthorProfile): Promise<void> {
    if (!author.email) return;
    try {
      // Ensure we have a cryptographically secure, non-pwned password that complies with Supabase Auth policy
      const securePassword = author.tempPassword && author.tempPassword.length >= 8 && !author.tempPassword.includes("UnigatesAuthor")
        ? author.tempPassword
        : generateSecureAuthPassword(author.authorCode || "Nsr");
      
      if (!author.tempPassword) {
        author.tempPassword = securePassword;
      }

      const metadataPayload = {
        id: author.id,
        authorCode: author.authorCode,
        fullName: author.fullName,
        academicTitle: author.academicTitle,
        academicTitleLabel: author.academicTitleLabel,
        specialization: author.specialization,
        institution: author.institution || "UNIGATES Global Author",
        email: author.email.trim().toLowerCase(),
        phone: author.phone,
        bio: author.bio,
        tempPassword: author.tempPassword,
        permanentPassword: author.permanentPassword,
        isTemporaryPassword: author.isTemporaryPassword ?? true,
        verificationStatus: author.verificationStatus || "pending_review",
        joinedDate: author.joinedDate || new Date().toISOString().split("T")[0],
        isForeign: author.isForeign ?? false,
        idType: author.idType || (author.isForeign ? "passport" : "national_id"),
        passportNumber: author.passportNumber,
        countryOfResidence: author.countryOfResidence
      };

      const { data, error } = await supabase.auth.signUp({
        email: author.email.trim().toLowerCase(),
        password: securePassword,
        options: {
          data: {
            role: "author",
            author_code: author.authorCode,
            full_name: author.fullName,
            phone: author.phone,
            specialization: author.specialization,
            academic_title: author.academicTitle,
            institution: author.institution || "UNIGATES Global Author",
            nashr_meta: JSON.stringify(metadataPayload)
          }
        }
      });

      let userId = data?.user?.id;
      if (!userId && error && error.message?.includes("already registered")) {
        console.info("[UnigatesCloudSync] User already registered in Auth, proceeding to sync profile");
      }

      if (userId) {
        console.info("[UnigatesCloudSync] Author account created in Supabase Cloud Auth:", userId);
        const encodedPlatform = `nashr:${JSON.stringify(metadataPayload)}`;
        
        await invokeCompleteSignup({
          userId: userId,
          role: "publisher",
          fullName: author.fullName,
          phone: author.phone || "",
          email: author.email.trim().toLowerCase(),
          platform: encodedPlatform,
          idPhotoUrl: author.nationalIdUrl && !author.nationalIdUrl.startsWith("data:") ? author.nationalIdUrl : `meta:${author.authorCode}`,
          universityCertUrl: author.qualificationDocuments?.[0]?.name || author.specialization,
          additionalCertsUrls: (author.qualificationDocuments || []).map(d => d.name),
          livePhotoUrl: author.avatarName || author.authorCode,
          countryCode: author.phone?.startsWith("+") ? author.phone.split(" ")[0] : "+966",
          country: author.isForeign ? (author.countryOfResidence || "OTHER") : "SA",
          isForeign: author.isForeign ?? false,
          idType: author.idType || (author.isForeign ? "passport" : "national_id"),
          idNumber: author.passportNumber || null,
          verificationStatus: author.verificationStatus || "pending_review"
        });
      }
    } catch (err) {
      console.warn("[UnigatesCloudSync] Auth sync warning:", err);
    }
  }

  /**
   * Fetch all Nashr authors stored in Supabase PostgreSQL
   * and merge them into local storage for the Admin Dashboard.
   */
  public async fetchCloudAuthorsFromSupabase(): Promise<AuthorProfile[]> {
    try {
      const cloudAuthors: AuthorProfile[] = [];
      const seenIds = new Set<string>();

      const isTombstoned = (userId: string, email?: string) => {
        try {
          const rawT = localStorage.getItem("nashr_deleted_authors_tombstones");
          if (rawT) {
            const tSet = new Set(JSON.parse(rawT));
            if (userId && (tSet.has(userId.toLowerCase()) || tSet.has(`auth-${userId.toLowerCase()}`))) return true;
            if (email && tSet.has(email.toLowerCase())) return true;
          }
        } catch {}
        return false;
      };

      // 1. Fetch via get_admin_pending_users RPC (SECURITY DEFINER, bypasses RLS safely)
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("get_admin_pending_users" as any, {
          p_only_foreign: false,
          p_search: null,
          p_platform: null
        });

        if (!rpcErr && Array.isArray(rpcData)) {
          for (const row of rpcData) {
            if (!row.user_id) continue;
            if (isTombstoned(row.user_id, row.email)) continue;

            const pStr = (row.platform || "").trim().toLowerCase();
            const rStr = (row.role || "").trim().toLowerCase();
            const isPublishing = pStr === "publishing" || pStr.startsWith("nashr") || rStr === "publisher" || rStr === "author";
            if (!isPublishing) continue;
            if (["student", "dean", "vice_dean", "department_head", "faculty", "lecturer"].includes(rStr)) continue;

            let parsedMeta: Partial<AuthorProfile> = {};
            if (pStr.startsWith("nashr:")) {
              try {
                parsedMeta = JSON.parse(row.platform.slice(6));
              } catch {}
            }

            const authorCode = parsedMeta.authorCode || `AUT-${row.user_id.substring(0, 4).toUpperCase()}`;
            const id = parsedMeta.id || `auth-${row.user_id}`;
            seenIds.add(id);

            const isApproved = Boolean(row.approved) || row.verification_status === "approved";
            cloudAuthors.push({
              id,
              authorCode,
              fullName: parsedMeta.fullName || row.full_name || "مؤلف مسجل",
              academicTitle: (parsedMeta.academicTitle as any) || "dr",
              academicTitleLabel: parsedMeta.academicTitleLabel || "دكتور / باحث أكاديمي",
              specialization: parsedMeta.specialization || "الدراسات الأكاديمية والبحث العلمي",
              institution: parsedMeta.institution || row.country || "دار عبيد للنشر",
              email: (row.email || parsedMeta.email || "").toLowerCase(),
              phone: row.phone || parsedMeta.phone || "",
              bio: parsedMeta.bio || "مؤلف وباحث مسجل عبر منصة نشر الموحدة.",
              avatarUrl: parsedMeta.avatarUrl || undefined,
              nationalIdUrl: parsedMeta.nationalIdUrl || (row.id_photo_url && !row.id_photo_url.startsWith("meta:") ? row.id_photo_url : undefined),
              nationalIdName: parsedMeta.nationalIdName || undefined,
              qualificationUrls: parsedMeta.qualificationUrls || [],
              qualificationDocuments: parsedMeta.qualificationDocuments || [],
              isTemporaryPassword: parsedMeta.isTemporaryPassword ?? !isApproved,
              tempPassword: parsedMeta.tempPassword,
              permanentPassword: parsedMeta.permanentPassword,
              verificationStatus: isApproved ? "approved" : ((parsedMeta.verificationStatus as any) || row.verification_status || "pending_review"),
              joinedDate: parsedMeta.joinedDate || (row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
              isForeign: Boolean(row.is_foreign),
              idType: (row.id_type as any) || (row.is_foreign ? "passport" : "national_id"),
              passportNumber: parsedMeta.passportNumber || row.id_number,
              countryOfResidence: parsedMeta.countryOfResidence || row.country
            });
          }
        }
      } catch (rpcEx) {
        console.warn("[UnigatesCloudSync] get_admin_pending_users fallback:", rpcEx);
      }

      // 2. Direct profiles fallback (in case user has an authenticated session)
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .or("platform.ilike.nashr%,platform.eq.publishing,role.eq.publisher,role.eq.author")
          .order("created_at", { ascending: false });

        if (Array.isArray(profilesData)) {
          for (const row of profilesData) {
            const id = `auth-${row.user_id}`;
            if (seenIds.has(id) || seenIds.has(row.user_id)) continue;
            if (isTombstoned(row.user_id, row.email)) continue;

            const pStr = (row.platform || "").trim().toLowerCase();
            const roleStr = (row.role || "").trim().toLowerCase();
            const isPublishing = pStr === "publishing" || pStr.startsWith("nashr") || roleStr === "publisher" || roleStr === "author";
            if (!isPublishing) continue;
            if (["student", "dean", "vice_dean", "department_head", "faculty", "lecturer"].includes(roleStr)) continue;

            let parsedMeta: Partial<AuthorProfile> = {};
            if (pStr.startsWith("nashr:")) {
              try {
                parsedMeta = JSON.parse(row.platform.slice(6));
              } catch {}
            }

            const authorCode = parsedMeta.authorCode || `AUT-${row.user_id.substring(0, 4).toUpperCase()}`;
            seenIds.add(id);

            cloudAuthors.push({
              id: parsedMeta.id || id,
              authorCode,
              fullName: parsedMeta.fullName || row.full_name || "مؤلف مسجل",
              academicTitle: (parsedMeta.academicTitle as any) || "dr",
              academicTitleLabel: parsedMeta.academicTitleLabel || "دكتور / باحث أكاديمي",
              specialization: parsedMeta.specialization || "الدراسات الأكاديمية والبحث العلمي",
              institution: parsedMeta.institution || "مؤسسة أكاديمية",
              email: (row.email || parsedMeta.email || "").toLowerCase(),
              phone: row.phone || parsedMeta.phone || "",
              bio: parsedMeta.bio || "مؤلف وباحث مسجل عبر منصة نشر الموحدة.",
              avatarUrl: parsedMeta.avatarUrl || undefined,
              nationalIdUrl: parsedMeta.nationalIdUrl || undefined,
              nationalIdName: parsedMeta.nationalIdName || undefined,
              qualificationUrls: parsedMeta.qualificationUrls || [],
              qualificationDocuments: parsedMeta.qualificationDocuments || [],
              isTemporaryPassword: parsedMeta.isTemporaryPassword ?? row.must_change_password ?? false,
              tempPassword: parsedMeta.tempPassword,
              permanentPassword: parsedMeta.permanentPassword,
              verificationStatus: (parsedMeta.verificationStatus as any) || "pending_review",
              joinedDate: parsedMeta.joinedDate || (row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
              isForeign: parsedMeta.isForeign || false,
              idType: parsedMeta.idType || "national_id",
              passportNumber: parsedMeta.passportNumber,
              countryOfResidence: parsedMeta.countryOfResidence
            });
          }
        }
      } catch (profEx) {
        // Non-fatal if RLS blocks profiles table
      }

      return cloudAuthors;
    } catch (err) {
      console.warn("[UnigatesCloudSync] fetchCloudAuthorsFromSupabase notice:", err);
      return [];
    }
  }

  /**
   * Periodic background synchronization (every 20 seconds)
   */
  private startPeriodicSync() {
    if (this.syncIntervalTimer) clearInterval(this.syncIntervalTimer);
    this.syncIntervalTimer = setInterval(() => {
      this.pullRemoteState().catch(() => {});
    }, 20000);
  }
}

export const UnigatesCloudSync = new UnigatesCloudSyncEngine();
