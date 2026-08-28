import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Radio, User, Calendar, Users, MessageSquare, Play, Star, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import StudentPageHeader from "@/components/StudentPageHeader";
import { StudentLiveRatingModal } from "@/components/StudentLiveRatingModal";

const StudentLiveDetail = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const loadStreamData = async () => {
    if (!streamId || streamId.startsWith("demo-")) {
      // Demo stream fallback
      setStream({
        id: streamId || "demo-1",
        title_ar: "بث تجريبي - شرح مباشر",
        title_en: "Demo Live Stream - Live Session",
        instructor_ar: "د. أحمد محمد",
        instructor_en: "Dr. Ahmed Mohamed",
        category_ar: "مادة تجريبية",
        category_en: "Demo Course",
        scheduled_at: "2026-05-05 10:00",
        status: "live",
      });
      setAvgRating(4.9);
      setRatings([
        { id: "1", rating: 5, comment: "شرح رائع جداً وممتع", created_at: new Date().toISOString() },
        { id: "2", rating: 5, comment: "وضوح عالي في الصوت والصورة والملفات المرفقة", created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const [streamRes, ratingsRes] = await Promise.all([
        supabase.from("live_streams").select("*").eq("id", streamId).maybeSingle(),
        supabase.from("live_stream_ratings").select("*").eq("stream_id", streamId).order("created_at", { ascending: false }),
      ]);

      if (streamRes.data) {
        setStream(streamRes.data);
      }
      const rList = ratingsRes.data || [];
      setRatings(rList);

      if (rList.length > 0) {
        const total = rList.reduce((acc: number, cur: any) => acc + cur.rating, 0);
        setAvgRating(Number((total / rList.length).toFixed(1)));
      }

      if (auth.user) {
        const mine = rList.find((r: any) => r.user_id === auth.user.id);
        if (mine) setUserRating(mine.rating);
      }
    } catch (err) {
      console.warn("Load stream detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreamData();
  }, [streamId]);

  const joinStream = () => {
    if (stream?.id) {
      navigate(`/stream/${stream.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = isRtl ? stream?.title_ar || stream?.title_en : stream?.title_en || stream?.title_ar;
  const instructor = isRtl ? stream?.instructor_ar || stream?.instructor_en : stream?.instructor_en || stream?.instructor_ar;
  const category = isRtl ? stream?.category_ar || stream?.category_en : stream?.category_en || stream?.category_ar;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="تفاصيل البث المباشر"
        titleEn="Live Stream Details"
        icon={<Radio className="w-3.5 h-3.5" />}
        backTo="/student/live"
        backLabelAr="رجوع للبث"
        backLabelEn="Back to Live"
      />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-6">
        {/* Stream Hero Banner */}
        <Card className="overflow-hidden rounded-3xl border-2 border-border shadow-xl bg-card">
          <button
            type="button"
            onClick={joinStream}
            className="block w-full aspect-video sm:aspect-21/9 bg-gradient-to-br from-red-600 via-rose-600 to-indigo-900 relative group cursor-pointer"
            aria-label={isRtl ? "انضم للبث" : "Join Stream"}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
            <div className="relative z-10 flex flex-col items-center gap-3 h-full justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-red-500/60 ring-4 ring-white/30 animate-pulse group-hover:scale-110 transition-transform text-white">
                <Play className="w-10 h-10 fill-white ml-1" />
              </div>
              <Badge className="bg-red-600 text-white border-0 gap-1.5 px-4 py-1.5 text-sm font-bold ring-2 ring-red-500/40 shadow-lg shadow-red-500/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {stream?.status === "live" ? (isRtl ? "مباشر الآن 🔴" : "LIVE NOW 🔴") : (isRtl ? "بث مجدول 📅" : "SCHEDULED 📅")}
              </Badge>
            </div>
          </button>

          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-bold text-xs bg-muted/60">
                    {category || (isRtl ? "عام" : "General")}
                  </Badge>
                  {avgRating > 0 && (
                    <Badge className="bg-amber-500 text-white font-black gap-1 text-xs shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span>{avgRating} / 5</span>
                      <span className="opacity-90">({ratings.length} {isRtl ? "تقييم" : "reviews"})</span>
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRatingModalOpen(true)}
                  className="font-bold text-xs gap-1.5 h-11 px-4 rounded-2xl border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shadow-sm"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{userRating ? (isRtl ? `تعديل تقييمك (${userRating}⭐)` : `Edit Rating (${userRating}⭐)`) : (isRtl ? "⭐ تقييم البث والمرفقات" : "Rate Stream")}</span>
                </Button>

                <Button
                  size="lg"
                  onClick={joinStream}
                  className="gap-2 text-base font-black h-11 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl shadow-red-500/25"
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>{isRtl ? "دخول البث والتفاعل" : "Join Stream & Chat"}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">{isRtl ? "المحاضر / مقدم البث" : "Presenter"}</p>
                  <p className="text-sm font-black text-foreground">{instructor || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground">{isRtl ? "موعد البث" : "Scheduled Time"}</p>
                  <p className="text-sm font-black text-foreground">
                    {stream?.scheduled_at ? new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US") : "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Reviews & Ratings Section */}
        <Card className="rounded-3xl border-2 border-border shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {isRtl ? "تقييمات وآراء الطلاب على هذا البث" : "Student Ratings & Feedback"}
              </h2>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setRatingModalOpen(true)}
              className="text-xs font-bold gap-1.5 rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-300"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{isRtl ? "أضف تقييمك" : "Add Review"}</span>
            </Button>
          </div>

          {ratings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <Star className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="text-xs font-bold">
                {isRtl ? "كن أول من يقيّم هذا البث المباشر والملفات المرفقة!" : "Be the first to rate this live stream!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {ratings.map((r: any) => (
                <div key={r.id} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                    </span>
                  </div>

                  {r.comment ? (
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {isRtl ? "تقييم بالنجوم بدون تعليق" : "Star rating without comment"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {stream && (
        <StudentLiveRatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          streamId={stream.id}
          streamTitle={title}
          instructorName={instructor}
          onRated={loadStreamData}
        />
      )}
    </div>
  );
};

export default StudentLiveDetail;
