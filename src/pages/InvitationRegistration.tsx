import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, AlertTriangle, CheckCircle2, GraduationCap, Building2,
  ShieldCheck, Sparkles, ArrowRight, ArrowLeft, KeyRound, Lock,
  Mail, UserRound, Phone, Upload, FileText, Check, Eye, EyeOff,
  Calendar, Award, BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
import {
  PERMISSION_ITEMS,
  ROLE_PERMISSION_PRESETS,
  type PermissionItem,
} from "@/components/FacultyMemberForm";

type VerificationStatus = "idle" | "verifying" | "valid" | "invalid" | "used" | "error";

interface VerifiedInvitationInfo {
  institutionId: string;
  institutionType: "college" | "institute";
  institutionName: string;
  role: string;
  customTitle?: string;
  permissions?: string[];
  departmentIds?: string[];
  departmentName?: string;
  suggestedName?: string;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const InvitationRegistration = () => {
  const { token: pathToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get("code") || "";
  const queryTitle = searchParams.get("title") || "";
  const queryPerms = searchParams.get("perms") || "";
  const queryDept = searchParams.get("dept") || "";
  const queryName = searchParams.get("name") || "";

  const initialCode = (pathToken || queryCode || "").trim().toUpperCase();

  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  // Verification State
  const [code, setCode] = useState(initialCode);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [invitationInfo, setInvitationInfo] = useState<VerifiedInvitationInfo | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(queryName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Qualification / Last Certificate
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateFileName, setCertificateFileName] = useState("");
  const certInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Verify code logic
  const verifyInvitationCode = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) {
      setVerificationStatus("invalid");
      setErrorMessage(isRtl ? "يرجى إدخال كود الدعوة المؤقت" : "Please enter the invitation code");
      return;
    }

    setVerificationStatus("verifying");
    setErrorMessage("");

    try {
      // 1. Try verify_institution_invitation RPC
      const { data, error } = await supabase.rpc(
        "verify_institution_invitation" as any,
        { _code: cleanCode }
      );

      if (error) {
        console.warn("verify_institution_invitation warning:", error);
      }

      const row = Array.isArray(data) ? data[0] : null;

      if (row && row.is_valid) {
        // Resolve pre-configured metadata from query or cache
        let resolvedTitle = queryTitle;
        let resolvedPerms: string[] = queryPerms ? queryPerms.split(",").filter(Boolean) : [];
        let resolvedDepts: string[] = queryDept ? queryDept.split(",").filter(Boolean) : [];

        // Check localStorage cache if available
        try {
          const cached = localStorage.getItem(`ug_invite_meta:${cleanCode}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (!resolvedTitle && parsed.customTitle) resolvedTitle = parsed.customTitle;
            if (resolvedPerms.length === 0 && Array.isArray(parsed.permissions)) resolvedPerms = parsed.permissions;
            if (resolvedDepts.length === 0 && Array.isArray(parsed.departmentIds)) resolvedDepts = parsed.departmentIds;
            if (!fullName && parsed.fullName) setFullName(parsed.fullName);
          }
        } catch { /* ignore */ }

        // Default permissions preset fallback if none provided
        if (resolvedPerms.length === 0 && ROLE_PERMISSION_PRESETS[row.role]) {
          resolvedPerms = ROLE_PERMISSION_PRESETS[row.role];
        }

        setInvitationInfo({
          institutionId: row.institution_id,
          institutionType: row.kind === "college" ? "college" : "institute",
          institutionName: row.institution_name || (isRtl ? "المؤسسة التعليمية" : "Educational Institution"),
          role: row.role || "lecturer",
          customTitle: resolvedTitle || (row.role === "student" ? (isRtl ? "طالب" : "Student") : row.role),
          permissions: resolvedPerms,
          departmentIds: resolvedDepts,
        });

        setVerificationStatus("valid");
        return;
      }

      // 2. Fallback: check college_invitations directly
      const { data: collegeInv } = await supabase
        .from("college_invitations")
        .select("id, college_id, role, is_active, max_uses, used_count")
        .eq("invitation_code", cleanCode)
        .maybeSingle();

      if (collegeInv) {
        if (!collegeInv.is_active || (collegeInv.max_uses && (collegeInv.used_count || 0) >= collegeInv.max_uses)) {
          setVerificationStatus("used");
          setErrorMessage(
            isRtl
              ? "هذا الكود المؤقت تم استخدامه بالفعل مسبقاً ولا يمكن استخدامه مرة أخرى (الأكواد صالحة لمرة واحدة فقط)."
              : "This temporary invitation code has already been used and cannot be reused (single-use code)."
          );
          return;
        }

        const { data: collegeReg } = await supabase
          .from("college_registrations")
          .select("college_name")
          .eq("id", collegeInv.college_id)
          .maybeSingle();

        setInvitationInfo({
          institutionId: collegeInv.college_id,
          institutionType: "college",
          institutionName: collegeReg?.college_name || (isRtl ? "الكلية" : "College"),
          role: collegeInv.role || "lecturer",
          customTitle: queryTitle || collegeInv.role,
          permissions: queryPerms ? queryPerms.split(",") : (ROLE_PERMISSION_PRESETS[collegeInv.role] || []),
        });
        setVerificationStatus("valid");
        return;
      }

      // 3. Fallback: check institute_invitations directly
      const { data: instituteInv } = await supabase
        .from("institute_invitations")
        .select("id, institute_id, role, is_active, max_uses, used_count")
        .eq("invitation_code", cleanCode)
        .maybeSingle();

      if (instituteInv) {
        if (!instituteInv.is_active || (instituteInv.max_uses && (instituteInv.used_count || 0) >= instituteInv.max_uses)) {
          setVerificationStatus("used");
          setErrorMessage(
            isRtl
              ? "هذا الكود المؤقت تم استخدامه بالفعل مسبقاً ولا يمكن استخدامه مرة أخرى (الأكواد صالحة لمرة واحدة فقط)."
              : "This temporary invitation code has already been used and cannot be reused (single-use code)."
          );
          return;
        }

        const { data: instReg } = await supabase
          .from("institute_registrations")
          .select("institute_name")
          .eq("id", instituteInv.institute_id)
          .maybeSingle();

        setInvitationInfo({
          institutionId: instituteInv.institute_id,
          institutionType: "institute",
          institutionName: instReg?.institute_name || (isRtl ? "المعهد / المركز" : "Institute / Center"),
          role: instituteInv.role || "lecturer",
          customTitle: queryTitle || instituteInv.role,
          permissions: queryPerms ? queryPerms.split(",") : (ROLE_PERMISSION_PRESETS[instituteInv.role] || []),
        });
        setVerificationStatus("valid");
        return;
      }

      // Code not found
      setVerificationStatus("invalid");
      setErrorMessage(
        isRtl
          ? "كود الدعوة غير صالح أو غير موجود. تأكد من إدخال الكود المكتوب بشكل صحيح."
          : "Invalid or expired invitation code. Please verify the entered code."
      );
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerificationStatus("error");
      setErrorMessage(err.message || (isRtl ? "فشل التحقق من الكود" : "Failed to verify code"));
    }
  };

  // Auto-verify on mount if code provided
  useEffect(() => {
    if (initialCode) {
      verifyInvitationCode(initialCode);
    }
  }, [initialCode]);

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast({
        title: isRtl ? "صيغة صورة غير مدعومة" : "Unsupported image format",
        description: isRtl ? "يرجى اختيار صورة بصيغة JPG أو PNG أو WebP" : "Use JPG, PNG or WebP",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      toast({
        title: isRtl ? "حجم الصورة كبير جداً" : "Image size too large",
        description: isRtl ? "الحد الأقصى لحجم الصورة هو 2 ميجابايت" : "Max photo size is 2MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  // Handle Certificate document selection
  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      toast({
        title: isRtl ? "صيغة مستند غير مدعومة" : "Unsupported document format",
        description: isRtl ? "يرجى اختيار ملف PDF أو صورة (JPG/PNG)" : "Use PDF or Image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_DOC_BYTES) {
      toast({
        title: isRtl ? "حجم المستند كبير جداً" : "File size too large",
        description: isRtl ? "الحد الأقصى لحجم المستند هو 10 ميجابايت" : "Max document size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setCertificateFile(file);
    setCertificateFileName(file.name);
  };

  // Validation
  const validateForm = (): string | null => {
    if (verificationStatus !== "valid" || !invitationInfo) {
      return isRtl ? "يجب التحقق من كود الدعوة المؤقت أولاً" : "Invitation code must be verified first";
    }
    if (!fullName.trim()) {
      return isRtl ? "يرجى إدخال الاسم الكامل" : "Full name is required";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return isRtl ? "يرجى إدخال بريد إلكتروني صالح" : "Valid email is required";
    }
    if (!password || password.length < 6) {
      return isRtl ? "كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام" : "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      return isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    }
    if (!qualification.trim()) {
      return isRtl ? "يرجى إدخال اسم آخر شهادة / المؤهل العلمي الذي حصلت عليه" : "Last qualification / degree is required";
    }
    return null;
  };

  // Submit Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const validationErr = validateForm();
    if (validationErr) {
      toast({
        title: isRtl ? "تنبيه" : "Validation Error",
        description: validationErr,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const isStudentRole = (invitationInfo?.role || "").toLowerCase() === "student";

      // 1. Upload photo if selected
      let uploadedPhotoUrl = "";
      if (photoFile) {
        try {
          const photoExt = photoFile.name.split(".").pop() || "jpg";
          const photoPath = `invitations/${code.trim().toUpperCase()}_${Date.now()}.${photoExt}`;
          const { error: photoErr } = await supabase.storage
            .from("avatars")
            .upload(photoPath, photoFile, { upsert: true });

          if (!photoErr) {
            const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(photoPath);
            uploadedPhotoUrl = pubData?.publicUrl || "";
          }
        } catch (photoUploadErr) {
          console.warn("Photo upload warning (non-fatal):", photoUploadErr);
        }
      }

      // 2. Upload certificate document if selected
      let uploadedCertUrl = "";
      if (certificateFile) {
        try {
          const certExt = certificateFile.name.split(".").pop() || "pdf";
          const certPath = `certificates/${code.trim().toUpperCase()}_${Date.now()}.${certExt}`;
          const { error: certErr } = await supabase.storage
            .from("user-documents")
            .upload(certPath, certificateFile, { upsert: true });

          if (!certErr) {
            const { data: certPub } = supabase.storage.from("user-documents").getPublicUrl(certPath);
            uploadedCertUrl = certPub?.publicUrl || "";
          }
        } catch (certUploadErr) {
          console.warn("Certificate upload warning (non-fatal):", certUploadErr);
        }
      }

      // 3. Prepare notes JSON payload preserving custom title and permissions
      const notesPayload = JSON.stringify({
        custom_title: invitationInfo?.customTitle || invitationInfo?.role,
        permissions: invitationInfo?.permissions || [],
        qualification: qualification.trim(),
        specialization: specialization.trim(),
        graduation_year: graduationYear.trim(),
        certificate_document_url: uploadedCertUrl,
        registered_via_invitation_code: code.trim().toUpperCase(),
      });

      // 4. Invoke Edge Function (create-faculty-account or create-student-account)
      const edgeFunctionName = isStudentRole ? "create-student-account" : "create-faculty-account";

      const requestBody: any = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        temporary_password: password,
        invitation_code: code.trim().toUpperCase(),
        role: invitationInfo?.role,
        extra: {
          date_of_birth: dateOfBirth || null,
          photo_url: uploadedPhotoUrl || null,
          qualification: qualification.trim() + (graduationYear ? ` (${graduationYear})` : ""),
          specialization: specialization.trim() || null,
          notes: notesPayload,
        },
      };

      if (!isStudentRole && invitationInfo?.departmentIds && invitationInfo.departmentIds.length > 0) {
        requestBody.department_ids = invitationInfo.departmentIds;
        requestBody.department_id = invitationInfo.departmentIds[0];
      }

      const { data: resp, error: fnErr } = await supabase.functions.invoke(
        edgeFunctionName,
        { body: requestBody }
      );

      if (fnErr) {
        let msg = fnErr.message || (isRtl ? "فشل إنشاء الحساب" : "Failed to create account");
        try {
          const ctx: any = (fnErr as any).context;
          const bodyText = ctx?.body
            ? typeof ctx.body === "string"
              ? ctx.body
              : await new Response(ctx.body).text()
            : "";
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            if (parsed?.error) msg = parsed.error;
          }
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      if (resp && (resp as any).error) {
        throw new Error((resp as any).error);
      }

      const createdUserId = (resp as any)?.user_id;

      // 5. Post-creation update to persist specific_role and notes
      if (createdUserId) {
        try {
          await supabase
            .from("institution_faculty_members")
            .update({
              specific_role: invitationInfo?.customTitle || invitationInfo?.role,
              notes: notesPayload,
              photo_url: uploadedPhotoUrl || null,
              qualification: qualification.trim(),
              specialization: specialization.trim(),
            })
            .eq("user_id", createdUserId);

          await supabase
            .from("profiles")
            .update({
              full_name: fullName.trim(),
              phone: phone.trim() || null,
            })
            .eq("user_id", createdUserId);
        } catch (dbErr) {
          console.warn("Post-creation db update warning:", dbErr);
        }
      }

      // Mark code in cache as used
      try {
        localStorage.removeItem(`ug_invite_meta:${code.trim().toUpperCase()}`);
      } catch { /* ignore */ }

      setRegisteredEmail(email.trim().toLowerCase());
      setSubmittedSuccessfully(true);

      toast({
        title: isRtl ? "تم تسجيل وتفعيل الحساب بنجاح!" : "Account Registered Successfully!",
        description: isRtl
          ? "يمكنك الآن تسجيل الدخول مباشرة ببريدك وكلمة السر الخاصة بك."
          : "You can now log in with your email and password.",
        duration: 8000,
      });
    } catch (err: any) {
      console.error("Registration failed:", err);
      toast({
        title: isRtl ? "فشل التسجيل" : "Registration Failed",
        description: err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Styling helpers
  const labelCls = "flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground";
  const iconCls = "w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0";
  const inputCls = "h-11 text-xs sm:text-sm border-2 border-border focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 bg-background/90 rounded-xl transition-all";

  // Success Screen
  if (submittedSuccessfully) {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-emerald-950/20 via-background to-teal-950/20 flex flex-col justify-center items-center p-4">
        <Card className="max-w-lg w-full border-2 border-emerald-500/40 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden text-center">
          <div className="h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 transform scale-110">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {isRtl ? "مرحباً بك! تم إنشاء حسابك بنجاح" : "Welcome! Account Created Successfully"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                {isRtl
                  ? `تم تفعيل حسابك وربطه بـ ${invitationInfo?.institutionName || "المؤسسة"} بصفة "${invitationInfo?.customTitle || invitationInfo?.role}".`
                  : `Your account is active and linked to ${invitationInfo?.institutionName} as "${invitationInfo?.customTitle || invitationInfo?.role}".`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/60 border border-border/60 text-start space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">{isRtl ? "البريد الإلكتروني:" : "Email:"}</span>
                <span className="font-bold text-foreground font-mono" dir="ltr">{registeredEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">{isRtl ? "المسمى المعتمد:" : "Official Title:"}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{invitationInfo?.customTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">{isRtl ? "الصلاحيات الممنوحة:" : "Permissions:"}</span>
                <span className="font-bold text-foreground">{invitationInfo?.permissions?.length || 0} {isRtl ? "صلاحيات مفعلة" : "active"}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-xl shadow-emerald-500/25"
              onClick={() => navigate("/login")}
            >
              <span>{isRtl ? "الانتقال إلى تسجيل الدخول" : "Proceed to Login"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-emerald-950/5 to-teal-950/10 text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/60 px-4 sm:px-8 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/20 p-0.5 bg-gradient-to-br from-teal-400 to-emerald-600">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                UNIGATES
              </span>
              <span className="block text-[10px] text-muted-foreground font-bold leading-none">
                {isRtl ? "بوابة التسجيل بالدعوة" : "Invitation Registration Portal"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelectorDropdown />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: Invitation Code Card */}
          <Card className="border-2 border-emerald-500/30 bg-card/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <KeyRound className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    {isRtl ? "1. كود الدعوة المؤقت (صالح لمرة واحدة)" : "1. Temporary Invitation Code (Single-Use)"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "أدخل كود الدعوة الذي أرسلته إليك إدارة المكان للتحقق من صلاحية التسجيل"
                      : "Enter the invitation code provided by your administration"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Input
                    className={`${inputCls} font-mono uppercase tracking-widest text-center text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5`}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="UG-XXXXXXXX"
                    maxLength={20}
                    disabled={verificationStatus === "verifying" || verificationStatus === "valid"}
                  />
                  {verificationStatus === "valid" && (
                    <div className="absolute inset-y-0 end-3 flex items-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {verificationStatus !== "valid" ? (
                  <Button
                    type="button"
                    onClick={() => verifyInvitationCode(code)}
                    disabled={!code.trim() || verificationStatus === "verifying"}
                    className="h-11 px-6 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {verificationStatus === "verifying" ? (
                      <Loader2 className="w-4 h-4 animate-spin me-2" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 me-2" />
                    )}
                    <span>{isRtl ? "التحقق من الكود" : "Verify Code"}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setVerificationStatus("idle");
                      setInvitationInfo(null);
                    }}
                    className="h-11 px-4 rounded-xl font-bold text-xs shrink-0"
                  >
                    <span>{isRtl ? "تغيير الكود" : "Change"}</span>
                  </Button>
                )}
              </div>

              {/* Error Alert */}
              {(verificationStatus === "invalid" || verificationStatus === "used" || verificationStatus === "error") && (
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3 text-xs leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Verified Info Card */}
              {verificationStatus === "valid" && invitationInfo && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isRtl ? "تم التحقق بنجاح من الدعوة" : "Invitation Verified"}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                      {isRtl ? "صالح للاستخدام مرة واحدة" : "Single-Use"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{isRtl ? "الجهة:" : "Institution:"}</span>
                      <strong className="text-foreground">{invitationInfo.institutionName}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{isRtl ? "المسمى المعتمد:" : "Assigned Title:"}</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{invitationInfo.customTitle}</strong>
                    </div>

                    {invitationInfo.permissions && invitationInfo.permissions.length > 0 && (
                      <div className="sm:col-span-2 flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
                        <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{isRtl ? "الصلاحيات الممنوحة من الإدارة:" : "Granted Permissions:"}</span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          {invitationInfo.permissions.length} {isRtl ? "صلاحيات مفعلة" : "active"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Registrant Credentials & Personal Info */}
          {verificationStatus === "valid" && (
            <Card className="border-2 border-border/80 bg-card/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserRound className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "2. بيانات تسجيل الدخول والمعلومات الشخصية" : "2. Account Credentials & Personal Info"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {isRtl
                        ? "أدخل بريدك الإلكتروني الشخصي وكلمة السر الخاصة بك التي ستستخدمها دائماً لتسجيل الدخول"
                        : "Set your own email and password for future logins"}
                    </p>
                  </div>
                </div>

                {/* Personal Photo & Full Name */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/40 bg-muted flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-12 h-12 text-muted-foreground/60" />
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      className="h-8 text-xs font-bold rounded-xl border-dashed hover:border-emerald-500"
                    >
                      <Upload className="w-3.5 h-3.5 me-1" />
                      {isRtl ? "رفع صورتك الشخصية" : "Upload Photo"}
                    </Button>
                    <span className="text-[10px] text-muted-foreground">
                      {isRtl ? "(JPG/PNG/WebP • حد 2MB)" : "(JPG/PNG • max 2MB)"}
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>
                        <UserRound className={iconCls} />
                        <span>{isRtl ? "الاسم الكامل ثلاثي أو رباعي" : "Full Name"}</span>
                        <span className="text-destructive font-black">*</span>
                      </Label>
                      <Input
                        className={inputCls}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isRtl ? "أدخل اسمك بالكامل..." : "Enter your full name..."}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          <Phone className={iconCls} />
                          <span>{isRtl ? "رقم الهاتف / واتساب" : "Phone Number"}</span>
                        </Label>
                        <Input
                          className={inputCls}
                          type="tel"
                          dir="ltr"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+20 100 000 0000"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          <Calendar className={iconCls} />
                          <span>{isRtl ? "تاريخ الميلاد (اختياري)" : "Date of Birth"}</span>
                        </Label>
                        <Input
                          className={inputCls}
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email and Passwords */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <Mail className={iconCls} />
                      <span>{isRtl ? "البريد الإلكتروني الخاص بك" : "Your Personal Email"}</span>
                      <span className="text-destructive font-black">*</span>
                    </Label>
                    <Input
                      className={inputCls}
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {isRtl
                        ? "هذا الإيميل ستستخدمه لتسجيل الدخول واستلام الإشعارات والتنبيهات الخاصة بك."
                        : "Used for login credentials and important platform notifications."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>
                        <Lock className={iconCls} />
                        <span>{isRtl ? "كلمة المرور الخاصة بك" : "Your Password"}</span>
                        <span className="text-destructive font-black">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          className={`${inputCls} pe-10`}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className={labelCls}>
                        <Lock className={iconCls} />
                        <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                        <span className="text-destructive font-black">*</span>
                      </Label>
                      <Input
                        className={inputCls}
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Last Certificate / Qualification in their field */}
          {verificationStatus === "valid" && (
            <Card className="border-2 border-border/80 bg-card/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Award className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "3. آخر شهادة حصلت عليها في مجالك" : "3. Last Degree & Professional Qualification"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {isRtl
                        ? "أدخل تفاصيل ومستند أعلى مؤهل أو آخر شهادة علمية/مهنية حصلت عليها في تخصصك"
                        : "Provide your highest or latest academic degree or professional credential in your field"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <GraduationCap className={iconCls} />
                      <span>{isRtl ? "اسم آخر شهادة / المؤهل العلمي" : "Last Qualification / Degree Name"}</span>
                      <span className="text-destructive font-black">*</span>
                    </Label>
                    <Input
                      className={inputCls}
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder={isRtl ? "مثال: دكتوراه في الجراحة / ماجستير علوم الحاسب / ليسانس لغات..." : "e.g. Ph.D. in Medicine, Master of Science..."}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <BookOpen className={iconCls} />
                      <span>{isRtl ? "التخصص في مجالك" : "Specialization / Field"}</span>
                    </Label>
                    <Input
                      className={inputCls}
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder={isRtl ? "مثال: جراحة عامة / ذكاء اصطناعي / لغة فرنسية..." : "e.g. Surgery, AI, Linguistics..."}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <Calendar className={iconCls} />
                      <span>{isRtl ? "سنة الحصول عليها / التخرج" : "Year Obtained / Graduation"}</span>
                    </Label>
                    <Input
                      className={inputCls}
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2023"
                      maxLength={4}
                    />
                  </div>

                  {/* Certificate Document Upload */}
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <FileText className={iconCls} />
                      <span>{isRtl ? "رفع ملف أو صورة الشهادة" : "Certificate File / Document"}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({isRtl ? "PDF أو صورة" : "PDF or Image"})</span>
                    </Label>
                    <input
                      ref={certInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleCertSelect}
                    />
                    <div
                      onClick={() => certInputRef.current?.click()}
                      className={`h-11 px-3 border-2 border-dashed rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        certificateFileName
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border hover:border-emerald-500/60 bg-background/50 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Upload className="w-4 h-4 shrink-0" />
                        <span className="text-xs truncate font-medium">
                          {certificateFileName || (isRtl ? "انقر لاختيار ملف الشهادة..." : "Click to select certificate file...")}
                        </span>
                      </div>
                      {certificateFileName && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Action */}
          {verificationStatus === "valid" && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full sm:w-auto h-12 px-10 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.01]"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin me-2" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 me-2" />
                )}
                <span>{isRtl ? "إتمام التسجيل وتفعيل الحساب" : "Complete Registration & Activate"}</span>
              </Button>
            </div>
          )}

        </form>
      </main>
    </div>
  );
};

export default InvitationRegistration;
