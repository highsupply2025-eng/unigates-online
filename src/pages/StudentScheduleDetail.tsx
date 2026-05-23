import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, BookOpen, User, FileText, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import MandatoryRatingDialog from "@/components/MandatoryRatingDialog";
import { hasRated, markRated } from "@/lib/rating-storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StudentScheduleDetail = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRtl = language === "ar";
  const [showRating, setShowRating] = useState(false);
  const alreadyRated = hasRated("schedule", scheduleId);

  const schedule = {
    id: scheduleId || "demo-1",
    titleAr: "محاضرة تجريبية - مقدمة في المادة",
    titleEn: "Demo Lecture - Introduction",
    instructorAr: "د. أحمد محمد",
    instructorEn: "Dr. Ahmed Mohamed",
    courseAr: "مادة تجريبية",
    courseEn: "Demo Course",
    date: "2026-05-05",
    startTime: "10:00",
    endTime: "11:30",
    locationAr: "قاعة افتراضية / أونلاين",
    locationEn: "Virtual Room / Online",
    descAr:
      "هذا جدول تجريبي لعرض شكل صفحة تفاصيل الموعد. تحتوي على بيانات المحاضرة، الموعد، والمكان.",
    descEn:
      "This is a demo schedule entry showcasing the detail layout, including session info, date, and location.",
  };

  const requestBack = () => {
    if (alreadyRated) navigate("/student/schedules");
    else setShowRating(true);
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="الجداول"
        titleEn="Schedules"
        icon={<Calendar className="w-3.5 h-3.5" />}
        backTo="/student/schedules"
        backLabelAr="رجوع للجداول"
        backLabelEn="Back to Schedules"
        onBackClick={requestBack}
      />
      <MandatoryRatingDialog
        open={showRating}
        kind="schedule"
        onSubmit={async (rating, comment) => {
          try {
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth.user?.id;
            if (uid && scheduleId) {
              await supabase.from("schedule_ratings").insert({
                schedule_id: scheduleId,
                user_id: uid,
                rating,
                comment: comment || null,
              });
            }
          } catch (e) {
            console.warn("schedule rating insert failed", e);
          }
          markRated("schedule", scheduleId);
          toast({
            title: isRtl ? "شكراً لتقييمك!" : "Thanks for rating!",
            description: isRtl ? `تقييمك: ${rating}/5` : `Your rating: ${rating}/5`,
          });
          setShowRating(false);
          navigate("/student/schedules");
        }}
      />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 sm:p-6 text-white">
            <Badge className="bg-white/20 text-white border-white/30 mb-2 gap-1.5">
              <BookOpen className="w-3 h-3" />
              {isRtl ? "محاضرة" : "Lecture"}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold">
              {isRtl ? schedule.titleAr : schedule.titleEn}
            </h1>
            <p className="text-sm text-white/90 mt-1">
              {isRtl ? schedule.courseAr : schedule.courseEn}
            </p>
          </div>
          <CardContent className="p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">{schedule.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">
                  {schedule.startTime} - {schedule.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">
                  {isRtl ? schedule.instructorAr : schedule.instructorEn}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">
                  {isRtl ? schedule.locationAr : schedule.locationEn}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {isRtl ? "التفاصيل" : "Details"}
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {isRtl ? schedule.descAr : schedule.descEn}
            </p>
          </CardContent>
        </Card>

        {!alreadyRated && (
          <div className="flex justify-center">
            <Button onClick={() => setShowRating(true)} size="lg" className="gap-2">
              <Star className="w-5 h-5" />
              {isRtl ? "قيّم هذا الجدول" : "Rate this schedule"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentScheduleDetail;
