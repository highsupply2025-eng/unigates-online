import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";

import { Star, MessageSquare, Sparkles } from "lucide-react";
import { StudentLiveRatingModal } from "@/components/StudentLiveRatingModal";

const StudentLive = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<any[]>([]);
  const [streamRatings, setStreamRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedStreamForRating, setSelectedStreamForRating] = useState<any | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    
    const [streamsRes, ratingsRes] = await Promise.all([
      supabase.from("live_streams").select("*").in("status", ["live", "scheduled"]).order("scheduled_at", { ascending: true }),
      supabase.from("live_stream_ratings").select("stream_id, user_id, rating"),
    ]);

    const sList = streamsRes.data || [];
    setStreams(sList);

    // Calculate average ratings and map user ratings
    const ratingsMap: Record<string, { total: number; count: number }> = {};
    const userMap: Record<string, number> = {};

    (ratingsRes.data || []).forEach((r: any) => {
      if (r.user_id === user.id) {
        userMap[r.stream_id] = r.rating;
      }
      if (!ratingsMap[r.stream_id]) {
        ratingsMap[r.stream_id] = { total: 0, count: 0 };
      }
      ratingsMap[r.stream_id].total += r.rating;
      ratingsMap[r.stream_id].count += 1;
    });

    const calculated: Record<string, { avg: number; count: number }> = {};
    Object.keys(ratingsMap).forEach((sId) => {
      calculated[sId] = {
        avg: Number((ratingsMap[sId].total / ratingsMap[sId].count).toFixed(1)),
        count: ratingsMap[sId].count,
      };
    });

    setStreamRatings(calculated);
    setMyRatings(userMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, [navigate]);

  useRealtimeRefresh(["live_streams"], load);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="البث المباشر" titleEn="Live Streams" icon={<Radio className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <StudentHero
          titleAr="البث المباشر"
          titleEn="Live Streams"
          subtitleAr="انضم لمحاضراتك المباشرة الآن"
          subtitleEn="Join your live lectures now"
          Icon={Radio}
          gradient="from-red-500 via-rose-600 to-pink-700"
          shadow="shadow-rose-500/30"
        />
        <div className="grid gap-4">
          {/* Demo live stream — always visible */}
          <Link to="/student/live/demo-1" className="block">
            <Card className="border-s-4 border-s-red-500 bg-gradient-to-l from-red-500/5 to-transparent hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30">
                    <Radio className="w-6 h-6 text-white animate-pulse" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground tracking-tight">
                      {isRtl ? "بث تجريبي - شرح مباشر" : "Demo Live Stream - Live Session"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {isRtl ? "د. أحمد محمد • مادة تجريبية" : "Dr. Ahmed Mohamed • Demo Course"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white gap-1 shadow-md shadow-red-500/30 border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {isRtl ? "مباشر" : "LIVE"}
                  </Badge>
                  <Button size="sm" className="shadow-md">{isRtl ? "انضم" : "Join"}</Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {streams.map((stream) => {
            const ratingData = streamRatings[stream.id];
            const myRating = myRatings[stream.id];

            return (
              <Card
                key={stream.id}
                className={`border-s-4 hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                  stream.status === "live"
                    ? "border-s-red-500 bg-gradient-to-l from-red-500/5 to-transparent"
                    : "border-s-muted-foreground/30"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                        stream.status === "live"
                          ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30"
                          : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-400/20"
                      }`}
                    >
                      <Radio
                        className={`w-6 h-6 text-white ${stream.status === "live" ? "animate-pulse" : ""}`}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-foreground tracking-tight">
                        {isRtl ? stream.title_ar : stream.title_en}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {stream.scheduled_at && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                          </p>
                        )}
                        {ratingData && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{ratingData.avg} ({ratingData.count})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStreamForRating(stream);
                        setRatingModalOpen(true);
                      }}
                      className="font-bold text-xs gap-1.5 h-8 rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{myRating ? (isRtl ? `تعديل تقييمك (${myRating}⭐)` : `Edit Rating (${myRating}⭐)`) : (isRtl ? "⭐ تقييم البث والمرفقات" : "Rate Stream")}</span>
                    </Button>

                    <Badge
                      className={
                        stream.status === "live"
                          ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-md shadow-red-500/30"
                          : "bg-muted text-muted-foreground border-0"
                      }
                    >
                      {stream.status === "live" ? (isRtl ? "مباشر" : "LIVE") : (isRtl ? "قادم" : "Upcoming")}
                    </Badge>

                    {stream.status === "live" && (
                      <Link to={`/stream/${stream.id}`}>
                        <Button size="sm" className="font-bold">{isRtl ? "انضم للبث" : "Join Stream"}</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {selectedStreamForRating && (
        <StudentLiveRatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          streamId={selectedStreamForRating.id}
          streamTitle={isRtl ? selectedStreamForRating.title_ar : selectedStreamForRating.title_en}
          instructorName={isRtl ? selectedStreamForRating.instructor_ar : selectedStreamForRating.instructor_en}
          onRated={load}
        />
      )}
    </div>
  );
};

export default StudentLive;
