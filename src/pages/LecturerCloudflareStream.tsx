import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Copy, Play, Square, Trash2, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import HlsPlayer from "@/components/HlsPlayer";

type Stream = {
  id: string;
  title: string;
  description: string | null;
  live_input_uid: string;
  rtmps_url: string;
  rtmps_stream_key: string;
  playback_hls_url: string | null;
  status: string;
  created_at: string;
};

const LecturerCloudflareStream = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const isAr = language === "ar";
  const tx = {
    pageTitle: isAr ? "البث المباشر عبر Cloudflare" : "Cloudflare Live Streaming",
    subtitle: isAr
      ? "أنشئ بثاً مباشراً يدعم عدداً غير محدود من المشاهدين عبر شبكة Cloudflare العالمية"
      : "Create a live stream that supports unlimited viewers via Cloudflare's global network",
    newStream: isAr ? "إنشاء بث جديد" : "New Stream",
    titleLabel: isAr ? "عنوان البث" : "Stream Title",
    descriptionLabel: isAr ? "وصف (اختياري)" : "Description (optional)",
    create: isAr ? "إنشاء" : "Create",
    creating: isAr ? "جارٍ الإنشاء..." : "Creating...",
    rtmps: isAr ? "رابط RTMPS" : "RTMPS URL",
    streamKey: isAr ? "مفتاح البث" : "Stream Key",
    copy: isAr ? "نسخ" : "Copy",
    copied: isAr ? "تم النسخ" : "Copied",
    start: isAr ? "بدء البث" : "Start Live",
    end: isAr ? "إنهاء البث" : "End Live",
    delete: isAr ? "حذف" : "Delete",
    preview: isAr ? "معاينة" : "Preview",
    statusIdle: isAr ? "غير نشط" : "Idle",
    statusLive: isAr ? "مباشر" : "Live",
    statusEnded: isAr ? "انتهى" : "Ended",
    noStreams: isAr ? "لا توجد بثوث بعد" : "No streams yet",
    instructions: isAr
      ? "افتح OBS Studio → الإعدادات → البث، اختر Custom، الصق رابط RTMPS ومفتاح البث، ثم اضغط Start Streaming."
      : "Open OBS Studio → Settings → Stream, choose Custom, paste the RTMPS URL and Stream Key, then press Start Streaming.",
    studentLink: isAr ? "رابط المشاهدة للطلاب" : "Student watch link",
    deleteConfirm: isAr ? "هل أنت متأكد؟" : "Are you sure?",
    back: isAr ? "رجوع" : "Back",
  };

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      navigate("/login");
      return;
    }
    const { data, error } = await supabase
      .from("cloudflare_live_streams")
      .select("*")
      .eq("lecturer_id", u.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setStreams((data as Stream[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return toast.error(tx.titleLabel);
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("stream-create-live-input", {
      body: { title: title.trim(), description: description.trim() },
    });
    setCreating(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Error");
      return;
    }
    setTitle("");
    setDescription("");
    setOpen(false);
    toast.success(isAr ? "تم إنشاء البث" : "Stream created");
    load();
  };

  const handleStatus = async (id: string, action: "start" | "end") => {
    const { data, error } = await supabase.functions.invoke("stream-update-status", {
      body: { streamId: id, action },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Error");
      return;
    }
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tx.deleteConfirm)) return;
    const { error } = await supabase.from("cloudflare_live_streams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success(tx.copied);
  };

  const statusBadge = (s: string) => {
    if (s === "live")
      return (
        <Badge variant="destructive" className="gap-1.5 animate-pulse">
          <Radio className="w-3 h-3" /> {tx.statusLive}
        </Badge>
      );
    if (s === "ended") return <Badge variant="secondary">{tx.statusEnded}</Badge>;
    return <Badge variant="outline">{tx.statusIdle}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Radio className="w-6 h-6 text-destructive" />
            {tx.pageTitle}
          </h1>
          <div className="flex items-center gap-3">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {tx.newStream}
                </Button>
              </DialogTrigger>
              <DialogContent dir={dir}>
                <DialogHeader>
                  <DialogTitle>{tx.newStream}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder={tx.titleLabel}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder={tx.descriptionLabel}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? tx.creating : tx.create}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-muted-foreground mb-6">{tx.subtitle}</p>

        <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
          <p className="text-sm text-foreground leading-relaxed">{tx.instructions}</p>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{tx.noStreams}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {streams.map((s) => {
              const studentUrl = `${window.location.origin}/cf-stream/${s.id}`;
              return (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                        {statusBadge(s.status)}
                      </div>
                      {s.description && (
                        <p className="text-sm text-muted-foreground">{s.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.status !== "live" ? (
                        <Button size="sm" onClick={() => handleStatus(s.id, "start")} className="gap-1.5">
                          <Play className="w-4 h-4" /> {tx.start}
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => handleStatus(s.id, "end")} className="gap-1.5">
                          <Square className="w-4 h-4" /> {tx.end}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setPreviewId(previewId === s.id ? null : s.id)}>
                        {tx.preview}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Field label={tx.rtmps} value={s.rtmps_url} onCopy={() => copy(s.rtmps_url)} copyLabel={tx.copy} />
                    <Field label={tx.streamKey} value={s.rtmps_stream_key} onCopy={() => copy(s.rtmps_stream_key)} copyLabel={tx.copy} secret />
                    <Field label={tx.studentLink} value={studentUrl} onCopy={() => copy(studentUrl)} copyLabel={tx.copy} />
                  </div>

                  {previewId === s.id && s.playback_hls_url && (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden">
                      <HlsPlayer src={s.playback_hls_url} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const Field = ({
  label,
  value,
  onCopy,
  copyLabel,
  secret,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copyLabel: string;
  secret?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-semibold text-muted-foreground min-w-[120px]">{label}</span>
    <Input
      readOnly
      value={value}
      type={secret ? "password" : "text"}
      className="font-mono text-xs"
    />
    <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5">
      <Copy className="w-3.5 h-3.5" />
      {copyLabel}
    </Button>
  </div>
);

export default LecturerCloudflareStream;
