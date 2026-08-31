import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatSeconds } from "./types";

interface VoiceRecorderProps {
  onSendVoice: (url: string, duration: number) => Promise<void>;
  onCancel: () => void;
  isRtl?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  isRtl = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      toast({
        title: isRtl ? "تعذر الوصول للميكروفون" : "Microphone Access Denied",
        description: isRtl
          ? "يرجى منح الإذن للوصول إلى الميكروفون لتسجيل الرسائل الصوتية"
          : "Please enable microphone permissions in your browser settings",
        variant: "destructive",
      });
      onCancel();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    onCancel();
  };

  const handleFinishAndSend = async () => {
    if (!mediaRecorderRef.current || seconds < 1) {
      handleCancel();
      return;
    }

    setUploading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        // Try upload to Supabase storage bucket `course-content` or `user-documents`
        const filename = `voice_notes/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
        let voiceUrl = "";

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("course-content")
          .upload(filename, audioBlob, { contentType: audioBlob.type, upsert: true });

        if (!uploadErr && uploadData) {
          const { data: pubUrl } = supabase.storage
            .from("course-content")
            .getPublicUrl(filename);
          voiceUrl = pubUrl.publicUrl;
        } else {
          // Fallback: convert to base64 Data URL so voice messages never fail
          voiceUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(audioBlob);
          });
        }

        await onSendVoice(voiceUrl, seconds);
      } catch (err: any) {
        console.error("Failed to send voice note:", err);
        toast({
          title: isRtl ? "فشل إرسال التسجيل" : "Failed to send voice note",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        stopTracks();
        setUploading(false);
        onCancel();
      }
    };

    recorder.stop();
  };

  return (
    <div
      className="flex items-center justify-between gap-3 w-full bg-slate-900/90 dark:bg-slate-950 border border-teal-500/30 rounded-2xl p-2 px-4 shadow-lg backdrop-blur-xl animate-fade-in"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Recording status & timer */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
        </span>
        <span className="font-mono font-black text-sm text-white">
          {formatSeconds(seconds)}
        </span>
        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
          {isRtl ? "جاري تسجيل رسالة صوتية..." : "Recording voice note..."}
        </span>
      </div>

      {/* Wave animation simulation */}
      <div className="flex-1 max-w-[160px] flex items-center justify-center gap-1 h-5 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="w-1 bg-teal-400 rounded-full animate-pulse"
            style={{
              height: `${Math.max(4, ((i * 7) % 20) + 4)}px`,
              animationDuration: `${0.4 + (i % 5) * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={uploading}
          className="h-9 w-9 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
          title={isRtl ? "إلغاء وحذف التسجيل" : "Discard"}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          onClick={handleFinishAndSend}
          disabled={uploading || seconds < 1}
          className="h-9 px-4 gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-teal-500/20"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{isRtl ? "إرسال" : "Send"}</span>
        </Button>
      </div>
    </div>
  );
};
