import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Radio, Search, Filter, Calendar, Users, Eye,
  Play, CheckCircle2, Clock, Video, Building2, GraduationCap, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface WatchLiveStreamsViewProps {
  isRtl: boolean;
  userId: string;
  institutionType?: "college" | "institute";
  streams: any[];
  streamAttendance?: Record<string, number>;
  onBack: () => void;
  onRefresh?: () => void;
}

export const WatchLiveStreamsView = ({
  isRtl,
  userId,
  institutionType = "college",
  streams,
  streamAttendance = {},
  onBack,
  onRefresh,
}: WatchLiveStreamsViewProps) => {
  const navigate = useNavigate();
  const isInstitute = institutionType === "institute";
  const instName = isInstitute ? (isRtl ? "المعهد" : "Institute") : (isRtl ? "الكلية" : "College");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "scheduled" | "ended">("all");

  const filteredStreams = streams.filter((stream) => {
    const titleMatch =
      (stream.title_ar || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.title_en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.instructor_ar || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.instructor_en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stream.category_ar || "").toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" ? true : stream.status === statusFilter;
    return titleMatch && statusMatch;
  });

  const liveCount = streams.filter((s) => s.status === "live").length;
  const scheduledCount = streams.filter((s) => s.status === "scheduled").length;
  const endedCount = streams.filter((s) => s.status === "ended").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Top Header with Back Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-2xl border-2 border-white/40 bg-white/15 hover:bg-white/30 text-white font-black px-4 py-2 gap-2 shrink-0 backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" strokeWidth={2.8} /> : <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />}
            <span>{isRtl ? "الرجوع للبث المباشر" : "Back to Streams"}</span>
          </Button>

          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black truncate tracking-tight text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-emerald-200" strokeWidth={2.8} />
              <span>{isRtl ? `استعراض ومشاهدة البثوث في ${instName}` : `Browse Broadcasts - ${instName}`}</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-white/90 truncate mt-0.5">
              {isRtl ? `متابعة البثوث الحية والمجدولة عبر أقسام وتخصصات ${instName}` : `Explore live and scheduled broadcasts`}
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="rounded-2xl border-2 border-white/40 bg-white/15 hover:bg-white/30 text-white font-bold gap-2 self-start sm:self-center"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </Button>
        )}
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث عن بث أو مادة أو محاضر..." : "Search streams or presenters..."}
            className="h-11 ps-10 rounded-2xl bg-card border-2 border-border font-bold text-xs sm:text-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="rounded-xl font-black text-xs gap-1.5 h-9"
          >
            <span>{isRtl ? "الكل" : "All"}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-md font-mono">
              {streams.length}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "live" ? "default" : "outline"}
            onClick={() => setStatusFilter("live")}
            className={`rounded-xl font-black text-xs gap-1.5 h-9 ${
              statusFilter === "live" ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-500/30 text-red-600"
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{isRtl ? "مباشر الآن" : "Live Now"}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-md font-mono">
              {liveCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "scheduled" ? "default" : "outline"}
            onClick={() => setStatusFilter("scheduled")}
            className={`rounded-xl font-black text-xs gap-1.5 h-9 ${
              statusFilter === "scheduled" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-500/30 text-blue-600"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isRtl ? "مجدول" : "Scheduled"}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-md font-mono">
              {scheduledCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "ended" ? "default" : "outline"}
            onClick={() => setStatusFilter("ended")}
            className={`rounded-xl font-black text-xs gap-1.5 h-9 ${
              statusFilter === "ended" ? "bg-slate-700 hover:bg-slate-800 text-white" : "border-slate-500/30 text-slate-700 dark:text-slate-300"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRtl ? "منتهي ومسجل" : "Ended / Recorded"}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-md font-mono">
              {endedCount}
            </Badge>
          </Button>
        </div>
      </div>

      {/* ── Streams Grid ── */}
      {filteredStreams.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border bg-card/50 shadow-sm">
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto shadow-inner">
              <Radio className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="font-black text-base sm:text-lg text-foreground">
              {isRtl ? "لا توجد بثوث تطابق البحث" : "No streams match your filter"}
            </h4>
            <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
              {isRtl ? "جرب تغيير خيارات التصفية أو البحث عن عنوان آخر." : "Try adjusting your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStreams.map((stream) => {
            const isLive = stream.status === "live";
            const isScheduled = stream.status === "scheduled";
            const viewers = streamAttendance[stream.id] || 0;

            return (
              <Card
                key={stream.id}
                className={`overflow-hidden rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isLive
                    ? "border-red-500/60 bg-gradient-to-br from-red-500/5 via-card to-card shadow-lg shadow-red-500/10"
                    : isScheduled
                      ? "border-blue-500/40 bg-gradient-to-br from-blue-500/5 via-card to-card"
                      : "border-border/70 bg-card"
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Row: Category + Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? "المادة:" : "Subject:"} {stream.category_ar || stream.category_en || (isRtl ? "عام" : "General")}</span>
                    </span>

                    <Badge
                      className={`font-black px-3 py-1 text-xs gap-1.5 rounded-xl ${
                        isLive
                          ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/30 animate-pulse"
                          : isScheduled
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            : "bg-slate-600 text-white"
                      }`}
                    >
                      {isLive ? (
                        <>
                          <Radio className="w-3.5 h-3.5" />
                          <span>{isRtl ? "مباشر الآن" : "Live Now"}</span>
                        </>
                      ) : isScheduled ? (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{isRtl ? "مجدول" : "Scheduled"}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? "منتهي ومسجل" : "Ended"}</span>
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Title & Presenter */}
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight leading-snug">
                      {isRtl ? stream.title_ar : stream.title_en}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{isRtl ? "مقدم البث:" : "Presenter:"} <span className="text-foreground">{stream.instructor_ar || stream.instructor_en || (isRtl ? "المحاضر" : "Faculty")}</span></span>
                    </div>
                  </div>

                  {/* Telemetry Row */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{viewers} {isRtl ? "طالب متفاعل" : "viewers"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {stream.scheduled_at
                          ? new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => navigate(`/stream/${stream.id}`)}
                    className={`w-full font-black rounded-2xl h-11 gap-2 shadow-md transition-all ${
                      isLive
                        ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/30 hover:scale-[1.02]"
                        : isScheduled
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/20 hover:scale-[1.02]"
                          : "bg-slate-700 hover:bg-slate-800 text-white shadow-slate-700/20 hover:scale-[1.02]"
                    }`}
                  >
                    <Eye className="w-4 h-4" strokeWidth={2.8} />
                    <span>
                      {isLive
                        ? (isRtl ? "دخول والتفاعل في البث المباشر 🔴" : "Join Live Room 🔴")
                        : isScheduled
                          ? (isRtl ? "دخول غرفة الانتظار والتعليق 📅" : "Enter Waiting Room 📅")
                          : (isRtl ? "مشاهدة التسجيل والتفاعل 👁️" : "Watch Replay & Chat 👁️")}
                    </span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
