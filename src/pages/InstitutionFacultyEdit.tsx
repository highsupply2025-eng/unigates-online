import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserPlus, ArrowLeft, ArrowRight, Upload, Loader2, Save,
  GraduationCap, Mail, Phone, IdCard, Calendar, MapPin, Briefcase,
  BookOpen, Users2, StickyNote, UserRound, Building2, ShieldCheck, KeyRound,
  Check, ChevronsUpDown, X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
} from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type DepartmentOption = {
  id: string;
  department_name: string;
};

type InstitutionRecord = {
  id: string;
  email: string | null;
  status: string | null;
  college_name?: string | null;
  institute_name?: string | null;
};

type FunctionErrorPayload = {
  error?: unknown;
};

type UpdateFacultyResponse = FunctionErrorPayload & {
  success?: boolean;
  function_version?: string;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const payloadError = (value: unknown): string | null => {
  if (!value || typeof value !== "object" || !("error" in value)) return null;
  const error = (value as FunctionErrorPayload).error;
  return error == null ? null : String(error);
};

// --- Bilingual / schema resilience helpers ---
const KNOWN_ROLE_SLUGS = new Set([
  "dean",
  "vice_dean_postgrad",
  "vice_dean_students",
  "vice_dean_community",
  "vice_dean_environment",
  "department_head",
  "teaching_assistant",
  "professor",
  "doctor",
  "assistant_lecturer",
]);

const ROLE_AR_TO_SLUG: Record<string, string> = {
  "عميد الكلية": "dean",
  "مدير المعهد": "dean",
  "وكيل الكلية للدراسات العليا": "vice_dean_postgrad",
  "وكيل المعهد للدراسات العليا": "vice_dean_postgrad",
  "وكيل الكلية لشئون الطلاب": "vice_dean_students",
  "وكيل المعهد لشئون الطلاب": "vice_dean_students",
  "وكيل الكلية لخدمة المجتمع": "vice_dean_community",
  "وكيل المعهد لخدمة المجتمع": "vice_dean_community",
  "وكيل الكلية لشئون البيئة": "vice_dean_environment",
  "وكيل المعهد لشئون البيئة": "vice_dean_environment",
  "رئيس القسم": "department_head",
  "مدرس مساعد": "teaching_assistant",
  "أستاذ دكتور": "professor",
  "استاذ دكتور": "professor",
  "دكتور": "doctor",
  "معيد": "assistant_lecturer",
};

const ROLE_EN_DISPLAY_TO_SLUG: Record<string, string> = {
  dean: "dean",
  "vice dean - postgraduate": "vice_dean_postgrad",
  "vice dean - student affairs": "vice_dean_students",
  "vice dean - community": "vice_dean_community",
  "vice dean - environment": "vice_dean_environment",
  "department head": "department_head",
  "teaching assistant": "teaching_assistant",
  professor: "professor",
  doctor: "doctor",
  "assistant lecturer": "assistant_lecturer",
};

const normalizeRole = (raw: unknown): string => {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (KNOWN_ROLE_SLUGS.has(s)) return s;
  const lower = s.toLowerCase();
  if (KNOWN_ROLE_SLUGS.has(lower)) return lower;
  if (ROLE_AR_TO_SLUG[s] != null) return ROLE_AR_TO_SLUG[s];
  if (ROLE_EN_DISPLAY_TO_SLUG[lower] != null) return ROLE_EN_DISPLAY_TO_SLUG[lower];
  // Unknown value: return safe fallback "" to avoid crash (Select will show placeholder)
  // Do not throw.
  return "";
};

const normalizeGender = (raw: unknown): string => {
  if (raw == null) return "";
  const s = String(raw).trim().toLowerCase();
  if (!s) return "";
  if (s === "male" || s === "ذكر") return "male";
  if (s === "female" || s === "أنثى" || s === "انثى" || s === "أنثي" || s === "انثي") return "female";
  // Also handle Arabic with tatweel/extra spaces already trimmed
  return "";
};

const safeStr = (v: unknown): string => (v == null ? "" : String(v));
const safeDeptIds = (primary: unknown, junction: Array<{ department_id: string }>): string[] => {
  const ids: string[] = [];
  const p = primary != null ? String(primary).trim() : "";
  if (p) ids.push(p);
  for (const row of junction ?? []) {
    const did = row?.department_id != null ? String(row.department_id).trim() : "";
    if (did && !ids.includes(did)) ids.push(did);
  }
  return ids;
};

const InstitutionFacultyEdit = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [institutionName, setInstitutionName] = useState("");

  const isCollege = institutionType === "college";
  const ROLE_OPTIONS = useMemo(() => [
    { value: "dean", ar: isCollege ? "عميد الكلية" : "مدير المعهد", en: "Dean" },
    { value: "vice_dean_postgrad", ar: isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", en: "Vice Dean - Postgraduate" },
    { value: "vice_dean_students", ar: isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب", en: "Vice Dean - Student Affairs" },
    { value: "vice_dean_community", ar: isCollege ? "وكيل الكلية لخدمة المجتمع" : "وكيل المعهد لخدمة المجتمع", en: "Vice Dean - Community" },
    { value: "department_head", ar: "رئيس القسم", en: "Department Head" },
    { value: "teaching_assistant", ar: isCollege ? "مدرس مساعد" : "مدرس مساعد", en: "Teaching Assistant" },
    { value: "professor", ar: "أستاذ دكتور", en: "Professor" },
    { value: "doctor", ar: "دكتور", en: "Doctor" },
    { value: "assistant_lecturer", ar: "معيد", en: "Assistant Lecturer" },
  ], [isCollege]);

  // form
  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [notes, setNotes] = useState("");
  const [banned, setBanned] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // baseline for dirty tracking
  const [baseline, setBaseline] = useState<string>("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const deptSnapshotKey = departmentIds.join("|");

  const snapshot = useMemo(() => JSON.stringify({
    photoUrl, fullName, role, deptSnapshotKey, dateOfBirth, gender,
    phone, nationalId, address, qualification, specialization, notes, banned,
  }), [photoUrl, fullName, role, deptSnapshotKey, dateOfBirth, gender, phone,
      nationalId, address, qualification, specialization, notes, banned]);

  const dirty = baseline !== "" && snapshot !== baseline;

  useEffect(() => {
  let isMounted = true;

  const loadFacultyMember = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.email) {
        navigate("/login", { replace: true });
        return;
      }

      if (!memberId) {
        toast({
          title: isRtl ? "معرّف العضو غير موجود" : "Member ID is missing",
          variant: "destructive",
        });

        navigate("/institution/dashboard?tab=faculty", {
          replace: true,
        });

        return;
      }

      /*
       * المصدر الأساسي للعضو:
       * institution_faculty_members
       *
       * memberId يجب أن يكون:
       * institution_faculty_members.id
       */
      const { data: member, error: memberError } = await supabase
        .from("institution_faculty_members")
        .select("id, institution_id, institution_type, user_id, full_name, specific_role, department_id, date_of_birth, gender, email, phone, national_id, address, qualification, specialization, notes, photo_url")
        .eq("id", memberId)
        .maybeSingle();

      if (memberError) {
        console.error("Full Fetch Error:", memberError.message, (memberError as { details?: unknown }).details, (memberError as { hint?: unknown }).hint);
        throw memberError;
      }

      if (!member) {
        toast({
          title: isRtl ? "العضو غير موجود" : "Member not found",
          description: isRtl
            ? "لم يتم العثور على عضو هيئة التدريس المطلوب."
            : "The requested faculty member could not be found.",
          variant: "destructive",
        });

        navigate("/institution/dashboard?tab=faculty", {
          replace: true,
        });

        return;
      }

      const memberInstitutionId = member.institution_id;
      const memberInstitutionType =
        member.institution_type === "institute"
          ? "institute"
          : "college";

      if (!memberInstitutionId) {
        throw new Error(
          isRtl
            ? "سجل العضو غير مرتبط بكلية أو معهد"
            : "The member is not linked to an institution",
        );
      }

      setInstitutionType(memberInstitutionType);

      /*
       * التحقق أن المستخدم الحالي هو مسؤول المؤسسة
       * المرتبط بها هذا العضو.
       */
      const institutionTable =
        memberInstitutionType === "college"
          ? "college_registrations"
          : "institute_registrations";

      const institutionNameColumn =
        memberInstitutionType === "college"
          ? "college_name"
          : "institute_name";

      const { data: institutionData, error: institutionError } =
        await supabase
          .from(institutionTable)
          .select(`id, email, status, ${institutionNameColumn}`)
          .eq("id", memberInstitutionId)
          .maybeSingle();

      if (institutionError) {
        console.error("Full Fetch Error:", institutionError.message, (institutionError as { details?: unknown }).details, (institutionError as { hint?: unknown }).hint);
        throw institutionError;
      }

      const institution = institutionData as unknown as InstitutionRecord | null;

      const callerEmail = user.email.trim().toLowerCase();
      const institutionEmail = String(
        institution?.email || "",
      ).trim().toLowerCase();

      if (
        !institution ||
        institution.status !== "approved" ||
        institutionEmail !== callerEmail
      ) {
        toast({
          title: isRtl
            ? "غير مصرح لك بتعديل هذا العضو"
            : "You are not authorized to edit this member",
          variant: "destructive",
        });

        navigate("/institution/dashboard?tab=faculty", {
          replace: true,
        });

        return;
      }

      /*
       * تحميل الأقسام المتاحة وبيانات الملف الشخصي.
       * عدم وجود قسم لا يمنع فتح الصفحة.
       */
      const [departmentsResult, profileResult, deptMembersResult] =
        await Promise.all([
          supabase
            .from("departments")
            .select("id, department_name")
            .eq("institution_id", memberInstitutionId)
            .eq("institution_type", memberInstitutionType)
            .order("department_name"),

          member.user_id
            ? supabase
                .from("profiles")
                .select("full_name, phone, email")
                .eq("user_id", member.user_id)
                .maybeSingle()
            : Promise.resolve({
                data: null,
                error: null,
              }),

          member.user_id
            ? supabase
                .from("department_members")
                .select("department_id")
                .eq("user_id", member.user_id)
            : Promise.resolve({
                data: null,
                error: null,
              }),
        ]);

      if (departmentsResult.error) {
        console.error("Full Fetch Error:", departmentsResult.error.message, (departmentsResult.error as { details?: unknown }).details, (departmentsResult.error as { hint?: unknown }).hint);
        // Non-blocking: allow page to render without departments
      }

      if (profileResult.error) {
        console.error("Full Fetch Error:", profileResult.error.message, (profileResult.error as { details?: unknown }).details, (profileResult.error as { hint?: unknown }).hint);
        // Non-blocking: allow page to render without profile
      }

      if ((deptMembersResult as { error?: { message: string; details?: unknown; hint?: unknown } }).error) {
        const dmErr = (deptMembersResult as { error: { message: string; details?: unknown; hint?: unknown } }).error;
        console.error("Full Fetch Error:", dmErr.message, dmErr.details, dmErr.hint);
      }

      const junctionRows = ((deptMembersResult.data as Array<{ department_id: string }> | null) ?? []) as Array<{ department_id: string }>;

      if (!isMounted) return;

      const profile = profileResult.data as unknown as { full_name?: unknown; phone?: unknown; email?: unknown } | null;

      setDepartments((departmentsResult.data as DepartmentOption[] | null) ?? []);
      setInstitutionName(
        safeStr((institution as unknown as Record<string, unknown>)?.[institutionNameColumn] ?? ""),
      );

      // Fallback-safe assignments: handle null / unexpected format without crash
      setUserId(safeStr((member as unknown as Record<string, unknown>)?.user_id ?? ""));
      setPhotoUrl(safeStr((member as unknown as Record<string, unknown>)?.photo_url ?? ""));
      setFullName(
        safeStr(
          (member as unknown as Record<string, unknown>)?.full_name ??
            (profile as unknown as Record<string, unknown>)?.full_name ??
            "",
        ),
      );

      /*
       * institution_faculty_members يستخدم specific_role
       * وليس role كمصدر أساسي للمسمى الوظيفي.
       * Gracefully accept Arabic or English values.
       */
      setRole(
        normalizeRole((member as unknown as Record<string, unknown>)?.specific_role ?? ""),
      );

      /*
       * الأقسام اختيارية. القسم الأساسي (institution_faculty_members)
       * يأتي أولاً، ثم أي أقسام إضافية من جدول العلاقات department_members.
       * department_id may be null or unexpected format — handle safely.
       */
      const initialDeptIds = safeDeptIds(
        (member as unknown as Record<string, unknown>)?.department_id,
        junctionRows ?? [],
      );
      setDepartmentIds(initialDeptIds);

      setDateOfBirth(safeStr((member as unknown as Record<string, unknown>)?.date_of_birth ?? ""));
      setGender(normalizeGender((member as unknown as Record<string, unknown>)?.gender ?? ""));
      setEmail(
        safeStr(
          (profile as unknown as Record<string, unknown>)?.email ??
            (member as unknown as Record<string, unknown>)?.email ??
            "",
        ),
      );
      setPhone(
        safeStr(
          (member as unknown as Record<string, unknown>)?.phone ??
            (profile as unknown as Record<string, unknown>)?.phone ??
            "",
        ),
      );
      setNationalId(safeStr((member as unknown as Record<string, unknown>)?.national_id ?? ""));
      setAddress(safeStr((member as unknown as Record<string, unknown>)?.address ?? ""));
      setQualification(safeStr((member as unknown as Record<string, unknown>)?.qualification ?? ""));
      setSpecialization(safeStr((member as unknown as Record<string, unknown>)?.specialization ?? ""));
      setNotes(safeStr((member as unknown as Record<string, unknown>)?.notes ?? ""));

      const photoUrlSafe = safeStr((member as unknown as Record<string, unknown>)?.photo_url ?? "");
      const fullNameSafe = safeStr(
        (member as unknown as Record<string, unknown>)?.full_name ??
          (profile as unknown as Record<string, unknown>)?.full_name ??
          "",
      );
      const roleSafe = normalizeRole((member as unknown as Record<string, unknown>)?.specific_role ?? "");
      const dobSafe = safeStr((member as unknown as Record<string, unknown>)?.date_of_birth ?? "");
      const genderSafe = normalizeGender((member as unknown as Record<string, unknown>)?.gender ?? "");
      const phoneSafe = safeStr(
        (member as unknown as Record<string, unknown>)?.phone ??
          (profile as unknown as Record<string, unknown>)?.phone ??
          "",
      );

      const initialSnapshot = JSON.stringify({
        photoUrl: photoUrlSafe ?? "",
        fullName: fullNameSafe ?? "",
        role: roleSafe ?? "",
        deptSnapshotKey: (initialDeptIds ?? []).join("|"),
        dateOfBirth: dobSafe ?? "",
        gender: genderSafe ?? "",
        phone: phoneSafe ?? "",
        nationalId: safeStr((member as unknown as Record<string, unknown>)?.national_id ?? "") ?? "",
        address: safeStr((member as unknown as Record<string, unknown>)?.address ?? "") ?? "",
        qualification: safeStr((member as unknown as Record<string, unknown>)?.qualification ?? "") ?? "",
        specialization: safeStr((member as unknown as Record<string, unknown>)?.specialization ?? "") ?? "",
        notes: safeStr((member as unknown as Record<string, unknown>)?.notes ?? "") ?? "",
        banned: false,
      });

      setBaseline(initialSnapshot);
    } catch (error: unknown) {
      console.error("Failed to load faculty member:", error);
      // Exact DB error for debugging (column / constraint)
      // @ts-ignore - error may be PostgrestError with details/hint
      console.error("Full Fetch Error:", error.message, error.details, error.hint);
      console.error("Full Fetch Error:", (error as { message?: unknown })?.message, (error as { details?: unknown })?.details, (error as { hint?: unknown })?.hint);

      if (!isMounted) return;

      toast({
        title: isRtl ? "فشل تحميل بيانات العضو" : "Failed to load member",
        description:
          errorMessage(
            error,
            isRtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
          ),
        variant: "destructive",
      });
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadFacultyMember();

  return () => {
    isMounted = false;
  };
}, [memberId, isRtl, navigate]);

  // beforeunload prompt for unsaved changes
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty && !saving) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, saving]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast({ title: isRtl ? "نوع صورة غير مدعوم" : "Unsupported image type", description: "JPG / PNG / WebP", variant: "destructive" });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast({ title: isRtl ? "حجم الصورة أكبر من 2MB" : "Image exceeds 2MB", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const { data: signed, error: signErr } = await supabase.functions.invoke("create-faculty-avatar-upload", {
        body: {
          member_id: memberId,
          content_type: file.type,
          file_size: file.size,
        },
      });
      if (signErr) throw signErr;
      if (!signed?.success) throw new Error(signed?.error || "Unable to create upload URL");
      const { bucket, path, token, public_url } = signed as { bucket: string; path: string; token: string; public_url: string };
      const { error: uploadErr } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;
      setPhotoUrl(public_url);
      toast({ title: isRtl ? "تم رفع الصورة" : "Photo uploaded" });
    } catch (err: unknown) {
      toast({
        title: isRtl ? "فشل رفع الصورة" : "Upload failed",
        description: errorMessage(err, isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return isRtl ? "الاسم مطلوب" : "Full name is required";
    if (!role) return isRtl ? "المسمى الوظيفي مطلوب" : "Role is required";
   
    if (phone && !/^[+0-9\s\-()]{6,20}$/.test(phone.trim()))
      return isRtl ? "رقم هاتف غير صالح" : "Invalid phone";
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (isNaN(d.getTime()) || d.getTime() > Date.now())
        return isRtl ? "تاريخ ميلاد غير صالح" : "Invalid date of birth";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const err = validate();
    if (err) { toast({ title: err, variant: "destructive" }); return; }

    setSaving(true);
    try {
      // Empty is valid: this member can remain at institution level without a
      // department assignment. The first selection is the primary department.
      const selectedDepartmentId = departmentIds[0]?.trim() || null;

      const { data: resp, error: fnErr } = await supabase.functions.invoke("update-faculty-member", {
        body: {
          member_id: memberId,
          user_id: userId,
          full_name: fullName.trim(),
          role,
          department_id: selectedDepartmentId,
          department_ids: departmentIds.map(id => id.trim()).filter(Boolean),
          phone: phone.trim(),
          banned,
          extra: {
            date_of_birth: dateOfBirth || null,
            photo_url: photoUrl || null,
            national_id: nationalId.trim() || null,
            gender: gender || null,
            address: address.trim() || null,
            qualification: qualification.trim() || null,
            specialization: specialization.trim() || null,
            notes: notes.trim() || null,
          },
        },
      });
      if (fnErr) {
        let msg = fnErr.message || "Update failed";
        try {
          const context: unknown = (fnErr as { context?: unknown }).context;

          if (context instanceof Response) {
            const parsed: unknown = await context.clone().json().catch(() => null);
            msg = payloadError(parsed) || msg;
          } else if (context && typeof context === "object") {
            const contextBody = (context as { body?: unknown }).body;
            const bodyText =
              typeof contextBody === "string"
                ? contextBody
                : "";
            if (bodyText) {
              const parsed: unknown = JSON.parse(bodyText);
              msg = payloadError(parsed) || msg;
            }
          }
        } catch {
          // Keep the original functions client error when the response body is
          // not readable JSON.
        }

        if (/missing department_id/i.test(msg)) {
          msg = isRtl
            ? "دالة الحفظ المنشورة قديمة وما زالت تشترط القسم. يجب نشر النسخة الجديدة من update-faculty-member."
            : "The deployed save function is outdated and still requires a department. Deploy the new update-faculty-member function.";
        }

        throw new Error(msg);
      }
      const updateResponse = resp as UpdateFacultyResponse | null;
      if (!updateResponse || updateResponse.success !== true) {
        throw new Error(
          payloadError(updateResponse) ||
            (isRtl ? "لم تؤكد دالة الحفظ نجاح العملية" : "The save function did not confirm success"),
        );
      }

      toast({ title: isRtl ? "تم حفظ التعديلات" : "Changes saved", duration: 2000 });
      try {
        sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString());
      } catch {
        // Storage can be unavailable in private browsing; saving already
        // succeeded, so navigation must continue.
      }
      setBaseline(snapshot);
      navigate("/institution/dashboard?tab=faculty", { replace: true });
    } catch (err: unknown) {
      toast({
        title: isRtl ? "فشل الحفظ" : "Save failed",
        description: errorMessage(err, isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const attemptCancel = () => {
    if (dirty) setShowLeaveConfirm(true);
    else navigate("/institution/dashboard?tab=faculty");
  };

  const labelCls = "flex items-center gap-2 text-sm sm:text-base font-bold text-foreground";
  const iconCls = "w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0";
  const inputCls = "h-11 text-sm sm:text-base border-2 border-border focus-visible:border-primary focus-visible:ring-primary/30 bg-background/80 rounded-xl";
  const triggerCls = "h-11 text-sm sm:text-base border-2 border-border focus:border-primary focus:ring-primary/30 bg-background/80 rounded-xl font-medium";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground flex flex-col institution-admin-scope transition-colors duration-300">
      {/* Unified UNIGATES Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform">
                <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                  {isRtl ? "تعديل بيانات عضو هيئة التدريس" : "Edit Faculty Member"}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {institutionType === "college" ? (isRtl ? "إدارة الكلية" : "College Admin") : (isRtl ? "إدارة المعهد" : "Institute Admin")}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
                {institutionName || (institutionType === "college" ? (isRtl ? "لوحة إدارة الكلية" : "College Administration") : (isRtl ? "لوحة إدارة المعهد" : "Institute Administration"))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3.5 rounded-xl font-bold text-xs bg-background/80 hover:bg-muted border-border text-foreground shadow-xs gap-1.5 transition-all"
              onClick={attemptCancel}
              aria-label={isRtl ? "رجوع" : "Back"}
            >
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              <span className="hidden sm:inline">{isRtl ? "رجوع" : "Back"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
        <form onSubmit={handleSubmit}>
          <Card className="border border-border/80 max-w-4xl mx-auto shadow-xl bg-card/95 rounded-3xl">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-primary/40 ring-2 ring-primary/15 bg-muted flex items-center justify-center shadow-lg shadow-primary/30">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-12 h-12 text-primary/60" strokeWidth={1.8} />
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoChange} />
                <Button type="button" variant="default" size="sm" className="shadow-md shadow-primary/30 font-bold text-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
                  {isRtl ? "تغيير الصورة (JPG/PNG/WebP • حد 2MB)" : "Change Photo (JPG/PNG/WebP • max 2MB)"}
                </Button>
              </div>

              {/* Institution + Role + Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><Building2 className={iconCls} strokeWidth={2.4} />{institutionType === "college" ? (isRtl ? "الكلية" : "College") : (isRtl ? "المعهد" : "Institute")}</Label>
                  <Input className={inputCls} value={institutionName} readOnly disabled />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "المسمى الوظيفي" : "Role"} <span className="text-destructive text-lg">*</span></Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className={triggerCls}><SelectValue placeholder={isRtl ? "اختر المسمى" : "Select role"} /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value} className="text-base">{isRtl ? r.ar : r.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5 md:col-span-2">
                 <Label className={labelCls}>
  <Briefcase className={iconCls} strokeWidth={2.4} />
  {isRtl ? "الأقسام (اختياري)" : "Departments (Optional)"}
</Label>
                  <Popover open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={deptPopoverOpen}
                        className={`${inputCls} w-full justify-between font-normal ${
                          departmentIds.length === 0 ? "text-muted-foreground" : ""
                        }`}
                      >
                        {departmentIds.length > 0
                          ? `${departmentIds.length} ${isRtl ? "قسم محدد" : "department(s) selected"}`
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
                          {departments.map(d => {
                            const isSelected = departmentIds.includes(d.id);
                            return (
                              <CommandItem
                                key={d.id}
                                value={d.department_name}
                                onSelect={() => {
                                  setDepartmentIds(prev =>
                                    isSelected
                                      ? prev.filter(id => id !== d.id)
                                      : [...prev, d.id]
                                  );
                                }}
                              >
                                <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                <span className="flex-1">{d.department_name}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {departmentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {departments
                        .filter(d => departmentIds.includes(d.id))
                        .map(d => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 font-semibold"
                          >
                            {d.department_name}
                            <button
                              type="button"
                              onClick={() => setDepartmentIds(prev => prev.filter(id => id !== d.id))}
                              className="rounded-full hover:bg-primary/20 p-0.5"
                              aria-label={isRtl ? "إزالة القسم" : "Remove department"}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "يمكن اختيار قسم واحد أو أكثر — القسم الأول هو القسم الأساسي."
                      : "Select one or more departments — the first one is the primary department."}
                  </p>
                </div>
              </div>

              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><UserRound className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive text-lg">*</span></Label>
                  <Input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Calendar className={iconCls} strokeWidth={2.4} />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                  <Input className={inputCls} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "النوع" : "Gender"}</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className={triggerCls}><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male" className="text-base">{isRtl ? "ذكر" : "Male"}</SelectItem>
                      <SelectItem value="female" className="text-base">{isRtl ? "أنثى" : "Female"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><IdCard className={iconCls} strokeWidth={2.4} />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                  <Input className={inputCls} value={nationalId} onChange={e => setNationalId(e.target.value)} maxLength={20} dir="ltr" />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input className={inputCls} type="email" value={email} readOnly disabled dir="ltr" />
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "البريد للقراءة فقط. لتغييره تواصل مع الدعم." : "Email is read-only. Contact support to change it."}
                  </p>
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                  <Input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label className={labelCls}><MapPin className={iconCls} strokeWidth={2.4} />{isRtl ? "العنوان" : "Address"}</Label>
                  <Input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Academic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><BookOpen className={iconCls} strokeWidth={2.4} />{isRtl ? "المؤهل العلمي" : "Qualification"}</Label>
                  <Input className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><GraduationCap className={iconCls} strokeWidth={2.4} />{isRtl ? "التخصص" : "Specialization"}</Label>
                  <Input className={inputCls} value={specialization} onChange={e => setSpecialization(e.target.value)} />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2.5">
                <Label className={labelCls}><StickyNote className={iconCls} strokeWidth={2.4} />{isRtl ? "ملاحظات" : "Notes"}</Label>
                <Textarea className="text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>

              {/* Account status */}
              <div className="rounded-xl border-2 border-primary/20 p-4 bg-card/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex w-10 h-10 rounded-lg items-center justify-center shrink-0 ${banned ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600"}`}>
                    <ShieldCheck className="w-5 h-5" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-extrabold text-foreground">
                      {isRtl ? "حالة الحساب" : "Account Status"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {banned
                        ? (isRtl ? "الحساب موقوف — لا يستطيع تسجيل الدخول" : "Suspended — cannot log in")
                        : (isRtl ? "الحساب مفعّل" : "Active")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{isRtl ? "إيقاف" : "Suspend"}</span>
                  <Switch checked={banned} onCheckedChange={setBanned} />
                </div>
              </div>

              {/* Password action placeholder (deferred) */}
              <div className="rounded-xl border-2 border-dashed border-primary/20 p-4 bg-card/40 flex items-center gap-3">
                <span className="inline-flex w-10 h-10 rounded-lg items-center justify-center bg-primary/10 text-primary shrink-0">
                  <KeyRound className="w-5 h-5" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-foreground">{isRtl ? "توليد كلمة مرور مؤقتة" : "Generate Temporary Password"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "سيُتاح لاحقاً كإجراء منفصل. لا تُدار كلمات المرور من هذه الصفحة." : "Coming as a separate action. Passwords are not managed here."}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled className="font-bold">
                  {isRtl ? "قريباً" : "Soon"}
                </Button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-2 border-primary/15">
                <Button type="button" variant="outline" size="lg" className="border-2 border-primary/30 font-bold text-base" onClick={attemptCancel} disabled={saving}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="lg" disabled={saving || !dirty}
                  className="shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80 gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" strokeWidth={2.5} />}
                  <span>{isRtl ? "حفظ التعديلات" : "Save Changes"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>{isRtl ? "تجاهل التعديلات؟" : "Discard changes?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? "لديك تعديلات غير محفوظة. هل تريد الخروج بدون حفظ؟" : "You have unsaved changes. Leave without saving?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel>{isRtl ? "البقاء" : "Stay"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/institution/dashboard?tab=faculty")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRtl ? "خروج" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InstitutionFacultyEdit;
