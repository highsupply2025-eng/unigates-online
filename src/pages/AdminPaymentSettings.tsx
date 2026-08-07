import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Globe, Save, Loader2, ArrowLeft, CheckCircle, Shield,
  CreditCard, AlertCircle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  currency: string;
  swift_code: string;
  bank_address: string;
}

const AdminPaymentSettings = () => {
  const { language, dir, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<BankDetails>({
    bank_name: "",
    account_name: "",
    account_number: "",
    iban: "",
    currency: "EGP",
    swift_code: "",
    bank_address: "",
  });

  const ar = (a: string, e: string) => (isRtl ? a : e);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("id")
        .eq("user_id", user.id).eq("role", "admin").eq("approved", true);
      if (!roles || roles.length === 0) { navigate("/"); return; }
      setAuthorized(true);

      try {
        const { data, error } = await supabase.rpc("get_bank_details");
        if (error) throw error;
        const result = data as unknown as BankDetails;
        setForm({
          bank_name: result.bank_name || "",
          account_name: result.account_name || "",
          account_number: result.account_number || "",
          iban: result.iban || "",
          currency: result.currency || "EGP",
          swift_code: result.swift_code || "",
          bank_address: result.bank_address || "",
        });
      } catch (e) {
        console.error("Failed to load bank details:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("set_platform_setting", {
        _key: "bank_details",
        _value: form as unknown as Record<string, unknown>,
      });
      if (error) throw error;
      const result = data as unknown as { success?: boolean; error?: string };
      if (result.error) throw new Error(result.error);
      setSaved(true);
      toast({
        title: ar("تم الحفظ", "Saved"),
        description: ar("تم حفظ بيانات الحساب البنكي بنجاح", "Bank account details saved successfully"),
      });
    } catch (e: unknown) {
      toast({
        title: ar("خطأ", "Error"),
        description: e instanceof Error ? e.message : ar("حدث خطأ", "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof BankDetails, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/10 flex flex-col" dir={dir}>
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="rounded-full shrink-0 h-10 w-10 sm:h-11 sm:w-11"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-foreground truncate">
                  {ar("بيانات الدفع", "Payment Settings")}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                  {ar("بيانات الحساب البنكي للتحويلات", "Bank account details for transfers")}
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

      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Info banner */}
          <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {ar("بيانات الحساب البنكي", "Bank Account Information")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {ar(
                      "سيتم استخدام هذه البيانات في إنشاء إيصال التحويل البنكي для الكليات والمعاهد. تأكد من صحة البيانات قبل الحفظ.",
                      "This data will be used to generate bank transfer receipts for colleges and institutes. Verify all details before saving."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank details form */}
          <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {ar("بيانات الحساب البنكي", "Bank Account Details")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {ar("أدخل بيانات الحساب البنكي للمؤسسة", "Enter institution bank account details")}
                </p>
              </div>
            </div>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{ar("اسم البنك", "Bank Name")}</Label>
                <Input
                  value={form.bank_name}
                  onChange={(e) => updateField("bank_name", e.target.value)}
                  placeholder={ar("مثال: البنك التجاري الدولي (CIB)", "e.g. Commercial International Bank (CIB)")}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{ar("اسم الحساب", "Account Name")}</Label>
                <Input
                  value={form.account_name}
                  onChange={(e) => updateField("account_name", e.target.value)}
                  placeholder={ar("اسم صاحب الحساب", "Account holder name")}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{ar("رقم الحساب", "Account Number")}</Label>
                <Input
                  value={form.account_number}
                  onChange={(e) => updateField("account_number", e.target.value)}
                  placeholder={ar("رقم الحساب البنكي", "Bank account number")}
                  className="h-11"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">IBAN</Label>
                <Input
                  value={form.iban}
                  onChange={(e) => updateField("iban", e.target.value)}
                  placeholder={ar("رقم الحساب البنكي الدولي", "International Bank Account Number")}
                  className="h-11"
                  dir="ltr"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{ar("العملة", "Currency")}</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    placeholder="EGP"
                    className="h-11"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">SWIFT Code</Label>
                  <Input
                    value={form.swift_code}
                    onChange={(e) => updateField("swift_code", e.target.value)}
                    placeholder={ar("رمز الصرف الدولي", "SWIFT code")}
                    className="h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{ar("عنوان البنك", "Bank Address")}</Label>
                <Input
                  value={form.bank_address}
                  onChange={(e) => updateField("bank_address", e.target.value)}
                  placeholder={ar("العنوان الكامل للفرع", "Full branch address")}
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {form.bank_name && (
            <Card className="border-0 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    {ar("معاينة الإيصال", "Receipt Preview")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {ar("هذا ما سيراه الكليات والمعاهد في إيصال التحويل البنكي", "This is what colleges and institutes will see in the bank transfer receipt")}
                  </p>
                </div>
              </div>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="rounded-xl bg-muted/30 p-4 space-y-2.5">
                  {[
                    { label: ar("اسم البنك", "Bank Name"), value: form.bank_name },
                    { label: ar("اسم الحساب", "Account Name"), value: form.account_name },
                    { label: ar("رقم الحساب", "Account Number"), value: form.account_number },
                    { label: "IBAN", value: form.iban },
                    { label: ar("العملة", "Currency"), value: form.currency },
                    ...(form.swift_code ? [{ label: "SWIFT Code", value: form.swift_code }] : []),
                    ...(form.bank_address ? [{ label: ar("العنوان", "Address"), value: form.bank_address }] : []),
                  ].filter(f => f.value).map((field) => (
                    <div key={field.label} className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-semibold" dir="ltr">{field.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save button */}
          <Button
            className="w-full h-12 text-base font-bold bg-teal-500 hover:bg-teal-600 gap-2"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saved ? ar("تم الحفظ", "Saved") : ar("حفظ البيانات", "Save Details")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            <Shield className="w-3.5 h-3.5 inline-block me-1 rtl:rotate-180" />
            {ar("هذه البيانات متاحة فقط للأدمن ولا يمكن الوصول إليها من المستخدمين العاديين", "This data is only accessible by admins and not visible to regular users")}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminPaymentSettings;
