import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import CloudHeader from "@/components/cloud/CloudHeader";
import CloudFooter from "@/components/cloud/CloudFooter";
import InstitutionRegistrationForm from "@/components/InstitutionRegistrationForm";

export default function TutoringCenterAdminSignup() {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <div className="cloud-site min-h-screen bg-background text-foreground flex flex-col font-sans" dir={dir}>
      <CloudHeader />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto w-full space-y-8">
        {/* Header Breadcrumb & Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isRtl ? "مساحة سحابية للسناتر التعليمية" : "Tutoring Center Cloud Workspace"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
            {isRtl ? "تسجيل سنتر تعليمي وقاعات تقوية" : "Register Tutoring & Educational Center"}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            {isRtl
              ? "أنشئ مساحتك السحابية المستقلة لإدارة مجموعات التقوية والحصص، حجز القاعات، ومتابعة حضور وغياب الطلاب والمذكرات تحت هويتك وشعارك."
              : "Launch your branded cloud workspace to manage tutoring groups, classroom reservations, attendance logs, and study materials."}
          </p>
        </div>

        {/* The Full Form with Tutoring Center preset */}
        <InstitutionRegistrationForm initialKind="tutoring_center" showKindSelector={true} />
      </main>

      <CloudFooter />
    </div>
  );
}
