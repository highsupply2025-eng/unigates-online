import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, Building2, Languages, Award, School, BookOpen,
  Upload, FileText, CheckCircle2, ShieldCheck, Eye, EyeOff,
  Loader2, Sparkles, MapPin, Users, Phone, Mail, FileCheck,
  AlertCircle, ExternalLink, ArrowLeft, ArrowRight, ImagePlus, X, Globe, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadSignupLogo } from "@/lib/signup-logo-upload";

export type InstitutionKind =
  | "college"
  | "institute"
  | "language_center"
  | "training_center"
  | "school"
  | "tutoring_center";

export interface InstitutionTypeOption {
  id: InstitutionKind;
  labelAr: string;
  labelEn: string;
  badgeAr: string;
  badgeEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  gradient: string;
  bgLight: string;
  defaultRoleTitleAr: string;
  defaultRoleTitleEn: string;
}

export const INSTITUTION_TYPES: InstitutionTypeOption[] = [
  {
    id: "college",
    labelAr: "إدارة كلية جامعية",
    labelEn: "University College Administration",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "مساحة سحابية مستقلة للأقسام الأكاديمية والعمادة وهيئة التدريس والطلاب",
    descriptionEn: "Independent cloud workspace for academic departments, deanery, faculty and students",
    icon: Landmark,
    accentColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500",
    gradient: "from-blue-600 to-indigo-700",
    bgLight: "bg-blue-50/70 dark:bg-blue-950/30",
    defaultRoleTitleAr: "عميد الكلية",
    defaultRoleTitleEn: "College Dean",
  },
  {
    id: "institute",
    labelAr: "إدارة معهد عالي / تخصصي",
    labelEn: "Higher Institute Administration",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "إدارة البرامج التخصصية والشعب الأكاديمية والمحاضرات مع كامل الصلاحيات",
    descriptionEn: "Management of diploma programs, academic sections, and lectures",
    icon: Building2,
    accentColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-500",
    gradient: "from-teal-600 to-emerald-700",
    bgLight: "bg-teal-50/70 dark:bg-teal-950/30",
    defaultRoleTitleAr: "مدير المعهد",
    defaultRoleTitleEn: "Institute Director",
  },
  {
    id: "language_center",
    labelAr: "إدارة مركز لغات وترجمة",
    labelEn: "Language & Translation Center Administration",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "مسارات تعليم اللغات الأجنبية والإعداد لاختبارات IELTS و TOEFL المعيارية",
    descriptionEn: "Foreign language tracks, conversational labs, and IELTS/TOEFL exam preparation",
    icon: Languages,
    accentColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500",
    gradient: "from-rose-600 to-pink-700",
    bgLight: "bg-rose-50/70 dark:bg-rose-950/30",
    defaultRoleTitleAr: "مدير عام مركز اللغات",
    defaultRoleTitleEn: "Language Center Director",
  },
  {
    id: "training_center",
    labelAr: "إدارة مركز تدريب وأكاديمية",
    labelEn: "Training Center & Academy Administration",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "إطلاق الدبلومات المهنية والبرامج المعتمدة وإصدار شهادات التدريب السحابية",
    descriptionEn: "Professional diplomas, accredited training workshops, and cloud verification certificates",
    icon: Award,
    accentColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500",
    gradient: "from-amber-600 to-orange-700",
    bgLight: "bg-amber-50/70 dark:bg-amber-950/30",
    defaultRoleTitleAr: "المدير التنفيذي للتدريب",
    defaultRoleTitleEn: "Executive Training Director",
  },
  {
    id: "school",
    labelAr: "إدارة مدرسة تعليمية (K-12)",
    labelEn: "School Administration (K-12)",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "بيئة رقمية موحدة للإدارة المدرسية، المعلمين، الفصول، المواد، وجداول الطلاب",
    descriptionEn: "Unified digital campus for school administration, teachers, classrooms, and homework",
    icon: School,
    accentColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-500",
    gradient: "from-purple-600 to-violet-700",
    bgLight: "bg-purple-50/70 dark:bg-purple-950/30",
    defaultRoleTitleAr: "مدير / ناظر المدرسة",
    defaultRoleTitleEn: "School Principal",
  },
  {
    id: "tutoring_center",
    labelAr: "إدارة سنتر تعليمي وقاعات تقوية",
    labelEn: "Tutoring Center Administration",
    badgeAr: "حساب إدارة",
    badgeEn: "Admin Account",
    descriptionAr: "إدارة مجموعات التقوية، الحصص والمذكرات، وسجلات حضور وغياب الطلاب",
    descriptionEn: "Tutoring groups, study materials, live sessions, and student attendance logs",
    icon: BookOpen,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500",
    gradient: "from-emerald-600 to-teal-700",
    bgLight: "bg-emerald-50/70 dark:bg-emerald-950/30",
    defaultRoleTitleAr: "المشرف العام على السنتر",
    defaultRoleTitleEn: "Center General Manager",
  },
];

const countryCodes = [
  { code: "+20", country: "🇪🇬", label: "مصر (+20)" },
  { code: "+966", country: "🇸🇦", label: "السعودية (+966)" },
  { code: "+971", country: "🇦🇪", label: "الإمارات (+971)" },
  { code: "+965", country: "🇰🇼", label: "الكويت (+965)" },
  { code: "+974", country: "🇶🇦", label: "قطر (+974)" },
  { code: "+973", country: "🇧🇭", label: "البحرين (+973)" },
  { code: "+968", country: "🇴🇲", label: "عمان (+968)" },
  { code: "+962", country: "🇯🇴", label: "الأردن (+962)" },
  { code: "+964", country: "🇮🇶", label: "العراق (+964)" },
  { code: "+212", country: "🇲🇦", label: "المغرب (+212)" },
  { code: "+216", country: "🇹🇳", label: "تونس (+216)" },
  { code: "+213", country: "🇩🇿", label: "الجزائر (+213)" },
  { code: "+249", country: "🇸🇩", label: "السودان (+249)" },
  { code: "+967", country: "🇾🇪", label: "اليمن (+967)" },
  { code: "+970", country: "🇵🇸", label: "فلسطين (+970)" },
  { code: "+1", country: "🇺🇸", label: "USA (+1)" },
  { code: "+44", country: "🇬🇧", label: "UK (+44)" },
];

interface Props {
  initialKind?: InstitutionKind;
  onKindChange?: (kind: InstitutionKind) => void;
  showKindSelector?: boolean;
}

export default function InstitutionRegistrationForm({
  initialKind = "college",
  onKindChange,
  showKindSelector = true,
}: Props) {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedKind, setSelectedKind] = useState<InstitutionKind>(initialKind);

  // Institution Details
  const [institutionName, setInstitutionName] = useState("");
  const [parentOrganization, setParentOrganization] = useState("");
  const [desiredSubdomain, setDesiredSubdomain] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Licenses & Official Documents
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseIssuer, setLicenseIssuer] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [authorizationLetterFile, setAuthorizationLetterFile] = useState<File | null>(null);

  // Responsible Manager
  const [managerName, setManagerName] = useState("");
  const [managerRoleTitle, setManagerRoleTitle] = useState("");
  const [managerIdType, setManagerIdType] = useState<"national_id" | "iqama" | "passport">("national_id");
  const [managerIdNumber, setManagerIdNumber] = useState("");
  const [managerIdFile, setManagerIdFile] = useState<File | null>(null);
  const [managerPhone, setManagerPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [managerEmail, setManagerEmail] = useState("");

  // Location & Address
  const [country, setCountry] = useState("المملكة العربية السعودية");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Capacity & Academics
  const [studentCapacity, setStudentCapacity] = useState("");
  const [facultyCount, setFacultyCount] = useState("");
  const [departmentsCount, setDepartmentsCount] = useState("");
  const [specializations, setSpecializations] = useState("");

  // Account Security
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  const currentOption = INSTITUTION_TYPES.find((t) => t.id === selectedKind) || INSTITUTION_TYPES[0];

  const handleKindSelect = (kind: InstitutionKind) => {
    setSelectedKind(kind);
    if (onKindChange) onKindChange(kind);
    // Autofill suggested default title if user hasn't typed one
    const opt = INSTITUTION_TYPES.find((t) => t.id === kind);
    if (opt && (!managerRoleTitle || INSTITUTION_TYPES.some(i => i.defaultRoleTitleAr === managerRoleTitle))) {
      setManagerRoleTitle(isRtl ? opt.defaultRoleTitleAr : opt.defaultRoleTitleEn);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: isRtl ? "حجم الملف كبير" : "File too large",
        description: isRtl ? "شعار المؤسسة يجب ألا يتجاوز 5 ميجابايت" : "Logo must be under 5MB",
        variant: "destructive",
      });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleDocumentPick = (file: File | undefined, setter: (f: File | null) => void, fieldLabel: string) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: isRtl ? "حجم الملف كبير" : "File too large",
        description: isRtl ? `حجم ${fieldLabel} يجب ألا يتجاوز 15 ميجابايت` : "File must be under 15MB",
        variant: "destructive",
      });
      return;
    }
    setter(file);
    toast({
      title: isRtl ? "تم إرفاق الملف بنجاح" : "File attached",
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!institutionName.trim()) {
      toast({ title: isRtl ? "حقل مطلوب" : "Required Field", description: isRtl ? "يرجى إدخال اسم المؤسسة الرسمي" : "Please enter institution name", variant: "destructive" });
      return;
    }
    if (!licenseNumber.trim()) {
      toast({ title: isRtl ? "حقل مطلوب" : "Required Field", description: isRtl ? "يرجى إدخال رقم الترخيص أو السجل التجاري / الأكاديمي" : "Please enter license or registration number", variant: "destructive" });
      return;
    }
    if (!managerName.trim()) {
      toast({ title: isRtl ? "حقل مطلوب" : "Required Field", description: isRtl ? "يرجى إدخال اسم الشخص المسؤول عن إدارة المؤسسة" : "Please enter administrator's name", variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: isRtl ? "حقل مطلوب" : "Required Field", description: isRtl ? "يرجى تحديد المدينة" : "Please enter city", variant: "destructive" });
      return;
    }
    if (!managerPhone.trim()) {
      toast({ title: isRtl ? "حقل مطلوب" : "Required Field", description: isRtl ? "يرجى إدخال رقم هاتف المسؤول" : "Please enter phone number", variant: "destructive" });
      return;
    }
    const finalAdminEmail = (adminEmail || managerEmail).trim().toLowerCase();
    if (!finalAdminEmail || !finalAdminEmail.includes("@")) {
      toast({ title: isRtl ? "بريد إلكتروني غير صالح" : "Invalid Email", description: isRtl ? "يرجى إدخال بريد إلكتروني إداري صالح" : "Please enter a valid administrator email", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: isRtl ? "كلمة المرور مطلوبة" : "Password Required", description: isRtl ? "يرجى إدخال كلمة مرور لحساب الإدارة السحابية" : "Please enter a password", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords mismatch", description: isRtl ? "يرجى التأكد من تطابق كلمتي المرور" : "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: isRtl ? "كلمة المرور قصيرة" : "Weak Password", description: isRtl ? "يجب ألا تقل كلمة المرور عن 8 أحرف" : "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        try {
          const kindMap: Record<InstitutionKind, "college" | "institute" | "language_center" | "training_center"> = {
            college: "college",
            institute: "institute",
            language_center: "language_center",
            training_center: "training_center",
            school: "college",
            tutoring_center: "training_center",
          };
          logoUrl = await uploadSignupLogo(kindMap[selectedKind], logoFile);
        } catch (uploadErr) {
          console.warn("Logo upload failed, continuing with registration:", uploadErr);
        }
      }

      // 2. Register Supabase Auth account as an Administration account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalAdminEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: `إدارة ${institutionName}`,
            role: "institution_admin",
            account_type: "admin",
            account_nature: "institution_administration",
            institution_type: selectedKind,
            institution_name: institutionName,
            manager_name: managerName,
            manager_role: managerRoleTitle || currentOption.defaultRoleTitleAr,
          },
        },
      });
      if (authError) throw authError;

      // 3. Compile structured dossier string for Admin review
      const dossierPayload = [
        `═══ ملف اعتماد وتسجيل حساب إدارة مؤسسة سحابية (UNIGATES) ═══`,
        `• نوع الحساب: حساب إدارة ${currentOption.labelAr} (${selectedKind})`,
        `• الاسم الرسمي: ${institutionName}`,
        parentOrganization ? `• التبعية / الجامعة: ${parentOrganization}` : null,
        desiredSubdomain ? `• النطاق المطلوب: ${desiredSubdomain}.unigates.online` : null,
        websiteUrl ? `• الموقع الإلكتروني: ${websiteUrl}` : null,
        ``,
        `═══ التراخيص والوثائق الرسمية ═══`,
        `• رقم الترخيص / السجل: ${licenseNumber}`,
        licenseIssuer ? `• جهة الإصدار: ${licenseIssuer}` : null,
        licenseExpiry ? `• تاريخ الانتهاء: ${licenseExpiry}` : null,
        taxNumber ? `• الرقم الضريبي: ${taxNumber}` : null,
        licenseFile ? `• ملف الترخيص المرفق: ${licenseFile.name} (${(licenseFile.size / 1024).toFixed(0)} KB)` : `• ملف الترخيص: لم يتم إرفاق ملف ورقي`,
        authorizationLetterFile ? `• خطاب التفويض الإداري: ${authorizationLetterFile.name} (${(authorizationLetterFile.size / 1024).toFixed(0)} KB)` : `• خطاب التفويض: غير مرفق`,
        ``,
        `═══ الشخص المسؤول عن الإدارة ═══`,
        `• اسم المسؤول الرباعي: ${managerName}`,
        `• المسمى الوظيفي: ${managerRoleTitle || currentOption.defaultRoleTitleAr}`,
        `• وثيقة الهوية: ${managerIdType === "national_id" ? "هوية وطنية" : managerIdType === "iqama" ? "إقامة" : "جواز سفر"} - رقم: ${managerIdNumber || "غير مدخل"}`,
        managerIdFile ? `• صورة الهوية المرفقة: ${managerIdFile.name}` : null,
        `• جوال المسؤول المباشر: ${countryCode}${managerPhone}`,
        managerEmail ? `• بريد المسؤول المباشر: ${managerEmail}` : null,
        ``,
        `═══ العنوان والمقر الجغرافي ═══`,
        `• الدولة: ${country}`,
        `• المدينة: ${city}`,
        district ? `• الحي / المنطقة: ${district}` : null,
        detailedAddress ? `• العنوان التفصيلي: ${detailedAddress}` : null,
        googleMapsUrl ? `• رابط خرائط Google: ${googleMapsUrl}` : null,
        ``,
        `═══ الطاقة الاستيعابية والإحصائيات ═══`,
        `• إجمالي عدد الطلاب: ${studentCapacity ? parseInt(studentCapacity) : 0}`,
        facultyCount ? `• عدد الكادر التدريسي: ${facultyCount}` : null,
        departmentsCount ? `• عدد الأقسام / الفروع / الفصول: ${departmentsCount}` : null,
        specializations ? `• التخصصات / المراحل: ${specializations}` : null,
        ``,
        `═══ حالة الاعتماد ═══`,
        `• الحالة الحالية: قيد المراجعة والتدقيق الإداري من إدارة UNIGATES`,
        `• تاريخ التقديم: ${new Date().toISOString()}`,
      ].filter(Boolean).join("\n");

      const studentCountNum = studentCapacity ? parseInt(studentCapacity, 10) || 0 : 0;
      const cleanPhone = `${countryCode}${managerPhone}`;

      // 4. Insert into college_registrations (unified backbone)
      const { data: regInsert, error: regError } = await supabase.from("college_registrations").insert({
        college_name: institutionName,
        university_name: parentOrganization || null,
        city: `${country} - ${city}`,
        address: detailedAddress || (district ? `حي ${district}` : null),
        dean_name: managerName,
        logo_url: logoUrl,
        email: finalAdminEmail,
        phone: cleanPhone,
        student_count: studentCountNum,
        message: dossierPayload,
        type: selectedKind,
        status: "pending", // ALWAYS pending admin review
      }).select("id").maybeSingle();

      if (regError) throw regError;

      // 5. If it's a school, also mirror to school_registrations for legacy viewers
      if (selectedKind === "school") {
        try {
          await supabase.from("school_registrations").insert({
            school_name: institutionName,
            city: `${country} - ${city}`,
            address: detailedAddress || null,
            principal_name: managerName,
            email: finalAdminEmail,
            phone: cleanPhone,
            student_count: studentCountNum,
            message: dossierPayload,
            status: "pending",
          });
        } catch (schoolErr) {
          console.warn("Mirroring to school_registrations skipped:", schoolErr);
        }
      }

      setSubmissionId(regInsert?.id || Math.random().toString(36).substring(2, 9).toUpperCase());
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Institution registration failed:", err);
      toast({
        title: isRtl ? "تعذر إرسال طلب التسجيل" : "Registration Failed",
        description: err?.message || (isRtl ? "حدث خطأ غير متوقع. يرجى التحقق من البيانات والمحاولة مجدداً." : "An unexpected error occurred. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // SUCCESS / CONFIRMATION SCREEN (UNDER REVIEW BY ADMIN)
  // ══════════════════════════════════════════════════════════════════
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto w-full py-8 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-in zoom-in-75 duration-300">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-bold px-3 py-1">
            {isRtl ? "⏳ طلب الحساب قيد المراجعة والتدقيق" : "⏳ Account Pending Admin Review"}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {isRtl ? "تم استلام طلب تسجيل مؤسستكم بنجاح!" : "Application Submitted Successfully!"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {isRtl
              ? `تم تسجيل طلب حساب إدارة «${institutionName}» (${currentOption.labelAr}) بنجاح، وهو الآن قيد المراجعة والتحقق الأكاديمي والقانوني من قِبل إدارة منصة UNIGATES لتفعيل صلاحيات الإدارة الكاملة.`
              : `Application for "${institutionName}" administration account has been received and is currently under official review by the UNIGATES Administration to activate full administrative privileges.`}
          </p>
        </div>

        {/* Dossier Card */}
        <div className="p-5 rounded-2xl border border-border bg-card text-start space-y-3.5 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-muted-foreground font-semibold">{isRtl ? "رقم المرجع للطلب:" : "Application Reference:"}</span>
            <span className="font-mono font-bold text-foreground bg-muted px-2.5 py-1 rounded-md">{submissionId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">{isRtl ? "نوع المساحة السحابية:" : "Space Type:"}</span>
            <span className="font-bold text-foreground">{currentOption.labelAr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">{isRtl ? "الشخص المسؤول:" : "Administrator:"}</span>
            <span className="font-bold text-foreground">{managerName} ({managerRoleTitle || currentOption.defaultRoleTitleAr})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">{isRtl ? "البريد الإلكتروني الإداري:" : "Admin Email:"}</span>
            <span className="font-mono text-foreground">{adminEmail || managerEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">{isRtl ? "رقم الترخيص / السجل:" : "License No:"}</span>
            <span className="font-mono text-foreground">{licenseNumber}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground font-semibold">{isRtl ? "حالة الاعتماد:" : "Approval Status:"}</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {isRtl ? "بانتظار فحص التراخيص والاعتماد النهائي" : "Pending Official Verification"}
            </span>
          </div>
        </div>

        {/* Steps notice */}
        <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-start space-y-2 text-xs">
          <h4 className="font-black text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            {isRtl ? "ما الخطوة التالية بعد التقديم؟" : "What happens next?"}
          </h4>
          <ul className="space-y-1.5 text-muted-foreground list-disc list-inside leading-relaxed">
            <li>{isRtl ? "يقوم فريق التدقيق بمراجعة التراخيص والسجل وخطاب التفويض ومطابقتها." : "Our review desk verifies the submitted licenses, registration and authorizations."}</li>
            <li>{isRtl ? "سيتم التواصل مع الشخص المسؤول هاتفياً أو عبر البريد للتأكيد واعتماد الحساب." : "We will reach out to the authorized representative via phone/email to confirm details."}</li>
            <li>{isRtl ? "بمجرد الاعتماد، ستتمكن من تسجيل الدخول إلى لوحة تحكم مؤسستك وتجهيز مساحتك السحابية." : "Once approved, you will be able to log in to your institutional cloud dashboard."}</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs">
              {isRtl ? "العودة للصفحة الرئيسية" : "Back to Home"}
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs bg-primary text-primary-foreground">
              {isRtl ? "صفحة تسجيل الدخول" : "Go to Login"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // REGISTRATION FORM
  // ══════════════════════════════════════════════════════════════════
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-8" dir={dir}>
      
      {/* ── 1. INSTITUTION TYPE SELECTOR (THE 6 ICONS) ── */}
      {showKindSelector && (
        <div className="space-y-3.5">
          <div className="text-center sm:text-start">
            <Label className="text-sm font-black text-foreground block">
              {isRtl ? "اختر نوع المؤسسة التعليمية المراد تسجيلها:" : "Select Institution Cloud Space Type:"}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl ? "تضم منصة UNIGATES 6 فئات سحابية مستقلة مجهزة بأدوار وصلاحيات متخصصة" : "UNIGATES offers 6 independent cloud categories with specialized roles"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {INSTITUTION_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedKind === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleKindSelect(t.id)}
                  className={`group relative flex flex-col items-center justify-center text-center p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]`
                      : `border-border/80 bg-card hover:bg-card/90 hover:border-primary/40`
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 ${
                    isSelected
                      ? `bg-primary text-primary-foreground shadow-sm`
                      : `bg-muted text-muted-foreground group-hover:scale-105 group-hover:text-primary`
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground leading-tight line-clamp-1">
                    {isRtl ? t.labelAr : t.labelEn}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {isRtl ? t.badgeAr : t.badgeEn}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Institution Hero Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <currentOption.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {isRtl ? `طلب تسجيل مساحة سحابية — ${currentOption.labelAr}` : `Register Workspace — ${currentOption.labelEn}`}
              </h2>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                {isRtl ? currentOption.badgeAr : currentOption.badgeEn}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {isRtl ? currentOption.descriptionAr : currentOption.descriptionEn}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{isRtl ? "يخضع لمراجعة الإدارة" : "Admin Review Required"}</span>
        </div>
      </div>

      {/* ── SECTION A: INSTITUTION IDENTITY & PROFILE ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "بيانات وهوية المؤسسة التعليمية" : "Institution Identity & Profile"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "الاسم الرسمي والتبعية والنطاق السحابي والشعار" : "Official name, affiliation, custom subdomain, and logo"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? `اسم ${currentOption.labelAr} الرسمي بالكامل` : "Official Institution Name"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              placeholder={isRtl ? `مثال: ${currentOption.labelAr} الحديثة للعلوم والتكنولوجيا` : "e.g. Modern College of Science"}
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "التبعية / الجامعة / الإدارة التعليمية التابع لها" : "Parent University / Directorate"}
            </Label>
            <Input
              placeholder={isRtl ? "مثال: جامعة القاهرة / إدارة التعليم الأهلي (إن وجد)" : "Parent university or educational authority"}
              value={parentOrganization}
              onChange={(e) => setParentOrganization(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "النطاق السحابي المطلوب لمساحتكم" : "Desired Cloud Subdomain"}
            </Label>
            <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden" dir="ltr">
              <Input
                placeholder="my-institution"
                value={desiredSubdomain}
                onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-11 border-0 focus-visible:ring-0 text-xs font-mono font-bold"
              />
              <span className="px-3 text-xs text-muted-foreground font-mono bg-muted py-3 border-s border-border select-none">
                .unigates.online
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "الموقع الإلكتروني الرسمي أو صفحة التعريف" : "Official Website / Portal URL"}
            </Label>
            <Input
              type="url"
              placeholder="https://example.edu"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
              dir="ltr"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-bold text-foreground block">
            {isRtl ? "شعار المؤسسة الرسمي (Logo)" : "Official Institution Logo"}
          </Label>
          <div className="flex items-center gap-4 flex-wrap">
            {logoPreview ? (
              <div className="relative w-20 h-20 rounded-2xl border-2 border-primary/30 p-1.5 bg-background flex items-center justify-center overflow-hidden group">
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full sm:w-auto sm:min-w-[240px] h-20 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-primary">
                  <ImagePlus className="w-5 h-5 text-primary" />
                  <span>{isRtl ? "انقر لاختيار الشعار (PNG / JPG)" : "Upload Logo (PNG / JPG)"}</span>
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
            <span className="text-[11px] text-muted-foreground">
              {isRtl ? "يُفضّل صورة شفافة مربعة بأبعاد 500x500 بكسل وبحجم أقل من 5 ميجابايت." : "Preferred transparent PNG, 500x500 px, max 5MB."}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION B: LICENSES & ACCREDITATION DOCUMENTS ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "التراخيص والأوراق الثبوتية والاعتماد" : "Licensing & Official Credentials"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "إرفاق التراخيص الرسمية والسجل التجاري / الأكاديمي للتحقق والاعتماد" : "Attach valid operating licenses, accreditation or commercial registers"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "رقم الترخيص / السجل التجاري أو الأكاديمي" : "License / Registration Number"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              placeholder={isRtl ? "مثال: 1010XXXXXX أو ترخيص رقم 458/ت" : "e.g. License/Registration ID"}
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "جهة إصدار الترخيص" : "Issuing Authority / Ministry"}
            </Label>
            <Input
              placeholder={isRtl ? "مثال: وزارة التعليم / المؤسسة العامة للتدريب / وزارة التجارة" : "e.g. Ministry of Education"}
              value={licenseIssuer}
              onChange={(e) => setLicenseIssuer(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "تاريخ انتهاء سريان الترخيص" : "License Expiry Date"}
            </Label>
            <Input
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "الرقم الضريبي للمنشأة (إن وجد)" : "Tax Identification Number (VAT)"}
            </Label>
            <Input
              placeholder={isRtl ? "مثال: 300XXXXXXXXXXXX" : "Tax/VAT number"}
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
              dir="ltr"
            />
          </div>
        </div>

        {/* File Uploads for Licenses & Authorization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. Official License File */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                {isRtl ? "ملف الترخيص / السجل التجاري" : "License / Register Document"}
              </span>
              <span className="text-[10px] text-destructive font-bold">{isRtl ? "مطلوب" : "Required"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "يرجى إرفاق نسخة ضوئية ملونة واضحة بصيغة PDF أو صورة (حتى 15 ميجابايت)" : "Color scan of the license (PDF or Image, max 15MB)"}
            </p>
            {licenseFile ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-emerald-500/30 text-xs">
                <span className="font-bold truncate text-emerald-700 dark:text-emerald-400">{licenseFile.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setLicenseFile(null)} className="h-7 w-7 p-0 text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>{isRtl ? "رفع ملف الترخيص" : "Upload License"}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleDocumentPick(e.target.files?.[0], setLicenseFile, isRtl ? "ملف الترخيص" : "License")}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 2. Official Authorization / Delegation Letter */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                {isRtl ? "خطاب التفويض الإداري الرسمي" : "Official Authorization Letter"}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">{isRtl ? "موصى به" : "Recommended"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "خطاب تفويض مطبوع على أوراق المؤسسة الرسمية ومختوم بتفويض المشرف" : "Letterhead delegation signed & stamped authorizing management"}
            </p>
            {authorizationLetterFile ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-primary/30 text-xs">
                <span className="font-bold truncate text-primary">{authorizationLetterFile.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAuthorizationLetterFile(null)} className="h-7 w-7 p-0 text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-10 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>{isRtl ? "رفع خطاب التفويض (اختياري)" : "Upload Letter"}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleDocumentPick(e.target.files?.[0], setAuthorizationLetterFile, isRtl ? "خطاب التفويض" : "Letter")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION C: RESPONSIBLE ADMINISTRATOR DETAILS ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "الشخص المسؤول عن إدارة المكان والمساحة" : "Authorized Institutional Administrator"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "بيانات العميد / المدير / المشرف المسؤول عن التعاقد والتواصل" : "Director, Dean or Manager details for compliance & verification"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "الاسم الرباعي للشخص المسؤول" : "Administrator Full Name"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              placeholder={isRtl ? "مثال: د. عبد الله بن محمد الأحمد" : "Full legal name"}
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "المسمى والصفة الوظيفية الرسمية" : "Official Job Title / Role"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              placeholder={isRtl ? currentOption.defaultRoleTitleAr : currentOption.defaultRoleTitleEn}
              value={managerRoleTitle}
              onChange={(e) => setManagerRoleTitle(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "نوع وثيقة إثبات الشخصية" : "ID Document Type"}
            </Label>
            <Select value={managerIdType} onValueChange={(v: any) => setManagerIdType(v)}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="national_id">{isRtl ? "هوية وطنية" : "National ID"}</SelectItem>
                <SelectItem value="iqama">{isRtl ? "إقامة نظامية" : "Resident ID (Iqama)"}</SelectItem>
                <SelectItem value="passport">{isRtl ? "جواز سفر" : "Passport"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "رقم وثيقة إثبات الشخصية للمسؤول" : "ID / Passport Number"}
            </Label>
            <Input
              placeholder={isRtl ? "أدخل رقم الهوية أو الإقامة أو الجواز" : "Enter ID number"}
              value={managerIdNumber}
              onChange={(e) => setManagerIdNumber(e.target.value)}
              className="h-11 rounded-xl bg-background border-border"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "رقم الهاتف المباشر للمسؤول (للتواصل والتحقق)" : "Direct Mobile Number"} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2" dir="ltr">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="h-11 w-[125px] shrink-0 rounded-xl bg-background border-border text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {countryCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.country} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                required
                type="tel"
                placeholder="5XXXXXXXX / 1XXXXXXXXX"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                className="h-11 flex-1 rounded-xl bg-background border-border text-xs font-mono font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "البريد الإلكتروني المباشر للشخص المسؤول" : "Direct Manager Email"}
            </Label>
            <Input
              type="email"
              placeholder="manager@example.edu"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className="h-11 rounded-xl bg-background border-border text-xs"
              dir="ltr"
            />
          </div>
        </div>

        {/* Manager ID Document Upload */}
        <div className="p-3.5 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-foreground block">
              {isRtl ? "صورة إثبات الشخصية للمسؤول (هوية / جواز سفر)" : "Manager ID Proof Upload"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isRtl ? "صورة ملونة واضحة للتحقق من هوية المفوض قانونياً" : "Clear photo/scan for authorized signer identity check"}
            </span>
          </div>
          {managerIdFile ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-background px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <span className="truncate max-w-[180px]">{managerIdFile.name}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => setManagerIdFile(null)} className="h-6 w-6 p-0 text-destructive">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <label className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-background border border-border hover:border-primary/50 text-xs font-bold text-foreground cursor-pointer transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>{isRtl ? "إرفاق صورة الهوية" : "Upload ID"}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleDocumentPick(e.target.files?.[0], setManagerIdFile, isRtl ? "صورة الهوية" : "ID")}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* ── SECTION D: LOCATION & CAMPUS ADDRESS ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "العنوان والمقر الجغرافي للمؤسسة" : "Campus Location & Address"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "الدولة والمدينة والحي ورابط خرائط جوجل لتسهيل التحقق الميداني" : "Country, city, district, street, and Google Maps pin"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "الدولة" : "Country"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={isRtl ? "مثال: المملكة العربية السعودية / مصر" : "Country"}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "المدينة" : "City"} <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isRtl ? "مثال: الرياض / القاهرة / جدة" : "City"}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "المنطقة / الحي" : "District / Area"}
            </Label>
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={isRtl ? "مثال: حي النخيل / الدقي" : "District"}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "العنوان التفصيلي للشارع ورقم المبنى" : "Detailed Street & Building Address"}
            </Label>
            <Input
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder={isRtl ? "مثال: طريق الملك فهد، مبنى رقم 14، الطابق 3" : "Street name, building number"}
              className="h-11 rounded-xl bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "رابط موقع المؤسسة على خرائط Google (Maps)" : "Google Maps Pin URL"}
            </Label>
            <Input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="h-11 rounded-xl bg-background border-border text-xs"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION E: CAPACITY & ACADEMIC METRICS ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
            5
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "الطاقة الاستيعابية والبيانات التعليمية" : "Student Capacity & Academic Scale"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "إجمالي عدد الطلاب وأعضاء هيئة التدريس والأقسام والشعب" : "Total active student body, faculty count, and departments"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "إجمالي عدد الطلاب (المتوقع أو الحالي)" : "Total Student Body"} <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={isRtl ? "مثال: 500" : "e.g. 500"}
              value={studentCapacity}
              onChange={(e) => setStudentCapacity(e.target.value)}
              className="h-11 rounded-xl bg-background border-border text-xs font-bold font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "عدد الكادر التدريسي / المعلمين" : "Faculty / Teachers Count"}
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={isRtl ? "مثال: 35" : "e.g. 35"}
              value={facultyCount}
              onChange={(e) => setFacultyCount(e.target.value)}
              className="h-11 rounded-xl bg-background border-border text-xs font-bold font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "عدد الأقسام / الشعب / الفصول" : "Departments / Classes Count"}
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={isRtl ? "مثال: 8" : "e.g. 8"}
              value={departmentsCount}
              onChange={(e) => setDepartmentsCount(e.target.value)}
              className="h-11 rounded-xl bg-background border-border text-xs font-bold font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">
            {isRtl ? "التخصصات أو المراحل التعليمية الرئيسية (اختياري)" : "Key Academic Programs or Grades"}
          </Label>
          <Textarea
            rows={2}
            value={specializations}
            onChange={(e) => setSpecializations(e.target.value)}
            placeholder={isRtl ? "مثال: هندسة البرمجيات، إدارة الأعمال، التحضير لاختبارات الثانوية العامة..." : "e.g. Software Engineering, High School SAT Prep..."}
            className="rounded-xl bg-background border-border text-xs"
          />
        </div>
      </div>

      {/* ── SECTION F: ADMINISTRATIVE ACCOUNT CREDENTIALS ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            6
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              {isRtl ? "بيانات الدخول الإداري وحماية الحساب" : "Administrative Login & Security"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {isRtl ? "البريد الإلكتروني المعتمد للدخول ولوحة التحكم السحابية" : "Email and strong password for your cloud portal management"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">
            {isRtl ? "البريد الإلكتروني الرسمي لحساب الإدارة (Login Email)" : "Official Admin Login Email"} <span className="text-destructive">*</span>
          </Label>
          <Input
            required
            type="email"
            placeholder="admin@institution.edu"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="h-11 rounded-xl bg-background border-border text-xs font-mono"
            dir="ltr"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "كلمة المرور" : "Password"} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pe-10 rounded-xl bg-background border-border text-xs font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isRtl ? "8 أحرف على الأقل تشمل أرقاماً ورموزاً وأحرفاً كبيرة وصغيرة." : "At least 8 characters with upper, lower, numbers & symbols."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {isRtl ? "تأكيد كلمة المرور" : "Confirm Password"} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                required
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 pe-10 rounded-xl bg-background border-border text-xs font-mono"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION G: OFFICIAL COMPLIANCE & ADMIN REVIEW NOTICE ── */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 space-y-2">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-foreground">
              {isRtl ? "سياسة الاعتماد والمراجعة الإدارية الشاملة" : "Mandatory Institutional Review Policy"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRtl
                ? "تخضع جميع حسابات المؤسسات التعليمية للمراجعة والتدقيق القانوني والأكاديمي من قِبل إدارة UNIGATES. سيتم التحقق من صحة التراخيص والسجل والأوراق الثبوتية المرفوعة قبل اعتماد وتفعيل المساحة السحابية."
                : "All educational institution accounts are strictly reviewed and verified by UNIGATES Administration before activating the dedicated cloud workspace."}
            </p>
          </div>
        </div>
      </div>

      {/* ── SUBMIT BUTTON ── */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground text-center sm:text-start">
          <span>{isRtl ? "بالضغط على زر الإرسال، فإنك تقر بصحة البيانات والوثائق المرفقة." : "By submitting, you confirm the accuracy of all attached documents."}</span>
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full sm:w-auto h-12 px-8 rounded-xl font-black text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isRtl ? "جاري تسجيل المؤسسة ورفع الوثائق..." : "Submitting Dossier..."}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span>{isRtl ? "إرسال طلب التسجيل للاعتماد والمراجعة" : "Submit Application for Review"}</span>
            </>
          )}
        </Button>
      </div>

    </form>
  );
}
