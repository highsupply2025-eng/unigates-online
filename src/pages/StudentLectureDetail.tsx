import { useParams, Link } from "react-router-dom";
import { BookOpen, Play, ArrowLeft, ArrowRight, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentLectureDetail = () => {
  const { lectureId } = useParams();
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const lecture = {
    id: lectureId || "demo-1",
    titleAr: "محاضرة تجريبية - مقدمة في المادة",
    titleEn: "Demo Lecture - Introduction",
    instructorAr: "د. أحمد محمد",
    instructorEn: "Dr. Ahmed Mohamed",
    duration: "45:20",
    descAr:
      "هذه محاضرة تجريبية لعرض شكل صفحة المحاضرة. تحتوي على فيديو الشرح والمواد المرفقة والملاحظات.",
    descEn:
      "This is a demo lecture to showcase the lecture page layout, including the video, attached materials, and notes.",
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="المحاضرات"
        titleEn="Lectures"
        icon={<BookOpen className="w-3.5 h-3.5" />}
        backTo="/student/lectures"
        backLabelAr="رجوع للمحاضرات"
        backLabelEn="Back to Lectures"
      />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        <Card className="overflow-hidden mb-5">
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black/30" />
            <Button size="lg" className="relative z-10 gap-2 rounded-full h-16 w-16 p-0">
              <Play className="w-7 h-7" />
            </Button>
          </div>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isRtl ? lecture.titleAr : lecture.titleEn}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRtl ? lecture.instructorAr : lecture.instructorEn}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <Clock className="w-3 h-3" />
                {lecture.duration}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {isRtl ? lecture.descAr : lecture.descEn}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {isRtl ? "المرفقات" : "Attachments"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRtl ? "لا توجد مرفقات حالياً" : "No attachments yet"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentLectureDetail;
