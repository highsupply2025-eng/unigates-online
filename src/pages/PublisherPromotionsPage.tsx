import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Sparkles, 
  Timer, 
  TrendingUp, 
  Zap, 
  Bell, 
  CheckCircle2, 
  Crown, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Building2,
  Percent,
  Play,
  Calendar,
  AlertCircle
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

export const PublisherPromotionsPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store/publisher-dashboard");

  const catalog = BookStoreDataStore.getCatalog();
  const [sales, setSales] = useState(BookStoreDataStore.getFlashSales());

  const [selectedBookId, setSelectedBookId] = useState(catalog[0]?.id || "bk-dar-001");
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [durationHours, setDurationHours] = useState<number>(48);

  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleLaunchSale = (e: React.FormEvent) => {
    e.preventDefault();
    const newSale = BookStoreDataStore.createFlashSale(selectedBookId, Number(discountPercent), Number(durationHours));
    setSales(BookStoreDataStore.getFlashSales());
    toast({
      title: isRtl ? "تم إطلاق عرض الفلاش سيل بنجاح! 🔥" : "Flash Sale Launched! 🔥",
      description: isRtl
        ? `تم تطبيق خصم ${discountPercent}% لمدة ${durationHours} ساعة، وإرسال تنبيه فوري لـ ${newSale.notifiedWishlistCount} قارئاً في قائمة الرغبات.`
        : `Applied ${discountPercent}% discount and alerted ${newSale.notifiedWishlistCount} readers on their wishlist.`
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم حجز أولوية باقة العروض الترويجية! 🌟" : "Subscribed to Promotions Tier!",
      description: isRtl
        ? "ستحصل على 3 حملات ترويجية مجانية مع إشعار مباشر لجميع مستخدمي المنصة عند الإطلاق الرسمي."
        : "You will receive 3 free flash sale campaigns upon official launch."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-orange-600 selection:text-white" dir={dir}>
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
              {isRtl ? <ArrowRight className="w-4 h-4 text-orange-500" /> : <ArrowLeft className="w-4 h-4 text-orange-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store/publisher-dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES STUDIO
                </span>
                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {isRtl ? "محرك العروض والتخفيضات الفورية" : "Dynamic Promotions & Flash Sales Engine"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store/publisher-dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-orange-500/30 text-orange-600 dark:text-orange-400">
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
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-orange-500" />
                <span>{isRtl ? "ميزة احترافية لدور النشر • قريباً (باقة مدفوعة)" : "Publisher Pro Tier • Coming Soon (Paid Package)"}</span>
                <Badge variant="secondary" className="bg-orange-600 text-white hover:bg-orange-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    أداة التسعير الديناميكي <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent">وحملات الفلاش سيل الذكية</span>
                  </>
                ) : (
                  <>
                    Dynamic Pricing & <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent">Flash Sales Promotions</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "أطلق حملات تخفيض مبرمجة لفترة محدودة (مثل: خصم 25% لمدة 48 ساعة) مع عداد تنازلي حي يظهر على واجهة الكتاب في المتجر، وتنبيه تلقائي فوري لكل قارئ وضع الكتاب في قائمة رغباته لرفع المبيعات بنسبة تصل إلى 300%."
                  : "Launch timed flash sale campaigns with live countdown tickers on store book pages and instant push notifications to all readers who wishlisted your titles to maximize conversions."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-orange-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  {isRtl ? "احجز اشتراك باقة التسويق والعروض" : "Join Promotions Engine Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "كن أول دار نشر تطلق حملات فلاش سيل مع خصم 50% على الباقة" : "Get 50% launch discount on publisher marketing suites"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تسجيل دار النشر بنجاح!" : "Publisher Registered Successfully!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك مفتاح تفعيل باقة التسويق فور التدشين." : "Activation key will be emailed upon release."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريد مسؤول التسويق بالدار..." : "Enter marketing email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم للحصول على أولوية الإطلاق" : "Get Early Access"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Campaign Builder & Active Sales Demo */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Create Sale Simulator */}
          <Card className="lg:col-span-6 border-border shadow-md bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                {isRtl ? "محاكي إنشاء حملة فلاش سيل جديدة" : "Flash Sale Campaign Creator Simulator"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isRtl ? "حدد الكتاب ونسبة الخصم ومدة العرض لجدولة إرسال التنبيهات" : "Configure title, discount, and sale window"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              <form onSubmit={handleLaunchSale} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "اختر الكتاب من مؤلفات الدار" : "Select Book Title"}
                  </label>
                  <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                    <SelectTrigger className="text-xs h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {isRtl ? b.title_ar : b.title_en} ({b.price_digital} EGP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      {isRtl ? "نسبة الخصم (%)" : "Discount (%)"}
                    </label>
                    <Select value={String(discountPercent)} onValueChange={(val) => setDiscountPercent(Number(val))}>
                      <SelectTrigger className="text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15% {isRtl ? "خصم ترويجي" : "Discount"}</SelectItem>
                        <SelectItem value="20">20% {isRtl ? "خصم نهاية الأسبوع" : "Discount"}</SelectItem>
                        <SelectItem value="25">25% {isRtl ? "خصم فلاش سيل" : "Discount"}</SelectItem>
                        <SelectItem value="30">30% {isRtl ? "خصم بداية الفصل" : "Discount"}</SelectItem>
                        <SelectItem value="50">50% {isRtl ? "خصم نصف السعر" : "Half Price"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      {isRtl ? "مدة العرض بالساعات" : "Duration (Hours)"}
                    </label>
                    <Select value={String(durationHours)} onValueChange={(val) => setDurationHours(Number(val))}>
                      <SelectTrigger className="text-xs h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 {isRtl ? "ساعة (عرض خاطف)" : "Hours"}</SelectItem>
                        <SelectItem value="24">24 {isRtl ? "ساعة (يوم كامل)" : "Hours"}</SelectItem>
                        <SelectItem value="48">48 {isRtl ? "ساعة (عطلة الأسبوع)" : "Hours"}</SelectItem>
                        <SelectItem value="72">72 {isRtl ? "ساعة (3 أيام)" : "Hours"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-300">
                    <Bell className="w-4 h-4" />
                    <span>{isRtl ? "التنبيه التلقائي الذكي لقائمة الرغبات:" : "Smart Wishlist Push:"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isRtl
                      ? "سيتم إرسال إشعار فوري وتنبيه في حسابات كافة القراء والطلاب الذين أضافوا هذا المرجع إلى قائمة رغباتهم."
                      : "Instant alert will be dispatched to all readers tracking this title."}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs py-2.5 shadow-md gap-2"
                >
                  <Flame className="w-4 h-4" />
                  {isRtl ? "إطلاق عرض الفلاش سيل وتنبيه القراء (قريباً)" : "Launch Flash Sale (Coming Soon)"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Campaigns Stream */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-600" />
                {isRtl ? "العروض والتخفيضات النشطة حالياً" : "Active Flash Sales Stream"}
              </h3>
              <Badge className="bg-orange-600 text-white text-[10px]">
                {sales.length} {isRtl ? "عروض نشطة" : "Active"}
              </Badge>
            </div>

            <div className="space-y-3">
              {sales.map((s) => (
                <Card key={s.id} className="p-4 border-orange-500/30 bg-card shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge className="bg-red-500 text-white text-[10px] font-extrabold mb-1">
                        {isRtl ? `خصم ${s.discountPercentage}%` : `${s.discountPercentage}% OFF`}
                      </Badge>
                      <h4 className="font-bold text-sm text-foreground leading-snug">
                        {s.bookTitle}
                      </h4>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="text-xs text-muted-foreground line-through block">
                        {s.originalPrice} EGP
                      </span>
                      <span className="text-base font-black text-orange-600 dark:text-orange-400">
                        {s.discountedPrice} EGP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 text-muted-foreground flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-orange-600 font-bold">
                      <Timer className="w-3.5 h-3.5 animate-pulse" />
                      {isRtl ? `متبقي ${s.durationHours} ساعة` : `${s.durationHours}h remaining`}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRtl ? `تم تنبيه ${s.notifiedWishlistCount} قارئاً` : `${s.notifiedWishlistCount} alerted`}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
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

export default PublisherPromotionsPage;
