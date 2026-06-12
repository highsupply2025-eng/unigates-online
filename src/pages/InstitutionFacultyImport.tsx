import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const InstitutionFacultyImport = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-500/5">
      <header className="border-b bg-gradient-to-l from-emerald-500/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="truncate">{isRtl ? "رفع ملف Excel" : "Upload Excel File"}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-md shrink-0" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2 border-emerald-500/20 max-w-3xl mx-auto">
          <CardContent className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-10 h-10 text-white" strokeWidth={2.4} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">{isRtl ? "رفع ملف Excel" : "Upload Excel File"}</h2>
            <p className="text-muted-foreground">
              {isRtl ? "صفحة مخصصة لاستيراد بيانات الأعضاء من ملف Excel." : "Dedicated page for importing members from an Excel file."}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
