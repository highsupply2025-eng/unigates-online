import {
  Layers,
  GraduationCap,
  BookOpen,
  UserPlus,
  Ticket,
  Calendar,
  CheckCircle,
  User,
} from "lucide-react";
import type { DashboardMenuItem } from "@/components/DashboardMenuDropdown";

/**
 * Standardised institution sidebar menu items.
 *
 * Every `/institution/*` page should use this factory so the menu stays
 * consistent across the whole dashboard.  Pass `activeKey` to highlight
 * the current page/tab, and provide navigation callbacks that match the
 * calling page's routing strategy (local tab switch vs. cross-page navigate).
 */
export function getInstitutionMenuItems({
  isRtl,
  activeKey,
  onTabChange,
  onNavigate,
}: {
  isRtl: boolean;
  /** The key of the currently active item (e.g. "general", "profile"). */
  activeKey: string;
  /** Called when a tab-based item is clicked (dashboard tabs). */
  onTabChange: (tab: string) => void;
  /** Called when a route-based item is clicked (subscriptions, profile). */
  onNavigate: (path: string) => void;
}): DashboardMenuItem[] {
  return [
    {
      key: "general",
      label: isRtl ? "الرئيسية" : "Home",
      Icon: Layers,
      onClick: () => onTabChange("general"),
      active: activeKey === "general",
    },
    {
      key: "faculty",
      label: isRtl ? "أعضاء هيئة التدريس" : "Faculty Members",
      Icon: GraduationCap,
      onClick: () => onTabChange("faculty"),
      active: activeKey === "faculty",
    },
    {
      key: "students",
      label: isRtl ? "تسجيل الطلاب" : "Student Registration",
      Icon: UserPlus,
      onClick: () => onTabChange("students"),
      active: activeKey === "students",
    },
    {
      key: "departments",
      label: isRtl ? "الأقسام" : "Departments",
      Icon: BookOpen,
      onClick: () => onTabChange("departments"),
      active: activeKey === "departments",
    },
    {
      key: "subscriptions",
      label: isRtl ? "اشتراك الطلاب" : "Student Subscriptions",
      Icon: Ticket,
      onClick: () => onNavigate("/institution/student-subscriptions"),
      active: activeKey === "subscriptions",
    },
    {
      key: "schedules",
      label: isRtl ? "الجداول" : "Schedules",
      Icon: Calendar,
      onClick: () => onTabChange("schedules"),
      active: activeKey === "schedules",
    },
    {
      key: "quizresults",
      label: isRtl ? "النتائج" : "Results",
      Icon: CheckCircle,
      onClick: () => onTabChange("quizresults"),
      active: activeKey === "quizresults",
    },
    {
      key: "profile",
      label: isRtl ? "بيانات الحساب" : "Account Details",
      Icon: User,
      color: "from-cyan-500 to-cyan-600",
      onClick: () => onNavigate("/institution/profile"),
      active: activeKey === "profile",
    },
  ];
}
