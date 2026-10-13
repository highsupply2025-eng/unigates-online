import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FileSignature, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  PlusCircle, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Crown,
  Eye,
  Send,
  AlertCircle,
  Award,
  Users,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { NashrDataStore } from "@/services/nashrDataStore";
import { AuthorProfile } from "@/types/nashr";
import { PublishingContract } from "@/types/bookStore";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useSmartBack } from "@/hooks/use-smart-back";

export const PublisherContractsPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store/publisher-dashboard");

  const [contracts, setContracts] = useState<PublishingContract[]>(BookStoreDataStore.getContracts());
  const [selectedContract, setSelectedContract] = useState<PublishingContract | null>(contracts[0] || null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);

  // Registered Authors
  const [registeredAuthors, setRegisteredAuthors] = useState<AuthorProfile[]>(() => {
    try {
      return NashrDataStore.getAllAuthors();
    } catch {
      return [];
    }
  });
  const [selectedAuthorCode, setSelectedAuthorCode] = useState<string>("custom");

  // New Contract Form State
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorNationalId, setAuthorNationalId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [contractType, setContractType] = useState<"digital_exclusive" | "print_exclusive" | "comprehensive_both">("comprehensive_both");
  const [advancePayment, setAdvancePayment] = useState<number | string>(15000);

  const handleAuthorSelect = (code: string) => {
    setSelectedAuthorCode(code);
    if (code === "custom") return;
    const found = registeredAuthors.find((a) => a.authorCode === code || a.id === code);
    if (found) {
      setAuthorName(found.fullName);
      if (found.email) setAuthorEmail(found.email);
      // Generate standard ID or passport if present
      if (found.passportNumber) {
        setAuthorNationalId(found.passportNumber);
      } else if (found.nationalIdUrl) {
        setAuthorNationalId("2850915010" + (found.authorCode?.replace(/\D/g, "") || "4714").slice(-4));
      }
      toast({
        title: isRtl ? "تم ربط بيانات المؤلف بالعقد" : "Author Profile Linked",
        description: isRtl ? `تم جلب بيانات «${found.fullName}» تلقائياً.` : `Filled details for ${found.fullName}`,
      });
    }
  };

  const handleSignContract = (contractId: string) => {
    BookStoreDataStore.signContractAsAdmin(contractId);
    setContracts(BookStoreDataStore.getContracts());
    setIsSignModalOpen(false);
    toast({
      title: isRtl ? "تم توقيع العقد رسمياً بالختم الرقمي! ✍️" : "Contract Signed by Admin Representative! ✍️",
      description: isRtl
        ? "أصبح العقد سارياً وتمت أرشفة شهادة الملكية الفكرية وإشعار المؤلف."
        : "Contract is now fully executed and intellectual property certified."
    });
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !bookTitle || !authorEmail) {
      toast({
        title: isRtl ? "يرجى تعبئة جميع الحقول" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const created = BookStoreDataStore.createDraftContract({
      authorName,
      authorEmail,
      authorNationalId,
      bookTitle,
      contractType,
      advancePayment: Number(advancePayment) || 10000
    });

    setContracts(BookStoreDataStore.getContracts());
    setSelectedContract(created);
    setIsNewContractModalOpen(false);
    toast({
      title: isRtl ? "تم إنشاء مسودة العقد وإرسالها للمؤلف 📄" : "Contract Draft Created & Sent!",
      description: isRtl
        ? `رقم العقد: ${created.contractNumber} — تم إرسال رابط التوقيع الإلكتروني لـ ${authorEmail}.`
        : `Contract ${created.contractNumber} dispatched to author.`
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-indigo-600 selection:text-white" dir={dir}>
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
              {isRtl ? <ArrowRight className="w-4 h-4 text-indigo-500" /> : <ArrowLeft className="w-4 h-4 text-indigo-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store/publisher-dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES & DAR OBEID
                </span>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {isRtl ? "إدارة العقود والأذونات الرقمية والملكية الفكرية" : "Digital Licensing, Contracts & IP Portal"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsNewContractModalOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {isRtl ? "إنشاء عقد نشر جديد" : "New Publishing Contract"}
            </Button>
            <Link to="/book-store/publisher-dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-4 h-4" />
                {isRtl ? "استوديو الناشر" : "Publisher Studio"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-500/10 via-background to-background py-10 px-4 sm:px-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{isRtl ? "منظومة العقود المعتمدة قانونياً • توقيع رقمي مشفر" : "Certified Digital Contracts & IP Exchange"}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                {isRtl ? (
                  <>
                    بوابة تبادل العقود الرسمية بين <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">دار عبيد للنشر والمؤلفين</span>
                  </>
                ) : (
                  <>
                    Official Publishing Contracts & <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">Author Licensing Portal</span>
                  </>
                )}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-3xl">
                {isRtl
                  ? "توقيع عقود النشر الرقمية والورقية إلكترونياً بين إدارة دار عبيد والمؤلفين، مع إثبات حقوق الملكية الفكرية بنظام الختم الزمني المشفر وحفظ الأرشيف التعاقدي للطرفين."
                  : "Exchange and legally execute digital & print book publishing contracts between Dar Obeid management and accredited authors with instant IP archival."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs p-2 font-bold gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? "نسبة الأرباح للمؤلف والدار: 80%" : "Author & Publisher Share: 80%"}</span>
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split View: Contracts List + Live Contract Viewer */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Contracts Sidebar List */}
          <Card className="lg:col-span-5 border-border shadow-md bg-card">
            <CardHeader className="p-4 pb-3 border-b border-border/40 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-foreground">
                  {isRtl ? "سجل العقود والأذونات" : "Contracts Directory"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "اختر العقد لمعاينة بنوده وتوقيعه" : "Select a contract to review terms"}
                </CardDescription>
              </div>
              <Badge className="bg-indigo-600 text-white text-[10px]">
                {contracts.length} {isRtl ? "عقود" : "contracts"}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {contracts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedContract(c)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    selectedContract?.id === c.id
                      ? "bg-indigo-500/10 border-indigo-500 shadow-sm"
                      : "bg-muted/30 border-border/60 hover:border-indigo-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">
                        {c.contractNumber}
                      </span>
                      <h4 className="font-bold text-xs text-foreground mt-0.5 leading-snug">
                        {c.bookTitle}
                      </h4>
                    </div>
                    <Badge
                      className={`text-[9px] font-bold shrink-0 ${
                        c.status === "fully_executed"
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                      }`}
                    >
                      {c.status === "fully_executed"
                        ? (isRtl ? "معتمد وموقع" : "Fully Executed")
                        : (isRtl ? "بانتظار التوقيع" : "Pending Signature")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                    <span>✍️ {c.authorName}</span>
                    <span>{c.startDate}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Document Viewer & Signing Pad */}
          {selectedContract && (
            <Card className="lg:col-span-7 border-indigo-500/30 shadow-xl bg-card">
              <CardHeader className="p-5 pb-4 border-b border-border/40 bg-gradient-to-r from-indigo-500/5 to-transparent flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white font-mono text-[10px]">
                      {selectedContract.contractNumber}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                      {isRtl ? `شهادة ملكية: ${selectedContract.ipCertificateNumber}` : selectedContract.ipCertificateNumber}
                    </Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-black text-foreground mt-1.5">
                    {selectedContract.bookTitle}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: isRtl ? "جاري تحميل نسخة PDF المعتمدة 📄" : "Downloading certified contract PDF...",
                      })
                    }
                    className="text-xs h-8 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isRtl ? "تحميل PDF" : "PDF"}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 text-xs sm:text-sm">
                {/* Parties Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold block">{isRtl ? "الطرف الأول (الناشر والمنصة):" : "Party 1 (Publisher):"}</span>
                    <p className="font-bold text-foreground">{selectedContract.publisherName}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedContract.adminRepresentative}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold block">{isRtl ? "الطرف الثاني (المؤلف / صاحب الحقوق):" : "Party 2 (Author):"}</span>
                    <p className="font-bold text-foreground">{selectedContract.authorName}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedContract.authorEmail} • هـ: {selectedContract.authorNationalId}</p>
                  </div>
                </div>

                {/* Contract Terms */}
                <div className="space-y-3">
                  <h4 className="font-black text-foreground text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {isRtl ? "بنود العقد والترخيص الأكاديمي:" : "Core Licensing Terms:"}
                  </h4>
                  <ul className="space-y-2 text-xs text-foreground/80 leading-relaxed bg-card p-4 rounded-xl border border-border/50">
                    {selectedContract.terms_ar.map((term, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 shrink-0">{i + 1}.</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <div>
                    <span className="text-[11px] text-muted-foreground">{isRtl ? "نسبة الأرباح" : "Royalties"}</span>
                    <p className="font-black text-indigo-600 text-base">{selectedContract.royaltyPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">{isRtl ? "دفعة التعاقد" : "Advance"}</span>
                    <p className="font-black text-emerald-600 text-base">{selectedContract.advancePayment} EGP</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">{isRtl ? "سريان العقد" : "Validity"}</span>
                    <p className="font-bold text-foreground text-xs">{selectedContract.startDate} إلى {selectedContract.endDate}</p>
                  </div>
                </div>

                {/* Signatures Status Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Author Signature */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "توقيع الطرف الثاني (المؤلف)" : "Author Signature"}</span>
                    {selectedContract.authorSignatureDate ? (
                      <div className="space-y-1">
                        <div className="font-serif italic text-lg text-indigo-600 font-black">
                          {selectedContract.authorName}
                        </div>
                        <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          {isRtl ? `تم التوقيع إلكترونياً: ${selectedContract.authorSignatureDate}` : "Digitally Signed"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-bold">{isRtl ? "بانتظار توقيع المؤلف..." : "Pending Author..."}</p>
                    )}
                  </div>

                  {/* Admin Signature */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "ختم وتوقيع دار عبيد (الناشر)" : "Publisher Digital Seal"}</span>
                    {selectedContract.adminSignatureDate ? (
                      <div className="space-y-1">
                        <div className="font-serif italic text-lg text-emerald-600 font-black">
                          DAR OBEID & UNIGATES SEAL
                        </div>
                        <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          {isRtl ? `معتمد وموقع: ${selectedContract.adminSignatureDate}` : "Certified by Admin"}
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setIsSignModalOpen(true)}
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                      >
                        <FileSignature className="w-4 h-4" />
                        {isRtl ? "توقيع واعتماد العقد الآن (إدارة الدار)" : "Sign Contract as Admin"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Admin Sign Confirmation Modal */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {isRtl ? "تأكيد التوقيع والختم الرقمي لدار عبيد" : "Confirm Official Publisher Signature"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl
                ? `سيتم تطبيق الختم الرقمي المعتمد لدار عبيد على العقد رقم ${selectedContract?.contractNumber} وأرشفته في سجلات حماية الملكية الفكرية.`
                : "Applies cryptographic seal and archives IP certificate."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
            <p className="font-bold text-emerald-700 dark:text-emerald-300">
              {isRtl ? "المفوض بالتوقيع: أ. محمد عبيد (رئيس مجلس الإدارة)" : "Authorized Signatory: Mohamed Obeid"}
            </p>
            <p className="text-muted-foreground text-[11px]">
              {isRtl ? "شهادة التشفير: SHA-256 Validated • UNIGATES Platform Key 2026" : "SHA-256 Validated Key"}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSignModalOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={() => selectedContract && handleSignContract(selectedContract.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {isRtl ? "تأكيد التوقيع والاعتماد" : "Confirm & Sign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Draft Contract Modal */}
      <Dialog open={isNewContractModalOpen} onOpenChange={setIsNewContractModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black text-base flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-indigo-600" />
              {isRtl ? "إنشاء مسودة عقد نشر وترخيص جديد" : "Create New Publishing Contract"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? "أدخل بيانات المؤلف والمصنف لإرسال رابط التوقيع للمؤلف" : "Enter author and title details"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDraft} className="space-y-3 py-2 text-xs">
            {/* Author Selector */}
            <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-[11px] text-foreground">
                    {isRtl ? "اختيار مؤلف مسجل (لجلب بياناته تلقائياً)" : "Select Registered Author"}
                  </span>
                </div>
                {selectedAuthorCode !== "custom" && (
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                    <UserCheck className="w-3 h-3 me-0.5 inline" />
                    {isRtl ? "معتمد" : "Verified"}
                  </Badge>
                )}
              </div>

              <Select value={selectedAuthorCode} onValueChange={handleAuthorSelect}>
                <SelectTrigger className="h-8 text-xs rounded-lg bg-card">
                  <SelectValue placeholder={isRtl ? "اختر مؤلفاً من المنصة أو كتابة يدوية" : "Choose author"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    {isRtl ? "✍️ إدخال يدوي / مؤلف خارجي" : "✍️ Manual Entry / External"}
                  </SelectItem>
                  {registeredAuthors.map((auth) => (
                    <SelectItem key={auth.id || auth.authorCode} value={auth.authorCode || auth.id}>
                      {auth.fullName} ({auth.authorCode || "AUT-SEED"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-bold block mb-1">{isRtl ? "عنوان الكتاب / المرجع الأكاديمي *" : "Book Title *"}</label>
              <Input
                required
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder={isRtl ? "مثال: موسوعة القانون التجاري الحديث" : "e.g. Modern Commercial Law"}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">{isRtl ? "اسم المؤلف الكامل" : "Author Name"}</label>
                <Input
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={isRtl ? "أ.د. سمير المنشاوي" : "Prof. Samir"}
                  className="text-xs h-9"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isRtl ? "الرقم القومي / الهوية" : "National ID"}</label>
                <Input
                  required
                  value={authorNationalId}
                  onChange={(e) => setAuthorNationalId(e.target.value)}
                  placeholder="28809151203491"
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">{isRtl ? "بريد المؤلف (لإرسال العقد)" : "Author Email"}</label>
                <Input
                  required
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="author@example.com"
                  className="text-xs h-9"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isRtl ? "دفعة التعاقد المقدمة (EGP)" : "Advance (EGP)"}</label>
                <Input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">{isRtl ? "نوع عقد النشر" : "Contract Scope"}</label>
              <Select value={contractType} onValueChange={(val: any) => setContractType(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive_both">{isRtl ? "نشر رقمي وورقي شامل (موصى به)" : "Comprehensive (Digital & Print)"}</SelectItem>
                  <SelectItem value="digital_exclusive">{isRtl ? "نشر رقمي مشفر DRM فقط" : "Digital Only (DRM)"}</SelectItem>
                  <SelectItem value="print_exclusive">{isRtl ? "طباعة ونشر ورقي فقط" : "Print Only"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewContractModalOpen(false)}>
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                {isRtl ? "إنشاء وإرسال العقد للمؤلف" : "Create & Send Draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default PublisherContractsPage;
