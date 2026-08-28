import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentLectureRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lectureId?: string;
  lectureTitle: string;
  instructorName?: string;
  onRated?: () => void;
}

export const StudentLectureRatingModal = ({
  open,
  onOpenChange,
  courseId,
  lectureId,
  lectureTitle,
  instructorName,
  onRated,
}: StudentLectureRatingModalProps) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !courseId) return;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;

        const { data: existing } = await supabase
          .from("lecture_ratings")
          .select("id, rating, comment")
          .eq("user_id", auth.user.id)
          .eq("course_id", courseId)
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
        console.warn("Load rating error:", err);
      }
    })();
  }, [open, courseId]);

  const handleSubmit = async () => {
    if (!rating || rating < 1) {
      toast({
        title: isRtl ? "يرجى تحديد التقييم" : "Rating required",
        description: isRtl ? "اختر عدد النجوم من 1 إلى 5" : "Please select 1 to 5 stars",
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
          .from("lecture_ratings")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingRatingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lecture_ratings")
          .insert({
            course_id: courseId,
            lecture_id: lectureId || courseId,
            user_id: auth.user.id,
            rating,
            comment: comment.trim() || null,
          });
        if (error) throw error;
      }

      toast({
        title: isRtl ? "تم إرسال تقييمك بنجاح!" : "Rating submitted successfully!",
        description: isRtl ? `تم تسجيل تقييم ${rating} من 5 للمحاضرة.` : `Recorded ${rating}/5 rating.`,
      });

      onOpenChange(false);
      onRated?.();
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل حفظ التقييم" : "Failed to save rating",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return isRtl ? "ممتازة جداً ومفيدة 🌟" : "Outstanding & Highly Useful 🌟";
      case 4: return isRtl ? "جيدة جداً وممتعة 👍" : "Very Good 👍";
      case 3: return isRtl ? "متوسطة / مقبولة 👌" : "Average 👌";
      case 2: return isRtl ? "تحتاج لتحسين ⚠️" : "Needs Improvement ⚠️";
      case 1: return isRtl ? "ضعيفة 👎" : "Poor 👎";
      default: return isRtl ? "انقر على النجوم للتقييم" : "Click stars to rate";
    }
  };

  const activeStars = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md rounded-3xl p-6 border-2 border-amber-500/20 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-xl shadow-amber-500/20 p-0.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center text-amber-500">
              <Star className="w-7 h-7 fill-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
            {isRtl ? "تقييم المحاضرة والمقرر" : "Rate Lecture"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium">
            <span className="font-bold text-foreground block">{lectureTitle}</span>
            {instructorName && <span className="text-xs text-primary block mt-0.5">{instructorName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star Selector */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                      activeStars >= n
                        ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 h-5">
              {getRatingLabel(activeStars)}
            </span>
          </div>

          {/* Comment Box */}
          <div className="space-y-1.5 text-start">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "رأيك أو ملاحظاتك على المحاضرة (اختياري)" : "Your Feedback / Notes (Optional)"}</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isRtl ? "اكتب تعليقك لمساعدة الأستاذ والكلية على تطوير المحتوى..." : "Write your review to help improve content..."}
              rows={3}
              className="rounded-2xl border border-primary/20 text-xs sm:text-sm bg-background/60 focus:bg-background"
              maxLength={500}
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs h-10 px-4"
              onClick={() => onOpenChange(false)}
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!rating || saving}
              onClick={handleSubmit}
              className="rounded-xl font-black text-xs h-10 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/20 gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isRtl ? "إرسال التقييم" : "Submit Rating"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLectureRatingModal;
