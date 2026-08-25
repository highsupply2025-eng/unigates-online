import { useEffect, useRef, useState } from "react";
import { MapPin, Camera, Loader2, ShieldCheck, CheckCircle2, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import StudentPageHeader from "@/components/StudentPageHeader";

type Geo = { latitude: number; longitude: number; accuracy: number } | null;

export default function StudentPresenceCheckin() {
  const { language, dir } = useLanguage();
  const isAr = dir === "rtl";
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [code, setCode] = useState("");
  const [geo, setGeo] = useState<Geo>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ at: string } | null>(null);

  const captureGeo = () => {
    setGeoErr(null);
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeoErr(isAr ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation not supported");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeoLoading(false);
      },
      (err) => {
        setGeoErr(err.message || (isAr ? "تعذر الحصول على الموقع" : "Failed to get location"));
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setCamErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setCamErr(e?.message || (isAr ? "تعذر فتح الكاميرا" : "Failed to open camera"));
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const snap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const w = v.videoWidth || 480;
    const h = v.videoHeight || 360;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    setSelfie(c.toDataURL("image/jpeg", 0.7));
    stopCamera();
  };

  useEffect(() => {
    captureGeo();
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!code.trim()) {
      toast({ title: isAr ? "أدخل رمز القاعة" : "Enter hall code", variant: "destructive" });
      return;
    }
    if (!geo) {
      toast({ title: isAr ? "يجب تفعيل الموقع" : "Location required", variant: "destructive" });
      return;
    }
    if (!selfie) {
      toast({ title: isAr ? "التقط صورة سيلفي" : "Capture a selfie", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      // Upload selfie to private user-documents bucket under presence sub-folder
      let selfieUrl: string | null = null;
      try {
        const blob = await (await fetch(selfie)).blob();
        const path = `${uid}/presence/${Date.now()}.jpg`;
        const up = await supabase.storage.from("user-documents").upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (!up.error) {
          // Store the storage path; lecturers/admins generate signed URLs on demand.
          selfieUrl = `user-documents/${path}`;
        }
      } catch {/* selfie still stored as null on failure */}

      const { error } = await supabase.from("student_presence_checkins").insert({
        user_id: uid,
        hall_code: code.trim(),
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy_m: geo.accuracy,
        selfie_url: selfieUrl,
        user_agent: navigator.userAgent,
      });
      if (error) throw error;

      setDone({ at: new Date().toLocaleString(isAr ? "ar-EG" : "en-US") });
      toast({ title: isAr ? "تم تثبيت حضورك" : "Presence recorded" });
    } catch (e: any) {
      toast({ title: isAr ? "فشل الحفظ" : "Save failed", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(null);
    setSelfie(null);
    setCode("");
    captureGeo();
    startCamera();
  };

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="إثبات الحضور في القاعة"
        titleEn="Verify Presence in Hall"
        icon={<ShieldCheck className="w-5 h-5" />}
      />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        {done ? (
          <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/10">
            <CardContent className="p-8 text-center space-y-4">
              <span className="inline-flex w-20 h-20 rounded-full bg-emerald-500/15 items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={2.5} />
              </span>
              <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {isAr ? "تم إثبات حضورك بنجاح" : "Presence verified successfully"}
              </h2>
              <p className="text-muted-foreground">{done.at}</p>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                <div className="rounded-xl border bg-card p-3">
                  <div className="text-xs text-muted-foreground mb-1">{isAr ? "رمز القاعة" : "Hall code"}</div>
                  <div className="font-bold">{code}</div>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <div className="text-xs text-muted-foreground mb-1">{isAr ? "دقة الموقع" : "Accuracy"}</div>
                  <div className="font-bold">±{Math.round(geo?.accuracy ?? 0)} m</div>
                </div>
              </div>
              <Button onClick={reset} variant="outline" className="gap-2 mt-2">
                <RefreshCw className="w-4 h-4" /> {isAr ? "تسجيل جديد" : "New check-in"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-2">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-base font-bold">
                  <KeyRound className="w-5 h-5 text-primary" />
                  {isAr ? "رمز القاعة" : "Hall code"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "أدخل الرمز الذي يعرضه المحاضر داخل القاعة الآن."
                    : "Enter the code the lecturer is currently showing in the hall."}
                </p>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={isAr ? "مثال: 7K2P9X" : "e.g. 7K2P9X"}
                  className="h-12 text-lg tracking-[0.3em] text-center font-black"
                  maxLength={12}
                />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base font-bold">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    {isAr ? "الموقع الجغرافي" : "Geolocation"}
                  </div>
                  <Button size="sm" variant="outline" onClick={captureGeo} disabled={geoLoading} className="gap-1.5">
                    {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isAr ? "تحديث" : "Refresh"}
                  </Button>
                </div>
                {geo ? (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary" className="font-mono">{geo.latitude.toFixed(5)}</Badge>
                    <Badge variant="secondary" className="font-mono">{geo.longitude.toFixed(5)}</Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                      ±{Math.round(geo.accuracy)} m
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">{geoErr ?? (isAr ? "جاري قراءة الموقع..." : "Reading location...")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Camera className="w-5 h-5 text-indigo-500" />
                  {isAr ? "صورة تأكيد (سيلفي)" : "Confirmation selfie"}
                </div>
                <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                  {selfie ? (
                    <img src={selfie} alt="selfie" className="w-full h-full object-cover" />
                  ) : (
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                {camErr && <p className="text-sm text-destructive">{camErr}</p>}
                <div className="flex gap-2">
                  {selfie ? (
                    <Button variant="outline" className="gap-2 flex-1" onClick={() => { setSelfie(null); startCamera(); }}>
                      <RefreshCw className="w-4 h-4" /> {isAr ? "إعادة الالتقاط" : "Retake"}
                    </Button>
                  ) : (
                    <Button className="gap-2 flex-1" onClick={snap}>
                      <Camera className="w-4 h-4" /> {isAr ? "التقاط" : "Capture"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full h-14 text-base font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 me-2" />}
              {isAr ? "إثبات حضوري الآن" : "Verify my presence now"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {isAr
                ? "سيتم تسجيل الوقت والموقع والجهاز والصورة كدليل على وجودك داخل القاعة."
                : "Timestamp, location, device and selfie are saved as proof of in-hall presence."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
