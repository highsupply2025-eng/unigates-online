import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, UserCheck, Crown, Landmark, School, BookOpen, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Quick-preview links for the admin to open role dashboards directly.
 * Note: This is read-only preview — data shown depends on the admin's
 * own membership; many lists may appear empty since the admin is not
 * enrolled as a student/lecturer.
 */
const AdminPreviewLinks = ({ compact = false }: { compact?: boolean }) => {
  const { language } = useLanguage();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const items = [
    { to: "/student/dashboard", label: ar("لوحة الطالب", "Student Dashboard"), icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
    { to: "/lecturer/dashboard", label: ar("لوحة المحاضر", "Lecturer Dashboard"), icon: UserCheck, color: "text-green-600 bg-green-50" },
    { to: "/leadership/dashboard", label: ar("لوحة القيادة", "Leadership Dashboard"), icon: Crown, color: "text-amber-600 bg-amber-50" },
    { to: "/institution/dashboard", label: ar("لوحة الكلية/المعهد", "Institution Dashboard"), icon: Landmark, color: "text-indigo-600 bg-indigo-50" },
    { to: "/school/dashboard", label: ar("لوحة المدرسة", "School Dashboard"), icon: School, color: "text-purple-600 bg-purple-50" },
    { to: "/school/teacher/dashboard", label: ar("لوحة المعلم", "Teacher Dashboard"), icon: BookOpen, color: "text-pink-600 bg-pink-50" },
    { to: "/school/student/dashboard", label: ar("لوحة طالب المدرسة", "School Student", ), icon: GraduationCap, color: "text-cyan-600 bg-cyan-50" },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to} className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent transition-colors text-sm">
              <Icon className="w-4 h-4 text-primary" />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">{ar("معاينة سريعة للوحات", "Quick Dashboard Preview")}</h3>
          <Badge variant="secondary" className="text-xs">{ar("للأدمن فقط", "Admin only")}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {ar(
            "افتح أي لوحة مباشرة بحساب الأدمن للتحقق من التعديلات. قد تظهر بعض القوائم فارغة لأن الأدمن غير مسجَّل كعضو.",
            "Open any role dashboard directly with the admin account to verify changes. Some lists may be empty since the admin is not enrolled."
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${it.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{it.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.to}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPreviewLinks;
