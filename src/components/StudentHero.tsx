import { type LucideIcon } from "lucide-react";

interface Props {
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  Icon: LucideIcon;
  gradient?: string;
  shadow?: string;
}

// Hero banner intentionally removed per design request.
// Kept as a no-op so existing imports continue to work without layout shifts.
const StudentHero = (_props: Props) => null;

export default StudentHero;
