import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SubPageHeader from "@/components/SubPageHeader";
import { ClipboardList, FileText, Calendar, Plus, Send, Upload, GraduationCap } from "lucide-react";
import { buildAssignmentPath } from "@/lib/assignment-url";

export default function CourseAssignments() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    due_date: "",
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user);
      if (!courseId) return;
      const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
      setCourse(c);
      await loadAssignments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadAssignments = async () => {
    if (!courseId) return;
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    setAssignments(data || []);
  };

  const handleCreate = async () => {
    if (!courseId || !user || !form.title_ar || !form.title_en) {
      toast({
        title: isRtl ? "أكمل الحقول المطلوبة" : "Fill required fields",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${courseId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }
      const { error } = await supabase.from("assignments").insert({
        course_id: courseId,
        creator_id: user.id,
        title_ar: form.title_ar,
        title_en: form.title_en,
        description_ar: form.description_ar || null,
        description_en: form.description_en || null,
        file_url: fileUrl,
        file_name: fileName,
        due_date: form.due_date || null,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم إنشاء التكليف" : "Assignment created" });
      setForm({ title_ar: "", title_en: "", description_ar: "", description_en: "", due_date: "" });
      setFile(null);
      await loadAssignments();
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20" dir={isRtl ? "rtl" : "ltr"}>
      <SubPageHeader
        titleAr="إدارة التكليفات"
        titleEn="Assignments Management"
        icon={<ClipboardList className="w-5 h-5" />}
        backTo="/lecturer/dashboard?tab=assignments"
      />
      <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {course && (
          <div className="mb-6 sm:mb-8 flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-l from-blue-500/10 to-indigo-500/5 border-2 border-blue-500/20 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="truncate font-extrabold text-base text-foreground">{isRtl ? course.title_ar : course.title_en}</span>
          </div>
        )}


        {/* Create new assignment (paper file) */}
        <Card className="mb-8 border-dashed border-2">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">
                {isRtl ? "إضافة تكليف / ملف ورقي" : "Add Assignment / Paper File"}
              </h2>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder={isRtl ? "العنوان (عربي)" : "Title (Arabic)"}
                value={form.title_ar}
                onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))}
              />
              <Input
                placeholder={isRtl ? "العنوان (إنجليزي)" : "Title (English)"}
                value={form.title_en}
                onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder={isRtl ? "الوصف (عربي)" : "Description (Arabic)"}
                value={form.description_ar}
                onChange={(e) => setForm((p) => ({ ...p, description_ar: e.target.value }))}
              />
              <Input
                placeholder={isRtl ? "الوصف (إنجليزي)" : "Description (English)"}
                value={form.description_en}
                onChange={(e) => setForm((p) => ({ ...p, description_en: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-sm font-semibold">
                  {isRtl ? "ملف التكليف الورقي (PDF/صورة/Word)" : "Paper File (PDF/Image/Word)"}
                </Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file && <p className="text-xs text-muted-foreground mt-1">{file.name}</p>}
              </div>
              <div>
                <Label className="mb-1 block text-sm font-semibold">
                  {isRtl ? "الموعد النهائي" : "Due Date"}
                </Label>
                <Input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              <Plus className="w-4 h-4" />
              {saving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : isRtl ? "إنشاء التكليف" : "Create Assignment"}
            </Button>
          </CardContent>
        </Card>

        {/* Assignments list */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            {isRtl ? "التكليفات المنشورة" : "Published Assignments"}
          </h2>
          <Badge variant="secondary">{assignments.length}</Badge>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">{isRtl ? "جارٍ التحميل..." : "Loading..."}</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            {isRtl ? "لا توجد تكليفات بعد" : "No assignments yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <Card key={a.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">{isRtl ? a.title_ar : a.title_en}</h3>
                      {(isRtl ? a.description_ar : a.description_en) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {isRtl ? a.description_ar : a.description_en}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {a.file_url && (
                          <a
                            href={a.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> {a.file_name || (isRtl ? "الملف" : "File")}
                          </a>
                        )}
                        {a.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(a.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(buildAssignmentPath(a.id, a.title_en, a.title_ar))}
                      className="gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isRtl ? "فتح الصفحة" : "Open Page"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
