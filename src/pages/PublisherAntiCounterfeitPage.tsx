import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Building2,
  ScanLine,
  Printer,
  Copy,
  Hash,
  Download,
  AlertTriangle,
  BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { useSmartBack } from "@/hooks/use-smart-back";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const PublisherAntiCounterfeitPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store/publisher-dashboard");

  const catalog = BookStoreDataStore.getCatalog();
  const [records, setRecords] = useState(BookStoreDataStore.getAntiCounterfeitRecords());

  const [selectedBookId, setSelectedBookId] = useState(catalog[0]?.id || "bk-dar-001");
  const [batchCount, setBatchCount] = useState<number>(50);
  const [editionName, setEditionName] = useState("الطبعة الأولى المعتمدة 2026");
  const [batchNumber, setBatchNumber] = useState("BATCH-EG-12");

  const [scannedSerialInput, setScannedSerialInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newItems = BookStoreDataStore.generatePrintQRBatch(selectedBookId, Number(batchCount), editionName, batchNumber);
    setRecords(BookStoreDataStore.getAntiCounterfeitRecords());
    toast({
      title: isRtl ? "تم توليد أرقام التحقق والـ QR بنجاح! 🛡️" : "QR Serials Generated! 🛡️",
      description: isRtl
        ? `تم توليد ${batchCount} كود QR برقم تسلسلي فريد مشفر وجاهز للطباعة على أغلفة الكتب الورقية.`
        : `Generated ${batchCount} serialized anti-counterfeit QR codes.`
    });
  };

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSerialInput.trim()) return;

    const matched = records.find(
      (r) => r.serialNumber.toLowerCase() === scannedSerialInput.trim().toLowerCase()
    );

    if (matched) {
      setVerificationResult({
        status: "authentic",
        record: matched
      });
      toast({
        title: isRtl ? "✅ طبعة أصلية معتمدة 100%" : "✅ 100% Genuine Copy Verified",
        description: isRtl
          ? `النسخة صادرة رسمياً من دار عبيد ومنصة UNIGATES برقم تسلسلي ${matched.serialNumber}.`
          : "Certified authentic edition."
      });
    } else {
      setVerificationResult({
        status: "fake",
        serial: scannedSerialInput.trim()
      });
      toast({
        title: isRtl ? "⚠️ تحذير: رقم تسلسلي غير معتمد!" : "⚠️ Warning: Unrecognized Serial",
        description: isRtl
          ? "هذا الرقم التسلسلي غير مسجل في قاعدة بيانات دار عبيد الرسمية، يرجى الحذر من النسخ المقلدة."
          : "Serial number not found in official registry.",
        variant: "destructive"
      });
    }
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم حجز باقة حماية المطبوعات ومكافحة التزوير! 🛡️" : "Anti-Counterfeit Tier Waitlist Confirmed!",
      description: isRtl
        ? "ستحصل على 1000 ملصق QR أمان فائق التشفير مجاناً عند التدشين."
        : "You'll receive 1,000 security QR holographic certificates on launch."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-emerald-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "رجوع لاستوديو الناشر" : "Back to Publisher Studio"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-emerald-500" /> : <ArrowLeft className="w-4 h-4 text-emerald-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store/publisher-dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES STUDIO
                </span>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {isRtl ? "منظومة مكافحة التزوير والتحقق من النسخ المطبوعة" : "Anti-Counterfeit QR & Serial Security"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store/publisher-dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Building2 className="w-4 h-4" />
                {isRtl ? "استوديو الناشر" : "Publisher Studio"}
              </Button>
            </Link>
            <Link to="/book-store/browse">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner with Coming Soon Paid Tier Badge */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "ميزة احترافية لدور النشر • قريباً (باقة مدفوعة)" : "Publisher Pro Tier • Coming Soon (Paid Package)"}</span>
                <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    حماية النسخ المطبوعة برقم تسلسلي <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">وكود QR للتحقق ومكافحة التزوير (Anti-Counterfeit)</span>
                  </>
                ) : (
                  <>
                    Physical Book Protection & <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Anti-Counterfeit QR Serials</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "حافظ على حقوق مؤلفاتك الأكاديمية والورقية من القرصنة والتصوير العشوائي؛ قم بتوليد كود QR أمان مشفر مع رقم تسلسلي فريد لكل نسخة مطبوعة، يمسحه الطالب أو المشتري بجواله ليتأكد فوراً أنها طبعة أصلية معتمدة من دار عبيد ومنصة UNIGATES."
                  : "Safeguard your print editions from counterfeiting. Generate serialized cryptographic QR codes printed on physical book covers, allowing buyers to instantly verify genuine publisher authenticity via any mobile camera."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-emerald-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {isRtl ? "احجز اشتراك باقة الأمان ومكافحة التزوير" : "Join Anti-Counterfeit Tier Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "احمِ حقوق دار النشر بملصقات وأكواد تحقق أصلية" : "Secure all your print production with official validation QR"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تسجيل دار النشر بنجاح!" : "Waitlist Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك حزمة التوليد والطباعة فور الانطلاق." : "We'll send your activation pack upon release."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريد مسؤول المطبعة أو دار النشر..." : "Enter print supervisor email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم للحصول على أولوية الأمان" : "Get Early Access"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Generator & Verification Simulator */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* QR Generator Box */}
          <Card className="lg:col-span-6 border-border shadow-md bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                {isRtl ? "توليد دفعة جديدة من ملصقات الأمان QR للمطبعة" : "Generate Batch of Print Security QR Codes"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isRtl ? "اختر الكتاب وحجم الدفعة لتوليد أكواد التحقق التسلسلية للطباعة" : "Batch print verification codes for your book covers"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              <form onSubmit={handleGenerateBatch} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "اختر الكتاب المراد حمايته" : "Select Book to Protect"}
                  </label>
                  <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                    <SelectTrigger className="text-xs h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {isRtl ? b.title_ar : b.title_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      {isRtl ? "عدد النسخ في الدفعة" : "Batch Size (Copies)"}
                    </label>
                    <Select value={String(batchCount)} onValueChange={(val) => setBatchCount(Number(val))}>
                      <SelectTrigger className="text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 {isRtl ? "نسخة" : "copies"}</SelectItem>
                        <SelectItem value="100">100 {isRtl ? "نسخة" : "copies"}</SelectItem>
                        <SelectItem value="250">250 {isRtl ? "نسخة" : "copies"}</SelectItem>
                        <SelectItem value="500">500 {isRtl ? "نسخة (طبعة كاملة)" : "copies"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      {isRtl ? "رقم تشغيلة الطباعة" : "Print Batch Number"}
                    </label>
                    <Input
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="BATCH-EG-12"
                      className="text-xs h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "مسمى الطبعة" : "Edition Name"}
                  </label>
                  <Input
                    value={editionName}
                    onChange={(e) => setEditionName(e.target.value)}
                    placeholder={isRtl ? "الطبعة الأولى المعتمدة 2026" : "1st Official Edition 2026"}
                    className="text-xs h-10"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    🛡️ {isRtl ? "ضمانات الأمان المشفرة:" : "Cryptographic Guarantees:"}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isRtl
                      ? "كل كود QR يحتوي على بصمة رقمية SHA-256 لا يمكن تكرارها، وتُسجل عملية المسح الأولى لمنع إعادة استخدام الملصق."
                      : "Each QR holds a unique SHA-256 fingerprint; first scan is timestamped to prevent sticker reuse."}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 shadow-md gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  {isRtl ? "توليد دفعة الأكواد وتصدير ملف الطباعة (قريباً)" : "Generate & Export Print PDF (Coming Soon)"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Verification Simulator for Reader / Buyer */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="border-border shadow-md bg-card">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-emerald-600" />
                  {isRtl ? "محاكي مسح الـ QR والتحقق من أصالة الكتاب" : "Buyer QR Scan & Authenticity Verifier"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "جرب إدخال أي رقم تسلسلي للتحقق من اعتماده ومطابقته" : "Simulate mobile camera scanning an official book QR"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <form onSubmit={handleVerifySerial} className="flex gap-2">
                  <Input
                    value={scannedSerialInput}
                    onChange={(e) => setScannedSerialInput(e.target.value)}
                    placeholder="OBEID-2026-98741"
                    className="text-xs font-mono h-10"
                  />
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 shrink-0">
                    {isRtl ? "تحقق الآن" : "Verify"}
                  </Button>
                </form>

                {/* Quick test buttons */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                  <span>{isRtl ? "أرقام للتجربة السريعة:" : "Test serials:"}</span>
                  <button
                    type="button"
                    onClick={() => setScannedSerialInput("OBEID-2026-98741")}
                    className="text-emerald-600 hover:underline font-mono font-bold"
                  >
                    OBEID-2026-98741 (صالح)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setScannedSerialInput("OBEID-FAKE-00000")}
                    className="text-rose-500 hover:underline font-mono font-bold"
                  >
                    OBEID-FAKE-00000 (مقلد)
                  </button>
                </div>

                {/* Result Display */}
                {verificationResult && (
                  <div className="pt-2">
                    {verificationResult.status === "authentic" ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-black text-sm text-emerald-700 dark:text-emerald-300">
                                {isRtl ? "نسخة أصلية معتمدة 100%" : "100% Verified Authentic Copy"}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {verificationResult.record.serialNumber}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-extrabold text-[10px]">
                            AUTHENTIC
                          </Badge>
                        </div>

                        <div className="space-y-1 text-foreground/90 pt-1 border-t border-emerald-500/20">
                          <p><strong>{isRtl ? "الكتاب:" : "Title:"}</strong> {verificationResult.record.bookTitle}</p>
                          <p><strong>{isRtl ? "الناشر:" : "Publisher:"}</strong> {verificationResult.record.publisherName}</p>
                          <p><strong>{isRtl ? "الطبعة:" : "Edition:"}</strong> {verificationResult.record.edition} • {verificationResult.record.printYear}</p>
                          <p><strong>{isRtl ? "قناة التوزيع:" : "Channel:"}</strong> {verificationResult.record.distributionChannel}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                          <div>
                            <p className="font-black text-sm">{isRtl ? "تحذير: نسخة غير معتمدة أو مقلدة!" : "Warning: Unverified Copy!"}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{verificationResult.serial}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {isRtl
                            ? "الرقم التسلسلي المدخل غير مسجل في سجلات دار النشر الرسمية، مما يشير إلى أنها قد تكون نسخة مصورة أو مقلدة دون تصريح."
                            : "Serial not found in official registry. Potential unauthorized reprint."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Serials Table */}
            <Card className="border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">
                  {isRtl ? "سجل الأرقام التسلسلية المعتمدة للمطبعة" : "Certified Print Serials Registry"}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {records.length} {isRtl ? "نسخة مسجلة" : "serials"}
                </Badge>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {records.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-foreground block">{r.serialNumber}</span>
                      <span className="text-[10px] text-muted-foreground truncate block max-w-[200px]">{r.bookTitle}</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[9px]">
                      {isRtl ? "أصلي" : "Genuine"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store/publisher-dashboard">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لاستوديو الناشر
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Publisher Studio
                </>
              )}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default PublisherAntiCounterfeitPage;
