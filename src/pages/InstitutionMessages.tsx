import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageSquare, Users, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// The messaging migration is newer than the generated database type snapshot.
const messagingDb = supabase as any;

interface Contact {
  user_id: string;
  full_name: string;
  specific_role: string;
  email: string | null;
  photo_url: string | null;
  isAdmin?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const roleLabel = (role: string, isCollege: boolean, isRtl: boolean) => {
  const map: Record<string, { ar: string; en: string }> = {
    dean: { ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director" },
    vice_dean_postgrad: { ar: "وكيل الدراسات العليا", en: "Vice Dean Postgrad" },
    vice_dean_students: { ar: "وكيل شئون الطلاب", en: "Vice Dean Students" },
    vice_dean_community: { ar: "وكيل خدمة المجتمع", en: "Vice Dean Community" },
    department_head: { ar: "رئيس القسم", en: "Department Head" },
    teacher: { ar: "مدرس", en: "Teacher" },
    teaching_assistant: { ar: "مدرس مساعد", en: "Teaching Assistant" },
    professor: { ar: "أستاذ دكتور", en: "Professor" },
    doctor: { ar: "دكتور", en: "Doctor" },
    assistant_lecturer: { ar: "معيد", en: "Assistant Lecturer" },
    lecturer: { ar: "محاضر", en: "Lecturer" },
    college_secretary: { ar: isCollege ? "أمين الكلية" : "أمين المعهد", en: "Secretary" },
    library_manager: { ar: "مدير المكتبة", en: "Library Manager" },
    admin: { ar: isCollege ? "إدارة الكلية" : "إدارة المعهد", en: "Administration" },
  };
  const entry = map[role];
  if (!entry) return role;
  return isRtl ? entry.ar : entry.en;
};

export default function InstitutionMessages() {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [isCollege, setIsCollege] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setCurrentUserId(user.id);
      const email = (user.email || "").toLowerCase();

      let instId: string | null = null;
      let instType: "college" | "institute" = "college";

      // Try faculty membership first (covers teacher, secretary, library, dept head, etc.)
      const { data: fac } = await supabase.from("institution_faculty_members").select("institution_id, institution_type").eq("user_id", user.id).maybeSingle();
      if (fac) {
        instId = fac.institution_id;
        instType = fac.institution_type as "college" | "institute";
      } else {
        // Try college admin
        const { data: college } = await supabase.from("college_registrations").select("id").ilike("email", email).in("status", ["approved","pending"]).maybeSingle();
        if (college) { instId = college.id; instType = "college"; }
        else {
          const { data: inst } = await supabase.from("institute_registrations").select("id").ilike("email", email).in("status", ["approved","pending"]).maybeSingle();
          if (inst) { instId = inst.id; instType = "institute"; }
        }
      }
      if (!instId) {
        toast({ title: isRtl ? "غير مصرح" : "Not authorized", description: isRtl ? "هذه الخدمة لأعضاء هيئة التدريس وإدارة الكلية فقط" : "Faculty and administration only", variant: "destructive" });
        navigate("/login");
        return;
      }
      setInstitutionId(instId);
      setInstitutionType(instType);
      setIsCollege(instType === "college");

      // Fetch contacts: faculty + admin
      const [facRes, adminRes] = await Promise.all([
        supabase.from("institution_faculty_members").select("user_id, full_name, specific_role, email, photo_url").eq("institution_id", instId).eq("institution_type", instType),
        instType === "college"
          ? supabase.from("college_registrations").select("college_name, dean_name, email").eq("id", instId).maybeSingle()
          : supabase.from("institute_registrations").select("institute_name, director_name, email").eq("id", instId).maybeSingle(),
      ]);

      const list: Contact[] = [];
      // Add admin as contact if not current user
      const adminData: any = adminRes.data;
      if (adminData) {
        const adminEmail = (adminData.email || "").toLowerCase();
        // Find admin user_id via auth (if exists) or via profiles
        let adminUserId: string | null = null;
        if (adminEmail) {
          const { data: prof } = await supabase.from("profiles").select("user_id").ilike("email", adminEmail).maybeSingle();
          if (prof) adminUserId = prof.user_id;
        }
        // If current user is not admin, add admin to contacts
        if (adminUserId && adminUserId !== user.id) {
          list.push({
            user_id: adminUserId,
            full_name: adminData.dean_name || adminData.director_name || adminData.college_name || adminData.institute_name || (isRtl ? "إدارة الكلية" : "Administration"),
            specific_role: "admin",
            email: adminData.email,
            photo_url: null,
            isAdmin: true,
          });
        } else if (!adminUserId) {
          // Admin has no auth user yet (pending) - still show as contact but messaging will fail until they have account
          // We add a placeholder with institution id as pseudo user? Better skip.
        }
      }

      for (const f of (facRes.data || []) as any[]) {
        if (f.user_id === user.id) continue;
        // Exclude pure students (should not be in this table anyway)
        list.push({
          user_id: f.user_id,
          full_name: f.full_name,
          specific_role: f.specific_role,
          email: f.email,
          photo_url: f.photo_url,
        });
      }
      setContacts(list);
      setLoading(false);
    })();
  }, [navigate, isRtl]);

  // Fetch messages for selected contact
  useEffect(() => {
    if (!selected || !currentUserId || !institutionId) return;
    let cancelled = false;
    const fetchMsgs = async () => {
      const { data } = await messagingDb
        .from("institution_messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .eq("institution_id", institutionId)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selected.user_id}),and(sender_id.eq.${selected.user_id},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!cancelled) setMessages((data as Message[]) || []);
    };
    fetchMsgs();

    // Realtime
    const channel = supabase.channel(`inst-msg-${institutionId}-${currentUserId}-${selected.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "institution_messages", filter: `institution_id=eq.${institutionId}` }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender_id === currentUserId && m.receiver_id === selected.user_id) || (m.sender_id === selected.user_id && m.receiver_id === currentUserId)) {
          setMessages(prev => [...prev, m]);
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [selected, currentUserId, institutionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selected || !currentUserId || !institutionId) return;
    setSending(true);
    try {
      const { error } = await messagingDb.from("institution_messages").insert({
        institution_id: institutionId,
        institution_type: institutionType,
        sender_id: currentUserId,
        receiver_id: selected.user_id,
        content: input.trim(),
      });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast({ title: isRtl ? "فشل الإرسال" : "Send failed", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" dir={dir}><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir={dir}>
      <header className="border-b border-primary/20 px-4 py-3 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" />{isRtl ? "التواصل الداخلي" : "Internal Messages"}</h1>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>{isRtl ? "رجوع" : "Back"} {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</Button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
        {/* Contacts */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-primary" />{isRtl ? "جهات الاتصال" : "Contacts"} <Badge variant="secondary">{contacts.length}</Badge></CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2 p-2">
            {contacts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{isRtl ? "لا يوجد أعضاء بعد" : "No members yet"}</p>}
            {contacts.map(c => (
              <button key={c.user_id} onClick={() => setSelected(c)} className={`w-full text-start p-3 rounded-xl border flex items-center gap-3 transition-colors ${selected?.user_id === c.user_id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.photo_url ? <img src={c.photo_url} alt={c.full_name} className="w-full h-full object-cover" /> : c.isAdmin ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{c.full_name}</p>
                  <p className={`text-xs truncate ${selected?.user_id === c.user_id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{roleLabel(c.specific_role, isCollege, isRtl)}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
              <p>{isRtl ? "اختر جهة اتصال لبدء المراسلة" : "Select a contact to start messaging"}</p>
              <p className="text-xs mt-1">{isRtl ? "يمكنك مراسلة إدارة الكلية وأعضاء هيئة التدريس (لا يشمل الطلاب)" : "You can message administration and faculty (excludes students)"}</p>
            </div>
          ) : (
            <>
              <CardHeader className="pb-2 border-b"><CardTitle className="text-base">{selected.full_name} — {roleLabel(selected.specific_role, isCollege, isRtl)}</CardTitle></CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.map(m => {
                  const isMe = m.sender_id === currentUserId;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border shadow-sm rounded-bl-sm"}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder={isRtl ? "اكتب رسالتك..." : "Type a message..."} onKeyDown={e => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
