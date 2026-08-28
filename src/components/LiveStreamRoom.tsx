import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
} from "@livekit/components-react";
import { Track, VideoPresets, ScreenSharePresets, RoomEvent, type RoomOptions } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import MandatoryRatingDialog from "@/components/MandatoryRatingDialog";
import { X, Radio, Users, Mic, MicOff, Star, MessageSquare, Paperclip, Download, FileText, Sparkles, CheckCircle2 } from "lucide-react";


interface LiveStreamRoomProps {
  streamId: string;
  streamTitle: string;
  isHost: boolean;
  participantName: string;
  onClose: () => void;
}

function StageView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div style={{ height: "calc(100vh - 120px)" }}>
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

const LiveStreamRoom = ({ streamId, streamTitle, isHost, participantName, onClose }: LiveStreamRoomProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeaveRating, setShowLeaveRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);


  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/livekit-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            roomName: streamId,
            participantName,
            isHost,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to get token");
      }

      const data = await resp.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [streamId, participantName, isHost]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Check if this viewer already rated this stream (don't prompt again)
  useEffect(() => {
    if (isHost) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("live_stream_ratings")
        .select("rating")
        .eq("stream_id", streamId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) setHasRated(true);
    })();
    return () => { cancelled = true; };
  }, [streamId, isHost]);

  const handleDisconnect = useCallback(async () => {
    if (isHost) {
      await supabase
        .from("live_streams")
        .update({ status: "ended" })
        .eq("id", streamId);
      onClose();
      return;
    }
    // Viewers must rate before leaving
    if (!hasRated) {
      setShowLeaveRating(true);
      return;
    }
    onClose();
  }, [isHost, streamId, onClose, hasRated]);

  const handleRatingSubmit = useCallback(async (rating: number, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onClose();
      return;
    }
    const { error: saveErr } = await supabase
      .from("live_stream_ratings")
      .upsert(
        { stream_id: streamId, user_id: user.id, rating, comment: comment || null },
        { onConflict: "stream_id,user_id" }
      );
    if (saveErr) {
      toast({
        title: language === "ar" ? "تعذر حفظ التقييم" : "Could not save rating",
        description: saveErr.message,
        variant: "destructive",
      });
      return;
    }
    setHasRated(true);
    setShowLeaveRating(false);
    onClose();
  }, [streamId, onClose, toast, language]);


  // High-quality streaming configuration
  // (must run before any early return to keep hook order stable)
  const roomOptions: RoomOptions = useMemo(() => ({
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      simulcast: true,
      videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
      videoCodec: "vp9",
      videoEncoding: {
        maxBitrate: 4_500_000, // 4.5 Mbps for 1080p HQ
        maxFramerate: 30,
        priority: "high",
      },
      screenShareEncoding: {
        maxBitrate: 6_000_000,
        maxFramerate: 30,
      },
      audioPreset: {
        maxBitrate: 64_000,
      },
      red: true,
      dtx: true,
    },
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
      facingMode: "user",
    },
    screenShareCaptureDefaults: {
      resolution: ScreenSharePresets.h1080fps30.resolution,
    },
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
  }), []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "ar" ? "جاري الاتصال بالبث المباشر..." : "Connecting to live stream..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {language === "ar" ? "خطأ في الاتصال" : "Connection Error"}
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              {language === "ar" ? "رجوع" : "Go Back"}
            </Button>
            <Button onClick={fetchToken}>
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-destructive animate-pulse" />
          <span className="font-bold text-foreground">{streamTitle}</span>
          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
            {language === "ar" ? "🔴 مباشر HD" : "🔴 LIVE HD"}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
          {isHost
            ? (language === "ar" ? "إنهاء البث" : "End Stream")
            : (language === "ar" ? "مغادرة" : "Leave")}
        </Button>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        video={isHost}
        audio={isHost}
        options={roomOptions}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="relative h-full">
          <VideoConference />
          <RoomAudioRenderer />
          {/* Listens for force-mute requests from host */}
          {!isHost && <ForceMuteListener />}
          {/* Floating action panels (Attachments, Host Controls, Stream Rating) */}
          <div className="absolute top-3 end-3 flex flex-col gap-2 z-20 pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-2">
              <StreamAttachmentsPanel streamId={streamId} />
              {isHost ? (
                <HostMuteControls />
              ) : (
                <StreamRating streamId={streamId} />
              )}
            </div>
          </div>
        </div>
      </LiveKitRoom>
      {!isHost && (
        <MandatoryRatingDialog
          open={showLeaveRating}
          kind="stream"
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};


/* ---------- Host: mute specific participants via data channel ---------- */
function HostMuteControls() {
  const { language, dir } = useLanguage();
  const isAr = dir === "rtl";
  const room = useRoomContext();
  const remotes = useRemoteParticipants();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const muteOne = useCallback(async (identity: string, name: string) => {
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: "force_mute", target: identity })
      );
      await room.localParticipant.publishData(payload, {
        reliable: true,
        destinationIdentities: [identity],
        topic: "moderation",
      });
      toast({ title: isAr ? "تم كتم المشارك" : "Participant muted", description: name });
    } catch (e: any) {
      toast({ title: isAr ? "تعذر الكتم" : "Mute failed", description: e?.message, variant: "destructive" });
    }
  }, [room, toast, isAr]);

  return (
    <div className="bg-background/90 backdrop-blur border-2 border-primary/30 rounded-xl shadow-lg w-72 max-w-[85vw]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-bold text-sm"
      >
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" strokeWidth={2.5} />
          {isAr ? `المشاركون (${remotes.length})` : `Participants (${remotes.length})`}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="max-h-72 overflow-y-auto border-t border-border">
          {remotes.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">
              {isAr ? "لا يوجد مشاركون بعد" : "No participants yet"}
            </p>
          ) : remotes.map(p => (
            <div key={p.identity} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border last:border-0">
              <span className="text-sm font-semibold truncate flex-1">{p.name || p.identity}</span>
              <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={() => muteOne(p.identity, p.name || p.identity)}>
                <MicOff className="w-3.5 h-3.5" /> {isAr ? "كتم" : "Mute"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Viewer: auto-mute self when host requests ---------- */
function ForceMuteListener() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { toast } = useToast();
  const { language, dir } = useLanguage();
  const isAr = dir === "rtl";

  useEffect(() => {
    const handler = (payload: Uint8Array, _participant: any, _kind: any, topic?: string) => {
      try {
        if (topic && topic !== "moderation") return;
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg?.type === "force_mute" && msg.target === localParticipant.identity) {
          localParticipant.setMicrophoneEnabled(false);
          toast({
            title: isAr ? "تم كتم الميكروفون" : "Microphone muted",
            description: isAr ? "قام المضيف بكتم الميكروفون الخاص بك" : "The host has muted your microphone",
          });
        }
      } catch { /* ignore */ }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, localParticipant, toast, isAr]);

  return null;
}

/* ---------- Viewer: rate the live stream ---------- */
function StreamRating({ streamId }: { streamId: string }) {
  const { language, dir } = useLanguage();
  const isAr = dir === "rtl";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("live_stream_ratings")
        .select("rating, comment")
        .eq("stream_id", streamId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) { setRating(data.rating); setComment(data.comment || ""); setDone(true); }
    })();
  }, [streamId]);

  const submit = async () => {
    if (!rating) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("live_stream_ratings")
      .upsert({ stream_id: streamId, user_id: user.id, rating, comment: comment.trim() || null }, { onConflict: "stream_id,user_id" });
    setSaving(false);
    if (error) {
      toast({ title: isAr ? "تعذر الحفظ" : "Save failed", description: error.message, variant: "destructive" });
    } else {
      setDone(true); setOpen(false);
      toast({ title: isAr ? "شكراً لتقييمك!" : "Thanks for rating!" });
    }
  };

  return (
    <div className="bg-background/90 backdrop-blur border-2 border-primary/30 rounded-xl shadow-lg w-72 max-w-[85vw]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-bold text-sm"
      >
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" fill={done ? "currentColor" : "none"} strokeWidth={2.5} />
          {done
            ? (isAr ? `تقييمك: ${rating}/5` : `Your rating: ${rating}/5`)
            : (isAr ? "قيّم البث" : "Rate stream")}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
                <Star
                  className={`w-7 h-7 transition-transform ${(hover || rating) >= n ? "text-yellow-500 scale-110" : "text-muted-foreground"}`}
                  fill={(hover || rating) >= n ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            placeholder={isAr ? "تعليق (اختياري)" : "Comment (optional)"}
            className="text-sm"
          />
          <Button size="sm" className="w-full font-bold" disabled={!rating || saving} onClick={submit}>
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إرسال التقييم" : "Submit")}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- In-Room Attachments & Handouts Panel ---------- */
function StreamAttachmentsPanel({ streamId }: { streamId: string }) {
  const { dir } = useLanguage();
  const isAr = dir === "rtl";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch course attachments or direct attachments
        const { data } = await supabase
          .from("course_attachments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        if (!cancelled && data) {
          setAttachments(data);
        }
      } catch (err) {
        console.warn("Error fetching stream attachments:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [streamId]);

  const handleDownload = (fileUrl: string, fileName: string) => {
    try {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: isAr ? "جاري تنزيل الملف" : "Downloading file",
        description: fileName,
      });
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="bg-background/90 backdrop-blur border-2 border-indigo-500/30 rounded-xl shadow-lg w-72 max-w-[85vw] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-bold text-sm text-foreground hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-500" strokeWidth={2.5} />
          <span>{isAr ? "الملفات والمرفقات أثناء البث" : "Live Stream Handouts"}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {attachments.length}
          </Badge>
          <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <div className="p-3 border-t border-border space-y-2.5 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {isAr ? "جاري تحميل الملفات..." : "Loading attachments..."}
            </p>
          ) : attachments.length === 0 ? (
            <div className="text-center py-4 space-y-1 text-muted-foreground">
              <FileText className="w-6 h-6 mx-auto opacity-40" />
              <p className="text-xs font-semibold">
                {isAr ? "لا توجد ملفات مرفقة بهذا البث بعد" : "No attached files yet"}
              </p>
            </div>
          ) : (
            attachments.map((att) => (
              <div
                key={att.id}
                className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{att.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {att.file_type || "PDF"}
                    </p>
                  </div>
                </div>

                {att.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(att.file_url, att.name)}
                    className="h-7 px-2 text-xs font-bold gap-1 rounded-lg border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isAr ? "تحميل" : "Get"}</span>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LiveStreamRoom;
