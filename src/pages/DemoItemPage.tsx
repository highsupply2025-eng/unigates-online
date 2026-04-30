import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Standalone "demo item" page used by the leadership/institution dashboards.
 * - Back button on the LEFT
 * - Download icon on the RIGHT
 * - Title in the middle (localized via :section param)
 */
const SECTIONS: Record<string, { ar: string; en: string; description_ar: string; description_en: string }> = {
  livestreams:   { ar: "البث المباشر",        en: "Live Streams",      description_ar: "تفاصيل عنصر بث مباشر تجريبي.",       description_en: "Sample live stream item details." },
  quizresults:   { ar: "نتائج الاختبارات",    en: "Quiz Results",      description_ar: "تفاصيل نتيجة اختبار تجريبية.",        description_en: "Sample quiz result details." },
  ratings:       { ar: "تقييمات المحاضرين",  en: "Lecturer Ratings",  description_ar: "تفاصيل تقييم محاضر تجريبي.",          description_en: "Sample lecturer rating details." },
  assignments:   { ar: "التكليفات",            en: "Assignments",       description_ar: "تفاصيل تكليف تجريبي.",                 description_en: "Sample assignment details." },
  schedule:      { ar: "الجداول",              en: "Schedules",         description_ar: "تفاصيل عنصر مجدول تجريبي.",           description_en: "Sample scheduled item details." },
  files:         { ar: "الملفات",              en: "Files",             description_ar: "تفاصيل ملف تجريبي.",                   description_en: "Sample file details." },
  approvals:     { ar: "اعتماد النتائج",      en: "Approvals",         description_ar: "تفاصيل عنصر اعتماد نتائج تجريبي.",     description_en: "Sample approval item details." },
  departments:   { ar: "الأقسام",              en: "Departments",       description_ar: "تفاصيل قسم تجريبي.",                   description_en: "Sample department details." },
  lecturers:     { ar: "المحاضرون",            en: "Lecturers",         description_ar: "تفاصيل محاضر تجريبي.",                description_en: "Sample lecturer details." },
  students:      { ar: "الطلاب",                en: "Students",          description_ar: "تفاصيل طالب تجريبي.",                  description_en: "Sample student details." },
};

const DemoItemPage = () => {
  const { section = "livestreams" } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const { toast } = useToast();
  const isRtl = language === "ar";

  const meta = SECTIONS[section] || SECTIONS.livestreams;
  const title = isRtl ? meta.ar : meta.en;
  const description = isRtl ? meta.description_ar : meta.description_en;

  const handleDownload = () => {
    // Generate a tiny demo text file so the action is real, not just decorative.
    const blob = new Blob(
      [
        `${title}\n\n${description}\n\n${isRtl ? "تم إنشاء هذا الملف للعرض التجريبي." : "This file was generated for demo purposes."}`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section}-demo.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: isRtl ? "تم بدء التحميل" : "Download started",
      description: isRtl ? "تم تنزيل ملف تجريبي." : "A demo file has been downloaded.",
    });
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top bar: back (LEFT), title (center/right), download (RIGHT) */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Back — always physically on the LEFT of the screen */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5"
            aria-label={isRtl ? "رجوع" : "Back"}
          >
            <BackIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "رجوع" : "Back"}</span>
          </Button>

          {/* Title — pinned to the right side in RTL, left in LTR (matches request: "عنوان الصفحة الفرعية إلى اليمين") */}
          <h1 className={`text-base sm:text-xl font-bold text-foreground truncate flex-1 ${isRtl ? "text-right" : "text-left"}`}>
            {title}
          </h1>

          {/* Download — always physically on the RIGHT of the screen */}
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5"
            aria-label={isRtl ? "تحميل ملف" : "Download file"}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "تحميل" : "Download"}</span>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRtl ? "عنصر تجريبي" : "Demo item"}
                </p>
              </div>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
              {description}
            </p>
            <div className={`pt-4 border-t border-border text-xs text-muted-foreground ${isRtl ? "text-right" : "text-left"}`}>
              {isRtl
                ? "هذه صفحة مستقلة لعرض تفاصيل العنصر. استخدم زر الرجوع للعودة، وأيقونة التحميل لتنزيل الملف."
                : "This is a standalone item details page. Use Back to return and the download icon to fetch the file."}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DemoItemPage;
