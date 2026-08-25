import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  /** Target kind being rated — for labels only */
  kind: "lecture" | "stream" | "assignment" | "quiz" | "schedule";
  /** Called with rating (1-5) and optional comment after a valid submission. Should perform/allow the gated action. */
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
  /** Mandatory dialogs are not dismissible by default. */
  onOpenChange?: (open: boolean) => void;
}

const TITLES = {
  lecture: { ar: "قيّم المحاضرة قبل الإغلاق", en: "Rate the lecture before closing" },
  stream: { ar: "قيّم البث قبل المغادرة", en: "Rate the stream before leaving" },
  assignment: { ar: "قيّم التكليف قبل التسليم", en: "Rate the assignment before submitting" },
  quiz: { ar: "قيّم الاختبار قبل الإنهاء", en: "Rate the quiz before finishing" },
  schedule: { ar: "قيّم الجدول قبل الإغلاق", en: "Rate the schedule before closing" },
};

const MandatoryRatingDialog = ({ open, kind, onSubmit, onOpenChange }: Props) => {
  const { language, dir } = useLanguage();
  const isAr = dir === "rtl";
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: isAr ? "التقييم إلزامي" : "Rating required",
        description: isAr ? "اختر عدد النجوم أولاً" : "Please select a star rating first",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      await onSubmit(rating, comment.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Block dismissal — rating is mandatory
        if (!o) return;
        onOpenChange?.(o);
      }}
    >
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {isAr ? TITLES[kind].ar : TITLES[kind].en}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isAr
              ? "تقييمك يساعدنا على تحسين التجربة. هذه الخطوة إلزامية."
              : "Your rating helps improve the experience. This step is required."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-9 h-9 transition-transform ${
                    (hover || rating) >= n ? "text-yellow-500 scale-110" : "text-muted-foreground"
                  }`}
                  fill={(hover || rating) >= n ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={isAr ? "تعليق (اختياري)" : "Comment (optional)"}
            maxLength={500}
          />
          <Button
            className="w-full font-bold"
            disabled={!rating || saving}
            onClick={handleSubmit}
          >
            {saving
              ? isAr ? "جاري الحفظ..." : "Saving..."
              : isAr ? "إرسال التقييم والمتابعة" : "Submit rating & continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MandatoryRatingDialog;
