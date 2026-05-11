import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Globe, Radio, Calendar, Clock, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";

const LiveStreams = () => {
  const { language, dir, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const ls = t.liveStreamsPage;

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["live-streams-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*")
        .in("status", ["live", "scheduled"])
        .order("status", { ascending: true })
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const liveStreams = streams.filter((s) => s.status === "live");
  const scheduledStreams = streams.filter((s) => s.status === "scheduled");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Link to="/">
              <Button variant="default" size="icon" className="rounded-full w-9 h-9">
                {language === "ar" ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 rounded-full mb-4">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-bold">{ls.liveBadge}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">{ls.title}</h1>
          <p className="text-muted-foreground text-lg">{ls.subtitle}</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">{ls.noStreams}</h3>
            <p className="text-muted-foreground mb-6">{ls.noStreamsDesc}</p>
            <Link to="/courses">
              <Button>{t.exploreCourses}</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Live Now */}
            {liveStreams.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <h2 className="text-2xl font-black text-foreground">{ls.liveNow}</h2>
                  <Badge variant="destructive" className="text-xs">{liveStreams.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="group relative bg-card border-2 border-destructive/30 rounded-2xl p-6 hover:border-destructive/60 hover:shadow-xl transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/stream/${stream.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="destructive" className="gap-1.5 animate-pulse">
                          <Radio className="w-3 h-3" />
                          {ls.live}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {language === "ar" ? stream.title_ar : stream.title_en}
                      </h3>
                      <Button className="w-full gap-2 mt-2">
                        {ls.joinNow}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled */}
            {scheduledStreams.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-black text-foreground">{ls.upcoming}</h2>
                  <Badge variant="secondary" className="text-xs">{scheduledStreams.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scheduledStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="secondary" className="gap-1.5">
                          <Clock className="w-3 h-3" />
                          {ls.scheduled}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-3">
                        {language === "ar" ? stream.title_ar : stream.title_en}
                      </h3>
                      {stream.scheduled_at && (
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(stream.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(stream.scheduled_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LiveStreams;
