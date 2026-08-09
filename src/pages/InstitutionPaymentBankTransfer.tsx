import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  GraduationCap, Building2, Mail, MessageCircle, Phone,
  Loader2, ArrowLeft, Globe, CheckCircle, Copy, CreditCard, Download, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import jsPDF from "jspdf";

interface StudentRecord {
  id: string;
  full_name: string;
  department_name: string;
  subscription_active: boolean;
}

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  currency: string;
  swift_code: string;
  bank_address: string;
}

const MONTHLY_PRICE = 50;
const ANNUAL_DISCOUNT = 0.1;

const InstitutionPaymentBankTransfer = () => {
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const studentIds = (searchParams.get("students") ?? searchParams.get("studentIds") ?? "").split(",").filter(Boolean);
  const planType = (searchParams.get("plan") || "monthly") as "monthly" | "annual";
  const months = Math.max(1, parseInt(searchParams.get("months") || (planType === "annual" ? "12" : "1"), 10) || 1);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  const baseAmount = students.length * months * MONTHLY_PRICE;
  const discount = planType === "annual" ? ANNUAL_DISCOUNT : 0;
  const totalAmount = Math.round(baseAmount * (1 - discount));

  const generateBankDetailsPDF = useCallback(() => {
    const doc = new jsPDF();
    const bd = bankDetails;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("UNIGATES - Bank Transfer Details", 105, 25, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Please transfer the amount to the following bank account:", 105, 35, { align: "center" });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);

    // Bank details
    const startY = 52;
    const labelX = 25;
    const valueX = 100;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Name:", labelX, startY);
    doc.setFont("helvetica", "normal");
    doc.text(bd?.bank_name || "Not configured", valueX, startY);

    doc.setFont("helvetica", "bold");
    doc.text("Account Name:", labelX, startY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(bd?.account_name || "Not configured", valueX, startY + 10);

    doc.setFont("helvetica", "bold");
    doc.text("Account Number:", labelX, startY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(bd?.account_number || "Not configured", valueX, startY + 20);

    doc.setFont("helvetica", "bold");
    doc.text("IBAN:", labelX, startY + 30);
    doc.setFont("helvetica", "normal");
    doc.text(bd?.iban || "Not configured", valueX, startY + 30);

    doc.setFont("helvetica", "bold");
    doc.text("Currency:", labelX, startY + 40);
    doc.setFont("helvetica", "normal");
    doc.text(bd?.currency || "EGP", valueX, startY + 40);

    // Amount box
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(20, startY + 50, 170, 20, 3, 3, "F");
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(20, startY + 50, 170, 20, 3, 3, "S");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(`Amount to transfer: ${totalAmount} EGP`, 105, startY + 63, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Order info
    doc.setDrawColor(200, 200, 200);
    doc.line(20, startY + 80, 190, startY + 80);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Order Information:", labelX, startY + 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Students: ${students.length}`, labelX, startY + 98);
    doc.text(`Plan: ${planType === "annual" ? "Annual" : "Monthly"}`, labelX, startY + 106);
    doc.text(`Duration: ${months} month(s)`, labelX, startY + 114);
    doc.text(`Date: ${new Date().toLocaleDateString("en-US")}`, labelX, startY + 122);

    // Student names
    if (students.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Students:", labelX, startY + 134);
      doc.setFont("helvetica", "normal");
      students.slice(0, 10).forEach((s, i) => {
        doc.text(`${i + 1}. ${s.full_name}`, labelX + 5, startY + 142 + i * 8);
      });
      if (students.length > 10) {
        doc.text(`... and ${students.length - 10} more`, labelX + 5, startY + 142 + 10 * 8);
      }
    }

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Please send this receipt along with proof of transfer to admin@unigates.online", 105, 280, { align: "center" });

    // Save
    doc.save(`UNIGATES_Bank_Transfer_${totalAmount}EGP.pdf`);
  }, [students, planType, months, totalAmount, bankDetails]);

  useEffect(() => {
    if (studentIds.length === 0) {
      navigate("/institution/student-subscriptions");
      return;
    }
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const [rpcRes, bankRes] = await Promise.all([
          supabase.rpc(
            "get_institution_student_subscriptions",
            { p_page: 1, p_page_size: 100, p_search: "", p_sort_by: "full_name", p_sort_dir: "asc" },
          ),
          (supabase as any).rpc("get_bank_details"),
        ]);
        if (rpcRes.error) throw rpcRes.error;
        const result = rpcRes.data as unknown as { data?: StudentRecord[] };
        const allStudents = result.data || [];
        setStudents(allStudents.filter((s) => studentIds.includes(s.id)));
        if (!bankRes.error) {
          setBankDetails(bankRes.data as unknown as BankDetails);
        }
      } catch {
        toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "حدث خطأ" : "An error occurred", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [studentIds.join(","), navigate, isRtl, toast]);

  // Auto-download PDF when page loads and students are ready
  useEffect(() => {
    if (!loading && students.length > 0 && !success) {
      const timer = setTimeout(() => {
        generateBankDetailsPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, students.length, success, generateBankDetailsPDF]);

  const handleConfirm = async () => {
    if (!identity) return;
    setConfirming(true);
    try {
      const { data, error } = await (supabase as any).rpc("create_payment_request", {
        _institution_type: identity.institutionType,
        _institution_id: identity.institutionId,
        _institution_name: identity.institutionName,
        _student_member_ids: studentIds,
        _student_names: students.map((s) => s.full_name),
        _plan_type: planType,
        _months: months,
        _total_amount: totalAmount,
      });
      if (error) throw error;
      const result = data as unknown as { success?: boolean; error?: string };
      if (result.error) throw new Error(result.error);
      setSuccess(true);
      toast({
        title: isRtl ? "تم إرسال الطلب" : "Request Submitted",
        description: isRtl ? "تم إرسال طلب الدفع بنجاح" : "Payment request submitted successfully",
      });
    } catch (e: unknown) {
      toast({ title: isRtl ? "خطأ" : "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: isRtl ? "تم النسخ" : "Copied", description: isRtl ? "تم نسخ النص" : "Text copied to clipboard" });
  };

  if (loading || identityLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full border-0 shadow-lg shadow-black/5">
          <CardContent className="py-8 sm:py-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                {isRtl ? "تم إرسال طلب الدفع" : "Payment Request Submitted"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRtl
                  ? `تم إرسال طلب تحويل بنكي لاشتراك ${students.length} طالب بمبلغ ${totalAmount} ج.م. سيتم مراجعة الطلب من قبل إدارة المنصة وتفعيل اشتراك الطلاب فور الموافقة.`
                  : `Bank transfer request submitted for ${students.length} student(s) totaling ${totalAmount} EGP. The request will be reviewed by the platform admin and subscriptions will be activated upon approval.`}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {isRtl ? "بانتظار موافقة الإدارة" : "Awaiting Admin Approval"}
              </p>
            </div>
            <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={() => navigate("/institution/student-subscriptions")}>
              {isRtl ? "العودة لإدارة الطلاب" : "Return to Student Management"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0 h-11 w-11">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-foreground truncate">
                  {isRtl ? "التحويل البنكي" : "Bank Transfer"}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {isRtl ? "تحويل المبلغ إلى حسابنا البنكي" : "Transfer to our bank account"}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 shrink-0">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "EN" : "عربي"}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Payment summary */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-teal-600" />
                {isRtl ? "ملخص الطلب" : "Order Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</span>
                <span className="text-sm font-medium">{students.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "المدة" : "Duration"}</span>
                <span className="text-sm font-medium">{months} {isRtl ? "شهر" : "months"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRtl ? "الخطة" : "Plan"}</span>
                <Badge variant="secondary" className={planType === "annual" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}>
                  {planType === "annual" ? (isRtl ? "سنوي" : "Annual") : (isRtl ? "شهري" : "Monthly")}
                </Badge>
              </div>
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium truncate">{s.full_name}</span>
                  <span className="text-xs text-muted-foreground">{s.department_name}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-lg font-black pt-2 border-t">
                <span>{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-teal-600">{totalAmount} {isRtl ? "ج.م" : "EGP"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bank account details */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-blue-600" />
                {isRtl ? "بيانات الحساب البنكي" : "Bank Account Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isRtl
                  ? "يرجى تحويل المبلغ إلى الحساب البنكي التالي:"
                  : "Please transfer the amount to the following bank account:"}
              </p>

              <div className="space-y-3">
                {[
                  { label: isRtl ? "اسم البنك" : "Bank Name", value: bankDetails?.bank_name, copyValue: bankDetails?.bank_name },
                  { label: isRtl ? "اسم الحساب" : "Account Name", value: bankDetails?.account_name, copyValue: bankDetails?.account_name },
                  { label: isRtl ? "رقم الحساب" : "Account Number", value: bankDetails?.account_number, copyValue: bankDetails?.account_number, dir: "ltr" as const },
                  { label: "IBAN", value: bankDetails?.iban, copyValue: bankDetails?.iban, dir: "ltr" as const },
                  { label: isRtl ? "العملة" : "Currency", value: bankDetails?.currency ? `${bankDetails.currency === "EGP" ? (isRtl ? "جنيه مصري (ج.م)" : "Egyptian Pound (EGP)") : bankDetails.currency}` : undefined },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" dir={field.dir || undefined}>
                        {field.value || (
                          <span className="text-orange-500 text-xs">{isRtl ? "غير مُعد" : "Not configured"}</span>
                        )}
                      </span>
                      {field.copyValue && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(field.copyValue!)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    {isRtl ? `المبلغ المطلوب: ${totalAmount} ج.م` : `Amount to transfer: ${totalAmount} EGP`}
                  </p>
                </div>

                {(!bankDetails?.bank_name || !bankDetails?.account_number) && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                      {isRtl
                        ? " بيانات الحساب البنكي غير مُعدة بعد. يرجى التواصل مع الإدارة."
                        : "Bank account details not yet configured. Please contact the platform admin."}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 mt-2"
                onClick={generateBankDetailsPDF}
              >
                <Download className="w-4 h-4" />
                {isRtl ? "تحميل بيانات الحساب كـ PDF" : "Download Bank Details as PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Contact details */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="w-5 h-5 text-teal-600" />
                {isRtl ? "إرسال إثبات التحويل" : "Send Transfer Proof"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isRtl
                  ? "بعد التحويل، يرجى إرسال إثبات التحويل عبر:"
                  : "After transferring, please send proof of transfer via:"}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{isRtl ? "البريد الإلكتروني" : "Email"}</p>
                    <p className="text-sm text-muted-foreground truncate">admin@unigates.online</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard("admin@unigates.online")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{isRtl ? "واتساب" : "WhatsApp"}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">+20 100 000 0000</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard("+201000000000")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{isRtl ? "المحادثة المباشرة" : "Live Chat"}</p>
                    <p className="text-sm text-muted-foreground">{isRtl ? "متاح على الموقع" : "Available on website"}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-teal-600" onClick={() => window.open("https://unigates.online", "_blank")}>
                    {isRtl ? "فتح" : "Open"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 gap-2"
            disabled={confirming || !identity}
            onClick={handleConfirm}
          >
            {confirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {isRtl ? "إرسال طلب الدفع" : "Submit Payment Request"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {isRtl
              ? "سيتم مراجعة طلب الدفع من قبل إدارة المنصة وتفعيل اشتراك الطلاب فور الموافقة"
              : "The payment request will be reviewed by the platform admin and subscriptions will be activated upon approval"}
          </p>
        </div>
      </main>
    </div>
  );
};

export default InstitutionPaymentBankTransfer;
