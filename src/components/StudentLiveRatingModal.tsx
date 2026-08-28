import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle2, Loader2, Radio, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentLiveRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
  streamTitle: string;
  instructorName?: string;
  onRated?: () => void;
}

export const StudentLiveRatingModal = ({
  open,
  onOpenChange,
  streamId,
  streamTitle,
  instructorName,
  onRated,
}: StudentLiveRatingModalProps) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !streamId) return;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;

        const { data: existing } = await supabase
          .from("live_stream_ratings")
          .select("id, rating, comment")
          .eq("user_id", auth.user.id)
          .eq("stream_id", streamId)
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
        console.warn("Load stream rating error:", err);
      }
    })();
  }, [open, streamId]);

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
          .from("live_stream_ratings")
          .update({
            rating,
            comment: comment.trim() || null,
          })
          .eq("id", existingRatingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("live_stream_ratings")
          .insert({
            stream_id: streamId,
            user_id: auth.user.id,
            rating,
            comment: comment.trim() || null,
          });
        if (error) throw error;
      }

      toast({
        title: isRtl ? "تم حفظ تقييمك بنجاح! ⭐" : "Rating saved successfully! ⭐",
        description: isRtl
          ? "شكراً لك على تقييم البث المباشر والملفات المرفقة."
          : "Thank you for rating the live broadcast and materials.",
      });

      onOpenChange(false);
      onRated?.();
    } catch (err: any) {
      console.error("Save stream rating error:", err);
      toast({
        title: isRtl ? "فشل حفظ التقييم" : "Failed to save rating",
        description: err.message || (isRtl ? "يرجى المحاولة مرة أخرى" : "Please try again"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return isRtl ? "ممتاز جداً ومفيد للغاية 🌟" : "Excellent & Highly Beneficial 🌟";
      case 4:
        return isRtl ? "جيد جداً وموضح للشرح 👍" : "Very Good 👍";
      case 3:
        return isRtl ? "جيد / متوسط ⚖️" : "Good / Average ⚖️";
      case 2:
        return isRtl ? "مقبول ويحتاج تحسين ⚠️" : "Fair / Needs Improvement ⚠️";
      case 1:
        return isRtl ? "ضعيف / غير واضح 👎" : "Poor / Unclear 👎";
      default:
        return isRtl ? "اضغط على النجوم للتقييم" : "Click stars to rate";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className="max-w-md w-full rounded-3xl p-6 bg-slate-950/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl shadow-black/80"
      >
        <DialogHeader className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-black text-white">
            {isRtl ? "تقييم البث المباشر والملفات المرفقة" : "Rate Live Stream & Materials"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            {streamTitle}
            {instructorName && <span className="block mt-0.5 text-rose-300 font-bold">({instructorName})</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Interactive Star Picker */}
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-hidden"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-bold text-amber-300 min-h-[18px]">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </div>

          {/* Comment / Review Feedback */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              <span>{isRtl ? "رأيك في الشرح وجودة البث والملفات (اختياري)" : "Your Feedback & Notes (Optional)"}</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isRtl
                  ? "شاركنا ملاحظاتك حول وضوح الصوت والصورة، تفاعل المحاضر، وجودة الملفات والمذكرات المرفقة..."
                  : "Share your notes on audio/video clarity, presenter interaction, and handouts quality..."
              }
              className="h-24 text-xs font-medium bg-white/5 border-white/15 text-white placeholder:text-slate-500 rounded-xl resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !rating}
            className="h-10 px-5 font-black text-xs bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-lg shadow-red-500/25 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isRtl ? "جاري الحفظ..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{existingRatingId ? (isRtl ? "تحديث التقييم" : "Update Rating") : (isRtl ? "إرسال التقييم" : "Submit Rating")}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
