import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, ArrowRight, Download, Upload } from "lucide-react";
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
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? "حمّل القالب الجاهز، عبّئ بيانات الأعضاء، ثم ارفع الملف."
                : "Download the template, fill in member data, then upload the file."}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              <a href="/templates/faculty_members_template.xlsx" download>
                <Button size="lg" className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Download className="w-5 h-5" />
                  {isRtl ? "تحميل قالب Excel" : "Download Excel Template"}
                </Button>
              </a>
              <Button size="lg" variant="outline" className="w-full gap-2 border-2 border-emerald-500/40" disabled>
                <Upload className="w-5 h-5" />
                {isRtl ? "رفع الملف (قريبًا)" : "Upload File (Soon)"}
              </Button>
            </div>

            <div className="mt-8 text-start bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm">
              <h3 className="font-bold mb-2 text-emerald-700 dark:text-emerald-400">
                {isRtl ? "الحقول المتوفرة في القالب:" : "Template Fields:"}
              </h3>
              <ul className="grid sm:grid-cols-2 gap-1 text-muted-foreground list-disc ps-5">
                <li>{isRtl ? "الاسم الكامل" : "Full Name"}</li>
                <li>{isRtl ? "الوظيفة (قائمة)" : "Role (list)"}</li>
                <li>{isRtl ? "القسم" : "Department"}</li>
                <li>{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</li>
                <li>{isRtl ? "النوع" : "Gender"}</li>
                <li>{isRtl ? "الرقم القومي" : "National ID"}</li>
                <li>{isRtl ? "البريد الإلكتروني" : "Email"}</li>
                <li>{isRtl ? "رقم الهاتف" : "Phone"}</li>
                <li>{isRtl ? "العنوان" : "Address"}</li>
                <li>{isRtl ? "المؤهل العلمي" : "Qualification"}</li>
                <li>{isRtl ? "التخصص" : "Specialization"}</li>
                <li>{isRtl ? "تاريخ التعيين" : "Hire Date"}</li>
                <li>{isRtl ? "ملاحظات" : "Notes"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
