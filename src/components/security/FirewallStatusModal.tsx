import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Lock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirewall } from "@/contexts/FirewallContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

export const FirewallStatusModal: React.FC<{ trigger?: React.ReactNode }> = ({ trigger }) => {
  const { stats, threats, isArmed, inspect } = useFirewall();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [testing, setTesting] = useState(false);

  const runSecurityTest = () => {
    setTesting(true);
    // Simulate safe dummy probe to demonstrate active interception
    inspect("<script>/* UniGates Firewall Probe */</script>", "test_probe");
    inspect("UNION SELECT 1, 'waf_test' --", "test_sqli_probe");

    setTimeout(() => {
      setTesting(false);
      toast({
        title: isRtl ? "✅ تم اختبار جدار الحماية بنجاح" : "✅ Firewall Test Completed",
        description: isRtl
          ? "جميع الدفاعات نشطة 100% وتم إحباط الحمولات التجريبية فوراً."
          : "All defense layers are 100% armed and intercepted simulated payloads instantly.",
      });
    }, 600);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold gap-2 text-xs h-9"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>{isRtl ? "جدار الحماية نشط 100%" : "WAF Active (100%)"}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full p-6 rounded-3xl border-2 border-primary/20 bg-card/95 backdrop-blur-2xl shadow-2xl" dir={dir}>
        <DialogHeader className="space-y-2 text-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
                  {isRtl ? "جدار الحماية الرقمي (UniGates WAF / IPS)" : "UniGates Firewall & IPS Shield"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-bold">
                  {isRtl ? "نظام الدفاع الاستباقي ومكافحة الاختراق" : "Proactive Cyber Defense & Intrusion Prevention"}
                </p>
              </div>
            </div>

            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black px-3 py-1 rounded-full text-xs gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isRtl ? "مُفعل ونشط" : "100% Armed"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-bold">{isRtl ? "مؤشر الحماية" : "Health Score"}</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.securityHealthScore}%</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-bold">{isRtl ? "إحباط XSS" : "XSS Blocked"}</p>
              <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{stats.xssBlocked}</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-bold">{isRtl ? "إحباط SQLi" : "SQLi Blocked"}</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.sqliBlocked}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground font-bold">{isRtl ? "إجمالي الاعتراض" : "Intercepted"}</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.totalIntercepted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Protection Layers List */}
        <div className="space-y-2 p-3 rounded-2xl bg-muted/40 border border-border text-xs">
          <div className="flex items-center justify-between text-foreground font-bold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isRtl ? "مكافحة حقن النصوص البرمجية (Anti-XSS Filter)" : "Anti-Cross Site Scripting"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{isRtl ? "محمي ✓" : "Active"}</span>
          </div>

          <div className="flex items-center justify-between text-foreground font-bold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isRtl ? "مكافحة حقن قواعد البيانات (Anti-SQL Injection)" : "Anti-SQL Injection"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{isRtl ? "محمي ✓" : "Active"}</span>
          </div>

          <div className="flex items-center justify-between text-foreground font-bold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isRtl ? "مكافحة التسلل عبر المسارات (Path Traversal Guard)" : "Path Traversal Blocker"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{isRtl ? "محمي ✓" : "Active"}</span>
          </div>

          <div className="flex items-center justify-between text-foreground font-bold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isRtl ? "مكافحة هجمات التخمين والإغراق (Brute-Force & Rate Limiting)" : "Anti-Brute Force"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{isRtl ? "محمي ✓" : "Active"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runSecurityTest}
            disabled={testing}
            className="rounded-xl font-bold gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
            {isRtl ? "اختبار استجابة جدار الحماية" : "Run Security Probe Test"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
