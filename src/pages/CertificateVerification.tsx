import React, { useState } from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Award,
  CheckCircle2,
  Search,
  ShieldCheck,
  QrCode,
  Lock,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileBadge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CertificateVerification() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  const { toast } = useToast();

  const [certCode, setCertCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCode.trim()) {
      toast({
        title: isAr ? "يرجى إدخال رقم الشهادة" : "Please enter a certificate code",
        variant: "destructive"
      });
      return;
    }

    setSearched(true);
    // Demo verification logic
    if (certCode.toUpperCase().startsWith("UG-") || certCode.length >= 6) {
      setSearchResult({
        status: "valid",
        code: certCode.toUpperCase(),
        studentNameAr: "أحمد عبد الله المنصوري",
        studentNameEn: "Ahmed Abdullah Al-Mansouri",
        courseNameAr: "هندسة البرمجيات والأنظمة السحابية المتقدمة",
        courseNameEn: "Advanced Cloud Systems & Software Engineering",
        issuedByAr: "منظومة UNIGATES — كلية الحاسبات والمعلومات",
        issuedByEn: "UNIGATES Ecosystem — Faculty of Computing & Informatics",
        issueDate: "2026-05-18",
        gradeAr: "ممتاز مع مرتبة الشرف (98%)",
        gradeEn: "Excellent with Honors (98%)",
        accreditationId: "ACCR-2026-UG-9981"
      });
    } else {
      setSearchResult({
        status: "invalid"
      });
    }
  };

  const securityFeatures = [
    {
      icon: QrCode,
      titleAr: "رمز استجابة سريعة QR ديناميكي",
      titleEn: "Dynamic Verifiable QR Code",
      descAr: "تحتوي كل شهادة على QR Code فريد ينقل جهة التوظيف مباشرة لصفحة التوثيق اللحظية لمنع التزوير.",
      descEn: "Each credential embeds a dynamic cryptographic QR linking directly to real-time verification servers."
    },
    {
      icon: Lock,
      titleAr: "توقيع وتشفير رقمي غير قابل للتعديل",
      titleEn: "Tamper-Proof Digital Ledger",
      descAr: "حفظ بيانات الشهادات بتجزئة مشفرة SHA-256 تمنع أي تلاعب بالدرجات أو المسميات الأكاديمية.",
      descEn: "Issued certificates are secured with immutable SHA-256 hashes against credential forgery."
    },
    {
      icon: Building2,
      titleAr: "ربط رسمي بالمؤسسة المانحة",
      titleEn: "Direct Institutional Attribution",
      descAr: "إظهار هوية الجامعة أو الكلية أو المركز المعتمد المانح للشهادة وسجل الاعتماد الأكاديمي الرسمي.",
      descEn: "Validates the issuing university, college, or accredited training center with full audit history."
    },
    {
      icon: FileBadge,
      titleAr: "متوافقة مع معايير لينكد إن وسوق العمل",
      titleEn: "LinkedIn & Global ATS Compatible",
      descAr: "إمكانية إضافة الشهادة بضغطة زر إلى الملف المهني على LinkedIn ومشاركتها مع أرباب العمل في منصة Career.",
      descEn: "1-click export to LinkedIn Licenses & Certifications and sharing with recruiters on UNIGATES Career."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isAr ? "التحقق من الشهادات الرقمية — منظومة UNIGATES" : "Digital Certificate Verification — UNIGATES"}
        description={
          isAr
            ? "بوابة التحقق الفوري من الشهادات والوثائق الأكاديمية المعتمدة الصادرة عبر منظومة UNIGATES."
            : "Official UNIGATES portal to verify accredited academic degrees, diplomas, and course certificates."
        }
      />
      <SimpleHeader backTo="/" />

      <main className="flex-1">
        {/* Hero & Search Form */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-emerald-500/10 via-background to-background overflow-hidden border-b border-border/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <Badge className="mb-4 px-4 py-1.5 text-xs sm:text-sm font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 inline-flex items-center gap-2">
              <Award className="w-4 h-4" />
              {isAr ? "منظومة التوثيق والشهادات الرقمية الآمنة" : "Secure Digital Credentials Verification"}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-4">
              {isAr ? (
                <>
                  بوابة <span className="text-primary underline decoration-primary/30 underline-offset-8">التحقق من الشهادات الرقمية</span>
                </>
              ) : (
                <>
                  Official <span className="text-primary underline decoration-primary/30 underline-offset-8">Certificate Verification</span> Portal
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {isAr
                ? "أدخل رقم وثيقة الشهادة أو المعرّف الأكاديمي للتحقق الفوري من صحة المؤهل وصلاحية الاعتماد المؤسسي."
                : "Enter the certificate verification ID or credential code to validate authenticity and institutional credentials."}
            </p>

            {/* Form */}
            <form onSubmit={handleVerify} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isAr ? "مثال: UG-2026-9981 أو رقم الشهادة" : "e.g., UG-2026-9981"}
                  value={certCode}
                  onChange={(e) => setCertCode(e.target.value)}
                  className="ps-11 h-12 text-sm sm:text-base font-bold bg-card shadow-sm"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 font-bold gap-2 shadow-lg">
                <ShieldCheck className="w-5 h-5" />
                {isAr ? "تحقق الآن" : "Verify Credential"}
              </Button>
            </form>

            {/* Quick Demo Helper */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>{isAr ? "لتجربة الفحص السريع، جرّب الكود التجريبي:" : "Quick demo code:"}</span>
              <button
                type="button"
                onClick={() => setCertCode("UG-2026-9981")}
                className="text-primary font-bold hover:underline"
              >
                UG-2026-9981
              </button>
            </div>
          </div>
        </section>

        {/* Search Results Display */}
        {searched && searchResult && (
          <section className="py-12 max-w-3xl mx-auto px-4 sm:px-6">
            {searchResult.status === "valid" ? (
              <Card className="border-2 border-emerald-500/50 bg-emerald-500/5 shadow-2xl overflow-hidden animate-scale-in">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <Badge className="bg-emerald-500 text-white font-bold mb-1">
                        {isAr ? "شهادة موثقة ورسمية 100%" : "Officially Verified Credential"}
                      </Badge>
                      <h3 className="text-lg font-black text-foreground">
                        {isAr ? "تم التحقق من صحة الوثيقة في سجلات المنظومة" : "Credential Validated in Institutional Registry"}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-card p-5 rounded-2xl border border-border">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "اسم الطالب / الخريج" : "Graduate Name"}</span>
                      <strong className="text-base text-foreground font-black">{isAr ? searchResult.studentNameAr : searchResult.studentNameEn}</strong>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "المؤهل / البرنامج" : "Program / Qualification"}</span>
                      <strong className="text-foreground font-bold">{isAr ? searchResult.courseNameAr : searchResult.courseNameEn}</strong>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "الجهة المانحة" : "Issuing Body"}</span>
                      <span className="text-foreground font-medium">{isAr ? searchResult.issuedByAr : searchResult.issuedByEn}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "تاريخ المنح والاعتماد" : "Issuance Date"}</span>
                      <span className="text-foreground font-medium">{searchResult.issueDate}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "التقدير الأكاديمي" : "Academic Standing"}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{isAr ? searchResult.gradeAr : searchResult.gradeEn}</span>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">{isAr ? "رقم مرجع الاعتماد" : "Accreditation Ref"}</span>
                      <span className="font-mono text-xs text-muted-foreground">{searchResult.accreditationId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-rose-500/40 bg-rose-500/5 shadow-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {isAr ? "لم يتم العثور على شهادة بهذا الرقم" : "No matching certificate found"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isAr
                    ? "يرجى التأكد من كتابة الرمز بدقة بما يشمل الفواصل، أو مسح رمز QR مباشرة من أصل الشهادة."
                    : "Please check the code spelling or scan the QR code directly from the original document."}
                </p>
              </Card>
            )}
          </section>
        )}

        {/* Security Features */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {isAr ? "معايير الأمان ومكافحة التزوير في UNIGATES" : "Anti-Counterfeit & Credential Security"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAr
                ? "تعتمد منظومتنا أحدث تقنيات التشفير والتحقق اللحظي لحماية سمعة الجامعات والمؤسسات المانحة."
                : "Employing advanced cryptography and live registry lookups to preserve institutional prestige."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1.5">
                      {isAr ? feat.titleAr : feat.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isAr ? feat.descAr : feat.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
