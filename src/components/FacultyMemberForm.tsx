import { useEffect, useMemo, useRef, useState } from "react";
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  Save,
  GraduationCap,
  Mail,
  Phone,
  IdCard,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  Users2,
  StickyNote,
  UserRound,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  ShieldCheck,
  Check,
  ChevronsUpDown,
  X,
  Sparkles,
  Building2,
  UserCheck,
  BadgeCheck,
  Lock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { generateStrongPassword as _generateStrongPassword } from "@/utils/crypto";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ugLogo from "@/assets/ug-logo.png";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

export function generateStrongPassword(): string {
  return _generateStrongPassword();
}

export function isStrongPassword(p: string): boolean {
  return (
    p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /[a-z]/.test(p) &&
    /\d/.test(p) &&
    !/\s/.test(p)
  );
}

const _ROLE_OPTIONS_BASE: { value: string; ar: string; en: string }[] = [
  { value: "department_head", ar: "رئيس القسم", en: "Department Head" },
  { value: "teacher", ar: "مدرس", en: "Teacher" },
  { value: "teaching_assistant", ar: "مدرس مساعد", en: "Teaching Assistant" },
  { value: "professor", ar: "أستاذ دكتور", en: "Professor" },
  { value: "doctor", ar: "دكتور", en: "Doctor" },
  { value: "assistant_lecturer", ar: "معيد", en: "Assistant Lecturer" },
  { value: "library_manager", ar: "مدير المكتبة", en: "Library Manager" },
];

export const buildRoleOptions = (isCollege: boolean) => [
  { value: "dean", ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: isCollege ? "Dean" : "Director" },
  { value: "vice_dean_postgrad", ar: isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", en: isCollege ? "Vice Dean - Postgraduate Studies" : "Vice Director - Postgraduate Studies" },
  { value: "vice_dean_students", ar: isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب", en: isCollege ? "Vice Dean - Student Affairs" : "Vice Director - Student Affairs" },
  { value: "vice_dean_community", ar: isCollege ? "وكيل الكلية لشئون البيئة وخدمة المجتمع" : "وكيل المعهد لشئون البيئة وخدمة المجتمع", en: isCollege ? "Vice Dean - Environment & Community Service" : "Vice Director - Environment & Community Service" },
  { value: "college_secretary", ar: isCollege ? "أمين الكلية" : "أمين المعهد", en: isCollege ? "College Secretary" : "Institute Secretary" },
  ..._ROLE_OPTIONS_BASE,
];

/** @deprecated Use buildRoleOptions(isCollege) instead. Kept for backward-compat with tests. */
export const ROLE_OPTIONS = buildRoleOptions(true);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FacultyFormMode = "admin-add" | "invitation";

export interface FacultyMemberFormData {
  photoUrl: string;
  fullName: string;
  role: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  qualification: string;
  specialization: string;
  hireDate: string;
  notes: string;
  /** admin-add only: temp password chosen by admin */
  tempPassword?: string;
  /** invitation only: password chosen by the invited member */
  password?: string;
  /** invitation only: confirmation */
  confirmPassword?: string;
  /** admin-add student only: comma-separated department codes */
  deptCodesInput?: string;
  /** admin-add student only: selected department IDs */
  selectedDeptIds?: string[];
  /** admin-add faculty only: selected department IDs (primary is first) */
  selectedDepartmentIds?: string[];
  /** admin-add faculty only: primary selected department ID */
  selectedDepartmentId?: string;
}

export type DepartmentOption = { id: string; department_name: string; department_code: string };

interface FacultyMemberFormProps {
  mode: FacultyFormMode;
  isRtl: boolean;
  dir: string;
  saving: boolean;
  onSubmit: (data: FacultyMemberFormData) => void | Promise<void>;
  onCancel: () => void;
  /** Page title override */
  title?: string;
  /** Submit button label override */
  submitLabel?: string;
  /** For invitation mode: pre-selected role */
  invitationRole?: string;
  /** For invitation mode: pre-filled email */
  invitationEmail?: string;
  /** For invitation mode: make role read-only */
  roleReadonly?: boolean;
  /** Available departments for multi-select */
  departments?: DepartmentOption[];
  /** Initial values for editing */
  initialData?: Partial<FacultyMemberFormData>;
  /** When true, tweaks labels for student registration */
  isStudent?: boolean;
  /** Optional element rendered alongside submit button (e.g. payment CTA) */
  paymentButton?: React.ReactNode;
  /** Institution type: "college" or "institute" */
  institutionType?: "college" | "institute";
}

export const FacultyMemberForm = ({
  mode,
  isRtl,
  dir,
  saving,
  onSubmit,
  onCancel,
  title,
  submitLabel,
  invitationRole,
  invitationEmail,
  roleReadonly = false,
  departments = [],
  initialData,
  isStudent = false,
  paymentButton,
  institutionType = "college",
}: FacultyMemberFormProps) => {
  const isCollege = institutionType !== "institute";
  const roleOptions = useMemo(() => buildRoleOptions(isCollege), [isCollege]);

  /* ---------------------------------------------------------------- */
  /*  Form state                                                      */
  /* ---------------------------------------------------------------- */
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initialData?.fullName ?? "");
  const [role, setRole] = useState(
    initialData?.role ?? invitationRole ?? (isStudent ? "student" : "lecturer")
  );
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth ?? "");
  const [gender, setGender] = useState(initialData?.gender ?? "");
  const [email, setEmail] = useState(initialData?.email ?? invitationEmail ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [nationalId, setNationalId] = useState(initialData?.nationalId ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [qualification, setQualification] = useState(initialData?.qualification ?? "");
  const [specialization, setSpecialization] = useState(initialData?.specialization ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  /* admin-add only: temp password */
  const [tempPassword, setTempPassword] = useState(() =>
    mode === "admin-add" ? generateStrongPassword() : ""
  );
  const [showPassword, setShowPassword] = useState(false);

  /* invitation only: passwords */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showInvitationPassword, setShowInvitationPassword] = useState(false);

  /* admin-add student only: department IDs */
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    initialData?.selectedDeptIds ?? []
  );
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");

  /* admin-add faculty only: multi-department selection */
  const [selectedFacultyDeptIds, setSelectedFacultyDeptIds] = useState<string[]>(
    initialData?.selectedDepartmentIds ?? (initialData?.selectedDepartmentId ? [initialData.selectedDepartmentId] : [])
  );
  const [facultyDeptPopoverOpen, setFacultyDeptPopoverOpen] = useState(false);
  const [facultyDeptSearch, setFacultyDeptSearch] = useState("");

  /* Keep role in sync if invitationRole changes */
  useEffect(() => {
    if (invitationRole) setRole(invitationRole);
  }, [invitationRole]);

  /* Keep email in sync if invitationEmail changes */
  useEffect(() => {
    if (invitationEmail) setEmail(invitationEmail);
  }, [invitationEmail]);

  /* ---------------------------------------------------------------- */
  /*  Photo upload handler                                            */
  /* ---------------------------------------------------------------- */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: isRtl ? "حجم الملف كبير" : "File too large",
        description: isRtl
          ? "أقصى حجم مسموح به هو 5 ميجابايت"
          : "Maximum allowed file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) {
          setUploading(false);
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 200;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
              setPhotoUrl(optimizedDataUrl);
            } else {
              setPhotoUrl(rawResult);
            }
          } catch {
            setPhotoUrl(rawResult);
          }
          setUploading(false);
        };
        img.onerror = () => {
          setPhotoUrl(rawResult);
          setUploading(false);
        };
        img.src = rawResult;
      };
      reader.onerror = () => {
        toast({
          title: isRtl ? "فشل قراءة الصورة" : "Failed to read image",
          variant: "destructive",
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Submit handler                                                  */
  /* ---------------------------------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: isRtl ? "حقل مطلوب" : "Required field",
        description: isRtl ? "يرجى إدخال الاسم الكامل" : "Please enter the full name",
        variant: "destructive",
      });
      return;
    }

    if (!isStudent && !role) {
      toast({
        title: isRtl ? "حقل مطلوب" : "Required field",
        description: isRtl ? "يرجى اختيار المسمى الوظيفي" : "Please select a role",
        variant: "destructive",
      });
      return;
    }

    if (isStudent && mode === "admin-add" && departments.length > 0 && selectedDeptIds.length === 0) {
      toast({
        title: isRtl ? "حقل مطلوب" : "Required field",
        description: isRtl ? "يرجى اختيار قسم واحد على الأقل" : "Please select at least one department",
        variant: "destructive",
      });
      return;
    }

    if (mode === "admin-add" && !isStrongPassword(tempPassword)) {
      toast({
        title: isRtl ? "كلمة مرور مؤقتة غير صالحة" : "Invalid Temporary Password",
        description: isRtl
          ? "يجب أن تكون كلمة المرور المؤقتة 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم"
          : "Temporary password must be at least 8 chars and contain uppercase, lowercase and a number",
        variant: "destructive",
      });
      return;
    }

    if (mode === "invitation") {
      if (!isStrongPassword(password)) {
        toast({
          title: isRtl ? "كلمة مرور ضعيفة" : "Weak password",
          description: isRtl
            ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم"
            : "Password must be at least 8 chars and contain uppercase, lowercase and a number",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: isRtl ? "عدم تطابق" : "Mismatch",
          description: isRtl
            ? "كلمتا المرور غير متطابقتين"
            : "Passwords do not match",
          variant: "destructive",
        });
        return;
      }
    }

    const data: FacultyMemberFormData = {
      photoUrl,
      fullName: fullName.trim(),
      role: isStudent ? "student" : role,
      dateOfBirth,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      address: address.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      hireDate: "",
      notes: notes.trim(),
      tempPassword: mode === "admin-add" ? tempPassword : undefined,
      password: mode === "invitation" ? password : undefined,
      confirmPassword: mode === "invitation" ? confirmPassword : undefined,
      selectedDeptIds: isStudent ? selectedDeptIds : undefined,
      selectedDepartmentIds: !isStudent ? selectedFacultyDeptIds : undefined,
      selectedDepartmentId: !isStudent ? selectedFacultyDeptIds[0] : undefined,
    };

    onSubmit(data);
  };

  const labelCls = "flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground";
  const iconCls = "w-4 h-4 text-primary shrink-0";
  const inputCls = "h-11 text-xs sm:text-sm rounded-xl border border-primary/20 bg-background/70 focus:border-primary focus:bg-background transition-all";
  const triggerCls = "h-11 text-xs sm:text-sm rounded-xl border border-primary/20 bg-background/70 font-semibold";

  const pageTitle =
    title ||
    (isStudent
      ? isRtl
        ? "تسجيل وإضافة طالب جديد"
        : "Register New Student"
      : mode === "invitation"
        ? isRtl
          ? "إنشاء حساب العضو"
          : "Create Member Account"
        : isRtl
          ? "إضافة عضو هيئة تدريس"
          : "Add Faculty Member");

  const buttonLabel =
    submitLabel ||
    (mode === "invitation"
      ? isRtl
        ? "إنشاء الحساب"
        : "Create Account"
      : isRtl
        ? "حفظ البيانات والتسجيل"
        : "Save & Register");

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 overflow-x-hidden flex flex-col">
      {/* Top Header */}
      <header className="border-b border-primary/20 bg-card/85 backdrop-blur-xl sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center shrink-0">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                {pageTitle}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">
                {isStudent
                  ? (isRtl ? "إضافة طالب وتعيين الأقسام الأكاديمية" : "Student Enrollment & Department Assignment")
                  : (isRtl ? "تعيين الرتبة الأكاديمية وبيانات الدخول" : "Academic Rank, Department & Credentials Setup")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelectorDropdown className="h-9 px-2.5 text-xs bg-background/60 border-primary/20" />
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-xs gap-1.5 h-9 rounded-xl border-primary/20"
              onClick={onCancel}
              aria-label={isRtl ? "رجوع" : "Back"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span className="hidden sm:inline">{isRtl ? "إلغاء ورجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Top Avatar Upload Card */}
          <div className="p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg text-center relative overflow-hidden flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-0.5 bg-gradient-to-br from-primary via-teal-500 to-indigo-600 shadow-xl shadow-primary/25 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={fullName || "photo"} className="w-full h-full object-cover rounded-[22px]" />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-muted/90 flex items-center justify-center text-primary/70">
                    <UserRound className="w-10 h-10" strokeWidth={1.8} />
                  </div>
                )}
              </div>
              <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500" />
              </span>
            </div>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-bold text-xs h-9 px-3.5 rounded-xl border-primary/30 shadow-xs gap-1.5"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-primary" />}
                <span>{isRtl ? "رفع صورة شخصية" : "Upload Photo"}</span>
              </Button>

              {photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                  onClick={() => setPhotoUrl("")}
                >
                  <X className="w-3.5 h-3.5 me-1" />
                  <span>{isRtl ? "حذف" : "Remove"}</span>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {isRtl ? "صيغة JPG أو PNG (الحد الأقصى 2 ميجابايت)" : "JPG or PNG format (Max 2MB)"}
            </p>
          </div>

          {/* Section 1: Personal & Identity Details */}
          <div className="p-5 sm:p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-foreground">
                  {isRtl ? "1. البيانات الشخصية والتعريفية" : "1. Personal & Contact Information"}
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {isRtl ? "الاسم الرباعي، معلومات الاتصال، وبيانات الهوية" : "Full name, contact info, and identity data"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <UserRound className={iconCls} />
                  <span>{isRtl ? "الاسم الكامل" : "Full Name"}</span>
                  <span className="text-destructive font-black">*</span>
                </Label>
                <Input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isRtl ? "الاسم رباعي بالكامل" : "Full four-part name"}
                  required
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Calendar className={iconCls} />
                  <span>{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</span>
                </Label>
                <Input
                  className={inputCls}
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Users2 className={iconCls} />
                  <span>{isRtl ? "النوع" : "Gender"}</span>
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className={triggerCls}>
                    <SelectValue placeholder={isRtl ? "اختر النوع" : "Select Gender"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                    <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* National ID */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <IdCard className={iconCls} />
                  <span>{isRtl ? "الرقم القومي / رقم الجواز" : "National ID / Passport"}</span>
                </Label>
                <Input
                  className={inputCls}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder={isRtl ? "الرقم القومي المكون من 14 رقم" : "National ID or Passport number"}
                  maxLength={20}
                  dir="ltr"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Mail className={iconCls} />
                  <span>{isRtl ? "البريد الإلكتروني" : "Email Address"}</span>
                </Label>
                <Input
                  className={inputCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  readOnly={mode === "invitation" && !!invitationEmail}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Phone className={iconCls} />
                  <span>{isRtl ? "رقم الهاتف" : "Phone Number"}</span>
                </Label>
                <Input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  dir="ltr"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className={labelCls}>
                  <MapPin className={iconCls} />
                  <span>{isRtl ? "العنوان السكني" : "Residential Address"}</span>
                </Label>
                <Input
                  className={inputCls}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isRtl ? "المدينة، المحافظة، العنوان بالتفصيل" : "City, Governorate, Street address"}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Role & Departments */}
          {!isStudent && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl ? "2. المسمى والرتبة الأكاديمية والأقسام" : "2. Academic Rank & Departments"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {isRtl ? "تحديد المنصب الأكاديمي وربطه بالأقسام العلمية" : "Assign academic role and department affiliations"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role / Job Title */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    <Users2 className={iconCls} />
                    <span>{isRtl ? "المسمى والرتبة الأكاديمية" : "Academic Rank / Role"}</span>
                    <span className="text-destructive font-black">*</span>
                  </Label>
                  {roleReadonly ? (
                    <div className={`${inputCls} flex items-center px-3 bg-muted/50`}>
                      <span className="text-xs sm:text-sm font-bold">
                        {roleOptions.find((r) => r.value === role)
                          ? isRtl
                            ? roleOptions.find((r) => r.value === role)!.ar
                            : roleOptions.find((r) => r.value === role)!.en
                          : role}
                      </span>
                    </div>
                  ) : (
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className={triggerCls}>
                        <SelectValue placeholder={isRtl ? "اختر المسمى الأكاديمي" : "Select Role"} />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {roleOptions.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-xs sm:text-sm font-bold">
                            {isRtl ? r.ar : r.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Department Multi-Select for Faculty */}
                {mode === "admin-add" && departments.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className={labelCls}>
                      <Building2 className={iconCls} />
                      <span>{isRtl ? "الأقسام التابع لها" : "Assigned Departments"}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({isRtl ? "اختياري" : "Optional"})</span>
                    </Label>
                    <Popover open={facultyDeptPopoverOpen} onOpenChange={setFacultyDeptPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={facultyDeptPopoverOpen}
                          className={`${inputCls} justify-between font-normal ${
                            selectedFacultyDeptIds.length === 0 ? "text-muted-foreground" : ""
                          }`}
                        >
                          <span className="truncate text-xs font-bold">
                            {selectedFacultyDeptIds.length > 0
                              ? `${selectedFacultyDeptIds.length} ${isRtl ? "قسم محدد" : "department(s) selected"}`
                              : isRtl
                                ? "اختر الأقسام الأكاديمية..."
                                : "Select departments..."}
                          </span>
                          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] max-w-md p-3 z-50 bg-card border-2 border-primary/20 shadow-2xl rounded-2xl overflow-hidden" dir={dir}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-border/50 mb-2 focus-within:border-primary/40 transition-colors">
                          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <input
                            type="text"
                            value={facultyDeptSearch}
                            onChange={(e) => setFacultyDeptSearch(e.target.value)}
                            placeholder={isRtl ? "ابحث عن اسم أو رمز القسم..." : "Search by department name or code..."}
                            className="bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground w-full"
                          />
                          {facultyDeptSearch && (
                            <button type="button" onClick={() => setFacultyDeptSearch("")} className="hover:opacity-70">
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-1 pr-0.5">
                          {departments
                            .filter((dept) =>
                              (dept.department_name || "").toLowerCase().includes(facultyDeptSearch.toLowerCase()) ||
                              (dept.department_code || "").toLowerCase().includes(facultyDeptSearch.toLowerCase())
                            )
                            .map((dept) => {
                              const isSelected = selectedFacultyDeptIds.includes(dept.id);
                              return (
                                <button
                                  type="button"
                                  key={dept.id}
                                  onClick={() => {
                                    setSelectedFacultyDeptIds((prev) =>
                                      isSelected ? prev.filter((id) => id !== dept.id) : [...prev, dept.id]
                                    );
                                  }}
                                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-start ${
                                    isSelected
                                      ? "bg-primary/15 text-primary border border-primary/30"
                                      : "hover:bg-muted/70 text-foreground border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected ? "bg-primary border-primary text-white shadow-xs" : "border-muted-foreground/40 bg-background/50"
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span className="truncate leading-snug">{dept.department_name}</span>
                                  </div>
                                  {dept.department_code && (
                                    <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50 shrink-0">
                                      {dept.department_code}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          {departments.filter((dept) =>
                            (dept.department_name || "").toLowerCase().includes(facultyDeptSearch.toLowerCase()) ||
                            (dept.department_code || "").toLowerCase().includes(facultyDeptSearch.toLowerCase())
                          ).length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-5 font-medium">
                              {isRtl ? "لا توجد أقسام مطابقة للبحث" : "No matching departments found"}
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {selectedFacultyDeptIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {departments
                          .filter((d) => selectedFacultyDeptIds.includes(d.id))
                          .map((d) => (
                            <span
                              key={d.id}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] px-2.5 py-0.5 font-bold"
                            >
                              <span>{d.department_name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFacultyDeptIds((prev) =>
                                    prev.filter((id) => id !== d.id)
                                  )
                                }
                                className="rounded-full hover:bg-primary/20 p-0.5"
                                aria-label={isRtl ? "إزالة القسم" : "Remove department"}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Department Selector for Students */}
          {isStudent && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl ? "2. القسم الأكاديمي للطالب" : "2. Student Department Assignment"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {isRtl ? "اختر القسم أو الأقسام الدراسية التي سينضم إليها الطالب" : "Select departments the student is enrolled in"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <Briefcase className={iconCls} />
                  <span>{isRtl ? "الأقسام الدراسية" : "Departments"}</span>
                  <span className="text-destructive font-black">*</span>
                </Label>
                <Popover open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={deptPopoverOpen}
                      className={`${inputCls} justify-between font-normal ${
                        selectedDeptIds.length === 0 ? "text-muted-foreground" : ""
                      }`}
                    >
                      <span className="truncate text-xs font-bold">
                        {selectedDeptIds.length > 0
                          ? `${selectedDeptIds.length} ${isRtl ? "قسم محدد" : "department(s) selected"}`
                          : isRtl
                            ? "اختر الأقسام..."
                            : "Select departments..."}
                      </span>
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] max-w-md p-3 z-50 bg-card border-2 border-primary/20 shadow-2xl rounded-2xl overflow-hidden" dir={dir}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-border/50 mb-2 focus-within:border-primary/40 transition-colors">
                      <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        placeholder={isRtl ? "ابحث عن اسم أو رمز القسم..." : "Search by department name or code..."}
                        className="bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground w-full"
                      />
                      {deptSearch && (
                        <button type="button" onClick={() => setDeptSearch("")} className="hover:opacity-70">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-1 pr-0.5">
                      {departments
                        .filter((dept) =>
                          (dept.department_name || "").toLowerCase().includes(deptSearch.toLowerCase()) ||
                          (dept.department_code || "").toLowerCase().includes(deptSearch.toLowerCase())
                        )
                        .map((dept) => {
                          const isSelected = selectedDeptIds.includes(dept.id);
                          return (
                            <button
                              type="button"
                              key={dept.id}
                              onClick={() => {
                                setSelectedDeptIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== dept.id) : [...prev, dept.id]
                                );
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-start ${
                                isSelected
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "hover:bg-muted/70 text-foreground border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-primary border-primary text-white shadow-xs" : "border-muted-foreground/40 bg-background/50"
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate leading-snug">{dept.department_name}</span>
                              </div>
                              {dept.department_code && (
                                <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50 shrink-0">
                                  {dept.department_code}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      {departments.filter((dept) =>
                        (dept.department_name || "").toLowerCase().includes(deptSearch.toLowerCase()) ||
                        (dept.department_code || "").toLowerCase().includes(deptSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-5 font-medium">
                          {isRtl ? "لا توجد أقسام مطابقة للبحث" : "No matching departments found"}
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedDeptIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {departments
                      .filter((d) => selectedDeptIds.includes(d.id))
                      .map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] px-2.5 py-0.5 font-bold"
                        >
                          <span>{d.department_name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDeptIds((prev) =>
                                prev.filter((id) => id !== d.id)
                              )
                            }
                            className="rounded-full hover:bg-primary/20 p-0.5"
                            aria-label={isRtl ? "إزالة القسم" : "Remove department"}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Credentials & Access Security */}
          {mode === "admin-add" && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-teal-500/30 bg-teal-500/5 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 border-b border-teal-500/20 pb-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl
                      ? isStudent
                        ? "3. الرقم السري المؤقت لتسجيل دخول الطالب"
                        : "3. بيانات الدخول وكلمة المرور المؤقتة"
                      : isStudent
                      ? "3. Student Temporary Password & Credentials"
                      : "3. Login Credentials & Temporary Password"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {isRtl
                      ? isStudent
                        ? "رقم سري مؤقت يستخدمه الطالب عند أول تسجيل دخول لتغيير وتعيين كلمة المرور الخاصة به"
                        : "كلمة مرور مؤقتة سيتم تسليمها للعضو لتفعيل حسابه"
                      : "Temporary password provided for initial login and password change"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelCls}>
                  <Lock className={iconCls} />
                  <span>
                    {isRtl
                      ? isStudent
                        ? "الرقم السري المؤقت للطالب"
                        : "كلمة المرور المؤقتة"
                      : "Temporary Password"}
                  </span>
                  <span className="text-destructive font-black">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    className={`${inputCls} font-mono tracking-wider flex-1 text-sm font-bold`}
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    dir="ltr"
                    autoComplete="new-password"
                    spellCheck={false}
                  />
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={isRtl ? "إظهار/إخفاء" : "Show/Hide"}
                      className="h-11 w-11 rounded-xl border-primary/20"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(tempPassword);
                          toast({
                            title: isRtl ? "تم نسخ الرقم السري المؤقت" : "Temporary password copied",
                            description: tempPassword,
                          });
                        } catch {
                          /* ignore */
                        }
                      }}
                      aria-label={isRtl ? "نسخ" : "Copy"}
                      className="h-11 w-11 rounded-xl border-primary/20"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setTempPassword(generateStrongPassword())}
                      aria-label={isRtl ? "توليد رقم سري مؤقت جديد" : "Generate new temporary password"}
                      className="h-11 w-11 rounded-xl border-primary/20 text-teal-600 dark:text-teal-400 hover:text-teal-500"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>
                    {isRtl
                      ? isStudent
                        ? "يجب تزويد الطالب بالبريد الإلكتروني والرقم السري المؤقت. عند أول تسجيل دخول سيُطلب منه إدخال الرقم السري المؤقت وتعيين كلمة سر جديدة لحسابه."
                        : "شارك هذه البيانات مع العضو الآن. سيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول."
                      : "Provide student with email and temporary password. Upon first sign-in, they will be required to change it."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {mode === "invitation" && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {isRtl ? "3. تعيين كلمة المرور للحساب" : "3. Set Account Password"}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    <Lock className={iconCls} />
                    <span>{isRtl ? "كلمة المرور" : "Password"}</span>
                    <span className="text-destructive font-black">*</span>
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      className={`${inputCls} pe-10 font-mono tracking-wider`}
                      type={showInvitationPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      autoComplete="new-password"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInvitationPassword((v) => !v)}
                      className="absolute end-3 text-muted-foreground hover:text-foreground"
                    >
                      {showInvitationPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    <ShieldCheck className={iconCls} />
                    <span>{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                    <span className="text-destructive font-black">*</span>
                  </Label>
                  <Input
                    className={`${inputCls} font-mono tracking-wider`}
                    type={showInvitationPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    autoComplete="new-password"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Qualifications & Notes */}
          <div className="p-5 sm:p-6 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-foreground">
                  {isRtl ? "4. المؤهلات والتخصص والملاحظات" : "4. Qualifications & Notes"}
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {isRtl ? "المؤهل الدراسي أو العلمي والتخصص والملاحظات الإضافية" : "Academic degree, specialization, and extra notes"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>
                  <BookOpen className={iconCls} />
                  <span>
                    {isStudent
                      ? isRtl
                        ? "المؤهل أو الفرقة الدراسية"
                        : "Study Level"
                      : isRtl
                        ? "المؤهل العلمي"
                        : "Academic Qualification"}
                  </span>
                </Label>
                <Input
                  className={inputCls}
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder={
                    isStudent
                      ? isRtl
                        ? "مثال: الفرقة الثانية"
                        : "e.g. 2nd year"
                      : isRtl
                        ? "مثال: دكتوراه في هندسة البرمجيات"
                        : "e.g. PhD in Software Engineering"
                  }
                />
              </div>

              {!isStudent && (
                <div className="space-y-1.5">
                  <Label className={labelCls}>
                    <GraduationCap className={iconCls} />
                    <span>{isRtl ? "التخصص الدقيق" : "Specialization"}</span>
                  </Label>
                  <Input
                    className={inputCls}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder={isRtl ? "مثال: الذكاء الاصطناعي / الشبكات" : "e.g. Artificial Intelligence"}
                  />
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2">
                <Label className={labelCls}>
                  <StickyNote className={iconCls} />
                  <span>{isRtl ? "ملاحظات إدارية إضافية" : "Administrative Notes"}</span>
                </Label>
                <Textarea
                  className="rounded-2xl border border-primary/20 bg-background/70 focus:border-primary text-xs sm:text-sm p-3.5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRtl ? "أي ملاحظات إضافية خاصة بالسجل أو التعيين..." : "Any additional notes regarding this record..."}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 rounded-3xl border-2 border-primary/20 bg-card/90 backdrop-blur-xl shadow-xl flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm border-primary/20"
              onClick={onCancel}
              disabled={saving}
            >
              {isRtl ? "إلغاء ورجوع" : "Cancel"}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                size="lg"
                disabled={saving}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-xl shadow-teal-500/25 gap-2 transition-all transform hover:scale-[1.01]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Save className="w-4 h-4 shrink-0" strokeWidth={2.4} />
                )}
                <span>{buttonLabel}</span>
              </Button>
              {paymentButton}
            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default FacultyMemberForm;
