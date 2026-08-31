import React from "react";
import { Sparkles, X, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickRepliesBarProps {
  onSelectReply: (text: string) => void;
  onClose: () => void;
  isRtl?: boolean;
}

const QUICK_TEMPLATES = [
  {
    category: { ar: "التحيات الرسمية", en: "Greetings" },
    items: [
      { ar: "السلام عليكم ورحمة الله وبركاته، تحياتي وتقديري لشخصكم الكريم.", en: "Peace and blessings upon you. Best regards." },
      { ar: "صباح الخير، أتمنى لكم يوماً موفقاً ومثمراً.", en: "Good morning, wishing you a productive day." },
      { ar: "مساء الخير، أرجو أن تكونوا بأتم الصحة والعافية.", en: "Good evening, hope you are in good health." },
    ],
  },
  {
    category: { ar: "الاجتماعات والمجالس", en: "Meetings" },
    items: [
      { ar: "يرجى التكرم بحضور اجتماع مجلس القسم القادم في الموعد المحدد.", en: "Please attend the upcoming department council meeting as scheduled." },
      { ar: "تم تأكيد موعد الاجتماع، وسنوافيكم بجدول الأعمال قريباً.", en: "Meeting confirmed, agenda will be shared shortly." },
      { ar: "أعتذر عن الحضور لظرف طارئ، وسأتابع المحضر لاحقاً.", en: "Apologies for not attending due to an emergency; will review minutes." },
    ],
  },
  {
    category: { ar: "الاعتماد والمراجعة", en: "Approvals & Review" },
    items: [
      { ar: "تم استلام الملفات والبيانات، وجاري المراجعة والتدقيق.", en: "Files received and currently under review." },
      { ar: "تم اعتماد النتائج / الجداول الدراسية بنجاح وإرسالها للإدارة.", en: "Academic results/schedules approved and submitted." },
      { ar: "يرجى مراجعة الملاحظات المرفقة وتعديل البيانات في أقرب وقت.", en: "Please review attached notes and update records accordingly." },
      { ar: "تم الانتهاء من رصد درجات الطلاب ورصد الحضور والغياب.", en: "Student grades and attendance tracking completed." },
    ],
  },
  {
    category: { ar: "الروابط والمستندات", en: "Documents & Links" },
    items: [
      { ar: "يرجى الاطلاع على المستند المرفق والتوقيع عليه.", en: "Please review and sign the attached document." },
      { ar: "رابط البث المباشر / المحاضرة متاح الآن في النظام.", en: "Live stream/lecture link is now active in the system." },
    ],
  },
];

export const QuickRepliesBar: React.FC<QuickRepliesBarProps> = ({
  onSelectReply,
  onClose,
  isRtl = true,
}) => {
  return (
    <div
      className="p-3 bg-slate-900/95 border border-teal-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl animate-scale-in mb-2"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
        <div className="flex items-center gap-2 text-teal-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black">
            {isRtl ? "الردود الأكاديمية والرسمية السريعة" : "Quick Academic & Official Templates"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 rounded-full text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        {QUICK_TEMPLATES.map((cat, idx) => (
          <div key={idx} className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-400 block px-1">
              {isRtl ? cat.category.ar : cat.category.en}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item, itemIdx) => {
                const text = isRtl ? item.ar : item.en;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => {
                      onSelectReply(text);
                      onClose();
                    }}
                    className="text-xs text-start font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-teal-500/20 hover:border-teal-500/40 border border-white/10 text-slate-200 hover:text-teal-300 transition-colors"
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
