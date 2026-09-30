import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Library,
  Navigation,
  Sparkles,
  User,
  Bike
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreLiveTrackingPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [orderQuery, setOrderQuery] = useState("UG-ORD-2026-9812");
  const trackingData = BookStoreDataStore.getLiveCourierTracking(orderQuery);

  const handleRefreshTracking = () => {
    toast({
      title: isRtl ? "تم تحديث موقع مندوب الشحن 📍" : "Courier Location Refreshed 📍",
      description: isRtl ? "المندوب يتحرك حالياً في التجمع الخامس على بعد 2.8 كم من عنوانك." : "Courier is 2.8 km away."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-blue-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES EXPRESS
                </span>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {isRtl ? "تتبع مسار الشحن الحي (مجاناً لجميع الطلبات الورقية)" : "Live Courier Tracking (Free)"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-bold gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRtl ? "خدمة مجانية متاحة الآن" : "Free Service Live"}</span>
            </Badge>
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <Link to="/book-store/reader/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-border">
                <Library className="w-4 h-4" />
                {isRtl ? "مكتبتي" : "My Library"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 via-background to-background py-10 px-4 sm:px-8 border-b border-border/30">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-600 text-white font-mono text-[10px]">
                  {trackingData.trackingNumber}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/40">
                  {isRtl ? "شحن إكسبريس مباشر" : "Direct Express"}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {isRtl ? "تتبع طرد الكتب الورقية على الخريطة الحية 📦" : "Live Book Parcel Tracking 📦"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isRtl
                  ? `الوجهة: ${trackingData.destinationAddress} • الموعد المتوقع للتسليم: ${trackingData.estimatedDeliveryTime}`
                  : `Destination: ${trackingData.destinationAddress}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="UG-ORD-2026-9812"
                className="text-xs h-9 font-mono w-48"
              />
              <Button onClick={handleRefreshTracking} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9">
                {isRtl ? "تحديث المسار" : "Refresh"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tracking View */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Live Map Simulator */}
          <Card className="lg:col-span-7 border-border shadow-xl bg-card overflow-hidden">
            <div className="p-4 bg-muted/40 border-b border-border/50 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-foreground">
                <Navigation className="w-4 h-4 text-blue-600 animate-spin" />
                {isRtl ? "خريطة الملاحة الحية للمندوب (GPS Live)" : "Courier Live GPS Navigation"}
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                {isRtl ? "على بعد 3.2 كم" : "3.2 km away"}
              </Badge>
            </div>

            {/* Simulated Dynamic Map Canvas */}
            <div className="relative h-[380px] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
              {/* Map Grid Pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Roads lines */}
              <svg className="absolute inset-0 w-full h-full stroke-blue-500/30 stroke-2" fill="none">
                <path d="M 50 180 Q 200 80, 380 200 T 700 240" strokeDasharray="6 6" />
                <path d="M 120 340 L 400 190 L 650 120" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="3" />
              </svg>

              {/* Destination Point */}
              <div className="absolute top-16 end-16 flex flex-col items-center animate-bounce">
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <Badge className="bg-rose-600 text-white text-[10px] mt-1 shadow">
                  {isRtl ? "منزلك (وجهة التسليم)" : "Your Doorstep"}
                </Badge>
              </div>

              {/* Moving Courier Icon */}
              <div className="absolute top-44 start-1/3 flex flex-col items-center transition-all duration-1000">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
                  <Bike className="w-6 h-6" />
                </div>
                <div className="p-1.5 rounded-lg bg-card/90 border border-border/80 text-[10px] font-bold text-foreground mt-1 shadow text-center">
                  <p className="text-blue-600">{trackingData.courierName}</p>
                  <p className="text-[9px] text-muted-foreground">{trackingData.courierVehicle}</p>
                </div>
              </div>

              {/* Origin Warehouse Point */}
              <div className="absolute bottom-8 start-8 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow border-2 border-white">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-zinc-400 mt-1 font-bold">
                  {isRtl ? "مستودع دار عبيد" : "Dar Obeid Hub"}
                </span>
              </div>
            </div>

            {/* Courier Contact Bar */}
            <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-base">
                  👨‍✈️
                </div>
                <div>
                  <p className="font-black text-xs text-foreground">{trackingData.courierName}</p>
                  <p className="text-[11px] text-muted-foreground">{trackingData.courierVehicle}</p>
                </div>
              </div>

              <Button
                onClick={() =>
                  toast({
                    title: isRtl ? "جاري الاتصال بمندوب الشحن 📞" : "Calling courier...",
                    description: `${trackingData.courierPhone}`
                  })
                }
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isRtl ? "اتصال بالمندوب" : "Call Courier"}</span>
              </Button>
            </div>
          </Card>

          {/* Stepper Milestones & Parcel Items */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Steps */}
            <Card className="border-border shadow-md bg-card p-5 space-y-4">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                {isRtl ? "مراحل الشحنة والتسليم" : "Delivery Checkpoints"}
              </h3>

              <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:start-3.5 before:w-0.5 before:bg-border">
                {trackingData.checkpoints.map((cp) => (
                  <div key={cp.id} className="relative flex items-start gap-3 ps-8">
                    <div
                      className={`absolute start-1.5 top-0.5 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                        cp.status === "completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : cp.status === "current"
                          ? "border-blue-500 bg-blue-500 text-white animate-ping"
                          : "border-muted-foreground"
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-foreground">{cp.titleAr}</h4>
                        <span className="text-[10px] text-muted-foreground shrink-0">{cp.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {cp.descriptionAr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Books in Parcel */}
            <Card className="border-border shadow-md bg-card p-5 space-y-3">
              <h4 className="font-black text-xs text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                {isRtl ? "الكتب الورقية المشمولة في الطرد:" : "Books in this parcel:"}
              </h4>
              <div className="space-y-2">
                {trackingData.booksList.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                    <img src={b.cover} alt={b.title} className="w-10 h-12 object-cover rounded shadow" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{isRtl ? `الكمية: ${b.count} نسخة أصلية` : `Qty: ${b.count}`}</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[9px] font-mono">
                      QR SEALED
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لمتجر الكتب
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Book Store
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

export default BookStoreLiveTrackingPage;
