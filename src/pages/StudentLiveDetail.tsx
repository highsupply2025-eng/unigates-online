import { useParams, useNavigate } from "react-router-dom";
import { Radio, User, Calendar, Users, MessageSquare, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentLiveDetail = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const stream = {
    id: streamId || "demo-1",
    titleAr: "بث تجريبي - شرح مباشر",
    titleEn: "Demo Live Stream - Live Session",
    instructorAr: "د. أحمد محمد",
    instructorEn: "Dr. Ahmed Mohamed",
    courseAr: "مادة تجريبية",
    courseEn: "Demo Course",
    scheduledAt: "2026-05-05 10:00",
    viewers: 128,
    descAr:
      "هذا بث تجريبي لعرض شكل صفحة البث المباشر. تحتوي على مشغل البث وبيانات الجلسة وقسم للدردشة.",
    descEn:
      "Demo live stream showcasing the live page layout, including the player, session info, and chat section.",
  };

  const joinStream = () => {
    navigate(`/stream/${stream.id}`);
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="البث المباشر"
        titleEn="Live Streams"
        icon={<Radio className="w-3.5 h-3.5" />}
        backTo="/student/live"
        backLabelAr="رجوع للبث"
        backLabelEn="Back to Live"
      />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={joinStream}
            className="block w-full aspect-video bg-gradient-to-br from-red-500/30 via-rose-500/20 to-background relative group cursor-pointer"
            aria-label={isRtl ? "انضم للبث" : "Join Stream"}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
            <div className="relative z-10 flex flex-col items-center gap-3 h-full justify-center">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/60 ring-4 ring-red-500/30 animate-pulse group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
              <Badge className="bg-red-500 text-white border-0 gap-1.5 px-4 py-1.5 text-sm font-bold ring-2 ring-red-500/40 shadow-lg shadow-red-500/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isRtl ? "مباشر الآن" : "LIVE NOW"}
              </Badge>
            </div>
          </button>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {isRtl ? stream.titleAr : stream.titleEn}
                </h1>
                <div className="h-1 w-16 mt-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  {isRtl ? stream.courseAr : stream.courseEn}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
                <Users className="w-3.5 h-3.5" />
                {stream.viewers}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-foreground text-base font-semibold">
                  {isRtl ? stream.instructorAr : stream.instructorEn}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-foreground text-base font-semibold">{stream.scheduledAt}</span>
              </div>
            </div>
            <p className="text-base text-foreground/85 leading-relaxed mt-4">
              {isRtl ? stream.descAr : stream.descEn}
            </p>
            <Button
              size="lg"
              onClick={joinStream}
              className="w-full sm:w-auto mt-5 gap-2 text-base font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.02] transition-all"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              {isRtl ? "انضم للبث" : "Join Stream"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-foreground text-lg mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              {isRtl ? "الدردشة" : "Chat"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRtl ? "الدردشة ستتاح عند الانضمام للبث" : "Chat will be available once you join the stream"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentLiveDetail;
