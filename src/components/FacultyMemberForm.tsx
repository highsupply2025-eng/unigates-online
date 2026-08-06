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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { generateStrongPassword as _generateStrongPassword } from "@/utils/crypto";

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

export const ROLE_OPTIONS: { value: string; ar: string; en: string }[] = [
  { value: "dean", ar: "عميد الكلية", en: "Dean" },
  { value: "vice_dean_postgrad", ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
  { value: "vice_dean_students", ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
  { value: "vice_dean_community", ar: "وكيل الكلية لشئون البيئة وخدمة المجتمع", en: "Vice Dean - Environment & Community Service" },
  { value: "department_head", ar: "رئيس القسم", en: "Department Head" },
  { value: "professor", ar: "أستاذ دكتور", en: "Professor" },
  { value: "doctor", ar: "دكتور", en: "Doctor" },
  { value: "assistant_lecturer", ar: "معيد", en: "Assistant Lecturer" },
];

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
  /** For admin-add mode: student flow */
  isStudent?: boolean;
  /** Department options for student multi-select */
  departments?: DepartmentOption[];
  /** Optional payment button for student subscription */
  paymentButton?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
  isStudent = false,
  departments = [],
  paymentButton,
}: FacultyMemberFormProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(
    isStudent ? "student" : invitationRole || ""
  );
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState(invitationEmail || "");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [notes, setNotes] = useState("");

  /* admin-add password state */
  const [tempPassword, setTempPassword] = useState<string>(() =>
    mode === "admin-add" ? generateStrongPassword() : ""
  );
  const [showPassword, setShowPassword] = useState(false);

  /* invitation password state */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showInvitationPassword, setShowInvitationPassword] = useState(false);

  /* Clean up password on unmount (admin-add mode) */
  useEffect(() => {
    return () => {
      if (mode === "admin-add") setTempPassword("");
    };
  }, [mode]);

  /* ---------------------------------------------------------------- */
  /*  Photo upload                                                     */
  /* ---------------------------------------------------------------- */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: isRtl ? "حجم الصورة كبير (الحد 5MB)" : "Image too large (max 5MB)",
        variant: "destructive",
      });
      return;
    }
    try {
      setUploading(true);
      /* Dynamically import supabase only when needed for upload */
      const { supabase } = await import("@/integrations/supabase/client");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      const userId = user?.id || "anonymous";
      const path = `${userId}/faculty/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل رفع الصورة" : "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Validation                                                       */
  /* ---------------------------------------------------------------- */
  const canSubmit = useMemo(() => {
    if (!fullName.trim()) return false;
    if (!role) return false;

    if (mode === "invitation") {
      return (
        isStrongPassword(password) && password === confirmPassword
      );
    }

    if (isStudent) return selectedDeptIds.length > 0;
    return isStrongPassword(tempPassword);
  }, [
    fullName,
    role,
    mode,
    password,
    confirmPassword,
    isStudent,
    selectedDeptIds,
    tempPassword,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!canSubmit) {
      const missing: string[] = [];
      if (!fullName.trim()) missing.push(isRtl ? "الاسم" : "Full name");
      if (!role) missing.push(isRtl ? "المسمى الوظيفي" : "Role");
      if (mode === "invitation") {
        if (!isStrongPassword(password))
          missing.push(isRtl ? "كلمة مرور قوية" : "Strong password");
        if (password !== confirmPassword)
          missing.push(isRtl ? "تأكيد كلمة المرور" : "Password confirmation");
      } else {
        if (isStudent && selectedDeptIds.length === 0)
          missing.push(isRtl ? "الأقسام" : "Departments");
        if (!isStudent && !isStrongPassword(tempPassword))
          missing.push(isRtl ? "كلمة مرور قوية" : "Strong password");
      }
      toast({
        title: isRtl ? "أكمل الحقول المطلوبة" : "Complete required fields",
        description: missing.join(" • "),
        variant: "destructive",
      });
      return;
    }

    const data: FacultyMemberFormData = {
      photoUrl,
      fullName: fullName.trim(),
      role,
      dateOfBirth,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      address: address.trim(),
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      hireDate,
      notes: notes.trim(),
      tempPassword: mode === "admin-add" ? tempPassword : undefined,
      password: mode === "invitation" ? password : undefined,
      confirmPassword: mode === "invitation" ? confirmPassword : undefined,
      deptCodesInput: isStudent
        ? departments
            .filter((d) => selectedDeptIds.includes(d.id))
            .map((d) => d.department_code)
            .join(", ")
        : undefined,
      selectedDeptIds: isStudent ? selectedDeptIds : undefined,
    };

    await onSubmit(data);
  };

  /* ---------------------------------------------------------------- */
  /*  CSS tokens (exact match with InstitutionFacultyAdd)              */
  /* ---------------------------------------------------------------- */
  const labelCls =
    "flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground";
  const iconCls = "w-5 h-5 sm:w-6 sm:h-6 text-primary";
  const inputCls =
    "h-12 text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card";
  const triggerCls =
    "h-12 text-base border-2 border-primary/30 focus:border-primary focus:ring-primary/30 bg-card font-semibold";

  const pageTitle =
    title ||
    (isStudent
      ? isRtl
        ? "تسجيل طالب"
        : "Register Student"
      : mode === "invitation"
        ? isRtl
          ? "إنشاء حساب العضو"
          : "Create Member Account"
        : isRtl
          ? "إضافة عضو يدويًا"
          : "Add Member Manually");

  const buttonLabel =
    submitLabel ||
    (mode === "invitation"
      ? isRtl
        ? "إنشاء الحساب"
        : "Create Account"
      : isRtl
        ? "حفظ العضو"
        : "Save Member");

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 overflow-x-hidden">
      <header className="border-b-2 border-primary/30 bg-gradient-to-l from-primary/25 via-primary/10 to-card shadow-lg sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/40 shrink-0">
              {mode === "invitation" ? (
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.6} />
              ) : (
                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.6} />
              )}
            </span>
            <span className="truncate tracking-tight">{pageTitle}</span>
          </h1>
          <Button
            size="icon"
            variant="default"
            className="shadow-lg shadow-primary/40 shrink-0 w-11 h-11"
            onClick={onCancel}
            aria-label={isRtl ? "رجوع" : "Back"}
          >
            {isRtl ? (
              <ArrowLeft className="w-5 h-5" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3 sm:py-5">
        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* ---- Photo ---- */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary/40 ring-2 ring-primary/15 bg-muted flex items-center justify-center shadow-lg shadow-primary/30">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={fullName || "photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound
                      className="w-10 h-10 text-primary/60"
                      strokeWidth={1.8}
                    />
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="shadow-md shadow-primary/30 font-bold text-sm h-11 px-4"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                  ) : (
                    <Upload className="w-4 h-4 me-2" />
                  )}
                  {isRtl ? "رفع صورة شخصية" : "Upload Photo"}
                </Button>
              </div>

              {/* ---- Role (faculty only) ---- */}
              {!isStudent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div className="space-y-2.5">
                    <Label className={labelCls}>
                      <Users2 className={iconCls} strokeWidth={2.4} />
                      {isRtl ? "المسمى الوظيفي" : "Role"}
                      <span className="text-destructive text-lg">*</span>
                    </Label>
                    {roleReadonly ? (
                      <div className={`${inputCls} flex items-center px-3 bg-muted/50`}>
                        <span className="text-base font-semibold">
                          {ROLE_OPTIONS.find((r) => r.value === role)
                            ? isRtl
                              ? ROLE_OPTIONS.find((r) => r.value === role)!.ar
                              : ROLE_OPTIONS.find((r) => r.value === role)!.en
                            : role}
                        </span>
                      </div>
                    ) : (
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className={triggerCls}>
                          <SelectValue
                            placeholder={isRtl ? "اختر المسمى" : "Select role"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem
                              key={r.value}
                              value={r.value}
                              className="text-base"
                            >
                              {isRtl ? r.ar : r.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Password section ---- */}
              {mode === "admin-add" && !isStudent && (
                <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4">
                  <Label className={labelCls}>
                    <KeyRound className={iconCls} strokeWidth={2.4} />
                    {isRtl
                      ? "بيانات الدخول (كلمة مرور مؤقتة)"
                      : "Login Details (Temporary Password)"}
                    <span className="text-destructive text-lg">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className={`${inputCls} font-mono tracking-wider min-w-0 flex-1`}
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
                      className="h-11 w-11"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(tempPassword);
                          toast({
                            title: isRtl ? "تم النسخ" : "Copied",
                          });
                        } catch {
                          /* ignore */
                        }
                      }}
                      aria-label={isRtl ? "نسخ" : "Copy"}
                      className="h-11 w-11"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setTempPassword(generateStrongPassword())}
                      aria-label={isRtl ? "توليد" : "Regenerate"}
                      className="h-11 w-11"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "شارك هذه البيانات مع العضو الآن. سيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول."
                      : "Share these credentials with the member now. They will be forced to change the password on first sign-in."}
                  </p>
                  {!isStrongPassword(tempPassword) && (
                    <p className="text-xs text-destructive">
                      {isRtl
                        ? "كلمة المرور ضعيفة: 8 أحرف+ تحتوي حرفاً كبيراً وصغيراً ورقماً."
                        : "Weak password: 8+ chars with upper, lower and a digit."}
                    </p>
                  )}
                </div>
              )}

              {mode === "invitation" && (
                <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4">
                  <Label className={labelCls}>
                    <KeyRound className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "كلمة المرور" : "Password"}
                    <span className="text-destructive text-lg">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className={`${inputCls} font-mono tracking-wider min-w-0`}
                      type={showInvitationPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      autoComplete="new-password"
                      spellCheck={false}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowInvitationPassword((v) => !v)}
                      aria-label={isRtl ? "إظهار/إخفاء" : "Show/Hide"}
                    >
                      {showInvitationPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {!isStrongPassword(password) && password.length > 0 && (
                    <p className="text-xs text-destructive">
                      {isRtl
                        ? "كلمة المرور ضعيفة: 8 أحرف+ تحتوي حرفاً كبيراً وصغيراً ورقماً."
                        : "Weak password: 8+ chars with upper, lower and a digit."}
                    </p>
                  )}

                  <Label className={labelCls}>
                    <KeyRound className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}
                    <span className="text-destructive text-lg">*</span>
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
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-destructive">
                      {isRtl
                        ? "كلمتا المرور غير متطابقتين"
                        : "Passwords do not match"}
                    </p>
                  )}
                </div>
              )}

              {/* ---- Department selector (student only) ---- */}
              {isStudent && (
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <Briefcase className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "الأقسام" : "Departments"}
                    <span className="text-destructive text-lg">*</span>
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
                        {selectedDeptIds.length > 0
                          ? `${selectedDeptIds.length} ${isRtl ? "قسم محدد" : "department(s) selected"}`
                          : isRtl
                            ? "اختر الأقسام..."
                            : "Select departments..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" dir={dir}>
                      <Command>
                        <CommandInput placeholder={isRtl ? "ابحث عن قسم..." : "Search department..."} />
                        <CommandEmpty>{isRtl ? "لا توجد أقسام" : "No departments found"}</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {departments.map((dept) => {
                            const isSelected = selectedDeptIds.includes(dept.id);
                            return (
                              <CommandItem
                                key={dept.id}
                                value={dept.department_name}
                                onSelect={() => {
                                  setSelectedDeptIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== dept.id)
                                      : [...prev, dept.id]
                                  );
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    isSelected ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <span className="flex-1">{dept.department_name}</span>
                                {dept.department_code && (
                                  <span className="text-xs text-muted-foreground ms-2 font-mono">
                                    {dept.department_code}
                                  </span>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedDeptIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {departments
                        .filter((d) => selectedDeptIds.includes(d.id))
                        .map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-semibold"
                          >
                            {d.department_name}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDeptIds((prev) =>
                                  prev.filter((id) => id !== d.id)
                                )
                              }
                              className="rounded-full hover:bg-primary/20 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "اختر قسمًا واحدًا أو أكثر — سيُضاف الطالب لكل قسم تلقائياً."
                      : "Select one or more departments — the student is added to each department automatically."}
                  </p>
                </div>
              )}

              {/* ---- Basic info ---- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <UserRound className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "الاسم الكامل" : "Full Name"}
                    <span className="text-destructive text-lg">*</span>
                  </Label>
                  <Input
                    className={inputCls}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isRtl ? "الاسم رباعي" : "Full name"}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <Calendar className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "تاريخ الميلاد" : "Date of Birth"}
                  </Label>
                  <Input
                    className={inputCls}
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <Users2 className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "النوع" : "Gender"}
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className={triggerCls}>
                      <SelectValue
                        placeholder={isRtl ? "اختر" : "Select"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male" className="text-base">
                        {isRtl ? "ذكر" : "Male"}
                      </SelectItem>
                      <SelectItem value="female" className="text-base">
                        {isRtl ? "أنثى" : "Female"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <IdCard className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "الرقم القومي" : "National ID"}
                  </Label>
                  <Input
                    className={inputCls}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* ---- Contact ---- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <Mail className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input
                    className={inputCls}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={mode === "invitation" && !!invitationEmail}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <Phone className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "رقم الهاتف" : "Phone"}
                  </Label>
                  <Input
                    className={inputCls}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label className={labelCls}>
                    <MapPin className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "العنوان" : "Address"}
                  </Label>
                  <Input
                    className={inputCls}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* ---- Academic ---- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}>
                    <BookOpen className={iconCls} strokeWidth={2.4} />
                    {isStudent
                      ? isRtl
                        ? "المؤهل الدراسي"
                        : "Study Qualification"
                      : isRtl
                        ? "المؤهل العلمي"
                        : "Qualification"}
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
                          ? "مثال: دكتوراه"
                          : "e.g. PhD"
                    }
                  />
                </div>
                {!isStudent && (
                  <div className="space-y-2.5">
                    <Label className={labelCls}>
                      <GraduationCap className={iconCls} strokeWidth={2.4} />
                      {isRtl ? "التخصص" : "Specialization"}
                    </Label>
                    <Input
                      className={inputCls}
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* ---- Notes ---- */}
              <div className="space-y-2.5">
                <Label className={labelCls}>
                  <StickyNote className={iconCls} strokeWidth={2.4} />
                  {isRtl ? "ملاحظات" : "Notes"}
                </Label>
                <Textarea
                  className="text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* ---- Actions ---- */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-2 border-primary/15">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary/30 font-bold text-base"
                  onClick={onCancel}
                  disabled={saving}
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={saving}
                  className="shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80 gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  ) : (
                    <Save className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                  )}
                  <span>{buttonLabel}</span>
                </Button>
                {paymentButton}
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default FacultyMemberForm;
