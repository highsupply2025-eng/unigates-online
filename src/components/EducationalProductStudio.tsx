import React, { useState } from "react";
import {
  BookOpen,
  Video,
  Radio,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  Star,
  Users,
  Clock,
  Play,
  Share2,
  Eye,
  DollarSign,
  Plus,
  Trash2,
  Upload,
  QrCode,
  Award,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export type ProductType = "recorded_course" | "ebook" | "live_workshop" | "bundle";

export interface EducationalProduct {
  id: string;
  type: ProductType;
  title: string;
  description: string;
  coverImage?: string;
  previewVideoUrl?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  institutionName?: string;
  instructorName: string;
  instructorRole?: string;
  rating: number;
  reviewsCount: number;
  studentsEnrolled: number;
  lessonsCount?: number;
  pagesCount?: number;
  durationHours?: number;
  includesCertificate: boolean;
  drmProtected: boolean;
  watermarkEnabled: boolean;
  freeTrialAvailable: boolean;
  bundleItems?: string[];
  tags: string[];
}

export const PRODUCT_TYPE_CONFIG: Record<
  ProductType,
  {
    labelAr: string;
    labelEn: string;
    badgeAr: string;
    badgeEn: string;
    icon: any;
    color: string;
    gradient: string;
    glow: string;
  }
> = {
  recorded_course: {
    labelAr: "دورة / مادة مسجلة بدقة 4K",
    labelEn: "Recorded 4K Course",
    badgeAr: "🎥 كورس تفاعلي مسجل",
    badgeEn: "🎥 Recorded Course",
    icon: Video,
    color: "from-purple-600 to-indigo-600",
    gradient: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    glow: "shadow-purple-500/20 border-purple-500/40",
  },
  ebook: {
    labelAr: "كتاب / مذكرة رقمية تفاعلية",
    labelEn: "Interactive E-Book",
    badgeAr: "📚 كتاب رقمي مشفر",
    badgeEn: "📚 Protected E-Book",
    icon: BookOpen,
    color: "from-blue-600 to-cyan-600",
    gradient: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    glow: "shadow-blue-500/20 border-blue-500/40",
  },
  live_workshop: {
    labelAr: "ورشة / برنامج تدريبي مباشر",
    labelEn: "Live Interactive Cohort",
    badgeAr: "🔴 بث تفاعلي مباشر",
    badgeEn: "🔴 Live Interactive",
    icon: Radio,
    color: "from-rose-600 to-red-600",
    gradient: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    glow: "shadow-rose-500/20 border-rose-500/40",
  },
  bundle: {
    labelAr: "باقة شاملة (دورة + كتاب + شهادة)",
    labelEn: "Complete Value Bundle",
    badgeAr: "✨ باقة تجميعية شاملة",
    badgeEn: "✨ All-in-One Bundle",
    icon: Layers,
    color: "from-amber-500 to-orange-600",
    gradient: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    glow: "shadow-amber-500/20 border-amber-500/40",
  },
};

/**
 * High-Converting Educational Product Card
 */
export const ProductShowcaseCard: React.FC<{
  product: EducationalProduct;
  onPreview?: (p: EducationalProduct) => void;
  onBuy?: (p: EducationalProduct) => void;
  isOwner?: boolean;
}> = ({ product, onPreview, onBuy, isOwner = false }) => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const typeConfig = PRODUCT_TYPE_CONFIG[product.type] || PRODUCT_TYPE_CONFIG.recorded_course;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 flex flex-col justify-between">
      {/* Top Media / Thumbnail with 3D feel */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        {product.coverImage ? (
          <img
            src={product.coverImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${typeConfig.color} opacity-80 flex items-center justify-center p-6 text-white`}>
            <TypeIcon className="w-16 h-16 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Ambient Top Badges */}
        <div className="absolute top-3 start-3 end-3 flex items-center justify-between pointer-events-none">
          <Badge className={`${typeConfig.gradient} font-bold text-xs backdrop-blur-md shadow-md border`}>
            {isRtl ? typeConfig.badgeAr : typeConfig.badgeEn}
          </Badge>

          {product.freeTrialAvailable && (
            <Badge className="bg-emerald-500/90 text-white font-bold text-[10px] shadow-md">
              {isRtl ? "فصل تجريبي مجاناً" : "Free Preview"}
            </Badge>
          )}
        </div>

        {/* Play Overlay if video */}
        {product.previewVideoUrl && (
          <button
            onClick={() => onPreview && onPreview(product)}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl"
            title={isRtl ? "مشاهدة المقدمة" : "Play Trailer"}
          >
            <Play className="w-5 h-5 fill-white ms-0.5" />
          </button>
        )}

        {/* DRM Protection Pill */}
        {product.drmProtected && (
          <div className="absolute bottom-2.5 start-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>DRM 256-bit</span>
          </div>
        )}
      </div>

      {/* Content Info Body */}
      <CardContent className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Institution & Instructor line */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-300 truncate max-w-[180px]">
              {product.institutionName || product.instructorName}
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">({product.reviewsCount})</span>
            </span>
          </div>

          <h3 className="font-black text-base sm:text-lg text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300 font-medium">
          {product.lessonsCount && (
            <div className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>{product.lessonsCount} {isRtl ? "محاضرة" : "Lessons"}</span>
            </div>
          )}
          {product.pagesCount && (
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{product.pagesCount} {isRtl ? "صفحة تفاعلية" : "Pages"}</span>
            </div>
          )}
          {product.durationHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{product.durationHours} {isRtl ? "ساعة تدريبية" : "Hours"}</span>
            </div>
          )}
          {product.includesCertificate && (
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? "شهادة معتمدة QR" : "QR Certificate"}</span>
            </div>
          )}
        </div>

        {/* Pricing & CTA Button */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{isRtl ? "سعر التملك:" : "Price:"}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-400">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-slate-500 line-through">${product.originalPrice}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(product)}
                className="border-white/15 hover:bg-white/10 text-xs font-bold px-2.5 h-9"
                title={isRtl ? "معاينة المادة" : "Preview"}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onBuy && onBuy(product)}
              className={`font-black text-xs h-9 px-4 rounded-xl bg-gradient-to-r ${typeConfig.color} text-white shadow-md hover:opacity-90`}
            >
              <span>{isOwner ? (isRtl ? "إدارة وتعديل" : "Manage") : (isRtl ? "شراء وبدء" : "Enroll")}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Creator Studio Modal for publishing new products
 */
export const CreateProductStudioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<EducationalProduct>) => void;
  instructorName?: string;
  institutionName?: string;
}> = ({ isOpen, onClose, onSave, instructorName = "المحاضر المعتمد", institutionName }) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [productType, setProductType] = useState<ProductType>("recorded_course");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("49");
  const [originalPrice, setOriginalPrice] = useState("99");
  const [includesCertificate, setIncludesCertificate] = useState(true);
  const [drmProtected, setDrmProtected] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(true);

  const handleFinish = () => {
    if (!title.trim()) {
      toast({
        title: isRtl ? "تنبيه" : "Validation",
        description: isRtl ? "يرجى كتابة عنوان المادة / المنتج" : "Please enter product title",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: "prod_" + Date.now(),
      type: productType,
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || undefined,
      currency: "USD",
      instructorName,
      institutionName,
      rating: 5.0,
      reviewsCount: 1,
      studentsEnrolled: 0,
      includesCertificate,
      drmProtected,
      watermarkEnabled,
      freeTrialAvailable,
      tags: [productType],
    });

    toast({
      title: isRtl ? "🎉 تم نشر المنتج التعليمي بنجاح" : "🎉 Product Published Successfully!",
      description: isRtl ? "أصبح المنتج متاحاً الآن في متجرك وبوابتك الأكاديمية" : "Product is live in your catalog",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 border-white/15 text-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? "استوديو إنشاء وتأمين المنتجات التعليمية" : "Educational Product Studio"}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black">
            {isRtl ? "إضافة منتج تعليمي جديد للمتجر والمقررات" : "Create New Educational Product"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {isRtl
              ? "أنشئ كتبك الرقمية، دوراتك المسجلة، أو باقاتك الشاملة مع حماية DRM والعلامة المائية المخصصة"
              : "Launch digital books, recorded masterclasses, or bundles with enterprise DRM & watermarking"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 py-3">
          {[
            { num: 1, labelAr: "1. نوع وهوية المنتج", labelEn: "1. Identity & Type" },
            { num: 2, labelAr: "2. التسعير وتأمين DRM", labelEn: "2. Pricing & DRM" },
            { num: 3, labelAr: "3. الاعتماد والشهادة", labelEn: "3. Certificate & Launch" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                step === s.num
                  ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {isRtl ? s.labelAr : s.labelEn}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">{isRtl ? "اختر نوع المنتج:" : "Select Product Type:"}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(PRODUCT_TYPE_CONFIG) as ProductType[]).map((typeKey) => {
                  const cfg = PRODUCT_TYPE_CONFIG[typeKey];
                  const Icon = cfg.icon;
                  const isSelected = productType === typeKey;
                  return (
                    <div
                      key={typeKey}
                      onClick={() => setProductType(typeKey)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? "bg-purple-600/15 border-purple-500 text-white ring-2 ring-purple-500/20"
                          : "bg-slate-950/60 border-white/10 hover:border-white/30 text-slate-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black">{isRtl ? cfg.labelAr : cfg.labelEn}</h4>
                        <span className="text-[10px] text-slate-400 block">{isRtl ? cfg.badgeAr : cfg.badgeEn}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{isRtl ? "عنوان المنتج / المادة العلمية *" : "Product Title *"}</Label>
              <Input
                placeholder={isRtl ? "مثال: المرجع الشامل في جراحة القلب أو كورس البرمجة المتقدم" : "e.g. Masterclass in Web Development"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">{isRtl ? "الوصف ونبذة المحتوى" : "Description"}</Label>
              <Textarea
                placeholder={isRtl ? "أبرز المحاور، المخرجات التعليمية، والفئات المستهدفة..." : "Detailed syllabus and outcomes..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-slate-950 border-white/15 text-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{isRtl ? "السعر للطلاب ($)" : "Price ($)"}</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{isRtl ? "السعر قبل الخصم ($)" : "Original Price ($)"}</Label>
                <Input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="bg-slate-950 border-white/15 text-white"
                />
              </div>
            </div>

            {/* Protection switches */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10">
              <h4 className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? "إعدادات الأمان وحماية الملكية الفكرية" : "Security & DRM Protection"}</span>
              </h4>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-bold text-white">{isRtl ? "تشفير الفيديو بتقنية DRM" : "DRM Video Encryption"}</p>
                  <p className="text-[11px] text-slate-400">{isRtl ? "منع برامج تسجيل الشاشة والتحميل غير المصرح" : "Blocks screen recorders and direct stream downloads"}</p>
                </div>
                <Switch checked={drmProtected} onCheckedChange={setDrmProtected} />
              </div>

              <div className="flex items-center justify-between py-1 border-t border-white/5">
                <div>
                  <p className="text-xs font-bold text-white">{isRtl ? "علامة مائية ديناميكية (Dynamic Watermark)" : "Dynamic Watermark"}</p>
                  <p className="text-[11px] text-slate-400">{isRtl ? "طباعة اسم ورقم هاتف الطالب على الفيديوهات وصفحات الكتب الرقمية" : "Overlays student info on video and PDF pages"}</p>
                </div>
                <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
              </div>

              <div className="flex items-center justify-between py-1 border-t border-white/5">
                <div>
                  <p className="text-xs font-bold text-white">{isRtl ? "إتاحة فصل تمهيدي مجاناً" : "Enable Free Preview Chapter"}</p>
                  <p className="text-[11px] text-slate-400">{isRtl ? "زيادة المبيعات عبر السماح للطالب بتجربة عينة قبل الشراء" : "Boost conversion by letting students try a sample"}</p>
                </div>
                <Switch checked={freeTrialAvailable} onCheckedChange={setFreeTrialAvailable} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>{isRtl ? "إصدار شهادة إتمام رقمية معتمدة" : "Verifiable QR Completion Certificate"}</span>
                </div>
                <Switch checked={includesCertificate} onCheckedChange={setIncludesCertificate} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isRtl
                  ? "يتم إصدار شهادة رقمية مشفرة برمز QR للتحقق الفوري عند إتمام الطالب لكامل محتويات المادة والاختبارات الملحقة."
                  : "Students will automatically receive an official QR-verified certificate upon completing all lessons and required quizzes."}
              </p>
            </div>

            {/* Summary preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? "ملخص النشر:" : "Publish Summary:"}</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">{title || (isRtl ? "بدون عنوان" : "Untitled")}</span>
                <span className="text-emerald-400 font-black text-sm">${price}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                <span>{isRtl ? PRODUCT_TYPE_CONFIG[productType].labelAr : PRODUCT_TYPE_CONFIG[productType].labelEn}</span>
                <span>•</span>
                <span>{drmProtected ? "DRM 🔒" : "No DRM"}</span>
                <span>•</span>
                <span>{includesCertificate ? "QR Cert 🎓" : "No Cert"}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white">
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((step - 1) as any)}
                className="border-white/15 text-xs font-bold"
              >
                {isRtl ? "السابق" : "Back"}
              </Button>
            )}

            {step < 3 ? (
              <Button
                size="sm"
                onClick={() => setStep((step + 1) as any)}
                className="bg-purple-600 hover:bg-purple-500 text-xs font-bold px-4"
              >
                {isRtl ? "التالي" : "Next"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black px-5 shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>{isRtl ? "نشر وتأكيد الإطلاق" : "Publish Product"}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductShowcaseCard;
