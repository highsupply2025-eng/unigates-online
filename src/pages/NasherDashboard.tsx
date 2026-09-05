import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { 
  PenTool, 
  FileText, 
  Building2, 
  ShieldCheck, 
  Gavel, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  Scale, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Lock,
  AlertTriangle,
  FileSignature,
  Coins,
  Send,
  UploadCloud,
  Check,
  Building,
  User,
  Stamp,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Bid {
  id: string;
  publisherName: string;
  publisherType: string;
  royaltyPercentage: number;
  printCostCovered: boolean;
  editionCopies: number;
  timelineDays: number;
  notes: string;
  status: "pending" | "accepted" | "contract_drafted" | "signed";
}

interface Manuscript {
  id: string;
  title: string;
  authorName: string;
  genre: string;
  pageCount: number;
  synopsis: string;
  sampleChapter: string;
  submittedDate: string;
  bids: Bid[];
}

const initialManuscripts: Manuscript[] = [
  {
    id: "ms-1",
    title: "أسرار الأندلس المفقودة: دراسة وثائقية",
    authorName: "د. أحمد السعيد",
    genre: "تاريخ وبحوث",
    pageCount: 280,
    synopsis: "دراسة روائية شيقة تسبر أغوار المخطوطات الأندلسية النادرة وتكشف تفاصيل الحياة الفكرية في قرطبة وغرناطة مع تحقيق مخطوطات لم تنشر من قبل.",
    sampleChapter: "الفصل الأول: البداية من مكتبة الزهراء المنسية في ربيع عام 1492...",
    submittedDate: "2026-09-01",
    bids: [
      {
        id: "bid-101",
        publisherName: "دار المعرفة للطباعة والنشر",
        publisherType: "دار نشر معتمدة",
        royaltyPercentage: 65,
        printCostCovered: true,
        editionCopies: 3000,
        timelineDays: 25,
        notes: "طباعة فاخرة ورق شاموا 80 جرام، غلاف مقوى مجلد مع حملة تسويقية حصرية داخل متجر UNIGATES.",
        status: "pending"
      },
      {
        id: "bid-102",
        publisherName: "دار الأفق الرقمي للنشر",
        publisherType: "نشر إلكتروني وورقي",
        royaltyPercentage: 70,
        printCostCovered: true,
        editionCopies: 1500,
        timelineDays: 14,
        notes: "إطلاق ورقي وإلكتروني متزامن مع كتاب صوتي مسموع عبر المتجر.",
        status: "pending"
      }
    ]
  },
  {
    id: "ms-2",
    title: "الذكاء الاصطناعي التوليدي في التعليم الجامعي",
    authorName: "م. محمود زكي",
    genre: "تكنولوجيا وأكاديميا",
    pageCount: 340,
    synopsis: "دليل تطبيقي عملي موجه للجامعات والأساتذة لبناء مناهج متوافقة مع الذكاء الاصطناعي وتطبيق أدوات المساعد الشخصي في التدريس والتقييم.",
    sampleChapter: "المقدمة: الانتقال من التعليم التقليدي إلى منظومة الذكاء الاصطناعي التوليدي...",
    submittedDate: "2026-09-03",
    bids: [
      {
        id: "bid-201",
        publisherName: "دار النهضة الأكاديمية",
        publisherType: "نشر جامعي وعلمي",
        royaltyPercentage: 60,
        printCostCovered: true,
        editionCopies: 5000,
        timelineDays: 20,
        notes: "اعتماد أكاديمي موثق وتوزيع على كافة كليات الحاسبات والتربية داخل المنصة.",
        status: "pending"
      }
    ]
  }
];

const NasherDashboard = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "deals";

  const [manuscripts, setManuscripts] = useState<Manuscript[]>(initialManuscripts);
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript>(initialManuscripts[0]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(initialManuscripts[0].bids[0]);

  // Submit manuscript form states
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newGenre, setNewGenre] = useState("أدب ورواية");
  const [newPageCount, setNewPageCount] = useState("200");
  const [newSynopsis, setNewSynopsis] = useState("");
  const [newSample, setNewSample] = useState("");

  // Place bid form states
  const [bidPublisher, setBidPublisher] = useState("");
  const [bidRoyalty, setBidRoyalty] = useState("65");
  const [bidCopies, setBidCopies] = useState("2000");
  const [bidDays, setBidDays] = useState("21");
  const [bidNotes, setBidNotes] = useState("");

  // Contract signing state
  const [contractSigned, setContractSigned] = useState(false);
  const [escrowPaid, setEscrowPaid] = useState(false);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const handleCreateManuscript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSynopsis.trim()) {
      toast({
        title: isAr ? "بيانات ناقصة" : "Missing Details",
        description: isAr ? "يرجى كتابة عنوان المخطوطة والنبذة المختصرة على الأقل." : "Please fill out title and synopsis.",
        variant: "destructive"
      });
      return;
    }

    const created: Manuscript = {
      id: "ms-" + Date.now(),
      title: newTitle,
      authorName: newAuthor || (isAr ? "كاتب غير محدد" : "Anonymous Author"),
      genre: newGenre,
      pageCount: parseInt(newPageCount) || 150,
      synopsis: newSynopsis,
      sampleChapter: newSample || (isAr ? "مقتطف تجريبي قيد المراجعة" : "Sample chapter under review"),
      submittedDate: new Date().toISOString().split("T")[0],
      bids: []
    };

    setManuscripts([created, ...manuscripts]);
    setSelectedManuscript(created);
    toast({
      title: isAr ? "🎉 تم طرح المخطوطة بنجاح!" : "Manuscript Listed!",
      description: isAr ? "مخطوطتك الآن متاحة لدور النشر لتقديم عروض الأسعار." : "Your manuscript is now live for publisher bids."
    });

    setNewTitle("");
    setNewSynopsis("");
    setNewSample("");
    handleTabChange("deals");
  };

  const handleAddBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidPublisher.trim()) {
      toast({
        title: isAr ? "اسم دار النشر مطلوب" : "Publisher Name Required",
        variant: "destructive"
      });
      return;
    }

    const newBidObj: Bid = {
      id: "bid-" + Date.now(),
      publisherName: bidPublisher,
      publisherType: isAr ? "دار نشر معتمدة" : "Certified Publisher",
      royaltyPercentage: parseInt(bidRoyalty) || 60,
      printCostCovered: true,
      editionCopies: parseInt(bidCopies) || 1000,
      timelineDays: parseInt(bidDays) || 30,
      notes: bidNotes || (isAr ? "عرض طباعة كامل مع التوزيع الحصري داخل متجر UNIGATES." : "Full print & exclusive distribution offer."),
      status: "pending"
    };

    const updated = manuscripts.map(m => {
      if (m.id === selectedManuscript.id) {
        return {
          ...m,
          bids: [newBidObj, ...m.bids]
        };
      }
      return m;
    });

    setManuscripts(updated);
    setSelectedManuscript({ ...selectedManuscript, bids: [newBidObj, ...selectedManuscript.bids] });
    setSelectedBid(newBidObj);

    toast({
      title: isAr ? "✨ تم تقديم عرض السعر بنجاح!" : "Bid Submitted!",
      description: isAr ? "تم إرسال عرضك للكاتب ولإشراف دار عبيد للمراجعة." : "Bid sent to author and Dar Obeid legal desk."
    });

    setBidPublisher("");
    setBidNotes("");
  };

  const handleSignContract = () => {
    setContractSigned(true);
    toast({
      title: isAr ? "📜 تم توقيع العقد الإلكتروني بنجاح!" : "Contract Signed!",
      description: isAr ? "العقد موثق قانونياً بإشراف دار عبيد للنشر وحصرية متجر UNIGATES." : "Legally signed under Dar Obeid supervision & UNIGATES exclusivity."
    });
  };

  const handlePayEscrow = () => {
    setEscrowPaid(true);
    toast({
      title: isAr ? "💳 تم إيداع رسوم النشر بالضمان (Escrow)!" : "Escrow Funded!",
      description: isAr ? "تم قفل الصفقة وبدء تجهيز ملفات الطباعة والرفع لمتجر الكتب." : "Deal locked. Production & Store publishing initiated."
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-500 selection:text-white">
      <SiteHeader />

      {/* Header Banner */}
      <section className="border-b border-border/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
                <Gavel className="h-3.5 w-3.5" />
                <span>{isAr ? "استوديو الصفقات والمزايدات الحصرية" : "Exclusive Deals & Bidding Studio"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                {isAr ? "منصة ناشر : إدارة عروض النشر والعقود الذكية" : "Nasher Studio: Manuscript Bids & E-Contracts"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isAr ? "إشراف دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م • حصرية متجر UNIGATES" : "Supervised by Dar Obeid Publishing LLC • Exclusive to UNIGATES Book Store"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="border-amber-500/30">
                <Link to="/book-store">
                  <BookOpen className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-amber-500" />
                  {isAr ? "متجر الكتب" : "Book Store"}
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
                <Link to="/nasher">
                  {isAr ? "الرئيسية لمنصة ناشر" : "Nasher Home"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Tabs */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl mx-auto h-auto p-1 bg-muted/60">
            <TabsTrigger value="deals" className="py-2.5 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "المزايدات والعروض" : "Bidding Arena"}
            </TabsTrigger>
            <TabsTrigger value="submit" className="py-2.5 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <PenTool className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "طرح نبذة مخطوطة" : "Submit Manuscript"}
            </TabsTrigger>
            <TabsTrigger value="contract" className="py-2.5 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <FileSignature className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "العقد الإلكتروني (دار عبيد)" : "Dar Obeid Contract"}
            </TabsTrigger>
            <TabsTrigger value="escrow" className="py-2.5 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isAr ? "الضمان المالي والنشر" : "Escrow & Publish"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Bidding Arena & Deals */}
          <TabsContent value="deals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Manuscripts List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    {isAr ? "المخطوطات المطروحة" : "Available Manuscripts"}
                  </h3>
                  <Badge variant="outline">{manuscripts.length}</Badge>
                </div>

                <div className="space-y-3">
                  {manuscripts.map((m) => (
                    <Card 
                      key={m.id}
                      onClick={() => {
                        setSelectedManuscript(m);
                        setSelectedBid(m.bids[0] || null);
                      }}
                      className={`cursor-pointer transition-all border ${
                        selectedManuscript.id === m.id 
                          ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5 shadow-md" 
                          : "border-border/60 hover:border-border"
                      }`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs font-semibold">{m.genre}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{m.bids.length} عروض</span>
                        </div>
                        <h4 className="font-bold text-sm line-clamp-1">{m.title}</h4>
                        <p className="text-xs text-muted-foreground">{m.authorName} • {m.pageCount} صفحة</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Manuscript Details & Bids View */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 mb-1 font-bold">
                          {selectedManuscript.genre}
                        </Badge>
                        <CardTitle className="text-xl font-bold">{selectedManuscript.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {isAr ? "الكاتب:" : "Author:"} {selectedManuscript.authorName} • {selectedManuscript.pageCount} {isAr ? "صفحة" : "pages"} • {isAr ? "تاريخ الطرح:" : "Date:"} {selectedManuscript.submittedDate}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTabChange("contract")}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      >
                        <FileSignature className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                        {isAr ? "صياغة العقد المعتمد" : "Draft Contract"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="font-bold text-sm mb-2 text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" />
                        {isAr ? "النبذة التعريفية للمخطوطة:" : "Manuscript Synopsis:"}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-muted/40 border border-border/40">
                        {selectedManuscript.synopsis}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm mb-2 text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        {isAr ? "فصل تجريبي / مقتطف:" : "Sample Chapter Excerpt:"}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-muted/40 border border-border/40 font-serif">
                        {selectedManuscript.sampleChapter}
                      </p>
                    </div>

                    {/* Active Bids for this manuscript */}
                    <div className="space-y-4 pt-4 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-amber-500" />
                          {isAr ? "عروض أسعار دور النشر المقدمة" : "Competing Publisher Bids"}
                        </h4>
                        <span className="text-xs text-muted-foreground">{selectedManuscript.bids.length} {isAr ? "عروض متنافسة" : "bids"}</span>
                      </div>

                      {selectedManuscript.bids.length === 0 ? (
                        <div className="text-center py-8 p-4 rounded-xl border border-dashed border-border/60 text-muted-foreground text-xs">
                          {isAr ? "لم تقدم أي دار نشر عرضاً حتى الآن على هذه المخطوطة. كن أول من يقدم عرضاً!" : "No bids placed yet. Be the first publisher to bid!"}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedManuscript.bids.map((bid) => (
                            <div 
                              key={bid.id}
                              onClick={() => setSelectedBid(bid)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                selectedBid?.id === bid.id 
                                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20" 
                                  : "border-border/60 hover:border-border"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-amber-500" />
                                  <span className="font-bold text-sm">{bid.publisherName}</span>
                                  <Badge variant="outline" className="text-[10px]">{bid.publisherType}</Badge>
                                </div>
                                <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                                  {bid.royaltyPercentage}% {isAr ? "أرباح للكاتب" : "Royalties"}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{bid.notes}</p>
                              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                                <span>{isAr ? "عدد النسخ:" : "Copies:"} {bid.editionCopies.toLocaleString()}</span>
                                <span>{isAr ? "التنفيذ خلال:" : "Timeline:"} {bid.timelineDays} {isAr ? "يوم" : "days"}</span>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBid(bid);
                                    handleTabChange("contract");
                                  }}
                                  className="h-7 text-xs font-bold"
                                >
                                  {isAr ? "قبول العقد والتوقيع" : "Accept & Sign"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Place Bid Form for Publishers */}
                    <div className="pt-6 border-t border-border/40">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        {isAr ? "تقديم عرض سعر جديد كناشر معتمد" : "Submit New Bid (For Publishers)"}
                      </h4>
                      <form onSubmit={handleAddBid} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold mb-1 block">{isAr ? "اسم دار النشر:" : "Publisher Name:"}</label>
                          <Input 
                            placeholder={isAr ? "مثال: دار النور للنشر والترجمة" : "e.g. Al-Noor Publishing House"}
                            value={bidPublisher}
                            onChange={(e) => setBidPublisher(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">{isAr ? "نسبة أرباح الكاتب (%):" : "Author Royalty (%):"}</label>
                          <Input 
                            type="number"
                            min="10"
                            max="95"
                            value={bidRoyalty}
                            onChange={(e) => setBidRoyalty(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">{isAr ? "عدد نسخ الطبعة الأولى:" : "1st Edition Copies:"}</label>
                          <Input 
                            type="number"
                            value={bidCopies}
                            onChange={(e) => setBidCopies(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block">{isAr ? "مدة الطباعة والتجهيز (أيام):" : "Turnaround (Days):"}</label>
                          <Input 
                            type="number"
                            value={bidDays}
                            onChange={(e) => setBidDays(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold mb-1 block">{isAr ? "ملاحظات العرض والمواصفات:" : "Bid Specs & Details:"}</label>
                          <Textarea 
                            placeholder={isAr ? "نوع الورق، التجليد، مواصفات التسويق الحصري..." : "Paper specs, binding, exclusive promo details..."}
                            value={bidNotes}
                            onChange={(e) => setBidNotes(e.target.value)}
                            className="text-xs min-h-[60px]"
                          />
                        </div>
                        <div className="sm:col-span-2 pt-1">
                          <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
                            <Send className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                            {isAr ? "إرسال العرض للمؤلف" : "Send Bid to Author"}
                          </Button>
                        </div>
                      </form>
                    </div>

                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* TAB 2: Submit Manuscript Synopsis */}
          <TabsContent value="submit" className="max-w-3xl mx-auto">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{isAr ? "طرح نبذة مؤلف جديد للمزايدة" : "Submit New Manuscript Synopsis"}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {isAr ? "استقبل عروض أسعار الطباعة والأرباح من دور النشر المعتمدة تحت إشراف دار عبيد" : "Receive competing offers from publishers under Dar Obeid legal protection"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateManuscript} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold mb-1.5 block">{isAr ? "عنوان الكتاب / المخطوطة *" : "Book Title *"}</label>
                      <Input 
                        placeholder={isAr ? "مثال: عبقرية التفكير الاستراتيجي" : "e.g. Strategic Thinking Mastery"}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1.5 block">{isAr ? "اسم المؤلف / الاسم المستعار" : "Author Name"}</label>
                      <Input 
                        placeholder={isAr ? "مثال: د. طارق عبد الرحمن" : "e.g. Dr. Tarek Abdelrahman"}
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold mb-1.5 block">{isAr ? "التصنيف الأدبي / العلمي" : "Genre / Category"}</label>
                      <Input 
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1.5 block">{isAr ? "عدد الصفحات التقديري" : "Estimated Page Count"}</label>
                      <Input 
                        type="number"
                        value={newPageCount}
                        onChange={(e) => setNewPageCount(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold mb-1.5 block">{isAr ? "النبذة التعريفية والفكرة العامة (ملخص الكتاب) *" : "Synopsis & Overview *"}</label>
                    <Textarea 
                      placeholder={isAr ? "اكتب نبذة جذابة من 100 إلى 300 كلمة تشرح فكرة الكتاب، الجمهور المستهدف، وما يميزه عن غيره..." : "Write a 100-300 word synopsis explaining core themes, target readers, and uniqueness..."}
                      value={newSynopsis}
                      onChange={(e) => setNewSynopsis(e.target.value)}
                      required
                      className="min-h-[120px] text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold mb-1.5 block">{isAr ? "فصل تجريبي أو عينة من النص (اختياري للتقييم)" : "Sample Chapter Excerpt (Optional)"}</label>
                    <Textarea 
                      placeholder={isAr ? "الصق الفصل الأول أو مقدمة الكتاب لتقييم الأسلوب الأدبي..." : "Paste the first chapter or introduction for literary review..."}
                      value={newSample}
                      onChange={(e) => setNewSample(e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>{isAr ? "ضمان الملكية الفكرية والحصرية" : "Copyright & Exclusivity Guarantee"}</span>
                    </div>
                    <p className="leading-relaxed">
                      {isAr
                        ? "بمجرد تقديمك، تسجل المخطوطة ببصمة زمنية لحفظ حقوقك. بعد قبول أي عرض، يتم التوقيع رسمياً مع دار عبيد ويلتزم الناشر بحصرية البيع داخل متجر UNIGATES."
                        : "Manuscripts are time-stamped for copyright proof. Accepted bids result in official contracts supervised by Dar Obeid with UNIGATES store exclusivity."}
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 text-base">
                    <UploadCloud className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {isAr ? "نشر المخطوطة واستقبال عروض الأسعار" : "Publish Synopsis & Open for Bids"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Dar Obeid Legal Contract */}
          <TabsContent value="contract" className="max-w-4xl mx-auto space-y-6">
            <Card className="border-2 border-amber-500/40 shadow-xl bg-card">
              <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-serif font-black text-xl border border-amber-500/30">
                      ع
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-black">{isAr ? "عقد طباعة ونشر وتوزيع إلكتروني موحد" : "Unified Publishing & Exclusive Distribution Contract"}</CardTitle>
                        <Badge className="bg-amber-500 text-white font-bold text-[10px]">رسمي ومعتمد</Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        {isAr ? "الجهة المشرفة والموثقة: دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م" : "Supervised by: Dar Obeid Publishing & Printing LLC"}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground font-mono">
                    REF: OBEID-{selectedManuscript.id.toUpperCase()}-2026
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed">
                
                {/* Contract Parties */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">{isAr ? "الطرف الأول (المؤلف):" : "Party 1 (Author):"}</span>
                    <strong className="text-sm font-bold text-foreground">{selectedManuscript.authorName}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">{isAr ? "الطرف الثاني (الناشر):" : "Party 2 (Publisher):"}</span>
                    <strong className="text-sm font-bold text-foreground">{selectedBid?.publisherName || (isAr ? "دار المعرفة للنشر" : "Al-Maaref Publishing")}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">{isAr ? "الطرف الثالث (المشرف القانوني):" : "Party 3 (Supervisor):"}</span>
                    <strong className="text-sm font-bold text-amber-600 dark:text-amber-400">دار عبيد للنشر والتوزيع</strong>
                  </div>
                </div>

                {/* Terms and Exclusivity Clauses */}
                <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Scale className="h-4 w-4 text-amber-500" />
                    {isAr ? "بنود الاتفاقية والشروط القانونية الملزمة:" : "Legal Terms & Mandatory Covenants:"}
                  </h4>

                  <div className="p-3.5 rounded-lg border border-border/60 bg-background/60 space-y-1">
                    <strong className="text-foreground font-bold">{isAr ? "البند الأول (موضوع العقد):" : "Clause 1 (Subject):"}</strong>
                    <p>{isAr ? `اتفق الطرفان على طباعة وتوزيع كتاب (${selectedManuscript.title}) بعدد صفحات ${selectedManuscript.pageCount} صفحة، وبطبعة أولى قوامها ${selectedBid?.editionCopies || 3000} نسخة.` : `Publication and printing of "${selectedManuscript.title}" with an initial run of ${selectedBid?.editionCopies || 3000} copies.`}</p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border/60 bg-background/60 space-y-1">
                    <strong className="text-foreground font-bold">{isAr ? "البند الثاني (الحقوق المالية ونسبة الكاتب):" : "Clause 2 (Financials & Royalties):"}</strong>
                    <p>{isAr ? `يستحق الطرف الأول (الكاتب) نسبة ${selectedBid?.royaltyPercentage || 65}% من صافي عوائد مبيعات الكتاب، وتصرف أرباحه شهرياً وتلقائياً عبر محفظة UNIGATES الإلكترونية.` : `The Author receives ${selectedBid?.royaltyPercentage || 65}% royalties deposited automatically into UNIGATES wallet.`}</p>
                  </div>

                  {/* CRITICAL EXCLUSIVITY & LEGAL LIABILITY CLAUSE */}
                  <div className="p-4 rounded-xl border-2 border-rose-500/40 bg-rose-500/5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-sm">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{isAr ? "البند الثالث (حصرية البيع والمسؤولية القانونية الصارمة):" : "Clause 3 (Mandatory Store Exclusivity & Legal Liability):"}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                      {isAr
                        ? "يلتزم الطرف الثاني (الناشر) بطرح الكتاب وبيعه وتوزيعه حصرياً ومطلقاً داخل «متجر كتب UNIGATES». ويُحظر تماماً بيع أو توزيع أو تفويض أي جهة أخرى بتداول الكتاب ورقياً أو رقمياً خارج المنصة دون موافقة كتابية رسمية من دار عبيد والكاتب. وفي حال ثبوت بيع الكتاب خارج متجر كتب UNIGATES، يُساءل الناشر جنائياً ومدنياً وتُفرض عليه غرامة تعويضية ملزمة لصالح الكاتب والمنصة."
                        : "The Publisher strictly undertakes to sell and distribute the book EXCLUSIVELY through the UNIGATES Book Store. Selling or distributing outside UNIGATES incurs direct civil and criminal legal liability, with statutory compensation payable to the Author and Platform."}
                    </p>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <span className="text-xs text-muted-foreground">{isAr ? "توقيع المؤلف" : "Author Signature"}</span>
                    <div className="font-serif italic font-bold text-amber-600 h-8 flex items-center justify-center">
                      {contractSigned ? selectedManuscript.authorName : "—"}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {contractSigned ? (isAr ? "تم التوقيع إلكترونياً" : "E-Signed") : (isAr ? "بانتظار التوقيع" : "Pending")}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <span className="text-xs text-muted-foreground">{isAr ? "توقيع الناشر" : "Publisher Signature"}</span>
                    <div className="font-serif italic font-bold text-foreground h-8 flex items-center justify-center">
                      {contractSigned ? (selectedBid?.publisherName || "دار النشر") : "—"}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {contractSigned ? (isAr ? "تم التوقيع والاعتماد" : "Confirmed") : (isAr ? "بانتظار التوقيع" : "Pending")}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 space-y-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{isAr ? "ختم دار عبيد للنشر والتوزيع" : "Dar Obeid Official Seal"}</span>
                    <div className="h-8 flex items-center justify-center text-amber-600">
                      <Stamp className="h-6 w-6 animate-pulse" />
                    </div>
                    <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                      {isAr ? "موثق قانونياً" : "Legally Certified"}
                    </Badge>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {isAr ? "التوقيع محمي ببصمة رقمية مشفرة eIDAS" : "Secured with eIDAS digital signature"}
                  </div>
                  <div className="flex gap-3">
                    {!contractSigned ? (
                      <Button onClick={handleSignContract} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6">
                        <FileSignature className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {isAr ? "الموافقة والتوقيع الإلكتروني" : "Sign E-Contract Now"}
                      </Button>
                    ) : (
                      <Button onClick={() => handleTabChange("escrow")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                        <Check className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {isAr ? "الانتقال إلى خطوة الدفع والنشر" : "Proceed to Escrow & Publish"}
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Escrow & Store Publishing */}
          <TabsContent value="escrow" className="max-w-3xl mx-auto space-y-6">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{isAr ? "حساب الضمان المالي والنشر بالمتجر" : "Escrow Settlement & Store Launch"}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {isAr ? "حماية المدفوعات وتوزيع الأرباح التلقائي مع حصرية العرض داخل متجر الكتب" : "Safe funds escrow and automatic royalty distribution on UNIGATES"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "حالة العقد الإلكتروني:" : "Contract Status:"}</span>
                    <Badge className={contractSigned ? "bg-emerald-500" : "bg-amber-500"}>
                      {contractSigned ? (isAr ? "موقع وموثق من دار عبيد" : "Signed & Certified") : (isAr ? "بانتظار استكمال التوقيع" : "Pending Signature")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "قناة البيع والتوزيع الحصرية:" : "Exclusive Channel:"}</span>
                    <strong className="text-amber-500 font-bold">{isAr ? "متجر كتب UNIGATES" : "UNIGATES Book Store"}</strong>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "نسبة حقوق الكاتب المودعة:" : "Author Royalty Deposit:"}</span>
                    <strong className="text-emerald-500 font-bold">{selectedBid?.royaltyPercentage || 65}% {isAr ? "لكل نسخة مباعة" : "per copy sold"}</strong>
                  </div>
                </div>

                {!escrowPaid ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                      {isAr 
                        ? "يتم حجز رسوم الطباعة والتجهيز في حساب الضمان (Escrow) التابع لدار عبيد ولا تُصرف إلا بعد وصول أول دفعة مطبوعة وإدراج الكتاب رسمياً بالمتجر."
                        : "Production funds are secured in Dar Obeid Escrow until physical copies are verified and live on UNIGATES Store."}
                    </div>

                    <Button 
                      onClick={handlePayEscrow} 
                      size="lg" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base"
                    >
                      <Coins className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                      {isAr ? "تأكيد إيداع الضمان وبدء الإنتاج والنشر" : "Confirm Escrow & Start Production"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground">{isAr ? "تم إطلاق الكتاب في متجر UNIGATES بنجاح!" : "Book is Live on UNIGATES Store!"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? "صفحة الكتاب جاهزة للطلب والشراء الحصري." : "Exclusive book listing is active and accepting orders."}
                      </p>
                    </div>

                    <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
                      <Link to="/book-store">
                        <BookOpen className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                        {isAr ? "الانتقال لصفحة الكتاب بمتجر الكتب" : "View on UNIGATES Book Store"}
                      </Link>
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NasherDashboard;
