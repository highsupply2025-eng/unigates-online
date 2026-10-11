import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X, AlertCircle, FlipHorizontal } from "lucide-react";

interface ChatCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string, fileName: string) => void;
  isRtl?: boolean;
}

export const ChatCameraModal: React.FC<ChatCameraModalProps> = ({
  open,
  onOpenChange,
  onCapture,
  isRtl = true,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Start camera stream when modal opens
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isRtl ? "المتصفح لا يدعم الوصول المباشر للكاميرا" : "Camera access not supported by browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err: any) {
      console.warn("[ChatCameraModal] Camera access error:", err);
      setErrorMsg(
        isRtl 
          ? "تعذر فتح الكاميرا مباشرة. يرجى التأكد من منح الإذن للمتصفح أو استخدام خيار التقاط صورة عبر الجهاز." 
          : "Could not access camera. Please check permissions or select a photo from your device."
      );
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front-facing user camera for natural mirror feeling
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `Camera_Photo_${timestamp}.jpg`;
    onCapture(capturedImage, fileName);
    onOpenChange(false);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onCapture(dataUrl, file.name);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-5 border-2 border-border/80 bg-card shadow-2xl">
        <DialogHeader className="text-start space-y-1">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" />
            <span>{isRtl ? "التقاط صورة عبر الكاميرا" : "Capture Photo via Camera"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isRtl
              ? "التقاط صورة حية ومشاركتها مباشرة في المحادثة الداخلية المعتمدة"
              : "Take a live photo and attach it instantly to the conversation"}
          </DialogDescription>
        </DialogHeader>

        {/* Viewport Area */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-border/60 shadow-inner my-2">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : errorMsg ? (
            <div className="text-center p-6 space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-300 leading-relaxed px-4">{errorMsg}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fallbackInputRef.current?.click()}
                className="rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Camera className="w-4 h-4 me-1.5" />
                <span>{isRtl ? "فتح كاميرا الهاتف / اختيار صورة" : "Open Device Camera / File"}</span>
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-8 border-2 border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-amber-400 absolute top-0 left-0 rounded-tl-xl" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-amber-400 absolute top-0 right-0 rounded-tr-xl" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0 rounded-bl-xl" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0 rounded-br-xl" />
              </div>

              {/* Camera Switch Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 end-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-all shadow-md"
                title={isRtl ? "تبديل الكاميرا (أمامية / خلفية)" : "Switch Camera"}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            type="file"
            ref={fallbackInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFallbackFile}
          />
        </div>

        {/* Action Controls */}
        <DialogFooter className="gap-2 sm:gap-0 flex-wrap justify-between pt-2">
          {capturedImage ? (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="rounded-xl text-xs font-bold gap-1.5 flex-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRtl ? "إعادة الالتقاط 🔄" : "Retake"}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="rounded-xl text-xs font-black gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isRtl ? "اعتماد وإرفاق الصورة ✅" : "Use Photo"}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-bold"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                >
                  <Camera className="w-3.5 h-3.5 me-1" />
                  <span>{isRtl ? "كاميرا الهاتف" : "Device Cam"}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(errorMsg) || loading}
                  onClick={handleCapture}
                  className="rounded-xl text-xs font-black gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md px-5"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isRtl ? "التقاط الصورة 📸" : "Capture 📸"}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatCameraModal;
