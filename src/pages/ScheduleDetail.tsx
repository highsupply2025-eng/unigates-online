import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, BookOpen, ClipboardList, Users, CheckCircle2, XCircle, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { extractScheduleId } from "@/lib/schedule-url";
import SimpleHeader from "@/components/SimpleHeader";

type Schedule = {
  id: string;
  course_id: string;
  creator_id: string;
  title_ar: string;
  title_en: string;
  schedule_type: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  location_ar: string | null;
  location_en: string | null;
  notes_ar: string | null;
  notes_en: string | null;
  approved_by_head: boolean;
  approved_by_vice_dean: boolean;
  approved_by_dean: boolean;
  approved_by_head_at: string | null;
  approved_by_vice_dean_at: string | null;
  approved_by_dean_at: string | null;
  rejection_reason: string | null;
};

const ScheduleDetail = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { scheduleSlug } = useParams<{ scheduleSlug: string }>();
  const scheduleId = extractScheduleId(scheduleSlug);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [viewers, setViewers] = useState<any[]>([]);
  const [acting, setActing] = useState(false);

  const isLeadership = ["department_head", "vice_dean", "dean"].includes(userRole);
  const isCreator = !!(userId && schedule && userId === schedule.creator_id);
  const canSeeViewers = isCreator || isLeadership || userRole === "admin";

  useEffect(() => { (async () => {
    if (!scheduleId) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
    const role = profile?.role || "";
    setUserRole(role);

    const { data: s, error } = await supabase.from("lecture_schedules").select("*").eq("id", scheduleId).maybeSingle();
    if (error || !s) { setLoading(false); return; }
    setSchedule(s as Schedule);

    const { data: c } = await supabase.from("courses").select("id,title_ar,title_en,instructor_ar,instructor_en").eq("id", s.course_id).maybeSingle();
    setCourse(c);

    const { data: creator } = await supabase.from("profiles").select("full_name").eq("user_id", s.creator_id).maybeSingle();
    setCreatorName(creator?.full_name || "");

    // Record this view (upsert by unique constraint)
    await supabase.from("schedule_views").upsert(
      { schedule_id: scheduleId, user_id: user.id, viewed_at: new Date().toISOString() },
      { onConflict: "schedule_id,user_id" }
    );

    // Load viewers if allowed (RLS will filter)
    const { data: vs } = await supabase.from("schedule_views").select("*").eq("schedule_id", scheduleId).order("viewed_at", { ascending: false });
    if (vs && vs.length) {
      const ids = vs.map((v: any) => v.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, role").in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setViewers(vs.map((v: any) => ({ ...v, profile: map.get(v.user_id) })));
    } else {
      setViewers([]);
    }
    setLoading(false);
  })(); }, [scheduleId, navigate]);

  const approve = async (which: "head" | "vice_dean" | "dean") => {
    if (!schedule || !userId) return;
    const expected: Record<string, string> = { head: "department_head", vice_dean: "vice_dean", dean: "dean" };
    if (userRole !== expected[which]) {
      toast({ title: isRtl ? "غير مصرح" : "Unauthorized", variant: "destructive" });
      return;
    }
    setActing(true);
    const patch: any = {
      [`approved_by_${which}`]: true,
      [`approved_by_${which}_id`]: userId,
      [`approved_by_${which}_at`]: new Date().toISOString(),
    };
    const { error } = await supabase.from("lecture_schedules").update(patch).eq("id", schedule.id);
    setActing(false);
    if (error) { toast({ title: isRtl ? "فشل" : "Failed", description: error.message, variant: "destructive" }); return; }
    setSchedule({ ...schedule, ...patch });
    toast({ title: isRtl ? "تم الاعتماد" : "Approved" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!scheduleId || !schedule) return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <SimpleHeader />
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">{isRtl ? "الجدول غير موجود" : "Schedule not found"}</h1>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4 gap-2"><ArrowLeft className="w-4 h-4" />{isRtl ? "رجوع" : "Back"}</Button>
      </main>
    </div>
  );

  const isTest = schedule.schedule_type === "test";
  const fullyApproved = schedule.approved_by_head && schedule.approved_by_vice_dean && schedule.approved_by_dean;

  const ApprovalBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-muted border-border text-muted-foreground"}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <SimpleHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />{isRtl ? "رجوع" : "Back"}
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isTest ? "bg-red-500/10" : "bg-primary/10"}`}>
                  {isTest ? <ClipboardList className="w-6 h-6 text-red-500" /> : <BookOpen className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <CardTitle className="text-2xl">{isRtl ? schedule.title_ar : schedule.title_en}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course && (isRtl ? course.title_ar : course.title_en)}
                    {creatorName && ` • ${creatorName}`}
                  </p>
                </div>
              </div>
              <Badge variant={isTest ? "destructive" : "outline"} className="shrink-0">
                {isTest ? (isRtl ? "اختبار" : "Test") : (isRtl ? "محاضرة" : "Lecture")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{schedule.scheduled_date}</span>
              </div>
              {(schedule.start_time || schedule.end_time) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{schedule.start_time || "?"} - {schedule.end_time || "?"}</span>
                </div>
              )}
              {(schedule.location_ar || schedule.location_en) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{isRtl ? schedule.location_ar : schedule.location_en}</span>
                </div>
              )}
            </div>
            {(schedule.notes_ar || schedule.notes_en) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-bold mb-1">{isRtl ? "ملاحظات" : "Notes"}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{isRtl ? schedule.notes_ar : schedule.notes_en}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {isRtl ? "اعتماد القيادة" : "Leadership Approvals"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ApprovalBadge ok={schedule.approved_by_head} label={isRtl ? "رئيس القسم" : "Head of Dept."} />
              <ApprovalBadge ok={schedule.approved_by_vice_dean} label={isRtl ? "وكيل العميد" : "Vice Dean"} />
              <ApprovalBadge ok={schedule.approved_by_dean} label={isRtl ? "العميد" : "Dean"} />
            </div>
            {fullyApproved ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {isRtl ? "تم اعتماد الجدول وأصبح ظاهراً للطلبة" : "Schedule fully approved and visible to students"}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
                {isRtl ? "بانتظار اكتمال الموافقات لإظهاره للطلبة" : "Awaiting approvals before students can view"}
              </div>
            )}

            {isLeadership && (
              <div className="flex flex-wrap gap-2 pt-2">
                {userRole === "department_head" && !schedule.approved_by_head && (
                  <Button size="sm" onClick={() => approve("head")} disabled={acting} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />{isRtl ? "اعتماد كرئيس قسم" : "Approve as Head"}
                  </Button>
                )}
                {userRole === "vice_dean" && !schedule.approved_by_vice_dean && (
                  <Button size="sm" onClick={() => approve("vice_dean")} disabled={acting} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />{isRtl ? "اعتماد كوكيل عميد" : "Approve as Vice Dean"}
                  </Button>
                )}
                {userRole === "dean" && !schedule.approved_by_dean && (
                  <Button size="sm" onClick={() => approve("dean")} disabled={acting} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />{isRtl ? "اعتماد كعميد" : "Approve as Dean"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Viewers (creator + leadership only) */}
        {canSeeViewers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                {isRtl ? `من شاهد الصفحة (${viewers.length})` : `Page Viewers (${viewers.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{isRtl ? "لا توجد مشاهدات بعد" : "No viewers yet"}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {viewers.map((v) => (
                    <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium">{v.profile?.full_name || v.user_id.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.profile?.role && <Badge variant="outline" className="me-2">{v.profile.role}</Badge>}
                        {new Date(v.viewed_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ScheduleDetail;
