import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  inspectPayload,
  inspectObject,
  checkRateLimit,
  recordThreat,
  getThreatLog,
  getFirewallStats,
  SecurityThreat,
  FirewallReport,
  RateLimitConfig,
} from "@/lib/security/firewall";
import { toast } from "@/hooks/use-toast";

interface FirewallContextType {
  isArmed: boolean;
  inspect: (input: string, sourcePath?: string) => FirewallReport;
  inspectData: <T>(data: T, sourcePath?: string) => { isSafe: boolean; threats: SecurityThreat[]; sanitizedData: T };
  enforceRateLimit: (action: string, customConfig?: RateLimitConfig) => boolean;
  threats: SecurityThreat[];
  stats: ReturnType<typeof getFirewallStats>;
  blockedIncident: SecurityThreat | null;
  dismissBlockedIncident: () => void;
  reportMaliciousActivity: (threat: SecurityThreat) => void;
}

const FirewallContext = createContext<FirewallContextType | null>(null);

export const FirewallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [threats, setThreats] = useState<SecurityThreat[]>(() => getThreatLog());
  const [blockedIncident, setBlockedIncident] = useState<SecurityThreat | null>(null);
  const [statsTick, setStatsTick] = useState(0);

  const stats = useMemo(() => getFirewallStats(), [statsTick, threats]);

  const reportMaliciousActivity = useCallback((threat: SecurityThreat) => {
    recordThreat(threat);
    setThreats(getThreatLog());
    setStatsTick((t) => t + 1);

    if (threat.severity === "critical" || threat.severity === "high") {
      setBlockedIncident(threat);
      toast({
        title: "🛡️ تم اعتراض محاولة مشبوهة بواسطة جدار الحماية",
        description: `تم إحباط تهديد أمني (${threat.pattern}) لحماية حسابك والمنصة.`,
        variant: "destructive",
      });
    }
  }, []);

  const inspect = useCallback(
    (input: string, sourcePath = ""): FirewallReport => {
      const report = inspectPayload(input, sourcePath);
      if (!report.isSafe) {
        for (const threat of report.threats) {
          reportMaliciousActivity(threat);
        }
      }
      return report;
    },
    [reportMaliciousActivity]
  );

  const inspectData = useCallback(
    <T,>(data: T, sourcePath = "") => {
      const result = inspectObject(data, sourcePath);
      if (!result.isSafe) {
        for (const threat of result.threats) {
          reportMaliciousActivity(threat);
        }
      }
      return result;
    },
    [reportMaliciousActivity]
  );

  const enforceRateLimit = useCallback(
    (action: string, customConfig?: RateLimitConfig): boolean => {
      const res = checkRateLimit(action, "client_session", customConfig);
      if (!res.allowed) {
        const threat: SecurityThreat = {
          id: `threat_rl_${Date.now()}`,
          category: "rate_limit_exceeded",
          severity: "medium",
          pattern: `Rate Limit Exceeded for action: ${action}`,
          sanitizedEvidence: `Throttled after reaching threshold. Retry in ${Math.ceil(res.resetTimeMs / 1000)}s`,
          timestamp: new Date().toISOString(),
          blocked: true,
          sourcePath: action,
        };
        reportMaliciousActivity(threat);
        toast({
          title: "⚠️ تم تجاوز الحد المسموح للطلبات",
          description: `يرجى الانتظار ${Math.ceil(res.resetTimeMs / 1000)} ثانية قبل المحاولة مرة أخرى لحماية الحساب.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    },
    [reportMaliciousActivity]
  );

  const dismissBlockedIncident = useCallback(() => {
    setBlockedIncident(null);
  }, []);

  // Continuous URL Parameter & Path Intrusion Scanner
  useEffect(() => {
    const fullSearch = location.search;
    if (fullSearch) {
      const report = inspectPayload(decodeURIComponent(fullSearch), location.pathname);
      if (!report.isSafe) {
        for (const t of report.threats) {
          reportMaliciousActivity(t);
        }
      }
    }
  }, [location.pathname, location.search, reportMaliciousActivity]);

  const value: FirewallContextType = {
    isArmed: true,
    inspect,
    inspectData,
    enforceRateLimit,
    threats,
    stats,
    blockedIncident,
    dismissBlockedIncident,
    reportMaliciousActivity,
  };

  return <FirewallContext.Provider value={value}>{children}</FirewallContext.Provider>;
};

export const useFirewall = (): FirewallContextType => {
  const ctx = useContext(FirewallContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      isArmed: true,
      inspect: (input: string, sourcePath = "") => inspectPayload(input, sourcePath),
      inspectData: <T,>(data: T, sourcePath = "") => inspectObject(data, sourcePath),
      enforceRateLimit: (action: string, customConfig?: RateLimitConfig) =>
        checkRateLimit(action, "fallback", customConfig).allowed,
      threats: [],
      stats: {
        totalIntercepted: 0,
        xssBlocked: 0,
        sqliBlocked: 0,
        rateLimitHits: 0,
        criticalThreats: 0,
        securityHealthScore: 100,
      },
      blockedIncident: null,
      dismissBlockedIncident: () => {},
      reportMaliciousActivity: () => {},
    };
  }
  return ctx;
};
