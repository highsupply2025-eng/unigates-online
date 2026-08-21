import { Eye, Play, GraduationCap, Clock, Film, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface WatchLecturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: any[];
  episodes: any[];
}

const WatchLecturesDialog = ({ open, onOpenChange, courses, episodes }: WatchLecturesDialogProps) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const totalEpisodes = courses.reduce((sum, c) => {
    return sum + episodes.filter(e => e.course_id === c.id).length;
  }, 0);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} ${isRtl ? "دقيقة" : "min"}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 pt-8 pb-10 text-center">
          <DialogClose className="absolute left-3 top-3 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-md flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all duration-200">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
            <Eye className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <DialogTitle className="text-xl font-black text-white tracking-tight">
            {isRtl ? "مشاهدة المحاضرات من اللوحات الأخرى" : "Watch Lectures from Other Boards"}
          </DialogTitle>
          <p className="text-sm text-white/75 mt-1 font-medium">
            {courses.length > 0
              ? isRtl
                ? `${courses.length} محاضرة \u2014 ${totalEpisodes} حلقة`
                : `${courses.length} courses \u2014 ${totalEpisodes} episodes`
              : isRtl ? "لم تُضاف أي محاضرات بعد" : "No lectures added yet"}
          </p>
        </div>

        <div className="px-6 py-5">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                <Inbox className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">
                {isRtl ? "لا توجد محاضرات" : "No Lectures Available"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {isRtl
                  ? "لم تُضاف أي محاضرات من اللوحات الأخرى بعد. ستظهر هنا عندما تتم إضافة محتوى جديد."
                  : "No lectures from other boards have been added yet. They will appear here when new content is available."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map(course => {
                const courseEps = episodes
                  .filter(e => e.course_id === course.id)
                  .sort((a, b) => (a.level_number - b.level_number) || (a.episode_number - b.episode_number));
                const totalDuration = courseEps.reduce((sum, ep) => sum + (ep.duration_minutes || 0), 0);

                return (
                  <Card key={course.id} className="overflow-hidden border border-border/40 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
                    <CardHeader className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-black text-foreground truncate">
                              {isRtl ? course.title_ar : course.title_en}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              {isRtl ? course.instructor_ar : course.instructor_en}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs font-bold gap-1">
                            <Film className="w-3 h-3" />
                            {courseEps.length}
                          </Badge>
                          {totalDuration > 0 && (
                            <Badge variant="outline" className="text-xs font-bold gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(totalDuration)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {courseEps.length > 0 && (
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/30">
                          {courseEps.map((ep, idx) => (
                            <div key={ep.id} className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-500/5 transition-colors group/ep">
                              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                                {ep.episode_number}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{isRtl ? ep.title_ar : ep.title_en}</p>
                                {ep.duration_minutes > 0 && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {ep.duration_minutes} {isRtl ? "دقيقة" : "min"}
                                  </p>
                                )}
                              </div>
                              {ep.video_url && (
                                <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm shadow-emerald-500/20 opacity-80 group-hover/ep:opacity-100 transition-all" onClick={() => window.open(ep.video_url, '_blank')}>
                                  <Play className="w-3.5 h-3.5 fill-current" /> {isRtl ? "مشاهدة" : "Watch"}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchLecturesDialog;
