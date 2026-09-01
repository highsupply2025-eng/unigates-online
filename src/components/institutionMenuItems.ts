import {
  Layers,
  GraduationCap,
  BookOpen,
  UserPlus,
  CreditCard,
  Calendar,
  CheckCircle,
  User,
  MessageSquare,
} from "lucide-react";
import type { DashboardMenuItem } from "@/components/DashboardMenuDropdown";
import { translateTerm } from "@/i18n/multilingualGlossary";
import type { Language } from "@/contexts/LanguageContext";

/**
 * Standardised institution sidebar menu items.
 *
 * Every `/institution/*` page should use this factory so the menu stays
 * consistent across the whole dashboard. Pass `activeKey` to highlight
 * the current page/tab, and provide navigation callbacks that match the
 * calling page's routing strategy (local tab switch vs. cross-page navigate).
 */
export function getInstitutionMenuItems({
  isRtl,
  activeKey,
  onTabChange,
  onNavigate,
  language,
}: {
  isRtl: boolean;
  /** The key of the currently active item (e.g. "general", "profile"). */
  activeKey: string;
  /** Called when a tab-based item is clicked (dashboard tabs). */
  onTabChange: (tab: string) => void;
  /** Called when a route-based item is clicked (subscriptions, profile). */
  onNavigate: (path: string) => void;
  language?: Language;
}): DashboardMenuItem[] {
  const lang: Language = language || (isRtl ? "ar" : "en");
  const tr = (ar: string, en: string) => translateTerm(ar, lang, en);

  return [
    {
      key: "general",
      label: tr("الرئيسية", "Home"),
      Icon: Layers,
      path: "/institution/dashboard",
      onClick: () => onTabChange("general"),
      active: activeKey === "general",
    },
    {
      key: "departments",
      label: tr("الأقسام", "Departments"),
      Icon: BookOpen,
      onClick: () => onTabChange("departments"),
      active: activeKey === "departments",
    },
    {
      key: "faculty",
      label: tr("أعضاء هيئة التدريس", "Faculty Members"),
      Icon: GraduationCap,
      onClick: () => onTabChange("faculty"),
      active: activeKey === "faculty",
    },
    {
      key: "students",
      label: tr("تسجيل الطلاب", "Student Registration"),
      Icon: UserPlus,
      onClick: () => onTabChange("students"),
      active: activeKey === "students",
    },
    {
      key: "subscriptions",
      label: tr("اشتراك الطلاب", "Student Subscriptions"),
      Icon: CreditCard,
      path: "/institution/student-subscriptions",
      onClick: () => onNavigate("/institution/student-subscriptions"),
      active: activeKey === "subscriptions",
    },
    {
      key: "schedules",
      label: tr("الجداول", "Schedules"),
      Icon: Calendar,
      onClick: () => onTabChange("schedules"),
      active: activeKey === "schedules",
    },
    {
      key: "quizresults",
      label: tr("النتائج", "Results"),
      Icon: CheckCircle,
      onClick: () => onTabChange("quizresults"),
      active: activeKey === "quizresults",
    },
    {
      key: "messages",
      label: tr("التواصل", "Messages"),
      Icon: MessageSquare,
      path: "/institution/messages",
      onClick: () => onNavigate("/institution/messages"),
      active: activeKey === "messages",
    },
    {
      key: "profile",
      label: tr("بيانات الحساب", "Account Information"),
      Icon: User,
      color: "from-cyan-500 to-cyan-600",
      path: "/institution/profile",
      onClick: () => onNavigate("/institution/profile"),
      active: activeKey === "profile",
    },
  ];
}

