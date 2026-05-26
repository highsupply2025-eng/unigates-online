import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import LiveStreamRoom from "@/components/LiveStreamRoom";

const WatchStream = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { language, dir, toggleLanguage, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);

      if (streamId) {
        const { data } = await supabase
          .from("live_streams")
          .select("*")
          .eq("id", streamId)
          .single();

        // Do not open this page when the stream is missing or has already ended
        if (!data || data.status === "ended") {
          navigate(-1);
          return;
        }
        setStream(data);
      }
      setLoading(false);
    };
    init();
  }, [streamId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {language === "ar" ? "البث غير موجود" : "Stream not found"}
          </h2>
          <Button onClick={() => navigate("/courses")}>
            {language === "ar" ? "العودة للدورات" : "Back to Courses"}
          </Button>
        </div>
      </div>
    );
  }

  if (stream.status !== "live" && !joined) {
    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
          </div>
        </header>
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 73px)" }}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {language === "ar" ? stream.title_ar : stream.title_en}
            </h2>
            <p className="text-muted-foreground mb-6">
              {stream.status === "scheduled"
                ? (language === "ar" ? "هذا البث لم يبدأ بعد. يرجى العودة في الموعد المحدد." : "This stream hasn't started yet. Please come back at the scheduled time.")
                : (language === "ar" ? "هذا البث قد انتهى." : "This stream has ended.")}
            </p>
            {stream.scheduled_at && stream.status === "scheduled" && (
              <p className="text-sm text-muted-foreground mb-4">
                {language === "ar" ? "الموعد: " : "Scheduled: "}
                {new Date(stream.scheduled_at).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
              </p>
            )}
            <Button onClick={() => navigate("/courses")}>
              {language === "ar" ? "العودة للدورات" : "Back to Courses"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (joined && user) {
    return (
      <LiveStreamRoom
        streamId={streamId!}
        streamTitle={language === "ar" ? stream.title_ar : stream.title_en}
        isHost={false}
        participantName={user.email?.split("@")[0] || "student"}
        onClose={() => {
          setJoined(false);
          navigate("/courses");
        }}
      />
    );
  }

  // Stream is live, show join button
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
            <Globe className="w-4 h-4" />{t.langSwitch}
          </Button>
        </div>
      </header>
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 73px)" }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {language === "ar" ? stream.title_ar : stream.title_en}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "ar" ? "البث المباشر جارٍ الآن! انضم للمشاهدة والتفاعل." : "The live stream is happening now! Join to watch and interact."}
          </p>
          <Button size="lg" onClick={() => setJoined(true)} className="gap-2 text-lg px-8">
            {language === "ar" ? "انضم للبث المباشر" : "Join Live Stream"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WatchStream;
