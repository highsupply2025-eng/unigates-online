import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const InstitutionFacultyAdd = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
              <UserPlus className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="truncate">{isRtl ? "إضافة عضو يدويًا" : "Add Member Manually"}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-md shrink-0" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2 border-primary/20 max-w-3xl mx-auto">
          <CardContent className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <UserPlus className="w-10 h-10 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">{isRtl ? "إضافة عضو يدويًا" : "Add Member Manually"}</h2>
            <p className="text-muted-foreground">
              {isRtl ? "صفحة مخصصة لإضافة أعضاء هيئة التدريس يدويًا." : "Dedicated page for adding faculty members manually."}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyAdd;
