import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, ArrowRight, Globe, Radio, User, Calendar, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import LiveStreamRoom from "@/components/LiveStreamRoom";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const WatchStream = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { language, dir, toggleLanguage, t } = useLanguage();
  const isRtl = dir === "rtl";
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUser(user);

      const [streamRes, profRes] = await Promise.all([
        streamId ? supabase.from("live_streams").select("*").eq("id", streamId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      if (profRes.data) {
        setProfile(profRes.data);
      }

      if (streamRes.data) {
        setStream(streamRes.data);
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
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground">
            {isRtl ? "البث غير موجود أو تم إنهاؤه" : "Stream not found or ended"}
          </h2>
          <Button onClick={() => navigate(-1)} className="rounded-2xl font-bold">
            {isRtl ? "الرجوع للصفحة السابقة" : "Go Back"}
          </Button>
        </div>
      </div>
    );
  }

  const participantDisplayName = (() => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.role === "dean") return isRtl ? "أ.د. عميد الكلية" : "Dean";
    if (profile?.role?.startsWith("vice_dean")) return isRtl ? "أ.د. وكيل الكلية" : "Vice Dean";
    return user?.email?.split("@")[0] || "Student";
  })();

  if (joined && user) {
    return (
      <LiveStreamRoom
        streamId={streamId!}
        streamTitle={isRtl ? stream.title_ar || stream.title_en : stream.title_en || stream.title_ar}
        isHost={stream.creator_id === user.id}
        participantName={participantDisplayName}
        onClose={() => {
          setJoined(false);
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/courses");
          }
        }}
      />
    );
  }

  // Pre-join landing view
  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border/80 px-4 sm:px-6 py-4 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelectorDropdown className="hidden sm:flex border-border/80 text-foreground bg-muted/40 hover:bg-muted" />
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="font-bold rounded-xl gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-card rounded-3xl border-2 border-border shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-red-500/20">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge className="bg-red-600 text-white font-black px-3 py-1 text-xs gap-1.5 shadow-md shadow-red-500/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {stream.status === "live"
                  ? (isRtl ? "مباشر الآن 🔴" : "LIVE NOW 🔴")
                  : stream.status === "scheduled"
                    ? (isRtl ? "بث مجدول 📅" : "SCHEDULED 📅")
                    : (isRtl ? "بث مسجل 👁️" : "RECORDED 👁️")}
              </Badge>
              {stream.category_ar && (
                <Badge variant="outline" className="text-xs font-bold bg-muted/40">
                  {isRtl ? stream.category_ar : stream.category_en}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight pt-2">
              {isRtl ? stream.title_ar || stream.title_en : stream.title_en || stream.title_ar}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
              {stream.instructor_ar ? (isRtl ? `مقدم البث: ${stream.instructor_ar}` : `Presenter: ${stream.instructor_en || stream.instructor_ar}`) : ""}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isRtl
                ? "يمكنك فتح وغلق الميكروفون بحرية، والتحدث صوتياً حتى مع غلق الشاشة، والتفاعل بالشات والتقييم."
                : "Join with mic toggle, audio-only speaking mode, live chat, and instant stream rating."}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => setJoined(true)}
              className="w-full sm:w-auto px-8 h-12 text-base font-black rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white shadow-xl shadow-red-600/30 gap-2"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>{isRtl ? "دخول البث المباشر فوراً والتفاعل" : "Enter Live Stream Now"}</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto h-12 font-bold rounded-2xl border-2"
            >
              {isRtl ? "الرجوع" : "Go Back"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchStream;
