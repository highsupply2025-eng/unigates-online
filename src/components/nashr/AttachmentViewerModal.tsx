import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink, Image as ImageIcon } from "lucide-react";
import { downloadFileOrDataUrl } from "@/services/nashrReceiptHelper";

interface AttachmentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  fileUrl?: string;
  senderName?: string;
  timestamp?: string;
  messageText?: string;
  isRtl?: boolean;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  senderName,
  timestamp,
  messageText,
  isRtl = true
}) => {
  if (!fileName && !fileUrl) return null;

  const isPdf = 
    (fileName && fileName.toLowerCase().endsWith(".pdf")) || 
    (fileUrl && fileUrl.startsWith("data:application/pdf"));

  const isImage = 
    (fileName && (fileName.toLowerCase().endsWith(".png") || fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg") || fileName.toLowerCase().endsWith(".webp"))) ||
    (fileUrl && (fileUrl.startsWith("data:image/") || fileUrl.startsWith("http")));

  const handleDownload = () => {
    if (fileUrl) {
      downloadFileOrDataUrl(fileUrl, fileName || "مرفق_محادثة.png");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-black">
                {fileName || (isRtl ? "مرفق المحادثة المباشرة" : "Message Attachment")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {senderName ? `${senderName} • ` : ""}{timestamp || ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Message Context if present */}
        {messageText && (
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 text-xs text-foreground leading-relaxed">
            <span className="font-bold text-muted-foreground block mb-1">
              💬 {isRtl ? "نص الرسالة المرفق معها:" : "Attached with message:"}
            </span>
            <p className="whitespace-pre-wrap">{messageText}</p>
          </div>
        )}

        {/* Preview Container */}
        <div className="rounded-2xl border-2 border-border/80 bg-slate-950 p-3 text-center min-h-[260px] flex items-center justify-center relative overflow-hidden">
          {fileUrl ? (
            isPdf ? (
              <div className="text-center p-6 space-y-3">
                <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                <p className="text-xs text-slate-300 font-bold">{fileName}</p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تحميل ملف PDF" : "Download PDF"}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <img
                src={fileUrl}
                alt={fileName || "Attachment"}
                className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
              />
            )
          ) : (
            <div className="text-slate-400 text-xs p-6">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <span>{isRtl ? "المستند متاح للتحميل" : "File available for download"}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border/60">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!fileUrl}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRtl ? "تحميل المرفق 📥" : "Download Attachment"}</span>
          </Button>

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isRtl ? "فتح في نافذة كاملة" : "Open in new tab"}</span>
            </a>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold px-6 ms-auto"
          >
            {isRtl ? "إغلاق" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
