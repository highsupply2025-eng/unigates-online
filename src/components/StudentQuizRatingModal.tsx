import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle2, Loader2, Award, FileQuestion } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StudentQuizRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  courseId?: string;
  quizTitle: string;
  instructorName?: string;
  onRated?: () => void;
}

export const StudentQuizRatingModal = ({
  open,
  onOpenChange,
  quizId,
  courseId,
  quizTitle,
  instructorName,
  onRated,
}: StudentQuizRatingModalProps) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !quizId) return;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;

        const { data: existing } = await supabase
          .from("quiz_ratings")
          .select("id, rating, comment")
          .eq("user_id", auth.user.id)
          .eq("quiz_id", quizId)
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
        console.warn("Load quiz rating error:", err);
      }
    })();
  }, [open, quizId]);

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
          .from("quiz_ratings")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingRatingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quiz_ratings").insert({
          quiz_id: quizId,
          course_id: courseId || null,
          user_id: auth.user.id,
          rating,
          comment: comment.trim() || null,
        });
        if (error) throw error;
      }

      toast({
        title: isRtl ? "تم حفظ تقييم الاختبار بنجاح ⭐" : "Exam rating submitted successfully ⭐",
        description: isRtl
          ? "شكراً لمشاركتك التقييم الأكاديمي لجودة الاختبار والأسئلة."
          : "Thank you for rating the quality of this exam.",
      });

      onRated?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Submit quiz rating error:", err);
      toast({
        title: isRtl ? "فشل حفظ التقييم" : "Failed to submit rating",
        description: err?.message || (isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStarLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return isRtl ? "ضعيف جداً" : "Very Poor";
      case 2:
        return isRtl ? "مقبول" : "Fair";
      case 3:
        return isRtl ? "جيد" : "Good";
      case 4:
        return isRtl ? "جيد جداً ومناسب" : "Very Good";
      case 5:
        return isRtl ? "ممتاز وشامل 🌟" : "Excellent 🌟";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-3xl p-6 border-2 border-primary/20 bg-card shadow-2xl"
        dir={dir}
      >
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-primary-foreground flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Award className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {isRtl ? "تقييم جودة الاختبار والأسئلة" : "Evaluate Exam Quality"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {isRtl
              ? "ملاحظاتك وتقييمك الأكاديمي يساهم في ضبط جودة الأسئلة والتقييمات بالكلية."
              : "Your evaluation helps ensure high examination and assessment quality."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Exam Summary Info Box */}
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground truncate">{quizTitle}</p>
              {instructorName && (
                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                  {isRtl ? "واضع الاختبار:" : "Instructor:"} {instructorName}
                </p>
              )}
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
                      className={cn(
                        "w-9 h-9 transition-colors",
                        active
                          ? "fill-amber-400 text-amber-400 drop-shadow-md"
                          : "text-muted-foreground/40",
                      )}
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
              <span>
                {isRtl
                  ? "ملاحظاتك وتقييمك للأداء الأكاديمي (اختياري):"
                  : "Academic feedback & notes (Optional):"}
              </span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isRtl
                  ? "أضف ملاحظاتك حول وضوح الأسئلة، زمن الاختبار، شمولية المنهج، وتوافق بنية الاختبار..."
                  : "Write your notes regarding question clarity, duration, coverage..."
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
              className="flex-1 rounded-2xl font-black text-xs h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-primary-foreground shadow-lg shadow-amber-500/25 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? "جارٍ الحفظ..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {existingRatingId
                      ? isRtl
                        ? "تحديث التقييم"
                        : "Update Rating"
                      : isRtl
                        ? "اعتماد وإرسال التقييم"
                        : "Submit Evaluation"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
