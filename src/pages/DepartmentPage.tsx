import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Copy, UserCheck, GraduationCap,
  Layers, LinkIcon, MessageCircle, Loader2, Search, Download, Trash2, Pencil, Crown, Mail, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
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
}

type StatusFilter = "all" | "linked" | "pending";

type MemberProfile = { email: string; phone: string; live_photo_url: string | null; full_name: string; must_change_password: boolean };
type DeptSnapshot = {
  deptName: string;
  deptStatus: string;
  institutionType: "college" | "institute";
  members: DepartmentMember[];
  profilesMap: Record<string, MemberProfile>;
};
const __deptCache = new Map<string, DeptSnapshot>();

const STUDENT_ROLE = "student";
const HEAD_ROLE = "department_head";


const DepartmentPage = () => {
  const { deptId } = useParams<{ deptId: string }>();
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("");
  const [deptStatus, setDeptStatus] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, MemberProfile>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberToDelete, setMemberToDelete] = useState<DepartmentMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<DepartmentMember | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "lecturer">("student");
  const [adding, setAdding] = useState(false);

  const [activationResults, setActivationResults] = useState<Array<{ full_name: string; email: string; password: string }>>([]);
  const [showActivationResults, setShowActivationResults] = useState(false);
  const [memberToActivate, setMemberToActivate] = useState<DepartmentMember | null>(null);
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePhone, setActivatePhone] = useState("");
  const [activating, setActivating] = useState(false);

  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    if (!deptId) return;
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
  }, [deptId]);

  useRealtimeRefresh(
    ["department_members"],
    () => {
      if (deptId) {
        __deptCache.delete(deptId);
        loadDepartmentData();
      }
    },
    Boolean(deptId),
  );

  const loadDepartmentData = async () => {
    if (!deptId) return;
    const requestId = ++loadRequestIdRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: dept } = await supabase
        .from("departments")
        .select("*")
        .eq("id", deptId)
        .maybeSingle();

      if (!dept) { navigate("/institution/dashboard"); return; }

      if (requestId !== loadRequestIdRef.current) return;

      setDeptName(dept.department_name);
      setDeptStatus(dept.status);
      setInstitutionType(dept.institution_type as "college" | "institute");

      let allMembers: DepartmentMember[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: batch } = await supabase
          .from("department_members")
          .select("*")
          .eq("department_id", deptId)
          .range(from, from + 999);
        allMembers = [...allMembers, ...(batch || [])];
        hasMore = (batch?.length || 0) === 1000;
        from += 1000;
      }

      if (requestId !== loadRequestIdRef.current) return;

      const seenIds = new Set<string>();
      allMembers = allMembers.filter(m => {
        if (seenIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
      });

      const hasHead = allMembers.some(m => m.role === "department_head");
      if (!hasHead) {
        const headInsert = {
          department_id: deptId,
          full_name: isRtl ? "رئيس القسم" : "Department Head",
          role: "department_head",
          invitation_code: crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
        };
        const { data: newHead } = await supabase
          .from("department_members")
          .insert(headInsert)
          .select()
          .maybeSingle();
        if (newHead && !seenIds.has(newHead.id)) {
          allMembers = [...allMembers, newHead as DepartmentMember];
        }
      }

      const visibleMembers = allMembers.filter(m => {
        if (m.user_id) return true;
        const nm = (m.full_name || "").trim();
        return nm !== "عضو جديد" && nm !== "New Member";
      });

      if (requestId !== loadRequestIdRef.current) return;

      setMembers(visibleMembers);

      const linkedUserIds = allMembers.filter(m => m.user_id).map(m => m.user_id as string);
      let snapshotMap: Record<string, MemberProfile> = {};
      if (linkedUserIds.length > 0) {
        const [{ data: profilesData }, { data: docsData }] = await Promise.all([
          supabase.from("profiles").select("user_id,email,phone,full_name,must_change_password").in("user_id", linkedUserIds),
          supabase.from("profile_documents").select("user_id,live_photo_url").in("user_id", linkedUserIds),
        ]);
        const docsById: Record<string, string | null> = {};
        (docsData || []).forEach((d: any) => { docsById[d.user_id] = d.live_photo_url ?? null; });
        const map: Record<string, MemberProfile> = {};
        (profilesData || []).forEach((p: any) => {
          map[p.user_id] = {
            email: p.email,
            phone: p.phone,
            live_photo_url: docsById[p.user_id] ?? null,
            full_name: p.full_name,
            must_change_password: p.must_change_password === true,
          };
        });
        snapshotMap = map;
        if (requestId !== loadRequestIdRef.current) return;
        setProfilesMap(map);
      }

      __deptCache.set(deptId, {
        deptName: dept.department_name,
        deptStatus: dept.status,
        institutionType: dept.institution_type as "college" | "institute",
        members: visibleMembers,
        profilesMap: snapshotMap,
      });
    } catch {
      navigate("/institution/dashboard");
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("department_members")
        .delete()
        .eq("id", memberToDelete.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      sonnerToast.success(isRtl ? "تم حذف العضو بنجاح" : "Member deleted successfully", { duration: 1500 });
      if (deptId) {
        __deptCache.delete(deptId);
        loadDepartmentData();
      }
    } catch {
      sonnerToast.error(isRtl ? "فشل حذف العضو" : "Failed to delete member");
    } finally {
      setDeleting(false);
      setMemberToDelete(null);
    }
  };

  const openEditDialog = (member: DepartmentMember) => {
    setMemberToEdit(member);
    setEditName(member.full_name);
  };

  const handleEditName = async () => {
    if (!memberToEdit || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("department_members")
        .update({ full_name: editName.trim() })
        .eq("id", memberToEdit.id);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberToEdit.id ? { ...m, full_name: editName.trim() } : m));
      sonnerToast.success(isRtl ? "تم تعديل الاسم" : "Name updated", { duration: 1000 });
      if (deptId) __deptCache.delete(deptId);
    } catch {
      sonnerToast.error(isRtl ? "فشل تعديل الاسم" : "Failed to update name");
    } finally {
      setSaving(false);
      setMemberToEdit(null);
    }
  };

  const handleAddMembers = async () => {
    if (!deptId || !newMemberName.trim()) return;
    const names = newMemberName.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setAdding(true);
    try {
      const inserts = names.map(name => ({
        department_id: deptId,
        full_name: name,
        role: newMemberRole,
        invitation_code: crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase(),
      }));
      const BATCH = 500;
      const added: DepartmentMember[] = [];
      for (let i = 0; i < inserts.length; i += BATCH) {
        const { data, error } = await supabase
          .from("department_members")
          .insert(inserts.slice(i, i + BATCH))
          .select();
        if (error) throw error;
        added.push(...(data as DepartmentMember[]));
      }

      const results: Array<{ full_name: string; email: string; password: string }> = [];
      for (const member of added) {
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("activate-department-member", {
            body: {
              full_name: member.full_name,
              department_id: deptId,
              role: member.role,
              existing_member_id: member.id,
            },
          });
          if (!fnError && fnData?.success) {
            results.push({
              full_name: member.full_name,
              email: fnData.email,
              password: fnData.password,
            });
          } else {
            console.error("Activation failed for", member.full_name, fnError || fnData);
          }
        } catch (actErr) {
          console.error("Activation error for", member.full_name, actErr);
        }
      }

      if (results.length > 0) {
        setActivationResults(results);
        setShowActivationResults(true);
        sonnerToast.success(
          isRtl
            ? `تمت إضافة ${added.length} عضو وتفعيل ${results.length} حساب`
            : `${added.length} members added, ${results.length} accounts activated`,
          { duration: 3000 }
        );
      } else {
        sonnerToast.success(
          isRtl ? `تمت إضافة ${added.length} عضو بنجاح` : `${added.length} members added`,
          { duration: 1500 }
        );
      }

      setNewMemberName("");
      setShowAddDialog(false);
      if (deptId) __deptCache.delete(deptId);
      await loadDepartmentData();
    } catch {
      sonnerToast.error(isRtl ? "فشل إضافة الأعضاء" : "Failed to add members");
    } finally {
      setAdding(false);
    }
  };

  const handleActivateExistingMember = async () => {
    if (!memberToActivate || !deptId) return;
    setActivating(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("activate-department-member", {
        body: {
          full_name: memberToActivate.full_name,
          email: activateEmail || undefined,
          phone: activatePhone || undefined,
          department_id: deptId,
          role: memberToActivate.role,
          existing_member_id: memberToActivate.id,
        },
      });
      if (fnError) throw fnError;
      if (!fnData?.success) throw new Error(fnData?.error || "Activation failed");

      setActivationResults([{
        full_name: memberToActivate.full_name,
        email: fnData.email,
        password: fnData.password,
      }]);
      setShowActivationResults(true);
      sonnerToast.success(
        isRtl ? "تم تفعيل الحساب بنجاح" : "Account activated successfully",
        { duration: 2000 }
      );
      setMemberToActivate(null);
      setActivateEmail("");
      setActivatePhone("");
      if (deptId) __deptCache.delete(deptId);
      await loadDepartmentData();
    } catch (err: any) {
      const msg = err?.message || String(err);
      sonnerToast.error(
        isRtl ? "فشل تفعيل الحساب" : "Failed to activate account",
        { description: msg, duration: 3000 }
      );
    } finally {
      setActivating(false);
    }
  };

  const filterMembers = (list: DepartmentMember[]) => {
    return list.filter(m => {
      const profile = m.user_id ? profilesMap[m.user_id] : null;
      const name = profile?.full_name || m.full_name;
      const matchesSearch = !searchQuery ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile?.email && profile.email.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  };

  const allLecturers = members.filter(m => m.role !== STUDENT_ROLE);
  const allStudents = members.filter(m => m.role === STUDENT_ROLE);
  const lecturers = useMemo(() => filterMembers(allLecturers), [members, searchQuery, statusFilter, profilesMap]);
  const students = useMemo(() => filterMembers(allStudents), [members, searchQuery, statusFilter, profilesMap]);

  const baseUrl = window.location.origin;
  const instPath = institutionType === "college" ? "college" : "institute";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(isRtl ? "تم النسخ" : "Copied!", { duration: 500 });
  };

  const getExportData = () => {
    return [...lecturers, ...students].map(m => ({
      [isRtl ? "الاسم" : "Name"]: m.full_name,
      [isRtl ? "الدور" : "Role"]: m.role === "department_head" ? (isRtl ? "رئيس قسم" : "Department Head") : m.role === "lecturer" ? (isRtl ? "محاضر" : "Lecturer") : (isRtl ? "طالب" : "Student"),
      [isRtl ? "الحالة" : "Status"]: m.user_id ? (isRtl ? "مسجّل" : "Linked") : (isRtl ? "بانتظار" : "Pending"),
      [isRtl ? "كود الدعوة" : "Invitation Code"]: m.invitation_code || "",
      [isRtl ? "رابط التسجيل" : "Signup Link"]: m.invitation_code
        ? `${baseUrl}/signup/${instPath}/${m.role === "department_head" ? "department_head" : m.role === "lecturer" ? "lecturer" : "student"}?code=${m.invitation_code}`
        : "",
    }));
  };

  const exportCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${(row as Record<string, string>)[h]}"`).join(","))
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deptName}_members.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sonnerToast.success(isRtl ? "تم تصدير CSV" : "CSV exported!", { duration: 1000 });
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

  const renderMemberCard = (member: DepartmentMember, roleParam: string, colorClass: string, icon: React.ReactNode) => {
    const inviteLink = `${baseUrl}/signup/${instPath}/${roleParam}?code=${member.invitation_code}`;
    const profile = member.user_id ? profilesMap[member.user_id] : null;
    const displayName = profile?.full_name || member.full_name;
    const avatar = profile?.live_photo_url || member.photo_url;
    const isLinked = !!member.user_id;
    const isActivated = isLinked && !!profile && profile.must_change_password === false;
    const shareText = isRtl
      ? `مرحباً ${member.full_name}، يمكنك التسجيل في منصة إدراك عبر هذا الرابط:\n${inviteLink}\nكود الدعوة: ${member.invitation_code}`
      : `Hi ${member.full_name}, register on Edrak platform:\n${inviteLink}\nInvitation code: ${member.invitation_code}`;

    return (
      <div key={member.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(`/institution/member/${member.id}`)}
              className="shrink-0"
            >
              <div className={`w-11 h-11 rounded-full ${colorClass} flex items-center justify-center overflow-hidden ring-2 ring-background shadow-sm group-hover:ring-primary/30 transition-all`}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : icon}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/institution/member/${member.id}`)}
                  className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate"
                >
                  {displayName}
                </button>
                {member.role === "department_head" && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
                    <Crown className="w-3 h-3" />
                    {isRtl ? "رئيس قسم" : "Head"}
                  </Badge>
                )}
              </div>
              {isLinked && profile ? (
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {profile.email && <span className="truncate max-w-[180px]">{profile.email}</span>}
                  {profile.phone && <span dir="ltr" className="truncate">{profile.phone}</span>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {isRtl ? "⏳ في انتظار التسجيل" : "⏳ Pending registration"}
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isLinked && (
                isActivated ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {isRtl ? "مفعّل" : "Active"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-100/60">
                    {isRtl ? "غير مفعّل" : "Inactive"}
                  </Badge>
                )
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => setMemberToDelete(member)}
                title={isRtl ? "حذف" : "Delete"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => openEditDialog(member)}
                title={isRtl ? "تعديل" : "Edit"}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isLinked && (
          <div className="border-t bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="default"
                className="text-xs h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setMemberToActivate(member);
                  setActivateEmail("");
                  setActivatePhone("");
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                {isRtl ? "تفعيل" : "Activate"}
              </Button>

              <span className="h-5 w-px bg-border" aria-hidden />

              <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1" onClick={() => copyToClipboard(member.invitation_code!)}>
                <Copy className="w-3.5 h-3.5" />
                {isRtl ? "الكود" : "Code"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1" onClick={() => copyToClipboard(inviteLink)}>
                <LinkIcon className="w-3.5 h-3.5" />
                {isRtl ? "الرابط" : "Link"}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 text-green-600 border-green-300 hover:bg-green-50">
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>
              </a>
              {(() => {
                const subject = isRtl ? "دعوة للتسجيل في منصة إدراك" : "Edrak Platform Invitation";
                const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
                return (
                  <>
                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 text-red-600 border-red-300 hover:bg-red-50">
                        <Mail className="w-3.5 h-3.5" />
                        Gmail
                      </Button>
                    </a>
                    <a href={mailtoUrl}>
                      <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 gap-1 text-blue-600 border-blue-300 hover:bg-blue-50">
                        <Mail className="w-3.5 h-3.5" />
                        {isRtl ? "إيميل" : "Email"}
                      </Button>
                    </a>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
      <header className="sticky top-0 z-30 border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
              <Layers className="w-5 h-5" />
            </span>
            <span className="truncate">{isRtl ? "إدارة القسم" : "Department Management"}</span>
          </h1>
          <Button
            size="icon"
            variant="default"
            className="shadow-md shrink-0 active:scale-95 transition-transform"
            onClick={() => navigate("/institution/dashboard?tab=departments")}
            aria-label={isRtl ? "رجوع" : "Back"}
          >
            {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-black text-foreground truncate">{deptName}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={deptStatus === "active" ? "default" : "secondary"} className="text-xs">
                {deptStatus === "active" ? (isRtl ? "مفعّل" : "Active") : (isRtl ? "بانتظار الموافقة" : "Pending")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {allLecturers.length} {isRtl ? "عضو" : "members"} · {allStudents.length} {isRtl ? "طالب" : "students"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRtl ? "ابحث بالاسم أو البريد..." : "Search by name or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportExcel} className="gap-1.5">
              <Download className="w-4 h-4" />
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </div>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4 bg-green-50/40 dark:bg-green-950/10 border-b">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <UserCheck className="w-4.5 h-4.5 text-green-600" />
              </div>
              <span className="font-extrabold">{isRtl ? "الأعضاء" : "Members"}</span>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-100/60 font-bold text-xs">
                {lecturers.length}/{allLecturers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {lecturers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchQuery
                  ? (isRtl ? "لا توجد نتائج مطابقة" : "No matching results")
                  : (isRtl ? "لا يوجد أعضاء مسجّلون بعد" : "No registered members yet")}
              </p>
            ) : (
              <div className="space-y-3">
                {lecturers.map(member =>
                  member.role === "department_head"
                    ? renderMemberCard(member, "department_head", "bg-amber-500/10", <Crown className="w-5 h-5 text-amber-600" />)
                    : renderMemberCard(member, "lecturer", "bg-green-500/10", <UserCheck className="w-5 h-5 text-green-600" />)
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4 bg-blue-50/40 dark:bg-blue-950/10 border-b">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <span className="font-extrabold">{isRtl ? "الطلاب" : "Students"}</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-100/60 font-bold text-xs">
                {students.length}/{allStudents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchQuery
                  ? (isRtl ? "لا توجد نتائج مطابقة" : "No matching results")
                  : (isRtl ? "لا يوجد طلاب مسجّلون بعد" : "No registered students yet")}
              </p>
            ) : (
              <div className="space-y-3">
                {students.map(member =>
                  renderMemberCard(member, "student", "bg-blue-500/10", <GraduationCap className="w-5 h-5 text-blue-600" />)
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "تأكيد حذف العضو" : "Confirm Delete Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl
                ? `هل أنت متأكد من حذف "${memberToDelete?.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${memberToDelete?.full_name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={deleting}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "تعديل اسم العضو" : "Edit Member Name"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? "أدخل الاسم الجديد للعضو" : "Enter the new name for this member"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={isRtl ? "الاسم الكامل" : "Full name"}
            className="my-2"
            onKeyDown={(e) => e.key === "Enter" && handleEditName()}
          />
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={saving}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditName}
              disabled={saving || !editName.trim()}
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "حفظ" : "Save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRtl ? "إضافة أعضاء جدد" : "Add New Members"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? "أدخل اسم كل عضو في سطر منفصل، ثم اختر الدور. سيتم تفعيل الحسابات تلقائياً." : "Enter each member's name on a separate line, then choose the role. Accounts will be activated automatically."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-2">
            <Textarea
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder={isRtl ? "أحمد محمد\nسارة علي\nخالد حسن" : "Ahmed Mohamed\nSara Ali\nKhaled Hassan"}
              rows={5}
            />
            {newMemberName.trim() && (
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? `${newMemberName.split("\n").filter(n => n.trim()).length} عضو سيتم إضافتهم وتفعيلهم`
                  : `${newMemberName.split("\n").filter(n => n.trim()).length} members to add and activate`}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={newMemberRole === "student" ? "default" : "outline"}
                onClick={() => setNewMemberRole("student")}
                className="flex-1 gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                {isRtl ? "طالب" : "Student"}
              </Button>
              <Button
                size="sm"
                variant={newMemberRole === "lecturer" ? "default" : "outline"}
                onClick={() => setNewMemberRole("lecturer")}
                className="flex-1 gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                {isRtl ? "محاضر" : "Lecturer"}
              </Button>
            </div>
          </div>
          <AlertDialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <AlertDialogCancel disabled={adding}>
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddMembers}
              disabled={adding || !newMemberName.trim()}
            >
              {adding
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (isRtl ? "إضافة وتفعيل" : "Add & Activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!memberToActivate} onOpenChange={(open) => !open && setMemberToActivate(null)}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              {isRtl ? "تفعيل حساب العضو" : "Activate Member Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? `تفعيل حساب "${memberToActivate?.full_name}". يمكنك إدخال البريد الإلكتروني ورقم الهاتف (اختياري).`
                : `Activate account for "${memberToActivate?.full_name}". Email and phone are optional.`}
            </p>
            <div>
              <Label>{isRtl ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
              <Input
                type="email"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                placeholder={isRtl ? "سيتم توليد بريد تلقائي إذا لم يُدخل" : "Auto-generated if left empty"}
                dir="ltr"
              />
            </div>
            <div>
              <Label>{isRtl ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
              <Input
                type="tel"
                value={activatePhone}
                onChange={(e) => setActivatePhone(e.target.value)}
                placeholder={isRtl ? "+201000000000" : "+201000000000"}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={() => setMemberToActivate(null)} disabled={activating}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleActivateExistingMember}
              disabled={activating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {activating
                ? <Loader2 className="w-4 h-4 animate-spin me-1" />
                : <Zap className="w-4 h-4 me-1" />}
              {isRtl ? "تفعيل" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivationResults} onOpenChange={setShowActivationResults}>
        <DialogContent dir={dir} className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              {isRtl ? "تم تفعيل الحسابات" : "Accounts Activated"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? "تم إنشاء حسابات للمستخدمين التالية. يُرجى مشاركة بيانات الدخول مع كل عضو."
                : "Accounts created for the following users. Please share login credentials with each member."}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activationResults.map((r, i) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <p className="font-bold text-sm">{r.full_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{isRtl ? "البريد:" : "Email:"}</span>
                    <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border flex-1 truncate" dir="ltr">{r.email}</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(r.email)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{isRtl ? "كلمة المرور:" : "Password:"}</span>
                    <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded border flex-1 truncate" dir="ltr">{r.password}</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(r.password)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 font-semibold">
              {isRtl
                ? "يجب على كل عضو تغيير كلمة المرور عند أول دخول."
                : "Each member must change their password on first login."}
            </p>
          </div>
          <DialogFooter className={`gap-2 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <Button
              variant="outline"
              onClick={() => {
                const allText = activationResults.map(r =>
                  `${r.full_name}\n${isRtl ? "البريد" : "Email"}: ${r.email}\n${isRtl ? "كلمة المرور" : "Password"}: ${r.password}`
                ).join("\n\n");
                copyToClipboard(allText);
              }}
            >
              <Copy className="w-4 h-4 me-1" />
              {isRtl ? "نسخ الكل" : "Copy All"}
            </Button>
            <Button onClick={() => setShowActivationResults(false)}>
              {isRtl ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentPage;
