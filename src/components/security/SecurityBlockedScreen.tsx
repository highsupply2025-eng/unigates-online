import React from "react";
import { ShieldAlert, Lock, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFirewall } from "@/contexts/FirewallContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const SecurityBlockedScreen: React.FC = () => {
  const { blockedIncident, dismissBlockedIncident } = useFirewall();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  if (!blockedIncident) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      dir={dir}
    >
      <Card className="max-w-lg w-full border-2 border-red-500/40 bg-slate-900/95 text-slate-100 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.35)] rounded-3xl overflow-hidden">
        {/* Top Danger Bar */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse" />

        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          {/* 3D Shield Icon with Pulse */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-600/10 border border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/20">
            <div className="absolute inset-0 rounded-3xl bg-red-500/20 blur-xl animate-pulse" />
            <ShieldAlert className="w-10 h-10 text-red-500 relative z-10" />
          </div>

          {/* Title and Explanation */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isRtl ? "تم إحباط محاولة غير آمنة" : "Security Threat Blocked"}
            </h2>
            <p className="text-sm text-slate-300">
              {isRtl
                ? "قام جدار الحماية الرقمي (UniGates WAF) برصد واعتراض حمولة مشبوهة ومنع تنفيذها لحماية بيانات المنصة والجامعة."
                : "UniGates Web Application Firewall intercepted and blocked a suspicious payload to safeguard the platform and institutional data."}
            </p>
          </div>

          {/* Incident Details Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-start space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>{isRtl ? "نوع التهديد:" : "Threat Type:"}</span>
              <span className="font-mono text-red-400 font-bold uppercase">{blockedIncident.pattern}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>{isRtl ? "مستوى الخطورة:" : "Severity:"}</span>
              <span className="font-bold text-rose-400 uppercase">{blockedIncident.severity}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>{isRtl ? "رقم المرجع:" : "Incident ID:"}</span>
              <span className="font-mono text-slate-300">{blockedIncident.id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>{isRtl ? "الوقت والتاريخ:" : "Timestamp:"}</span>
              <span className="font-mono text-slate-300">{new Date(blockedIncident.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-red-600/30"
              onClick={dismissBlockedIncident}
            >
              <RotateCcw className="w-4 h-4 me-2" />
              {isRtl ? "العودة والاستمرار بأمان" : "Acknowledge & Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
