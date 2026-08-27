import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Plus, Upload, X, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateLectureViewProps {
  isRtl: boolean;
  userId: string;
  profile: any;
  myDepartments: Array<{ id: string; department_name: string }>;
  onBack: () => void;
  onCreated: () => void;
}

export const CreateLectureView = ({
  isRtl,
  userId,
  profile,
  myDepartments,
  onBack,
  onCreated,
}: CreateLectureViewProps) => {
  const { toast } = useToast();
  const [savingCourse, setSavingCourse] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [newCourse, setNewCourse] = useState({
    title_ar: "",
    title_en: "",
    category_ar: "",
    category_en: "",
    instructor_ar: "",
    instructor_en: "",
    is_free: false,
    price: 0,
    created_at: new Date().toISOString().slice(0, 10),
    expires_at: "",
    department_id: myDepartments.length === 1 ? myDepartments[0].id : "",
  });

  const handleCreateCourse = async () => {
    if (!newCourse.title_ar || !newCourse.title_en) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى إدخال عنوان المحاضرة بالعربية والإنجليزية" : "Please enter lecture title in Arabic and English",
        variant: "destructive",
      });
      return;
    }
    if (!newCourse.department_id) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى اختيار القسم الذي تتبع له المحاضرة" : "Please select a department",
        variant: "destructive",
      });
      return;
    }

    setSavingCourse(true);
    try {
      const { data: authUserData } = await supabase.auth.getUser();
      const activeUserId = authUserData?.user?.id || userId;
      if (!activeUserId) {
        throw new Error(isRtl ? "يرجى تسجيل الدخول أولاً" : "Please log in first");
      }

      // Ensure membership in department_members
      try {
        const { data: dmCheck } = await supabase
          .from("department_members")
          .select("id")
          .eq("department_id", newCourse.department_id)
          .eq("user_id", activeUserId)
          .maybeSingle();

        if (!dmCheck) {
          const memberEmail = profile?.email || authUserData?.user?.email || "";
          if (memberEmail) {
            const { data: unlinkedDm } = await supabase
              .from("department_members")
              .select("id")
              .eq("department_id", newCourse.department_id)
              .ilike("email", memberEmail)
              .maybeSingle();

            if (unlinkedDm?.id) {
              await supabase
                .from("department_members")
                .update({ user_id: activeUserId } as any)
                .eq("id", unlinkedDm.id);
            }
          }

          const { data: targetDept } = await supabase
            .from("departments")
            .select("id, department_code")
            .eq("id", newCourse.department_id)
            .maybeSingle();

          if (targetDept?.department_code) {
            await supabase.rpc("claim_department_codes" as any, {
              _user_id: activeUserId,
              _codes: [targetDept.department_code],
              _full_name: profile?.full_name || "",
              _email: memberEmail,
              _phone: profile?.phone || "",
            });
          }
        }
      } catch (deptLinkErr) {
        console.warn("Department linkage warning:", deptLinkErr);
      }

      // Upload thumbnail
      let thumbnailUrl: string | null = null;
      if (thumbnail && activeUserId) {
        try {
          const ext = thumbnail.name.split(".").pop();
          const path = `${activeUserId}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("course-thumbnails").upload(path, thumbnail);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
            thumbnailUrl = urlData?.publicUrl || null;
          }
        } catch (e) {
          console.warn("Thumbnail upload warning:", e);
        }
      }

      const lecturerName = profile?.full_name || authUserData?.user?.email || "";
      let insertedId: string | null = null;

      // 1. Primary: RPC
      try {
        const { data: rpcCourseId, error: rpcError } = await supabase.rpc("create_institution_course" as any, {
          p_department_id: newCourse.department_id,
          p_title_ar: newCourse.title_ar,
          p_title_en: newCourse.title_en,
          p_category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          p_category_en: newCourse.category_en || "General",
          p_instructor_ar: lecturerName,
          p_instructor_en: lecturerName,
          p_thumbnail_url: thumbnailUrl,
          p_expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          p_is_free: newCourse.is_free ?? false,
          p_created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        });
        if (!rpcError && rpcCourseId) {
          insertedId = rpcCourseId;
        }
      } catch (e) {
        console.warn("RPC error:", e);
      }

      // 2. Fallback: Direct insert
      if (!insertedId) {
        const { data: directData, error: directError } = await supabase.from("courses").insert({
          title_ar: newCourse.title_ar,
          title_en: newCourse.title_en,
          category_ar: newCourse.category_ar || (isRtl ? "عام" : "General"),
          category_en: newCourse.category_en || "General",
          instructor_ar: lecturerName,
          instructor_en: lecturerName,
          is_free: newCourse.is_free,
          creator_id: activeUserId,
          thumbnail_url: thumbnailUrl,
          department_id: newCourse.department_id,
          expires_at: newCourse.expires_at ? new Date(newCourse.expires_at).toISOString() : null,
          created_at: newCourse.created_at ? new Date(newCourse.created_at).toISOString() : new Date().toISOString(),
        } as any).select("id").single();

        if (directError) throw directError;
        insertedId = directData?.id || null;
      }

      toast({
        title: isRtl ? "تم بنجاح" : "Success",
        description: isRtl ? "تم إنشاء المحاضرة بنجاح وربطها بالقسم" : "Lecture created and assigned successfully",
      });

      onCreated();
      onBack();
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingCourse(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            {isRtl ? "إنشاء محاضرة جديدة" : "Create New Lecture"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            {isRtl ? "أضف محاضرة جديدة واربطها بالقسم المحدد حتى تظهر للطلاب" : "Add a new lecture and assign it to a department"}
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card 1: Subject & Title */}
          <Card className="border-2 border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {isRtl ? "تفاصيل المادة وعنوان المحاضرة" : "Subject & Title Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    {isRtl ? "اسم المادة (عربي)" : "Subject Name (Arabic)"}
                  </Label>
                  <Input
                    value={newCourse.category_ar}
                    onChange={e => setNewCourse(p => ({ ...p, category_ar: e.target.value }))}
                    placeholder={isRtl ? "مثال: البرمجة المتقدمة" : "e.g. Advanced Programming"}
                    className="h-11 rounded-xl border-border/60 focus:border-cyan-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    {isRtl ? "اسم المادة (إنجليزي)" : "Subject Name (English)"}
                  </Label>
                  <Input
                    value={newCourse.category_en}
                    onChange={e => setNewCourse(p => ({ ...p, category_en: e.target.value }))}
                    placeholder="e.g. Advanced Programming"
                    className="h-11 rounded-xl border-border/60 focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isRtl ? "عنوان المحاضرة (عربي)" : "Lecture Title (Arabic)"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newCourse.title_ar}
                    onChange={e => setNewCourse(p => ({ ...p, title_ar: e.target.value }))}
                    placeholder={isRtl ? "أدخل عنوان المحاضرة" : "Enter lecture title"}
                    className="h-11 rounded-xl border-border/60 focus:border-cyan-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isRtl ? "عنوان المحاضرة (إنجليزي)" : "Lecture Title (English)"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newCourse.title_en}
                    onChange={e => setNewCourse(p => ({ ...p, title_en: e.target.value }))}
                    placeholder="Enter lecture title"
                    className="h-11 rounded-xl border-border/60 focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Department & Expiry */}
          <Card className="border-2 border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {isRtl ? "القسم والجدولة" : "Department & Schedule"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-bold text-foreground">
                  {isRtl ? "القسم الأكاديمي" : "Academic Department"} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newCourse.department_id}
                  onValueChange={v => setNewCourse(p => ({ ...p, department_id: v }))}
                >
                  <SelectTrigger
                    className={`h-11 rounded-xl border-border/60 focus:border-cyan-500 ${
                      myDepartments.length === 0 ? "border-destructive/40 bg-destructive/5" : ""
                    }`}
                  >
                    <SelectValue
                      placeholder={
                        myDepartments.length === 0
                          ? isRtl ? "لا توجد أقسام مرتبطة بحسابك" : "No linked departments"
                          : isRtl ? "اختر القسم" : "Select Department"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {myDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id} className="py-2.5 font-bold">
                        {d.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {myDepartments.length === 0 && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isRtl ? "يجب أن تكون مسجلاً في قسم أكاديمي لتتمكن من إضافة محاضرة" : "You must be registered in a department"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    {isRtl ? "اسم المحاضر" : "Lecturer"}
                  </Label>
                  <Input
                    value={profile?.full_name || ""}
                    disabled
                    readOnly
                    className="h-11 rounded-xl bg-muted/50 border-border/50 font-bold text-foreground"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    {isRtl ? "تاريخ انتهاء الصلاحية (اختياري)" : "Expiry Date (Optional)"}
                  </Label>
                  <Input
                    type="date"
                    value={newCourse.expires_at}
                    onChange={e => setNewCourse(p => ({ ...p, expires_at: e.target.value }))}
                    className="h-11 rounded-xl border-border/60 focus:border-cyan-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Thumbnail & Submission */}
        <div className="space-y-5">
          <Card className="border-2 border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
              <CardTitle className="text-sm sm:text-base font-black flex items-center gap-2 text-foreground">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? "الصورة المصغرة" : "Thumbnail Image"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {thumbnailPreview ? (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-border shadow-md group">
                  <img src={thumbnailPreview} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <button
                    type="button"
                    onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 hover:bg-muted/40 cursor-pointer hover:border-cyan-500 transition-all p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {isRtl ? "اضغط لرفع صورة مصغرة للمحاضرة" : "Click to upload lecture thumbnail"}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 font-medium">PNG, JPG, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setThumbnail(f);
                        setThumbnailPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateCourse}
              disabled={savingCourse || myDepartments.length === 0}
              className="w-full h-13 gap-2 font-black text-base bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/30 rounded-2xl transition-all"
            >
              {savingCourse ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRtl ? "جاري الحفظ والإنشاء..." : "Saving..."}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                  {isRtl ? "إنشاء وحفظ المحاضرة" : "Create Lecture"}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onBack}
              disabled={savingCourse}
              className="w-full h-11 font-bold rounded-2xl border-border/70 text-muted-foreground hover:text-foreground"
            >
              {isRtl ? "إلغاء والعودة" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
