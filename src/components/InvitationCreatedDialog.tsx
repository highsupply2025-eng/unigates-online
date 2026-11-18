import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Check, Link as LinkIcon, Share2, MessageCircle, Sparkles,
  ShieldCheck, KeyRound, Building2, GraduationCap, X, CheckCircle2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InvitationCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  inviteLink: string;
  role: string;
  customTitle: string;
  permissionsCount: number;
  departmentName?: string;
  institutionName?: string;
  fullName?: string;
  isRtl?: boolean;
}

export const InvitationCreatedDialog: React.FC<InvitationCreatedDialogProps> = ({
  open,
  onOpenChange,
  code,
  inviteLink,
  role,
  customTitle,
  permissionsCount,
  departmentName,
  institutionName,
  fullName,
  isRtl = true,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast({
        title: isRtl ? "تم نسخ كود الدعوة" : "Invitation Code Copied",
        description: code,
      });
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast({ title: isRtl ? "فشل النسخ" : "Failed to copy", variant: "destructive" });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({
        title: isRtl ? "تم نسخ رابط الدعوة" : "Invitation Link Copied",
        description: isRtl ? "يمكنك الآن إرساله إلى الشخص المعني" : "Ready to share with the invitee",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: isRtl ? "فشل النسخ" : "Failed to copy", variant: "destructive" });
    }
  };

  const shareText = isRtl
    ? `مرحباً ${fullName ? fullName + "، " : ""}تمت دعوتك للانضمام إلى منصة ${institutionName || "UNIGATES"} بصفة "${customTitle || role}".\n\n📌 رابط التسجيل الخاص بك:\n${inviteLink}\n\n🔑 كود الدعوة المؤقت (صالح لمرة واحدة فقط):\n${code}\n\n*ملاحظة:* يرجى الدخول عبر الرابط وإدخال إيميلك وكلمة السر الخاصة بك وصورتك وآخر شهادة حصلت عليها لإتمام تفعيل الحساب.`
    : `Hi ${fullName ? fullName + ", " : ""}you are invited to join ${institutionName || "UNIGATES"} as "${customTitle || role}".\n\nRegistration link:\n${inviteLink}\n\nInvitation code (single-use):\n${code}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className="max-w-lg p-0 overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-card text-foreground shadow-2xl z-50"
      >
        {/* Banner Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/10 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                {isRtl ? "تم إنشاء الدعوة والكود المؤقت بنجاح" : "Invitation & Code Created"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl
                  ? "أرسل هذا الكود والرابط إلى الشخص المعني ليسجل حسابه بنفسه لمرة واحدة"
                  : "Share this single-use code and link with the invitee to register"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Temporary One-Time Code Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-muted-foreground">
                {isRtl ? "كود التسجيل المؤقت (للاستخدام لمرة واحدة فقط)" : "Temporary Single-Use Code"}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-4 py-1.5 rounded-xl border border-emerald-500/30 select-all">
                {code}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="h-10 px-3 rounded-xl border-emerald-500/40 hover:bg-emerald-500/10 font-bold text-xs"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="ms-1.5">{copiedCode ? (isRtl ? "تم النسخ" : "Copied") : (isRtl ? "نسخ الكود" : "Copy")}</span>
              </Button>
            </div>
          </div>

          {/* Direct Invitation Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              {isRtl ? "رابط الدعوة المباشر للتسجيل:" : "Direct Invitation Link:"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                dir="ltr"
                value={inviteLink}
                className="flex-1 h-10 px-3 text-xs font-mono bg-muted/60 border border-border rounded-xl text-foreground truncate select-all"
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                className="h-10 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground shrink-0 shadow-md shadow-primary/20"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ms-1.5">{copiedLink ? (isRtl ? "تم النسخ" : "Copied") : (isRtl ? "نسخ الرابط" : "Copy Link")}</span>
              </Button>
            </div>
          </div>

          {/* WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm border-2 border-emerald-600/40 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
              <span>{isRtl ? "إرسال الدعوة والكود عبر واتساب مباشرة" : "Share Invitation via WhatsApp"}</span>
            </Button>
          </a>

          {/* Pre-assigned Profile Summary */}
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isRtl ? "المسمى الوظيفي المعتمد:" : "Official Title:"}</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{customTitle || role}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isRtl ? "الصلاحيات الممنوحة:" : "Permissions Granted:"}</span>
              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                {permissionsCount} {isRtl ? "صلاحيات مفعلة" : "active permissions"}
              </Badge>
            </div>

            {departmentName && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isRtl ? "القسم الأكاديمي:" : "Department:"}</span>
                <span className="font-semibold text-foreground">{departmentName}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed">
              💡 {isRtl
                ? "عند دخول الشخص عبر الرابط وإدخال هذا الكود، سيطلب منه النظام إدخال إيميله وكلمة سره وصورته وآخر شهادة حصل عليها في مجاله."
                : "Upon opening the link, the registrant will provide their email, password, photo, and latest degree certificate."}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border/50 flex items-center justify-end">
          <Button
            type="button"
            variant="default"
            className="rounded-xl font-bold text-xs px-6 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            onClick={() => onOpenChange(false)}
          >
            {isRtl ? "تم / إغلاق" : "Done / Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitationCreatedDialog;
