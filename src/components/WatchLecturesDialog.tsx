import { Eye, Play, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            {isRtl ? "مشاهدة المحاضرات من اللوحات الأخرى" : "Watch Lectures from Other Boards"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{isRtl ? "لا توجد محاضرات بعد" : "No lectures yet"}</p>
          ) : (
            courses.map(course => {
              const courseEps = episodes
                .filter(e => e.course_id === course.id)
                .sort((a, b) => (a.level_number - b.level_number) || (a.episode_number - b.episode_number));
              return (
                <Card key={course.id} className="overflow-hidden border border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-foreground truncate">
                          {isRtl ? course.title_ar : course.title_en}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {isRtl ? course.instructor_ar : course.instructor_en}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold shrink-0">
                        {courseEps.length} {isRtl ? "حلقة" : "episodes"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {courseEps.length > 0 && (
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {courseEps.map(ep => (
                          <div key={ep.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{ep.episode_number}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{isRtl ? ep.title_ar : ep.title_en}</p>
                              {ep.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{ep.duration_minutes} {isRtl ? "دقيقة" : "min"}</p>}
                            </div>
                            {ep.video_url && (
                              <Button size="sm" variant="ghost" className="gap-1 text-xs font-bold text-primary" onClick={() => window.open(ep.video_url, '_blank')}>
                                <Play className="w-3.5 h-3.5" /> {isRtl ? "مشاهدة" : "Watch"}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchLecturesDialog;
