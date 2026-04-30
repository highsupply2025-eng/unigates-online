import { useParams } from "react-router-dom";
import { Radio, User, Calendar, Users, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentLiveDetail = () => {
  const { streamId } = useParams();
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
          <div className="aspect-video bg-gradient-to-br from-red-500/30 via-rose-500/20 to-background flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/50 animate-pulse">
                <Radio className="w-10 h-10 text-white" />
              </div>
              <Badge className="bg-red-500 text-white border-0 gap-1.5 px-3 py-1 text-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isRtl ? "مباشر الآن" : "LIVE NOW"}
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isRtl ? stream.titleAr : stream.titleEn}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRtl ? stream.courseAr : stream.courseEn}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <Users className="w-3 h-3" />
                {stream.viewers}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">
                  {isRtl ? stream.instructorAr : stream.instructorEn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">{stream.scheduledAt}</span>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mt-4">
              {isRtl ? stream.descAr : stream.descEn}
            </p>
            <Button className="w-full sm:w-auto mt-4 gap-2 bg-red-500 hover:bg-red-600 text-white">
              <Radio className="w-4 h-4" />
              {isRtl ? "انضم للبث" : "Join Stream"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
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
