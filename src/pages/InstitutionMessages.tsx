import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Send, MessageSquare, Users, ShieldCheck, ArrowLeft, ArrowRight,
  Phone, Video, Mic, Paperclip, Image as ImageIcon, Smile, FileText,
  Download, Search, X, CheckCheck, Check, Sparkles, PhoneIncoming,
  PhoneOff, Radio, Plus, MoreVertical, Trash2, Maximize2, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import {
  Contact, Message, RichMessageData, parseMessageContent,
  serializeMessage, formatFileSize, formatSeconds
} from "@/components/messaging/types";
import { AudioMessagePlayer } from "@/components/messaging/AudioMessagePlayer";
import { VoiceRecorder } from "@/components/messaging/VoiceRecorder";
import { QuickRepliesBar } from "@/components/messaging/QuickRepliesBar";
import { VideoCallModal } from "@/components/messaging/VideoCallModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// The messaging migration is newer than the generated database type snapshot.
const messagingDb = supabase as any;

const EMOJI_LIST = [
  "👍", "❤️", "👏", "🔥", "✅", "🎓", "📚", "✨",
  "🙏", "🤝", "💡", "🎯", "⭐", "🎉", "💼", "✍️",
  "😊", "😃", "☕", "💯", "🚀", "👌", "💪", "🏆"
];

const roleLabel = (role: string, isCollege: boolean, isRtl: boolean) => {
  const map: Record<string, { ar: string; en: string }> = {
    dean: { ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director" },
    vice_dean_postgrad: { ar: isCollege ? "وكيل الكلية للدراسات العليا والبحوث" : "وكيل المعهد للدراسات العليا", en: "Vice Dean Postgrad" },
    vice_dean_students: { ar: isCollege ? "وكيل الكلية لشئون التعليم والطلاب" : "وكيل المعهد لشئون الطلاب", en: "Vice Dean Students" },
    vice_dean_community: { ar: isCollege ? "وكيل الكلية لخدمة المجتمع وتنمية البيئة" : "وكيل المعهد لخدمة المجتمع", en: "Vice Dean Community" },
    vice_dean_environment: { ar: isCollege ? "وكيل الكلية لخدمة المجتمع وتنمية البيئة" : "وكيل المعهد لخدمة المجتمع", en: "Vice Dean Community" },
    vice_dean: { ar: isCollege ? "وكيل الكلية" : "وكيل المعهد", en: "Vice Dean" },
    department_head: { ar: "رئيس القسم", en: "Department Head" },
    professor: { ar: "أستاذ دكتور (أ.د)", en: "Professor" },
    prof_dr: { ar: "أستاذ دكتور (أ.د)", en: "Professor" },
    doctor: { ar: "دكتور (د.)", en: "Doctor" },
    dr: { ar: "دكتور (د.)", en: "Doctor" },
    teacher: { ar: "مدرس", en: "Teacher / Lecturer" },
    lecturer: { ar: "مدرس / محاضر", en: "Lecturer" },
    assistant_lecturer: { ar: "مدرس مساعد", en: "Assistant Lecturer" },
    teaching_assistant: { ar: "مدرس مساعد", en: "Teaching Assistant" },
    demonstrator: { ar: "معيد", en: "Demonstrator" },
    college_secretary: { ar: isCollege ? "أمين الكلية" : "أمين المعهد", en: "College Secretary" },
    library_manager: { ar: "مدير المكتبة", en: "Library Manager" },
    admin: { ar: isCollege ? "إدارة الكلية" : "إدارة المعهد", en: "Administration" },
  };
  const entry = map[role];
  if (!entry) return role;
  return isRtl ? entry.ar : entry.en;
};

interface CachedMessagesData {
  contacts: Contact[];
  instId: string;
  instType: "college" | "institute";
  userName: string;
  userId: string;
  cachedAt: number;
}

const MESSAGES_CACHE_KEY = "unigates_messages_contacts_cache";

function getInitialMessagesCache(): CachedMessagesData | null {
  if (__messagesContactsCache && Date.now() - (__messagesContactsCache as any).cachedAt < 5 * 60 * 1000) {
    return __messagesContactsCache as any;
  }
  try {
    const raw = sessionStorage.getItem(MESSAGES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedMessagesData;
      if (parsed && Date.now() - (parsed.cachedAt || 0) < 5 * 60 * 1000) {
        __messagesContactsCache = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

let __messagesContactsCache: (CachedMessagesData & { cachedAt: number }) | null = getInitialMessagesCache() as any;

export default function InstitutionMessages() {
  const { language, dir, toggleLanguage, tText } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const { identity } = useInstitutionIdentity({ redirectOnMissing: false });
  const subscriptionPlan = identity?.subscriptionPlan ?? "free";

  const initialCache = getInitialMessagesCache();

  // Basic States
  const [loading, setLoading] = useState(() => !initialCache);
  const [institutionId, setInstitutionId] = useState<string | null>(() => initialCache?.instId ?? identity?.institutionId ?? null);
  const [institutionType, setInstitutionType] = useState<"college" | "institute">(() => initialCache?.instType ?? identity?.institutionType ?? "college");
  const [isCollege, setIsCollege] = useState(() => (initialCache?.instType ?? identity?.institutionType ?? "college") === "college");
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => initialCache?.userId ?? null);
  const [currentUserName, setCurrentUserName] = useState<string>(() => initialCache?.userName ?? identity?.institutionName ?? "");
  const [contacts, setContacts] = useState<Contact[]>(() => initialCache?.contacts ?? []);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "admin" | "heads" | "faculty" | "staff">("all");
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Voice & Quick tools
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);

  // Calling States
  const [activeCall, setActiveCall] = useState<{
    type: "video" | "audio";
    isIncoming: boolean;
    incomingOffer?: any;
  } | null>(null);
  const [incomingCallNotification, setIncomingCallNotification] = useState<{
    caller: Contact;
    callType: "video" | "audio";
    offer: any;
  } | null>(null);

  // Lightbox Image Preview
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // 1. Initial Fast Load & Auth Check
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Fast Session lookup
      const sessionRes = await supabase.auth.getSession();
      let user = sessionRes.data.session?.user;
      if (!user) {
        const userRes = await supabase.auth.getUser();
        user = userRes.data.user;
      }
      if (!user) {
        if (!cancelled) navigate("/login");
        return;
      }

      if (cancelled) return;
      setCurrentUserId(user.id);
      const email = (user.email || "").toLowerCase();

      let instId: string | null = identity?.institutionId ?? null;
      let instType: "college" | "institute" = identity?.institutionType ?? "college";
      let userName = identity?.institutionName || user.user_metadata?.full_name || email.split("@")[0];

      // If identity is already known, we can skip identity discovery and fetch contacts directly in parallel
      if (!instId) {
        const [facRes, colRes, instRes] = await Promise.all([
          supabase
            .from("institution_faculty_members")
            .select("institution_id, institution_type, full_name")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("college_registrations")
            .select("id, dean_name, college_name")
            .ilike("email", email)
            .in("status", ["approved", "pending"])
            .maybeSingle(),
          supabase
            .from("institute_registrations")
            .select("id, director_name, institute_name")
            .ilike("email", email)
            .in("status", ["approved", "pending"])
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (facRes.data) {
          instId = facRes.data.institution_id;
          instType = facRes.data.institution_type as "college" | "institute";
          if (facRes.data.full_name) userName = facRes.data.full_name;
        } else if (colRes.data) {
          instId = colRes.data.id;
          instType = "college";
          userName = colRes.data.dean_name || colRes.data.college_name || userName;
        } else if (instRes.data) {
          instId = instRes.data.id;
          instType = "institute";
          userName = instRes.data.director_name || instRes.data.institute_name || userName;
        }
      }

      if (!instId) {
        if (!cancelled) {
          toast({
            title: isRtl ? "غير مصرح" : "Not authorized",
            description: isRtl
              ? "هذه الخدمة لأعضاء هيئة التدريس وإدارة الكلية فقط"
              : "Faculty and administration only",
            variant: "destructive",
          });
          navigate("/login");
        }
        return;
      }

      if (cancelled) return;
      setCurrentUserName(userName);
      setInstitutionId(instId);
      setInstitutionType(instType);
      setIsCollege(instType === "college");

      // Fetch contacts: faculty + admin + departments in parallel
      const [facRes, adminRes, deptsRes] = await Promise.all([
        supabase
          .from("institution_faculty_members")
          .select("user_id, full_name, specific_role, email, photo_url, department_id")
          .eq("institution_id", instId)
          .eq("institution_type", instType),
        instType === "college"
          ? supabase.from("college_registrations").select("college_name, dean_name, email").eq("id", instId).maybeSingle()
          : supabase.from("institute_registrations").select("institute_name, director_name, email").eq("id", instId).maybeSingle(),
        supabase.from("departments").select("id, department_name").eq("institution_id", instId),
      ]);

      if (cancelled) return;

      const deptsMap = new Map<string, string>();
      if (deptsRes.data) {
        deptsRes.data.forEach((d: any) => deptsMap.set(d.id, d.department_name));
      }

      const list: Contact[] = [];
      const adminData: any = adminRes.data;
      if (adminData) {
        const adminEmail = (adminData.email || "").toLowerCase();
        let adminUserId: string | null = null;
        if (adminEmail) {
          const { data: prof } = await supabase.from("profiles").select("user_id").ilike("email", adminEmail).maybeSingle();
          if (prof) adminUserId = prof.user_id;
        }
        if (adminUserId && adminUserId !== user.id) {
          list.push({
            user_id: adminUserId,
            full_name: adminData.dean_name || adminData.director_name || adminData.college_name || adminData.institute_name || (isRtl ? "إدارة الكلية" : "Administration"),
            specific_role: "admin",
            email: adminData.email,
            photo_url: null,
            isAdmin: true,
            isOnline: true,
          });
        }
      }

      for (const f of (facRes.data || []) as any[]) {
        if (f.user_id === user.id) continue;
        list.push({
          user_id: f.user_id,
          full_name: f.full_name,
          specific_role: f.specific_role,
          email: f.email,
          photo_url: f.photo_url,
          department_name: f.department_id ? deptsMap.get(f.department_id) : undefined,
          isOnline: true,
        });
      }

      const cacheEntry: CachedMessagesData = {
        contacts: list,
        instId: instId || "",
        instType,
        userName,
        userId: user.id,
        cachedAt: Date.now(),
      };
      __messagesContactsCache = cacheEntry as any;
      try {
        sessionStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(cacheEntry));
      } catch {
        // ignore
      }

      if (!cancelled) {
        setContacts(list);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, isRtl, identity]);

  // Real-time listener for newly added / registered faculty & staff members
  useEffect(() => {
    if (!institutionId || !currentUserId) return;

    const channel = supabase
      .channel(`inst-faculty-sync-${institutionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "institution_faculty_members",
          filter: `institution_id=eq.${institutionId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newMember = payload.new as any;
            if (newMember.user_id === currentUserId) return;

            setContacts((prev) => {
              const existingIdx = prev.findIndex((c) => c.user_id === newMember.user_id);
              const updatedContact: Contact = {
                user_id: newMember.user_id,
                full_name: newMember.full_name,
                specific_role: newMember.specific_role,
                email: newMember.email,
                photo_url: newMember.photo_url,
                isOnline: true,
              };

              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = { ...next[existingIdx], ...updatedContact };
                return next;
              } else {
                return [updatedContact, ...prev];
              }
            });
          } else if (payload.eventType === "DELETE") {
            const oldMember = payload.old as any;
            setContacts((prev) => prev.filter((c) => c.user_id !== oldMember.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId, currentUserId]);

  // 2. Global Call Listener Channel
  useEffect(() => {
    if (!institutionId || !currentUserId) return;

    const callChannelName = `inst-calls-hub-${institutionId}-${currentUserId}`;
    const channel = supabase.channel(callChannelName);

    channel
      .on("broadcast", { event: "incoming_call" }, (payload) => {
        const data = payload.payload;
        if (data.targetUserId === currentUserId && data.caller) {
          setIncomingCallNotification({
            caller: data.caller,
            callType: data.callType || "video",
            offer: data.offer,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId, currentUserId]);

  // 3. Fetch messages for selected contact & listen in real-time
  useEffect(() => {
    if (!selected || !currentUserId || !institutionId) return;
    let cancelled = false;

    const fetchMsgs = async () => {
      const { data } = await messagingDb
        .from("institution_messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .eq("institution_id", institutionId)
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${selected.user_id}),and(sender_id.eq.${selected.user_id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true })
        .limit(150);

      if (!cancelled && data) {
        const parsedMsgs: Message[] = data.map((m: any) => ({
          ...m,
          parsed: parseMessageContent(m.content),
        }));
        setMessages(parsedMsgs);
      }
    };
    fetchMsgs();

    // Real-time listener for new messages & typing
    const channel = supabase
      .channel(`inst-chat-${institutionId}-${[currentUserId, selected.user_id].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "institution_messages",
          filter: `institution_id=eq.${institutionId}`,
        },
        (payload) => {
          const m = payload.new as any;
          if (
            (m.sender_id === currentUserId && m.receiver_id === selected.user_id) ||
            (m.sender_id === selected.user_id && m.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [
              ...prev,
              { ...m, parsed: parseMessageContent(m.content) },
            ]);
            setRemoteTyping(false);
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.senderId === selected.user_id) {
          setRemoteTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setRemoteTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selected, currentUserId, institutionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteTyping]);

  // Handle Typing Broadcast
  const handleInputChange = (text: string) => {
    setInput(text);
    if (!isTyping && selected && institutionId && currentUserId) {
      setIsTyping(true);
      const chatChan = supabase.channel(`inst-chat-${institutionId}-${[currentUserId, selected.user_id].sort().join("-")}`);
      chatChan.send({
        type: "broadcast",
        event: "typing",
        payload: { senderId: currentUserId },
      });
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  // 4. Send Message (Text / Rich)
  const sendMessageData = async (payload: RichMessageData) => {
    if (!selected || !currentUserId || !institutionId) return;
    setSending(true);
    try {
      const content = serializeMessage(payload);
      const { error } = await messagingDb.from("institution_messages").insert({
        institution_id: institutionId,
        institution_type: institutionType,
        sender_id: currentUserId,
        receiver_id: selected.user_id,
        content,
      });
      if (error) throw error;
      setInput("");
      setShowQuickReplies(false);
    } catch (e: any) {
      toast({
        title: isRtl ? "فشل الإرسال" : "Send failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (!input.trim()) return;
    sendMessageData({ type: "text", text: input.trim() });
  };

  // 5. Send Voice Note
  const handleSendVoice = async (url: string, duration: number) => {
    await sendMessageData({
      type: "voice",
      url,
      duration,
    });
  };

  // 6. Handle File / Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !selected || !institutionId) return;

    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chat_attachments/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("course-content")
        .upload(path, file, { upsert: true });

      let publicUrl = "";
      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from("course-content")
          .getPublicUrl(path);
        publicUrl = pubData.publicUrl;
      } else {
        // Fallback to data URL
        publicUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      await sendMessageData({
        type: isImage ? "image" : "file",
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileMime: file.type,
      });

      toast({
        title: isRtl ? "تم إرسال الملف بنجاح" : "File sent successfully",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: isRtl ? "فشل رفع الملف" : "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // 7. Start Video / Voice Call
  const startCall = (type: "video" | "audio") => {
    if (!selected || !institutionId || !currentUserId) return;
    setActiveCall({ type, isIncoming: false });

    // Broadcast incoming call notification to target user's hub channel
    const targetHubChannel = supabase.channel(`inst-calls-hub-${institutionId}-${selected.user_id}`);
    targetHubChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        targetHubChannel.send({
          type: "broadcast",
          event: "incoming_call",
          payload: {
            targetUserId: selected.user_id,
            callType: type,
            caller: {
              user_id: currentUserId,
              full_name: currentUserName,
              specific_role: "faculty",
              photo_url: null,
            },
          },
        });
      }
    });
  };

  // End Call & Log to Chat
  const handleEndCall = async (duration: number) => {
    setActiveCall(null);
    if (selected && duration > 0) {
      await sendMessageData({
        type: "call_log",
        callType: activeCall?.type || "video",
        callStatus: "completed",
        callDuration: duration,
      });
    }
  };

  // Filter Contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department_name && c.department_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === "admin") {
      return (
        c.isAdmin ||
        ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment", "college_secretary", "library_manager", "admin"].includes(
          c.specific_role
        )
      );
    }
    if (selectedCategory === "heads") {
      return c.specific_role === "department_head";
    }
    if (selectedCategory === "faculty") {
      return ["professor", "prof_dr", "doctor", "dr", "teacher", "lecturer"].includes(c.specific_role);
    }
    if (selectedCategory === "staff") {
      return ["assistant_lecturer", "teaching_assistant", "demonstrator", "college_secretary", "library_manager"].includes(
        c.specific_role
      );
    }
    return true;
  });

  // Filter Messages inside active chat
  const filteredMessages = messages.filter((m) => {
    if (!chatSearch.trim()) return true;
    const text = m.parsed?.text || m.content || "";
    return text.toLowerCase().includes(chatSearch.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground institution-admin-scope" dir={dir}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground">
            {isRtl ? "جاري تحميل مركز التواصل..." : "Loading Communication Hub..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col institution-admin-scope transition-colors duration-300 overflow-hidden" dir={dir}>
      {/* Hidden File Upload Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileUpload(e, false)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, true)}
      />

      {/* Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform">
                <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                  {institutionType === "institute"
                    ? (isRtl ? "لوحة إدارة المعهد" : "Institute Administration")
                    : (isRtl ? "لوحة إدارة الكلية" : "College Administration")}
                </h1>
                {subscriptionPlan && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {subscriptionPlan === "free"
                      ? (isRtl ? "الخطة المجانية" : "Free Plan")
                      : subscriptionPlan === "monthly"
                      ? (isRtl ? "الخطة الشهرية" : "Monthly Plan")
                      : (isRtl ? "الخطة السنوية" : "Annual Plan")}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
                {isRtl ? "التواصل والمراسلات" : "Messages & Communication"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />

            <DashboardMenuDropdown
              title={institutionType === "institute" ? (isRtl ? "لوحة المعهد" : "Institute Panel") : (isRtl ? "لوحة الكلية" : "College Panel")}
              onLanguageToggle={toggleLanguage}
              showNotifications={false}
              onLogout={async () => {
                await supabase.auth.signOut();
                navigate("/university-platform");
              }}
              items={getInstitutionMenuItems({
                isRtl,
                language,
                activeKey: "messages",
                onTabChange: (tab) => navigate(`/institution/dashboard?tab=${tab}`),
                onNavigate: (path) => navigate(path),
              })}
            />
          </div>
        </div>
      </header>

      {/* 2. Main Chat Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid md:grid-cols-12 gap-4 h-[calc(100vh-75px)] overflow-hidden">
        {/* Left/Right Sidebar: Contacts List (4 cols) */}
        <Card className="md:col-span-4 flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-2xl">
          {/* Search Contacts */}
          <div className="p-3.5 border-b border-border/70 space-y-3 bg-muted/40 dark:bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث في جهات الاتصال أو الأقسام..." : "Search contacts or departments..."}
                className="ps-9 h-10 rounded-2xl bg-background border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all duration-200 flex items-center gap-1 ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <span>{isRtl ? "الكل" : "All"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25 opacity-90 text-white">
                  {contacts.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("admin")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all duration-200 flex items-center gap-1 ${
                  selectedCategory === "admin"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <span>{isRtl ? "العمادة والإدارة" : "Administration"}</span>
              </button>

              <button
                onClick={() => setSelectedCategory("heads")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all duration-200 flex items-center gap-1 ${
                  selectedCategory === "heads"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <span>{isRtl ? "رؤساء الأقسام" : "Dept Heads"}</span>
              </button>

              <button
                onClick={() => setSelectedCategory("faculty")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all duration-200 flex items-center gap-1 ${
                  selectedCategory === "faculty"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <span>{isRtl ? "أعضاء التدريس" : "Faculty"}</span>
              </button>

              <button
                onClick={() => setSelectedCategory("staff")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all duration-200 flex items-center gap-1 ${
                  selectedCategory === "staff"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <span>{isRtl ? "الكادر المساعد" : "Staff"}</span>
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Users className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs font-bold">
                  {isRtl ? "لا توجد جهات اتصال مطابقة للبحث" : "No contacts matching search"}
                </p>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = selected?.user_id === c.user_id;
                return (
                  <button
                    key={c.user_id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-start p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/10 dark:from-teal-500/25 dark:to-emerald-500/25 border-primary/40 text-foreground shadow-md"
                        : "bg-background/50 hover:bg-muted/60 border-border/50 text-foreground"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-primary/20 flex items-center justify-center text-primary font-black text-sm overflow-hidden">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt={c.full_name} className="w-full h-full object-cover" />
                        ) : c.isAdmin ? (
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        ) : (
                          c.full_name.charAt(0)
                        )}
                      </div>
                      {c.isOnline && (
                        <span className="absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-black text-xs sm:text-sm text-foreground truncate">
                          {c.full_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[11px] truncate ${isSelected ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {roleLabel(c.specific_role, isCollege, isRtl)}
                        </span>
                        {c.department_name && (
                          <>
                            <span className="text-muted-foreground/60 text-[10px]">•</span>
                            <span className="text-[10px] text-muted-foreground truncate">{c.department_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Central Chat Area (8 cols) */}
        <Card className="md:col-span-8 flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-2xl">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h2 className="text-lg font-black text-foreground">
                  {isRtl ? "اختر جهة اتصال لبدء المحادثة" : "Select a contact to begin"}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "يمكنك إجراء محادثات فورية، تسجيل رسائل صوتية، ومكالمات فيديو عالية الدقة مع أعضاء هيئة التدريس والإدارة."
                    : "Conduct instant chat, send voice notes, and start HD video/audio calls with faculty & administration."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Active Contact Header */}
              <div className="p-3 sm:p-4 px-5 border-b border-border/70 bg-muted/40 dark:bg-slate-950/50 backdrop-blur flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm overflow-hidden">
                      {selected.photo_url ? (
                        <img src={selected.photo_url} alt={selected.full_name} className="w-full h-full object-cover" />
                      ) : (
                        selected.full_name.charAt(0)
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-black text-foreground truncate flex items-center gap-1.5">
                      {selected.full_name}
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold py-0">
                        {roleLabel(selected.specific_role, isCollege, isRtl)}
                      </Badge>
                    </h2>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {isRtl ? "متصل الآن" : "Online"}
                    </p>
                  </div>
                </div>

                {/* Call & Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Voice Call Button */}
                  <Button
                    onClick={() => startCall("audio")}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-2xl border-border/80 bg-background/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    title={isRtl ? "مكالمة صوتية" : "Voice Call"}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>

                  {/* Video Call Button */}
                  <Button
                    onClick={() => startCall("video")}
                    className="h-10 px-3.5 gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-teal-500/25"
                    title={isRtl ? "مكالمة فيديو مباشرة" : "Video Call"}
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">{isRtl ? "مكالمة فيديو" : "Video Call"}</span>
                  </Button>

                  {/* Search in chat toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChatSearch(!showChatSearch)}
                    className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground border border-border/80 bg-background/60"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Search Bar */}
              {showChatSearch && (
                <div className="p-2.5 px-4 bg-muted/60 dark:bg-slate-950/90 border-b border-border/70 flex items-center gap-2 animate-fade-in">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder={isRtl ? "بحث داخل هذه المحادثة..." : "Search inside conversation..."}
                    className="h-8 text-xs bg-background border-border/80 text-foreground"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setShowChatSearch(false); setChatSearch(""); }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-muted/20 dark:bg-slate-950/30">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-primary/40" />
                    <p className="text-xs font-bold">
                      {isRtl ? "لا توجد رسائل سابقة. ابدأ المحادثة الآن!" : "No messages yet. Say hello!"}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((m) => {
                    const isMe = m.sender_id === currentUserId;
                    const parsed = m.parsed || { type: "text", text: m.content };

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} group animate-fade-in`}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] rounded-3xl p-3.5 shadow-md ${
                            isMe
                              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-sm shadow-teal-500/10"
                              : "bg-card dark:bg-slate-900 border border-border/80 text-card-foreground rounded-bl-sm"
                          }`}
                        >
                          {/* 1. Text Message */}
                          {parsed.type === "text" && (
                            <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                              {parsed.text}
                            </p>
                          )}

                          {/* 2. Voice Note */}
                          {parsed.type === "voice" && parsed.url && (
                            <AudioMessagePlayer
                              src={parsed.url}
                              duration={parsed.duration}
                              isMe={isMe}
                            />
                          )}

                          {/* 3. Image Photo */}
                          {parsed.type === "image" && parsed.url && (
                            <div className="space-y-2">
                              <div
                                onClick={() => setLightboxImage(parsed.url!)}
                                className="rounded-2xl overflow-hidden cursor-pointer border border-border/80 hover:opacity-90 transition-opacity max-h-64"
                              >
                                <img
                                  src={parsed.url}
                                  alt={parsed.fileName || "Image"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {parsed.fileName && (
                                <p className="text-[11px] opacity-80 truncate">{parsed.fileName}</p>
                              )}
                            </div>
                          )}

                          {/* 4. Document / File */}
                          {parsed.type === "file" && parsed.url && (
                            <div className="flex items-center gap-3 p-2 rounded-2xl bg-black/10 dark:bg-black/20 border border-border/60">
                              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs truncate">{parsed.fileName || "Document"}</p>
                                <span className="text-[10px] opacity-70 block">{formatFileSize(parsed.fileSize)}</span>
                              </div>
                              <a
                                href={parsed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground shrink-0 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {/* 5. Call Log */}
                          {parsed.type === "call_log" && (
                            <div className="flex items-center gap-2.5 py-1">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                {parsed.callType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                              </div>
                              <div className="text-xs">
                                <span className="font-bold block">
                                  {isRtl ? "مكالمة مكتملة" : "Call Completed"}
                                </span>
                                <span className="text-[10px] opacity-75">
                                  {isRtl ? `المدة: ${formatSeconds(parsed.callDuration || 0)}` : `Duration: ${formatSeconds(parsed.callDuration || 0)}`}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Timestamp & Read Indicator */}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75 font-mono">
                            <span>
                              {new Date(m.created_at).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-teal-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Remote User Typing Indicator */}
                {remoteTyping && (
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{isRtl ? `${selected.full_name} يكتب الآن...` : `${selected.full_name} is typing...`}</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Bottom Input Area */}
              <div className="p-3 border-t border-border/70 bg-muted/40 dark:bg-slate-950/80 backdrop-blur space-y-2">
                {/* Quick Replies Drawer */}
                {showQuickReplies && (
                  <QuickRepliesBar
                    onSelectReply={(text) => handleInputChange(text)}
                    onClose={() => setShowQuickReplies(false)}
                    isRtl={isRtl}
                  />
                )}

                {/* Voice Recorder Mode OR Normal Input Mode */}
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onSendVoice={handleSendVoice}
                    onCancel={() => setIsRecordingVoice(false)}
                    isRtl={isRtl}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Media Attachment Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={uploadingMedia}
                          className="h-10 w-10 rounded-2xl border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                          title={isRtl ? "إرفاق ملفات أو صور" : "Attach files or photos"}
                        >
                          {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-48 p-2 rounded-2xl bg-popover border-border text-popover-foreground shadow-2xl">
                        <div className="space-y-1">
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted text-start text-foreground hover:text-primary transition-colors"
                          >
                            <ImageIcon className="w-4 h-4 text-teal-500" />
                            <span>{isRtl ? "إرسال صورة" : "Photos & Images"}</span>
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted text-start text-foreground hover:text-primary transition-colors"
                          >
                            <FileText className="w-4 h-4 text-emerald-500" />
                            <span>{isRtl ? "إرسال مستند / ملف" : "Document or File"}</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Emoji Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                          title="Emojis"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-64 p-3 rounded-2xl bg-popover border-border text-popover-foreground shadow-2xl">
                        <div className="grid grid-cols-6 gap-2">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleInputChange(input + emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg rounded-xl hover:bg-muted transition-transform active:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Quick Replies Toggle Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className={`h-10 w-10 rounded-2xl border shrink-0 transition-colors ${
                        showQuickReplies
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={isRtl ? "ردود سريعة جاهزة" : "Quick replies"}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>

                    {/* Text Input */}
                    <Input
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={isRtl ? "اكتب رسالتك هنا..." : "Type your message..."}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendText()}
                      className="h-10 rounded-2xl bg-background border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary"
                    />

                    {/* Voice Recording Button OR Send Button */}
                    {input.trim() ? (
                      <Button
                        onClick={handleSendText}
                        disabled={sending}
                        size="icon"
                        className="h-10 w-10 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shrink-0 shadow-lg shadow-teal-500/25"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsRecordingVoice(true)}
                        size="icon"
                        className="h-10 w-10 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-primary/30 text-primary shrink-0"
                        title={isRtl ? "تسجيل رسالة صوتية" : "Record voice note"}
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 3. Global Active Video / Voice Call Modal */}
      {activeCall && selected && institutionId && currentUserId && (
        <VideoCallModal
          callType={activeCall.type}
          contact={selected}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          institutionId={institutionId}
          isIncoming={activeCall.isIncoming}
          incomingOffer={activeCall.incomingOffer}
          onEndCall={handleEndCall}
          isRtl={isRtl}
        />
      )}

      {/* 4. Global Incoming Call Alert Banner */}
      {incomingCallNotification && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-50 p-4 rounded-3xl bg-slate-900/95 border-2 border-teal-400 shadow-2xl backdrop-blur-2xl animate-scale-in flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-sm">{incomingCallNotification.caller.full_name}</p>
              <p className="text-xs text-teal-300">
                {isRtl
                  ? incomingCallNotification.callType === "video"
                    ? "مكالمة فيديو واردة..."
                    : "مكالمة صوتية واردة..."
                  : "Incoming Call..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setSelected(incomingCallNotification.caller);
                setActiveCall({
                  type: incomingCallNotification.callType,
                  isIncoming: true,
                  incomingOffer: incomingCallNotification.offer,
                });
                setIncomingCallNotification(null);
              }}
              className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs gap-1 shadow-lg shadow-emerald-500/30"
            >
              <Phone className="w-4 h-4" />
              <span>{isRtl ? "رد" : "Accept"}</span>
            </Button>
            <Button
              onClick={() => setIncomingCallNotification(null)}
              variant="destructive"
              size="icon"
              className="h-10 w-10 rounded-xl"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. Image Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-slate-950/95 border border-white/20 rounded-3xl overflow-hidden text-white">
          {lightboxImage && (
            <div className="flex flex-col items-center gap-3 p-2">
              <img
                src={lightboxImage}
                alt="Enlarged preview"
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <div className="flex items-center justify-between w-full px-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-xs font-bold text-teal-300 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? "تنزيل الصورة الأصلية" : "Download original"}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLightboxImage(null)}
                  className="rounded-xl text-slate-400 hover:text-white"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
