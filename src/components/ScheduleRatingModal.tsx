import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle2, Loader2, Award, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  courseId?: string;
  scheduleTitle: string;
  location?: string;
  instructorName?: string;
  onRated?: () => void;
}

export const ScheduleRatingModal = ({
  open,
  onOpenChange,
  scheduleId,
  courseId,
  scheduleTitle,
  location,
  instructorName,
  onRated,
}: ScheduleRatingModalProps) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !scheduleId) return;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;

        const { data: existing } = await supabase
          .from("schedule_ratings")
          .select("id, rating, comment")
          .eq("user_id", auth.user.id)
          .eq("schedule_id", scheduleId)
          .maybeSingle();

        if (existing) {
          setExistingRatingId(existing.id);
          setRating(existing.rating || 0);
          setComment(existing.comment || "");
        } else {
          setExistingRatingId(null);
          setRating(0);
          setComment("");
        }
      } catch (err) {
        console.error("Error fetching schedule rating:", err);
      }
    })();
  }, [open, scheduleId]);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: isRtl ? "الرجاء تحديد التقييم بالنجوم" : "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      if (existingRatingId) {
        const { error } = await supabase
          .from("schedule_ratings")
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRatingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schedule_ratings").insert({
          schedule_id: scheduleId,
          user_id: auth.user.id,
          rating,
          comment: comment.trim() || null,
        });
        if (error) throw error;
      }

      toast({
        title: isRtl ? "تم حفظ تقييم الجدول بنجاح! ⭐" : "Schedule rating submitted! ⭐",
        description: isRtl ? `تم تسجيل تقييمك (${rating} من 5)` : `Rating recorded (${rating}/5)`,
      });

      onRated?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving schedule rating:", err);
      toast({
        title: isRtl ? "فشل حفظ التقييم" : "Failed to save rating",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStarLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return isRtl ? "ممتاز جداً - تنظيم وتوقيت مثالي" : "Outstanding - Perfect Scheduling";
      case 4:
        return isRtl ? "جيد جداً - مناسب وملائم" : "Very Good - Suitable & Clear";
      case 3:
        return isRtl ? "جيد - يفي بالغرض" : "Good - Acceptable";
      case 2:
        return isRtl ? "مقبول - يحتاج تحسين وتنسيق القاعات" : "Fair - Needs Schedule Optimization";
      case 1:
        return isRtl ? "ضعيف - تعارض في المواعيد أو القاعات" : "Poor - Clashing or Inconvenient";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader className="text-center space-y-2 pb-2 border-b">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
            <Award className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {isRtl ? "تقييم جودة وتنظيم الجدول الدراسي" : "Evaluate Schedule & Timing Quality"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {isRtl
              ? "ملاحظاتك وتقييمك الأكاديمي يساهم في ضبط جودة المواعيد وتفادي التعارضات بالكلية."
              : "Your evaluation helps maintain optimal timetable distribution and room availability."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Schedule Summary Info Box */}
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground truncate">{scheduleTitle}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate mt-0.5">
                {instructorName && <span>{instructorName}</span>}
                {location && <span className="text-amber-600 dark:text-amber-400 font-bold">• {location}</span>}
              </div>
            </div>
          </div>

          {/* Interactive 5-Star Rating */}
          <div className="text-center space-y-2 py-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = hoverRating ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-xl transition-all transform hover:scale-125 focus:outline-none"
                    aria-label={`${star} stars`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        active
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="h-5">
              {(hoverRating || rating) > 0 && (
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 animate-in fade-in-50">
                  {getStarLabel(hoverRating || rating)}
                </p>
              )}
            </div>
          </div>

          {/* Comment / Feedback */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "ملاحظاتك وتقييمك للأداء والتنظيم (اختياري):" : "Timetable feedback & notes (Optional):"}</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isRtl
                  ? "أضف ملاحظاتك حول ملاءمة المواعيد، توزيع القاعات، الفترات البينية، وعدم وجود تعارضات..."
                  : "Write your notes regarding timing, lecture hall space, breaks, collisions..."
              }
              className="min-h-[90px] rounded-2xl bg-background border-2 border-border resize-none text-xs font-medium"
              maxLength={500}
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground">{comment.length}/500</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="w-1/3 rounded-2xl font-black text-xs h-11"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !rating}
              className="flex-1 rounded-2xl font-black text-xs h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? "جارٍ الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{existingRatingId ? (isRtl ? "تحديث التقييم" : "Update Rating") : (isRtl ? "اعتماد وإرسال التقييم" : "Submit Evaluation")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
