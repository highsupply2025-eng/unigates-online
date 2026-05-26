import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Radio, ArrowLeft, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import HlsPlayer from "@/components/HlsPlayer";

type PublicStream = {
  id: string;
  title: string;
  description: string | null;
  playback_hls_url: string | null;
  status: string;
  started_at: string | null;
};

const WatchCloudflareStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const [stream, setStream] = useState<PublicStream | null>(null);
  const [loading, setLoading] = useState(true);

  const isAr = language === "ar";
  const tx = {
    live: isAr ? "مباشر الآن" : "Live Now",
    idle: isAr ? "لم يبدأ بعد" : "Not started yet",
    ended: isAr ? "انتهى البث" : "Stream ended",
    notFound: isAr ? "البث غير موجود" : "Stream not found",
    waiting: isAr ? "بانتظار بدء المحاضر للبث..." : "Waiting for lecturer to start streaming...",
    back: isAr ? "رجوع" : "Back",
  };

  const load = async () => {
    if (!streamId) return;
    const { data } = await (supabase as any)
      .from("cloudflare_live_streams_public")
      .select("id,title,description,playback_hls_url,status,started_at")
      .eq("id", streamId)
      .maybeSingle();
    setStream((data as unknown) as PublicStream | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [streamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={dir}>
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir={dir}>
        <Radio className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-foreground font-bold">{tx.notFound}</p>
        <Button onClick={() => navigate(-1)}>{tx.back}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
            <h1 className="text-lg md:text-xl font-black text-foreground truncate">{stream.title}</h1>
          </div>
          {stream.status === "live" ? (
            <Badge variant="destructive" className="gap-1.5 animate-pulse">
              <Radio className="w-3 h-3" /> {tx.live}
            </Badge>
          ) : stream.status === "ended" ? (
            <Badge variant="secondary">{tx.ended}</Badge>
          ) : (
            <Badge variant="outline">{tx.idle}</Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4 relative">
          {stream.status === "live" && stream.playback_hls_url ? (
            <HlsPlayer src={stream.playback_hls_url} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
              <Radio className="w-16 h-16 opacity-50" />
              <p className="text-lg font-bold">
                {stream.status === "ended" ? tx.ended : tx.waiting}
              </p>
            </div>
          )}
        </div>
        {stream.description && (
          <p className="text-muted-foreground leading-relaxed">{stream.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
          <Users className="w-4 h-4" />
          <span>{isAr ? "بث عالي الجودة عبر شبكة CDN عالمية" : "HD stream powered by global CDN"}</span>
        </div>
      </main>
    </div>
  );
};

export default WatchCloudflareStream;
