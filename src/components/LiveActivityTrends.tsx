import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SectionDatum } from "./SectionsActivityChart";

interface Props {
  sections: SectionDatum[];
  days?: number;
  className?: string;
}

export const LiveActivityTrends = ({ sections, days = 7, className = "" }: Props) => {
  const { isRtl, translate, tText } = useLanguage();

  const data = useMemo(() => {
    const today = new Date();
    // Initialize buckets for the last N days
    const buckets: Record<string, any> = {};
    const dateList: string[] = [];
    
    // Create buckets (e.g. "2024-05-01")
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0]; // yyyy-mm-dd
      dateList.push(dateStr);
      
      const dayName = d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
      buckets[dateStr] = {
        name: dayName,
        dateStr,
      };
      
      // Initialize 0 for each section
      sections.forEach(s => {
        if (!s.fixedPercentage) {
          buckets[dateStr][translate(s.label)] = 0;
        }
      });
    }

    const since = today.getTime() - days * 24 * 60 * 60 * 1000;

    sections.forEach(s => {
      if (s.fixedPercentage) return; // Skip static elements like "Account Data"
      
      const label = translate(s.label);
      (s.timestamps || []).forEach(t => {
        if (!t) return;
        const dateObj = typeof t === "string" ? new Date(t) : t;
        const ts = dateObj.getTime();
        
        if (ts >= since) {
          const dateStr = dateObj.toISOString().split("T")[0];
          if (buckets[dateStr]) {
            buckets[dateStr][label] += 1;
          }
        }
      });
    });

    return dateList.map(dateStr => buckets[dateStr]);
  }, [sections, days, isRtl, translate]);

  const activeSections = sections.filter(s => !s.fixedPercentage);

  if (!activeSections || activeSections.length === 0) return null;

  return (
    <Card className={`overflow-hidden border-2 border-primary/10 shadow-lg rounded-3xl ${className}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <CardTitle className="text-base sm:text-lg font-black">
              {tText("مؤشرات النشاط الزمني", "Activity Time Trends")}
            </CardTitle>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{tText("مباشر", "Live")}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-1 pl-0 pr-4 sm:pr-6 sm:pl-2 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: isRtl ? 30 : 10, left: isRtl ? 10 : 30, bottom: 0 }}>
            <defs>
              {activeSections.map((s, i) => (
                <linearGradient key={`color-${i}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.palette?.from || s.color || "#3b82f6"} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={s.palette?.from || s.color || "#3b82f6"} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} 
              allowDecimals={false}
              orientation={isRtl ? "right" : "left"}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontWeight: 700 }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '13px' }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '15px' }} 
            />
            {activeSections.map((s, i) => (
              <Area 
                key={i} 
                type="monotone" 
                dataKey={translate(s.label)} 
                stroke={s.palette?.from || s.color || "#3b82f6"} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#color-${i})`} 
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LiveActivityTrends;
