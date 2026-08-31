import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  FacultyMemberForm,
  type FacultyMemberFormData,
  type DepartmentOption,
} from "@/components/FacultyMemberForm";
import {
  Loader2, AlertTriangle, CheckCircle2, GraduationCap,
  Building2, ShieldCheck, Sparkles, ArrowRight, ArrowLeft,
  Check, Lock, UserCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TokenStatus = "loading" | "valid" | "invalid" | "expired" | "used" | "error";

interface InvitationData {
  institutionId: string;
  institutionType: "college" | "institute";
  institutionName: string;
}

const StudentInvitationRegistration = () => {
  const { token } = useParams<{ token: string }>();
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const [status, setStatus] = useState<TokenStatus>("loading");
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [successName, setSuccessName] = useState("");
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage(isRtl ? "رابط الدعوة غير صالح" : "Invalid invitation link");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.rpc(
          "verify_institution_invitation" as any,
          { _code: token }
        );

        if (error) {
          console.error("Student invitation verification failed:", error);
          setStatus("error");
          setErrorMessage(isRtl ? "فشل التحقق من الدعوة" : "Failed to verify invitation");
          return;
        }

        const row = data?.[0];
        if (!row || !row.is_valid) {
          setStatus("invalid");
          setErrorMessage(
            isRtl
              ? "رابط الدعوة غير صالح أو منتهي الصلاحية أو مستخدم بالفعل"
              : "This invitation link is invalid, expired, or has already been used"
          );
          return;
        }

        const role = (row.role || "").toLowerCase();
        if (role !== "student") {
          setStatus("invalid");
          setErrorMessage(
            isRtl
              ? "هذا الرابط مخصص لتسجيل أعضاء هيئة التدريس"
              : "This invitation link is for faculty members, not students"
          );
          return;
        }

        setInvitationData({
          institutionId: row.institution_id,
          institutionType: row.kind === "college" ? "college" : "institute",
          institutionName: row.institution_name || "",
        });
        setStatus("valid");

        // Fetch departments for this institution
        const { data: depts } = await supabase
          .from("departments")
          .select("id, department_name, department_code")
          .eq("institution_id", row.institution_id)
          .eq("institution_type", row.kind === "college" ? "college" : "institute")
          .eq("status", "active");

        if (depts) {
          setDepartments(
            depts.map((d: any) => ({
              id: d.id,
              department_name: d.department_name,
              department_code: d.department_code || "",
            }))
          );
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        setStatus("error");
        setErrorMessage(err.message || (isRtl ? "خطأ غير متوقع" : "Unexpected error"));
      }
    })();
  }, [token, isRtl]);

  const handleSubmit = async (data: FacultyMemberFormData) => {
    if (saving || !invitationData || !token) return;
    setSaving(true);

    try {
      const selectedIds = data.selectedDeptIds || [];
      const codes = departments
        .filter((d) => selectedIds.includes(d.id))
        .map((d) => d.department_code)
        .filter(Boolean);

      if (codes.length === 0) {
        throw new Error(
          isRtl ? "اختر قسمًا واحدًا على الأقل" : "Select at least one department"
        );
      }

      const { data: resp, error: fnErr } = await supabase.functions.invoke(
        "create-student-account",
        {
          body: {
            full_name: data.fullName,
            email: data.email ? String(data.email).trim().toLowerCase() : null,
            phone: data.phone || null,
            department_codes: codes,
            temporary_password: data.password,
            invitation_code: token,
            extra: {
              date_of_birth: data.dateOfBirth || null,
              photo_url: data.photoUrl || null,
              national_id: data.nationalId || null,
              gender: data.gender || null,
              address: data.address || null,
              qualification: data.qualification || null,
              specialization: data.specialization || null,
              notes: data.notes || null,
            },
          },
        }
      );

      if (fnErr) {
        let realMsg = fnErr.message || (isRtl ? "فشل إنشاء الحساب" : "Failed to create account");
        let realStep = "";
        try {
          const ctx: any = (fnErr as any).context;
          const bodyText = ctx?.body
            ? typeof ctx.body === "string"
              ? ctx.body
              : await new Response(ctx.body).text()
            : "";
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            if (parsed?.error) realMsg = parsed.error;
            if (parsed?.step) realStep = parsed.step;
          }
        } catch {
          /* ignore */
        }
        throw new Error(realStep ? `[${realStep}] ${realMsg}` : realMsg);
      }

      if (resp && (resp as any).error) {
        throw new Error((resp as any).error);
      }

      const r = resp as any;
      setSuccessEmail(r.email || data.email || "");
      setSuccessName(data.fullName);
      setStatus("used" as any);
      toast({
        title: isRtl ? "تم إنشاء الحساب بنجاح" : "Account created successfully",
        description: isRtl
          ? "يمكنك الآن تسجيل الدخول باستخدام بياناتك"
          : "You can now sign in with your credentials",
        duration: 8000,
      });
    } catch (err: any) {
      console.error("Student account creation failed:", err);
      toast({
        title: isRtl ? "فشل إنشاء الحساب" : "Account creation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---- Loading state ---- */
  if (status === "loading") {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="border-2 border-teal-500/30 max-w-md w-full rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {isRtl ? "جاري التحقق من رابط الدعوة..." : "Verifying invitation link..."}
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl ? "يرجى الانتظار لحظات للتحقق من صلاحية الكود" : "Please wait while we verify invitation credentials"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Success state ---- */
  if (status === ("used" as any) && successEmail) {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="border-2 border-emerald-500/40 max-w-lg w-full rounded-3xl bg-slate-900/90 backdrop-blur-2xl shadow-2xl">
          <CardContent className="p-8 sm:p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.4} />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs px-3 py-1">
                {isRtl ? "اكتمل التسجيل بنجاح" : "Registration Completed"}
              </Badge>
              <h2 className="text-2xl font-black text-white">
                {isRtl ? `أهلاً بك، ${successName}!` : `Welcome, ${successName}!`}
              </h2>
              <p className="text-sm font-semibold text-slate-300">
                {isRtl
                  ? `تم تفعيل حسابك كطالب بنجاح في ${invitationData?.institutionName}.`
                  : `Your student account is now active at ${invitationData?.institutionName}.`}
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-start space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">{isRtl ? "البريد الإلكتروني للدخول:" : "Sign-in Email:"}</span>
                <span className="font-mono font-black text-teal-300">{successEmail}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">{isRtl ? "حالة الحساب:" : "Account Status:"}</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {isRtl ? "مفعّل ونشط" : "Active"}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full rounded-2xl font-black text-sm gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/30"
              onClick={() => navigate("/login")}
            >
              <UserCheck className="w-5 h-5" />
              <span>{isRtl ? "تسجيل الدخول إلى حسابك الآن" : "Sign In to Your Account"}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Error / invalid states ---- */
  if (status === "invalid" || status === "expired" || status === "error") {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="border-2 border-rose-500/30 max-w-md w-full rounded-3xl bg-slate-900/90 backdrop-blur-2xl shadow-2xl">
          <CardContent className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-xl shadow-rose-500/25">
              <AlertTriangle className="w-9 h-9 text-white" strokeWidth={2.4} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">
                {isRtl ? "تعذر فتح رابط الدعوة" : "Invalid Invitation Link"}
              </h2>
              <p className="text-xs font-semibold text-rose-300">
                {errorMessage}
              </p>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-2xl border-white/20 bg-white/5 hover:bg-white/15 text-white font-black text-xs"
              onClick={() => navigate("/")}
            >
              {isRtl ? "العودة إلى الصفحة الرئيسية" : "Go to Homepage"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Valid: show registration form ---- */
  if (!invitationData) return null;

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground py-6 sm:py-10 px-4">
      {/* 1. Official Institution Hero Header */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8 animate-scale-in">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border-2 border-teal-500/30 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/30 shrink-0">
              <GraduationCap className="w-9 h-9" strokeWidth={2.3} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {invitationData.institutionName}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5">
                  <ShieldCheck className="w-3 h-3 me-1 inline" />
                  {isRtl ? "دعوة رسمية موثقة" : "Official Invitation"}
                </Badge>
              </div>
              <p className="text-xs font-bold text-teal-300">
                {isRtl
                  ? "مرحباً بك! قم بتعبئة بياناتك لإنشاء حساب الطالب الرسمي الخاص بك."
                  : "Welcome! Complete the form below to create your official student account."}
              </p>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-950/90 border border-white/15 text-center shrink-0">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
              {isRtl ? "كود التسجيل" : "Invitation Code"}
            </span>
            <span className="text-base font-mono font-black text-teal-400 tracking-widest">
              {token}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Registration Form */}
      <div className="max-w-4xl mx-auto">
        <FacultyMemberForm
          mode="invitation"
          isStudent={true}
          isRtl={isRtl}
          dir={dir}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/")}
          departments={departments}
          title={
            isRtl
              ? `استمارة تسجيل طالب — ${invitationData.institutionName}`
              : `Student Registration Form — ${invitationData.institutionName}`
          }
          submitLabel={isRtl ? "تأكيد وإنشاء حساب الطالب" : "Create Student Account"}
        />
      </div>
    </div>
  );
};

export default StudentInvitationRegistration;
