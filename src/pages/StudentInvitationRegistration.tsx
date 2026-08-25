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
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  }, [token]);

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
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <Card className="border-2 border-primary/30 max-w-md w-full mx-4 shadow-2xl shadow-primary/10">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-lg font-bold text-foreground text-center">
              {isRtl ? "جاري التحقق من الدعوة..." : "Verifying invitation..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Success state ---- */
  if (status === ("used" as any) && successEmail) {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <Card className="border-2 border-emerald-500/30 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/10">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-foreground text-center">
              {isRtl ? "تم إنشاء الحساب بنجاح" : "Account Created Successfully"}
            </h2>
            <p className="text-muted-foreground text-center text-sm">
              {isRtl
                ? `يمكنك تسجيل الدخول الآن باستخدام البريد: ${successEmail}`
                : `You can now sign in using: ${successEmail}`}
            </p>
            <Button
              size="lg"
              className="mt-4 shadow-xl shadow-primary/40 font-bold"
              onClick={() => navigate("/login")}
            >
              {isRtl ? "تسجيل الدخول" : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Error / invalid states ---- */
  if (status === "invalid" || status === "expired" || status === "error") {
    return (
      <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <Card className="border-2 border-destructive/30 max-w-md w-full mx-4 shadow-2xl shadow-destructive/10">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-foreground text-center">
              {isRtl ? "الدعوة غير صالحة" : "Invalid Invitation"}
            </h2>
            <p className="text-muted-foreground text-center text-sm">
              {errorMessage}
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-4 border-2 border-primary/30 font-bold"
              onClick={() => navigate("/")}
            >
              {isRtl ? "العودة للرئيسية" : "Go to Homepage"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Valid: show form ---- */
  if (!invitationData) return null;

  return (
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
          ? `تسجيل طالب - ${invitationData.institutionName}`
          : `Student Registration - ${invitationData.institutionName}`
      }
      submitLabel={isRtl ? "إنشاء الحساب" : "Create Account"}
    />
  );
};

export default StudentInvitationRegistration;
