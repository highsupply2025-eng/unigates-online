import React from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PromoVideoGenerator from "@/components/promo/PromoVideoGenerator";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PromoVideoPage() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100" dir={dir}>
      <SEO
        title={isAr ? "استوديو الفيديو الترويجي للمنصة | UNIGATES" : "UNIGATES Promotional Video Studio"}
        description={isAr ? "شاهد وحمل الفيديو الترويجي الرسمي لمنصة UNIGATES للنشر على وسائل التواصل الاجتماعي." : "Watch and download the official UNIGATES promotional video."}
      />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <PromoVideoGenerator />
      </main>
      <SiteFooter />
    </div>
  );
}
