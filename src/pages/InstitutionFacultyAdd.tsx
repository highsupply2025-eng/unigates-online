import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import {
  FacultyMemberForm,
  isStrongPassword,
  type FacultyMemberFormData,
  type DepartmentOption,
} from "@/components/FacultyMemberForm";

const InstitutionFacultyAdd = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcedRole = searchParams.get("role");
  const isStudent = forcedRole === "student";
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const [saving, setSaving] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [createdStudentEmail, setCreatedStudentEmail] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const institutionId = identity?.institutionId ?? "";
  const institutionType: "college" | "institute" =
    identity?.institutionType === "institute" ? "institute" : "college";
  const subscriptionPlan = identity?.subscriptionPlan ?? "free";

  useEffect(() => {
    if (!identity) return;
    (async () => {
      try {
        const { data: depts } = await supabase
          .from("departments")
          .select("id, department_name, department_code")
          .eq("institution_id", identity.institutionId)
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
      } catch {
        navigate("/login");
      }
    })();
  }, [identity, navigate]);

  const handleSubmit = async (data: FacultyMemberFormData) => {
    if (saving) return;
    setSaving(true);

    try {
      const baseRow: any = {
        full_name: data.fullName,
        role: data.role,
        date_of_birth: data.dateOfBirth || null,
        photo_url: data.photoUrl || null,
        email: data.email || null,
        phone: data.phone || null,
        national_id: data.nationalId || null,
        gender: data.gender || null,
        address: data.address || null,
        qualification: data.qualification || null,
        specialization: data.specialization || null,
        hire_date: data.hireDate || null,
        notes: data.notes || null,
      };

      if (isStudent) {
        const selectedIds = data.selectedDeptIds || [];
        const codes = departments
          .filter((d) => selectedIds.includes(d.id))
          .map((d) => d.department_code)
          .filter(Boolean);
        const { data: resp, error: fnErr } = await supabase.functions.invoke(
          "create-student-account",
          {
            body: {
              full_name: baseRow.full_name,
              email: baseRow.email,
              phone: baseRow.phone,
              department_codes: codes,
              extra: {
                date_of_birth: baseRow.date_of_birth,
                photo_url: baseRow.photo_url,
                national_id: baseRow.national_id,
                gender: baseRow.gender,
                address: baseRow.address,
                qualification: baseRow.qualification,
                specialization: baseRow.specialization,
                notes: baseRow.notes,
              },
            },
          }
        );
        if (fnErr) {
          let realMsg = fnErr.message || "Failed to create student account";
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
          } catch (e) {
            console.error("Parse edge error failed:", e);
          }
          throw new Error(
            realStep ? `[${realStep}] ${realMsg}` : realMsg
          );
        }
        if (resp && (resp as any).error)
          throw new Error((resp as any).error);
        const r = resp as any;
        toast({
          title: isRtl
            ? `تم تسجيل الطالب في ${r.joined} قسم`
            : `Student enrolled in ${r.joined} department(s)`,
          description: (
            isRtl
              ? `تم تفعيل الحساب بنجاح. البريد: ${r.email}`
              : `Account activated. Email: ${r.email}`
          ) +
            (r.missing?.length
              ? isRtl
                ? `\nأكواد غير صالحة: ${r.missing.join(", ")}`
                : `\nInvalid codes: ${r.missing.join(", ")}`
              : ""),
          duration: 8000,
        });
        setCreatedStudentId(r.user_id || null);
        setCreatedStudentEmail(r.email || null);
        if (subscriptionPlan === "free") {
          try {
            sessionStorage.setItem(
              "institution-dashboard-force-refresh",
              Date.now().toString()
            );
          } catch { /* ignore */ }
          navigate(`/institution/dashboard?tab=students`, { replace: true });
        }
      } else {
        const { data: resp, error: fnErr } = await supabase.functions.invoke(
          "create-faculty-account",
          {
            body: {
              full_name: baseRow.full_name,
              role: data.role,
              email: data.email
                ? String(data.email).trim().toLowerCase()
                : null,
              phone: data.phone,
              temporary_password: data.tempPassword,
              department_ids: data.selectedDepartmentIds || [],
              department_id: data.selectedDepartmentIds?.[0] || null,
              extra: {
                date_of_birth: baseRow.date_of_birth,
                photo_url: baseRow.photo_url,
                national_id: baseRow.national_id,
                gender: baseRow.gender,
                address: baseRow.address,
                qualification: baseRow.qualification,
                specialization: baseRow.specialization,
                hire_date: baseRow.hire_date,
                notes: baseRow.notes,
              },
            },
          }
        );

        if (fnErr) {
          let realMsg = fnErr.message || "Failed to create faculty account";
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
          } catch (e) {
            console.error("Parse edge error failed:", e);
          }
          throw new Error(
            realStep ? `[${realStep}] ${realMsg}` : realMsg
          );
        }
        if (resp && (resp as any).error)
          throw new Error((resp as any).error);

        const r = resp as any;
        toast({
          title: isRtl
            ? "تمت إضافة العضو وإنشاء حسابه بنجاح"
            : "Member added and account created",
          description: isRtl
            ? `تم تفعيل الحساب، ويجب على العضو تغيير كلمة المرور المؤقتة عند أول تسجيل دخول.\nالبريد: ${r.email}`
            : `The account is active. The member must change the temporary password on first sign-in.\nEmail: ${r.email}`,
          duration: 8000,
        });
      }

      try {
        sessionStorage.setItem(
          "institution-dashboard-force-refresh",
          Date.now().toString()
        );
      } catch {
        /* ignore */
      }
      navigate(
        `/institution/dashboard?tab=${isStudent ? "students" : "faculty"}`,
        { replace: true }
      );
    } catch (err: any) {
      console.error("Save failed:", err);
      toast({
        title: isRtl ? "فشل الحفظ" : "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FacultyMemberForm
      mode="admin-add"
      isRtl={isRtl}
      dir={dir}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      isStudent={isStudent}
      departments={departments}
      institutionType={institutionType}
      paymentButton={
        isStudent && createdStudentId && subscriptionPlan !== "free" ? (
          <Button
            type="button"
            size="lg"
            className="bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-base gap-2 shadow-xl shadow-teal-500/40"
            onClick={() => {
              const months = subscriptionPlan === "annual" ? 12 : 1;
              const params = new URLSearchParams({
                studentIds: createdStudentId,
                studentNames: "",
                plan: subscriptionPlan,
                months: String(months),
                count: "1",
              });
              navigate(`/institution/payment?${params.toString()}`);
            }}
          >
            <CreditCard className="w-5 h-5 shrink-0" />
            <span>{isRtl ? "دفع الاشتراك" : "Pay Subscription"}</span>
          </Button>
        ) : undefined
      }
    />
  );
};

export default InstitutionFacultyAdd;
