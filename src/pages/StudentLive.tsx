import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentLive = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data } = await supabase.from("live_streams").select("*").in("status", ["live", "scheduled"]).order("scheduled_at", { ascending: true });
    setStreams(data || []);
    setLoading(false);
  })(); }, [navigate]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="البث المباشر" titleEn="Live Streams" icon={<Radio className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="grid gap-4">
          {/* Demo live stream — always visible */}
          <Link to="/student/live/demo-1" className="block">
            <Card className="card-hover border-primary/20">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-100">
                    <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">
                      {isRtl ? "بث تجريبي - شرح مباشر" : "Demo Live Stream - Live Session"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRtl ? "د. أحمد محمد • مادة تجريبية" : "Dr. Ahmed Mohamed • Demo Course"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge className="bg-red-500 text-white gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {isRtl ? "مباشر" : "LIVE"}
                  </Badge>
                  <Button size="sm">{isRtl ? "انضم" : "Join"}</Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {streams.map(stream => (
            <Card key={stream.id} className="card-hover">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stream.status === "live" ? "bg-red-100" : "bg-muted"}`}>
                    <Radio className={`w-6 h-6 ${stream.status === "live" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">{isRtl ? stream.title_ar : stream.title_en}</p>
                    {stream.scheduled_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge className={stream.status === "live" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}>
                    {stream.status === "live" ? (isRtl ? "مباشر" : "LIVE") : (isRtl ? "قادم" : "Upcoming")}
                  </Badge>
                  {stream.status === "live" && (
                    <Link to={`/stream/${stream.id}`}>
                      <Button size="sm">{isRtl ? "انضم" : "Join"}</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentLive;
