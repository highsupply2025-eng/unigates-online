import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Copy, UserCheck, GraduationCap,
  Layers, LinkIcon, MessageCircle, Loader2, Search, Download,
  Crown, Mail, Zap, Plus, UserMinus, Users, BookOpen,
  Shield, CheckCircle2, Clock, X, FileSpreadsheet, Share2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import * as XLSX from "xlsx";

interface DepartmentMember {
  id: string;
  department_id: string;
  full_name: string;
  role: string;
  date_of_birth: string | null;
  photo_url: string | null;
  invitation_code: string | null;
  user_id: string | null;
  created_at: string;
  email?: string | null;
  phone?: string | null;
}

type StatusFilter = "all" | "linked" | "pending";

type MemberProfile = { email: string; phone: string; live_photo_url: string | null; photo_url: string | null; full_name: string; must_change_password: boolean };
type DeptSnapshot = {
  deptName: string;
  deptStatus: string;
  institutionType: "college" | "institute";
  members: DepartmentMember[];
  profilesMap: Record<string, MemberProfile>;
};
const __deptCache = new Map<string, DeptSnapshot>();

const STUDENT_ROLE = "student";

const FACULTY_ROLES = new Set<string>([
  "dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students",
  "vice_dean_community", "vice_dean_environment", "department_head",
  "teaching_assistant", "professor", "doctor", "lecturer", "assistant_lecturer",
]);
const isFacultyRole = (role: string) => FACULTY_ROLES.has(String(role || ""));

// Role label helper
const getRoleLabel = (role: string, isRtl: boolean, institutionType: "college" | "institute" = "college"): string => {
  const isCollege = institutionType === "college";
  const map: Record<string, [string, string]> = {
    department_head:      ["رئيس قسم",                                                "Department Head"],
    dean:                 [isCollege ? "عميد الكلية" : "مدير المعهد",                 isCollege ? "Dean" : "Director"],
    vice_dean:            [isCollege ? "وكيل الكلية" : "وكيل المعهد",                 isCollege ? "Vice Dean" : "Vice Director"],
    vice_dean_postgrad:   [isCollege ? "وكيل الكلية للدراسات العليا" : "وكيل المعهد للدراسات العليا", "Vice Dean - Postgraduate Studies"],
    vice_dean_students:   [isCollege ? "وكيل الكلية لشئون الطلاب" : "وكيل المعهد لشئون الطلاب",       "Vice Dean - Student Affairs"],
    vice_dean_community:  [isCollege ? "وكيل الكلية لشئون البيئة وخدمة المجتمع" : "وكيل المعهد لشئون البيئة وخدمة المجتمع", "Vice Dean - Community Service"],
    vice_dean_environment:[isCollege ? "وكيل الكلية لشئون البيئة" : "وكيل المعهد لشئون البيئة", "Vice Dean - Environment"],
    college_secretary:    [isCollege ? "أمين الكلية" : "أمين المعهد",                 isCollege ? "College Secretary" : "Institute Secretary"],
    library_manager:      ["مدير المكتبة",                                            "Library Manager"],
    professor:            ["أستاذ دكتور",                                             "Professor"],
    doctor:               ["دكتور",                                                   "Doctor"],
    lecturer:             ["محاضر",                                                   "Lecturer"],
    teaching_assistant:   ["مدرس مساعد",                                              "Teaching Assistant"],
    assistant_lecturer:   ["معيد",                                                    "Assistant Lecturer"],
    teacher:              ["مدرس",                                                    "Teacher"],
    student:              ["طالب",                                                    "Student"],
  };
  return map[role]?.[isRtl ? 0 : 1] ?? role;
};

const DepartmentPage = () => {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dir, tText, translate } = useLanguage();
  const isRtl = dir === "rtl";
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("");
  const [deptStatus, setDeptStatus] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, MemberProfile>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberToRemove, setMemberToRemove] = useState<DepartmentMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [activationResults, setActivationResults] = useState<Array<{ full_name: string; email: string; password: string }>>([]);
  const [showActivationResults, setShowActivationResults] = useState(false);
  const [memberToActivate, setMemberToActivate] = useState<DepartmentMember | null>(null);
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePhone, setActivatePhone] = useState("");
  const [activating, setActivating] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    if (!deptId || !identity) return;
    const cached = __deptCache.get(deptId);
    if (cached) {
      setDeptName(cached.deptName);
      setDeptStatus(cached.deptStatus);
      setInstitutionType(cached.institutionType);
      setMembers(cached.members);
      setProfilesMap(cached.profilesMap);
      setLoading(false);
    }
    loadDepartmentData();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && deptId) {
        __deptCache.delete(deptId);
        loadDepartmentData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [deptId, identity]);

  useRealtimeRefresh(
    ["department_members", "institution_faculty_members"],
    () => { if (deptId) { __deptCache.delete(deptId); loadDepartmentData(); } },
    Boolean(deptId),
  );

  const loadDepartmentData = async () => {
    if (!deptId) return;
    const requestId = ++loadRequestIdRef.current;
    try {
      if (!identity) return;
      const [deptResult, membersResult] = await Promise.all([
        supabase.from("departments").select("*").eq("id", deptId).maybeSingle(),
        (async () => {
          let all: DepartmentMember[] = [];
          let from = 0;
          let hasMore = true;
          while (hasMore) {
            const { data: batch } = await supabase
              .from("department_members").select("*").eq("department_id", deptId).range(from, from + 999);
            all = [...all, ...(batch || [])];
            hasMore = (batch?.length || 0) === 1000;
            from += 1000;
          }
          return all;
        })(),
      ]);
      if (requestId !== loadRequestIdRef.current) return;
      const dept = deptResult.data;
      if (!dept) { navigate("/institution/dashboard"); return; }
      setDeptName(dept.department_name);
      setDeptStatus(dept.status);
      setInstitutionType(dept.institution_type as "college" | "institute");
      const seenIds = new Set<string>();
      const allMembers = (membersResult || []).filter(m => { if (seenIds.has(m.id)) return false; seenIds.add(m.id); return true; });
      let visibleMembers = allMembers.filter(m => {
        if (m.user_id) return true;
        const nm = (m.full_name || "").trim();
        return nm !== "عضو جديد" && nm !== "New Member";
      });
      if (dept) {
        try {
          const { data: ifmRows } = await supabase
            .from("institution_faculty_members")
            .select("id,user_id,email,full_name,photo_url,phone,specific_role")
            .eq("institution_id", (dept as any).institution_id)
            .eq("institution_type", (dept as any).institution_type);
          if (ifmRows && ifmRows.length > 0) {
            const ifmByEmail = new Map<string, any>();
            const ifmByName = new Map<string, any>();
            const ifmByUserId = new Map<string, any>();
            ifmRows.forEach((r: any) => {
              if (r.user_id) ifmByUserId.set(String(r.user_id).toLowerCase(), r);
              if (r.email) ifmByEmail.set(String(r.email).toLowerCase(), r);
              if (r.full_name) ifmByName.set(String(r.full_name).trim().toLowerCase(), r);
            });
            visibleMembers = visibleMembers.map(m => {
              if (!isFacultyRole(m.role)) return m;
              const match = (m.user_id && ifmByUserId.get(String(m.user_id).toLowerCase())) ||
                (m.email && ifmByEmail.get(String(m.email).toLowerCase())) ||
                (m.full_name && ifmByName.get(String(m.full_name).trim().toLowerCase()));
              if (match) return { ...m, user_id: m.user_id || match.user_id || null, email: m.email || match.email || null, phone: m.phone || match.phone || null, photo_url: m.photo_url || match.photo_url || null };
              return m;
            }).filter(m => {
              if (!isFacultyRole(m.role)) return true;
              if (m.user_id && ifmByUserId.has(String(m.user_id).toLowerCase())) return true;
              const email = (m as any).email ? String((m as any).email).toLowerCase() : "";
              if (email && ifmByEmail.has(email)) return true;
              const name = (m as any).full_name ? String((m as any).full_name).trim().toLowerCase() : "";
              if (name && ifmByName.has(name)) return true;
              return false;
            });
          }
        } catch (e) { console.warn("faculty authority filter failed:", e); }
      }
      if (requestId !== loadRequestIdRef.current) return;
      setMembers(visibleMembers);
      const linkedUserIds = visibleMembers.filter(m => m.user_id).map(m => m.user_id as string);
      let snapshotMap: Record<string, MemberProfile> = {};
      if (linkedUserIds.length > 0) {
        let profilesData: any[] = [];
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc("get_user_profiles_for_institution" as any, { p_user_ids: linkedUserIds });
          if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) profilesData = rpcData;
        } catch { /* fallback */ }
        if (!profilesData || profilesData.length === 0) {
          const { data: directData } = await supabase.from("profiles").select("user_id,email,phone,full_name,must_change_password,avatar_url").in("user_id", linkedUserIds);
          profilesData = directData || [];
        }
        const map: Record<string, MemberProfile> = {};
        (profilesData || []).forEach((p: any) => {
          map[p.user_id] = { email: p.email, phone: p.phone, live_photo_url: null, photo_url: p.avatar_url ?? null, full_name: p.full_name, must_change_password: p.must_change_password === true };
        });
        allMembers.forEach(m => { if (m.user_id && map[m.user_id] && !map[m.user_id].photo_url && m.photo_url) map[m.user_id].photo_url = m.photo_url; });
        snapshotMap = map;
        if (requestId !== loadRequestIdRef.current) return;
        setProfilesMap(map);
      }
      setImgErrors({});
      __deptCache.set(deptId, { deptName: dept.department_name, deptStatus: dept.status, institutionType: dept.institution_type as "college" | "institute", members: visibleMembers, profilesMap: snapshotMap });
    } catch { navigate("/institution/dashboard"); }
    finally { if (requestId === loadRequestIdRef.current) setLoading(false); }
  };

  const handleRemoveFromDepartment = async () => {
    if (!memberToRemove || !deptId) return;
    setRemoving(true);
    try {
      if (isFacultyRole(memberToRemove.role)) {
        if (!identity) throw new Error("Missing institution identity");
        const { data: ifmRows, error: ifmQueryError } = await supabase.from("institution_faculty_members").select("id,user_id,email").eq("institution_id", identity.institutionId).eq("institution_type", identity.institutionType).eq("department_id", deptId);
        if (ifmQueryError) throw ifmQueryError;
        const memberEmail = String((memberToRemove as any).email || "").toLowerCase();
        const matchedIfm = (ifmRows || []).find((r: any) => {
          if (memberToRemove.user_id && r.user_id) return String(r.user_id).toLowerCase() === String(memberToRemove.user_id).toLowerCase();
          if (memberEmail && r.email) return String(r.email).toLowerCase() === memberEmail;
          return false;
        });
        if (matchedIfm) {
          const { error: unlinkError } = await supabase.from("institution_faculty_members").update({ department_id: null }).eq("id", matchedIfm.id);
          if (unlinkError) throw unlinkError;
        }
      }
      const { error } = await supabase.from("department_members").delete().eq("id", memberToRemove.id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      __deptCache.delete(deptId);
      try {
        sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString());
        sessionStorage.setItem(`dept-cache-invalidate:${deptId}`, Date.now().toString());
      } catch { /* ignore */ }
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      sonnerToast.success(isRtl ? "تمت إزالة العضو من القسم بنجاح" : "Member removed from department", { description: isRtl ? "ظل العضو محفوظاً في قائمة أعضاء هيئة التدريس بالكلية" : "The member remains in the institution-wide faculty directory", duration: 2500 });
    } catch (err: any) {
      sonnerToast.error(isRtl ? "فشل إزالة العضو من القسم" : "Failed to remove member", { description: err?.message || String(err), duration: 3000 });
      await loadDepartmentData();
    } finally { setRemoving(false); setMemberToRemove(null); }
  };

  const handleActivateExistingMember = async () => {
    if (!memberToActivate || !deptId) return;
    setActivating(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("activate-department-member", { body: { full_name: memberToActivate.full_name, email: activateEmail || undefined, phone: activatePhone || undefined, department_id: deptId, role: memberToActivate.role, existing_member_id: memberToActivate.id } });
      if (fnError) throw fnError;
      if (!fnData?.success) throw new Error(fnData?.error || "Activation failed");
      setActivationResults([{ full_name: memberToActivate.full_name, email: fnData.email, password: fnData.password }]);
      setShowActivationResults(true);
      sonnerToast.success(isRtl ? "تم تفعيل الحساب بنجاح" : "Account activated successfully", { duration: 2000 });
      setMemberToActivate(null); setActivateEmail(""); setActivatePhone("");
      if (deptId) __deptCache.delete(deptId);
      await loadDepartmentData();
    } catch (err: any) {
      sonnerToast.error(isRtl ? "فشل تفعيل الحساب" : "Failed to activate account", { description: err?.message || String(err), duration: 3000 });
    } finally { setActivating(false); }
  };

  const allLecturers = members.filter(m => m.role !== STUDENT_ROLE);
  const allStudents = members.filter(m => m.role === STUDENT_ROLE);

  const filterMembers = (list: DepartmentMember[]) => list.filter(m => {
    const profile = m.user_id ? profilesMap[m.user_id] : null;
    const name = profile?.full_name || m.full_name;
    const matchSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || (profile?.email && profile.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const isLinked = !!m.user_id;
    const matchStatus = statusFilter === "all" || (statusFilter === "linked" && isLinked) || (statusFilter === "pending" && !isLinked);
    return matchSearch && matchStatus;
  });

  const lecturers = useMemo(() => filterMembers(allLecturers), [members, searchQuery, statusFilter, profilesMap]);
  const students = useMemo(() => filterMembers(allStudents), [members, searchQuery, statusFilter, profilesMap]);

  const linkedFaculty = allLecturers.filter(m => !!m.user_id).length;
  const linkedStudents = allStudents.filter(m => !!m.user_id).length;

  const baseUrl = window.location.origin;
  const instPath = institutionType === "college" ? "college" : "institute";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  const getExportData = () => [...lecturers, ...students].map(m => ({
    [isRtl ? "الاسم" : "Name"]: m.full_name,
    [isRtl ? "الدور" : "Role"]: getRoleLabel(m.role, isRtl, institutionType),
    [isRtl ? "الحالة" : "Status"]: m.user_id ? (isRtl ? "مسجّل" : "Linked") : (isRtl ? "بانتظار" : "Pending"),
    [isRtl ? "كود الدعوة" : "Invitation Code"]: m.invitation_code || "",
    [isRtl ? "رابط التسجيل" : "Signup Link"]: m.invitation_code ? `${baseUrl}/signup/${instPath}/${m.role}?code=${m.invitation_code}` : "",
  }));

  const exportCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(","), ...data.map(row => headers.map(h => `"${(row as Record<string, string>)[h]}"`).join(","))];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deptName || "department"}-members.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 30 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, deptName.slice(0, 31));
    XLSX.writeFile(wb, `${deptName}_members.xlsx`);
    sonnerToast.success(isRtl ? "تم تصدير Excel" : "Excel exported!", { duration: 1000 });
  };

  // ── Member Card ─────────────────────────────────────────────────────────────
  const renderMemberCard = (member: DepartmentMember) => {
    const inviteLink = `${baseUrl}/signup/${instPath}/${member.role}?code=${member.invitation_code}`;
    const profile = member.user_id ? profilesMap[member.user_id] : null;
    const displayName = profile?.full_name || member.full_name;
    const avatar = profile?.live_photo_url || profile?.photo_url || member.photo_url;
    const isLinked = !!member.user_id;
    const isActivated = isLinked && !!profile && profile.must_change_password === false;
    const isHead = member.role === "department_head";
    const isDeanOrViceDean = member.role === "dean" || member.role.startsWith("vice_dean");
    const isStudent = member.role === STUDENT_ROLE;
    const shareText = isRtl
      ? `مرحباً ${member.full_name}، يمكنك التسجيل في منصة يونيجيتس عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
      : `Hi ${member.full_name}, register on UNIGATES platform:\n${inviteLink}\nInvitation code: ${member.invitation_code}`;

    const avatarBg = isHead ? "from-amber-500 to-orange-600" : isDeanOrViceDean ? "from-purple-600 to-indigo-600" : isStudent ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-teal-600";
    const AvatarIcon = isHead || isDeanOrViceDean ? Crown : isStudent ? GraduationCap : UserCheck;

    return (
      <div key={member.id} className="group rounded-2xl border-2 border-border/60 hover:border-primary/30 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <button type="button" onClick={() => navigate(`/institution/member/${member.id}`)} className="shrink-0 relative">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarBg} flex items-center justify-center overflow-hidden ring-2 ring-white/50 dark:ring-white/20 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                {avatar && !imgErrors[member.id] ? (
                  <img src={avatar} alt={displayName} className="w-full h-full object-cover" onError={() => setImgErrors(prev => ({ ...prev, [member.id]: true }))} />
                ) : <AvatarIcon className="w-5 h-5 text-white drop-shadow-sm" />}
              </div>
              {isActivated && (
                <span className="absolute -bottom-0.5 -end-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <button type="button" onClick={() => navigate(`/institution/member/${member.id}`)} className="font-black text-sm text-foreground hover:text-primary transition-colors truncate">
                  {displayName}
                </button>
                {isHead && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0 gap-1 shrink-0 shadow-sm">
                    <Crown className="w-2.5 h-2.5" />
                    {tText("رئيس قسم", "Head")}
                  </Badge>
                )}
                {isDeanOrViceDean && (
                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] px-2 py-0 gap-1 shrink-0 shadow-sm">
                    <Crown className="w-2.5 h-2.5" />
                    {getRoleLabel(member.role, isRtl, institutionType)}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-bold">{getRoleLabel(member.role, isRtl, institutionType)}</p>
              {isLinked && profile ? (
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                  {profile.email && <span className="truncate max-w-[180px]" dir="ltr">{profile.email}</span>}
                  {profile.phone && <span dir="ltr" className="truncate">{profile.phone}</span>}
                  {profile.must_change_password === true && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{tText("⚠ كلمة مرور مؤقتة", "⚠ Temp password")}</span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {tText("في انتظار التسجيل", "Pending registration")}
                </p>
              )}
            </div>

            {/* Status + Remove */}
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              {isActivated ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[10px] font-black">
                  <CheckCircle2 className="w-3 h-3" />{tText("مفعّل", "Active")}
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 text-[10px] font-black">
                  <Clock className="w-3 h-3" />{tText("غير مفعّل", "Inactive")}
                </Badge>
              )}
              <button
                onClick={() => setMemberToRemove(member)}
                className="p-1.5 rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                title={tText("إزالة من القسم", "Remove from department")}
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pending Footer — Invite Actions */}
        {!isLinked && (
          <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" className="text-xs h-8 px-3 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
                onClick={() => { setMemberToActivate(member); setActivateEmail(""); setActivatePhone(""); }}>
                <Zap className="w-3.5 h-3.5" />
                {tText("تفعيل", "Activate")}
              </Button>
              <span className="h-5 w-px bg-border" aria-hidden />
              <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 rounded-xl" onClick={() => copyToClipboard(member.invitation_code!)}>
                <Copy className="w-3.5 h-3.5" />{tText("الكود", "Code")}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 rounded-xl" onClick={() => copyToClipboard(inviteLink)}>
                <LinkIcon className="w-3.5 h-3.5" />{tText("الرابط", "Link")}
              </Button>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 rounded-xl text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30">
                  <MessageCircle className="w-3.5 h-3.5" />WA
                </Button>
              </a>
              {(() => {
                const subject = isRtl ? "دعوة للتسجيل في منصة يونيجيتس" : "UNIGATES Platform Invitation";
                return (
                  <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`}>
                    <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                      <Mail className="w-3.5 h-3.5" />{tText("إيميل", "Email")}
                    </Button>
                  </a>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Loading Skeleton ─────────────────────────────────────────────────────────
  if (identityLoading || (loading && members.length === 0)) {
    return (
      <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)}
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
          {[1,2].map(i => (
            <div key={i} className="rounded-3xl border-2 border-border/60 overflow-hidden">
              <div className="p-5 border-b bg-muted/20"><Skeleton className="h-6 w-32" /></div>
              <div className="p-4 space-y-3">
                {[1,2].map(j => <Skeleton key={j} className="h-20 rounded-2xl" />)}
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  const isActive = deptStatus === "active";
  const activeFaculty = allLecturers.filter(m => !!m.user_id && (m.user_id ? profilesMap[m.user_id]?.must_change_password === false : false)).length;

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-gradient-to-r from-primary/10 via-card/95 to-card/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-foreground truncate">{tText("إدارة القسم", "Department Management")}</h1>
              <p className="text-[11px] text-muted-foreground font-bold truncate">{deptName}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="outline"
            className="rounded-xl shrink-0 border-border/60 hover:bg-primary/10 hover:border-primary/30 transition-all"
            onClick={() => navigate("/institution/dashboard?tab=departments")}
            aria-label={tText("رجوع", "Back")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-7 space-y-6">

        {/* ── Department Title Block ── */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-3xl font-black text-foreground truncate">{deptName}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                {isActive ? tText("قسم مفعّل", "Active Department") : tText("بانتظار الموافقة", "Pending Approval")}
              </span>
              <span className="text-xs text-muted-foreground font-bold">
                {allLecturers.length} {tText("عضو", "members")} · {allStudents.length} {tText("طالب", "students")}
              </span>
            </div>
          </div>
        </div>

        {/* ── HUD Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: tText("أعضاء هيئة التدريس", "Faculty Members"),
              value: allLecturers.length,
              sub: `${linkedFaculty} ${tText("مرتبط", "linked")}`,
              icon: <Shield className="w-5 h-5 text-white" />,
              gradient: "from-violet-500 to-purple-600",
              glow: "shadow-violet-500/20",
            },
            {
              label: tText("الطلاب المسجلون", "Registered Students"),
              value: allStudents.length,
              sub: `${linkedStudents} ${tText("مرتبط", "linked")}`,
              icon: <GraduationCap className="w-5 h-5 text-white" />,
              gradient: "from-blue-500 to-indigo-600",
              glow: "shadow-blue-500/20",
            },
            {
              label: tText("الحسابات المفعّلة", "Activated Accounts"),
              value: activeFaculty + linkedStudents,
              sub: tText("مفعّل بالكامل", "fully active"),
              icon: <CheckCircle2 className="w-5 h-5 text-white" />,
              gradient: "from-emerald-500 to-teal-600",
              glow: "shadow-emerald-500/20",
            },
            {
              label: tText("في الانتظار", "Pending Registration"),
              value: members.filter(m => !m.user_id).length,
              sub: tText("بحاجة تفعيل", "need activation"),
              icon: <Clock className="w-5 h-5 text-white" />,
              gradient: "from-amber-500 to-orange-600",
              glow: "shadow-amber-500/20",
            },
          ].map((stat, i) => (
            <Card key={i} className="rounded-3xl border-2 border-border/60 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0 shadow-md ${stat.glow}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                  <p className="text-[11px] font-black text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground/70 font-bold">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Search + Filters + Actions Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tText("ابحث بالاسم أو البريد الإلكتروني...", "Search by name or email...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ps-10 h-11 rounded-2xl bg-background border-border/80 font-bold text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border/60 shrink-0">
            {(["all", "linked", "pending"] as StatusFilter[]).map(f => (
              <button key={f} type="button" onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${statusFilter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? tText("الكل", "All") : f === "linked" ? tText("مرتبط", "Linked") : tText("انتظار", "Pending")}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-11 px-4 rounded-2xl gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-black shadow-md shadow-primary/20"
              onClick={() => navigate(`/institution/dashboard?tab=faculty&addDeptId=${deptId}`)}
            >
              <Plus className="w-4 h-4" />
              {tText("إضافة عضو", "Add Member")}
            </Button>
            <Button size="sm" variant="outline" onClick={exportExcel} className="h-11 px-3 rounded-2xl gap-1.5 border-border/60 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="h-11 px-3 rounded-2xl gap-1.5 border-border/60 font-bold">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* ── Faculty Members Section ── */}
        <div className="rounded-3xl border-2 border-border/60 overflow-hidden bg-card shadow-sm">
          {/* Section Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-violet-500/8 via-purple-500/5 to-transparent border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">{tText("أعضاء هيئة التدريس", "Faculty Members")}</h3>
                <p className="text-[11px] text-muted-foreground font-bold">{lecturers.length}/{allLecturers.length} {tText("عضو", "member")}</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
              {linkedFaculty}/{allLecturers.length}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            {lecturers.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? tText("لا توجد نتائج مطابقة", "No matching results")
                    : tText("لا يوجد أعضاء مسجّلون بعد", "No registered members yet")}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 font-bold"
                    onClick={() => navigate(`/institution/dashboard?tab=faculty&addDeptId=${deptId}`)}>
                    <Plus className="w-4 h-4" />{tText("إضافة عضو هيئة تدريس", "Add Faculty Member")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {lecturers.map(m => renderMemberCard(m))}
              </div>
            )}
          </div>
        </div>

        {/* ── Students Section ── */}
        <div className="rounded-3xl border-2 border-border/60 overflow-hidden bg-card shadow-sm">
          {/* Section Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-blue-500/8 via-indigo-500/5 to-transparent border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <GraduationCap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">{tText("الطلاب المسجلون", "Registered Students")}</h3>
                <p className="text-[11px] text-muted-foreground font-bold">{students.length}/{allStudents.length} {tText("طالب", "student")}</p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              {linkedStudents}/{allStudents.length}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            {students.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? tText("لا توجد نتائج مطابقة", "No matching results")
                    : tText("لا يوجد طلاب مسجّلون في هذا القسم بعد", "No students registered in this department yet")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map(m => renderMemberCard(m))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Remove Confirmation Dialog ── */}
      <AlertDialog open={!!memberToRemove} onOpenChange={open => !open && setMemberToRemove(null)}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-destructive" />
              {tText("تأكيد إزالة العضو من القسم", "Confirm Remove from Department")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {isFacultyRole(memberToRemove?.role || "") ? (
                  <>
                    <p className="font-bold text-destructive">
                      {isRtl
                        ? `سيتم إزالة "${memberToRemove?.full_name}" من هذا القسم فقط ولن يتم حذفه من أعضاء هيئة التدريس بالكلية.`
                        : `"${memberToRemove?.full_name}" will only be removed from this department and will NOT be deleted from the faculty directory.`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tText("سيبقى العضو ظاهراً في قائمة أعضاء هيئة التدريس بالكلية.", "The member will remain listed in the institution-wide Faculty tab.")}
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-destructive">
                    {isRtl
                      ? `سيتم إزالة "${memberToRemove?.full_name}" من هذا القسم فقط.`
                      : `"${memberToRemove?.full_name}" will only be removed from this department.`}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={removing} className="rounded-2xl">{tText("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleRemoveFromDepartment(); }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl gap-2"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
              {tText("إزالة من القسم", "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Activate Member Dialog ── */}
      <Dialog open={!!memberToActivate} onOpenChange={open => !open && setMemberToActivate(null)}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-md w-full rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" />
              </div>
              {tText("تفعيل حساب العضو", "Activate Member Account")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <p className="text-sm font-black text-foreground">{memberToActivate?.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getRoleLabel(memberToActivate?.role || "", isRtl, institutionType)}</p>
            </div>
            <p className="text-sm text-muted-foreground">{tText("يمكنك إدخال البريد الإلكتروني ورقم الهاتف (اختيارياً) أو تركهما فارغين ليتم توليدهما تلقائياً.", "Enter email and phone optionally. Leave blank for auto-generation.")}</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-black">{tText("البريد الإلكتروني (اختياري)", "Email (optional)")}</Label>
              <Input type="email" value={activateEmail} onChange={e => setActivateEmail(e.target.value)} placeholder={tText("سيتم توليد بريد تلقائي إذا لم يُدخل", "Auto-generated if empty")} dir="ltr" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black">{tText("رقم الهاتف (اختياري)", "Phone (optional)")}</Label>
              <Input type="tel" value={activatePhone} onChange={e => setActivatePhone(e.target.value)} placeholder="+201000000000" dir="ltr" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={() => setMemberToActivate(null)} disabled={activating} className="rounded-2xl">{tText("إلغاء", "Cancel")}</Button>
            <Button onClick={handleActivateExistingMember} disabled={activating} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md shadow-emerald-500/20">
              {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {tText("تفعيل الحساب", "Activate Account")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Activation Results Dialog ── */}
      <Dialog open={showActivationResults} onOpenChange={setShowActivationResults}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full rounded-3xl border-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              {tText("تم تفعيل الحسابات بنجاح", "Accounts Activated Successfully")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{tText("يُرجى مشاركة بيانات الدخول مع كل عضو.", "Please share login credentials with each member.")}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activationResults.map((r, i) => (
                <div key={i} className="p-3 rounded-2xl border-2 border-border/60 bg-muted/20 space-y-2">
                  <p className="font-black text-sm text-foreground">{r.full_name}</p>
                  {[
                    { label: tText("البريد:", "Email:"), val: r.email },
                    { label: tText("كلمة المرور:", "Password:"), val: r.password },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-bold shrink-0">{label}</span>
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded-lg border flex-1 truncate" dir="ltr">{val}</code>
                      <button onClick={() => copyToClipboard(val)} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              ⚠ {tText("يجب على كل عضو تغيير كلمة المرور عند أول دخول.", "Each member must change their password on first login.")}
            </p>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button variant="outline" className="rounded-2xl gap-2" onClick={() => {
              const allText = activationResults.map(r => `${r.full_name}\n${isRtl ? "البريد" : "Email"}: ${r.email}\n${isRtl ? "كلمة المرور" : "Password"}: ${r.password}`).join("\n\n");
              copyToClipboard(allText);
            }}>
              <Copy className="w-4 h-4" />{tText("نسخ الكل", "Copy All")}
            </Button>
            <Button onClick={() => setShowActivationResults(false)} className="rounded-2xl">{tText("إغلاق", "Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentPage;
