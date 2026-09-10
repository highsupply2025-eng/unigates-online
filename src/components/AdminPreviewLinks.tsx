import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, UserCheck, Crown, Landmark, School, BookOpen,
  ExternalLink, BookMarked, Briefcase, MessageSquare, Sparkles,
  Zap, Radio, Terminal, Cpu
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ADMIN_WHATSAPP_NUMBER } from "@/utils/whatsappNotifications";

/**
 * Futuristic Holographic Dashboard Preview Grid.
 */
const AdminPreviewLinks = ({ compact = false }: { compact?: boolean }) => {
  const { language } = useLanguage();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const items = [
    {
      to: "/student/dashboard",
      label: ar("لوحة الطالب", "Student Dashboard"),
      tag: "NEURAL-STU",
      icon: GraduationCap,
      color: "from-cyan-500 to-blue-600",
      borderGlow: "hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]",
      textColor: "text-cyan-400",
    },
    {
      to: "/lecturer/dashboard",
      label: ar("لوحة المحاضر", "Lecturer Dashboard"),
      tag: "FACULTY-CORE",
      icon: UserCheck,
      color: "from-emerald-500 to-teal-600",
      borderGlow: "hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      textColor: "text-emerald-400",
    },
    {
      to: "/leadership/dashboard",
      label: ar("لوحة القيادة", "Leadership Dashboard"),
      tag: "COMMAND-VIP",
      icon: Crown,
      color: "from-amber-400 to-orange-500",
      borderGlow: "hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      textColor: "text-amber-400",
    },
    {
      to: "/institution/dashboard",
      label: ar("لوحة الكلية/المعهد", "Institution Dashboard"),
      tag: "CAMPUS-GRID",
      icon: Landmark,
      color: "from-indigo-500 to-purple-600",
      borderGlow: "hover:border-indigo-500/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]",
      textColor: "text-indigo-400",
    },
    {
      to: "/school/dashboard",
      label: ar("لوحة المدرسة", "School Dashboard"),
      tag: "ACADEMY-SYS",
      icon: School,
      color: "from-purple-500 to-pink-600",
      borderGlow: "hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]",
      textColor: "text-purple-400",
    },
    {
      to: "/school/teacher/dashboard",
      label: ar("لوحة المعلم", "Teacher Dashboard"),
      tag: "INSTRUCTOR",
      icon: BookOpen,
      color: "from-pink-500 to-rose-600",
      borderGlow: "hover:border-pink-500/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]",
      textColor: "text-pink-400",
    },
    {
      to: "/school/student/dashboard",
      label: ar("لوحة طالب المدرسة", "School Student"),
      tag: "K12-LEARNER",
      icon: GraduationCap,
      color: "from-sky-400 to-cyan-600",
      borderGlow: "hover:border-sky-500/60 hover:shadow-[0_0_20px_rgba(14,165,233,0.25)]",
      textColor: "text-sky-400",
    },
    {
      to: "/nasher/dashboard",
      label: ar("لوحة الناشر والمؤلف", "Nasher Dashboard"),
      tag: "PRESS-HUB",
      icon: BookMarked,
      color: "from-rose-500 to-red-600",
      borderGlow: "hover:border-rose-500/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]",
      textColor: "text-rose-400",
    },
    {
      to: "/career",
      label: ar("لوحة التوظيف والتدريب", "Career Platform"),
      tag: "CAREER-MATRIX",
      icon: Briefcase,
      color: "from-teal-400 to-emerald-600",
      borderGlow: "hover:border-teal-500/60 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)]",
      textColor: "text-teal-400",
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all text-xs font-semibold min-w-0"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${it.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate flex-1">{it.label}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative mb-8 rounded-3xl p-5 sm:p-6 border border-cyan-500/20 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.08)] overflow-hidden">
      {/* Sci-Fi Decorative Corner Accents */}
      <div className="absolute top-0 start-0 w-8 h-8 border-t-2 border-s-2 border-cyan-400/60 rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-0 end-0 w-8 h-8 border-t-2 border-e-2 border-cyan-400/60 rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-0 start-0 w-8 h-8 border-b-2 border-s-2 border-cyan-400/60 rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-0 end-0 w-8 h-8 border-b-2 border-e-2 border-cyan-400/60 rounded-br-2xl pointer-events-none" />

      {/* Cyber Grid Background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header HUD Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap border-b border-cyan-500/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg tracking-wide flex items-center gap-2">
                  {ar("بوابة المعاينة المباشرة للقطاعات", "Quantum Portal — Live Dashboard Previews")}
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  ONLINE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ar("الولوج المباشر والمحاكاة الآنية لكافة واجهات المستخدمين بصلاحيات الإدارة العليا", "Real-time holographic simulation and direct access to all user portal environments.")}
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/60 hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>00966563057356</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 rounded border border-emerald-400/30">DISPATCH</span>
          </a>
        </div>

        {/* Futuristic Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`group relative flex items-center justify-between p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850/90 transition-all duration-300 backdrop-blur-xl ${it.borderGlow} overflow-hidden`}
              >
                {/* Subtle Neon Line at Card Top */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent group-hover:via-cyan-400/60 transition-all" />

                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${it.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-100 group-hover:text-white truncate">
                        {it.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300/80 border border-slate-700/60">
                        {it.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate" dir="ltr">
                        {it.to}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ms-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all">
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPreviewLinks;

