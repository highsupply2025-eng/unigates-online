import React, { useState } from "react";
import { Link } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  Search,
  Building2,
  GraduationCap,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  FileText,
  Users,
  Award,
  ShieldCheck,
  Send,
  Bookmark,
  Share2,
  ChevronRight,
  SlidersHorizontal,
  BadgeCheck,
  Laptop,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import PlatformUnderDevelopmentOverlay from "@/components/PlatformUnderDevelopmentOverlay";

export interface JobPosting {
  id: string;
  titleAr: string;
  titleEn: string;
  companyAr: string;
  companyEn: string;
  locationAr: string;
  locationEn: string;
  type: "full-time" | "part-time" | "internship" | "remote";
  category: "tech" | "academic" | "design" | "marketing" | "management" | "translation";
  salaryAr: string;
  salaryEn: string;
  date: string;
  experienceAr: string;
  experienceEn: string;
  featured: boolean;
  urgent: boolean;
  descriptionAr: string;
  descriptionEn: string;
  requirementsAr: string[];
  requirementsEn: string[];
  tags: string[];
}

const INITIAL_JOBS: JobPosting[] = [
  {
    id: "job-1",
    titleAr: "مطور برمجيات ذكاء اصطناعي (Full-Stack AI Developer)",
    titleEn: "Full-Stack AI Developer",
    companyAr: "شركة ديلفاي للحلول السحابية (Delvai.cloud)",
    companyEn: "Delvai Cloud Solutions",
    locationAr: "الرياض — المملكة العربية السعودية (هجين / عن بُعد)",
    locationEn: "Riyadh, KSA (Hybrid / Remote)",
    type: "full-time",
    category: "tech",
    salaryAr: "14,000 - 22,000 ر.س",
    salaryEn: "14,000 - 22,000 SAR",
    date: "2026-04-10",
    experienceAr: "3 - 5 سنوات",
    experienceEn: "3 - 5 Years",
    featured: true,
    urgent: true,
    descriptionAr: "نبحث عن مطور برمجيات متمرس لبناء وتطوير واجهات وأنظمة الذكاء الاصطناعي التوليدي لمنظومة UNIGATES السحابية.",
    descriptionEn: "We are seeking an experienced full-stack developer to architect AI and cloud solutions for UNIGATES.",
    requirementsAr: [
      "إتقان React, TypeScript, Python, و PostgreSQL",
      "خبرة في تكامل واجهات الذكاء الاصطناعي LLM & OpenAI / Gemini",
      "خبرة بالبنية السحابية وإدارة الـ API"
    ],
    requirementsEn: [
      "Proficiency in React, TypeScript, Python, and PostgreSQL",
      "Experience with LLM & AI integrations (Gemini / OpenAI)",
      "Cloud architecture and REST/GraphQL APIs"
    ],
    tags: ["React", "TypeScript", "Python", "AI", "Cloud"]
  },
  {
    id: "job-2",
    titleAr: "أستاذ مشارك / محاضر جامعي في علوم الحاسب",
    titleEn: "Associate Professor / Lecturer in Computer Science",
    companyAr: "كلية المستقبل الجامعية الأهلية",
    companyEn: "Al-Mustaqbal University College",
    locationAr: "جدة — المملكة العربية السعودية",
    locationEn: "Jeddah, KSA",
    type: "full-time",
    category: "academic",
    salaryAr: "16,000 - 26,000 ر.س",
    salaryEn: "16,000 - 26,000 SAR",
    date: "2026-04-08",
    experienceAr: "دكتوراه / ماجستير مع خبرة تدريس",
    experienceEn: "PhD / Master's with academic teaching experience",
    featured: true,
    urgent: false,
    descriptionAr: "تدريس المقررات الأكاديمية لمرحلة البكالوريوس، الإشراف على مشاريع التخرج، واستخدام منصة UNIGATES للاختبارات والمحاضرات.",
    descriptionEn: "Teaching undergraduate CS courses, supervising graduation projects, and utilizing UNIGATES for assessments.",
    requirementsAr: [
      "شهادة دكتوراه أو ماجستير في علوم الحاسب أو هندسة البرمجيات",
      "نشر أبحاث علمية محكمة في مجلات معتمدة",
      "إجادة استخدام أنظمة التعليم الإلكتروني الحديثة"
    ],
    requirementsEn: [
      "PhD or MSc in Computer Science or Software Engineering",
      "Published peer-reviewed research papers",
      "Proficiency in modern digital LMS workflows"
    ],
    tags: ["تدريس جامعي", "علوم حاسب", "أكاديمي", "Computer Science"]
  },
  {
    id: "job-3",
    titleAr: "محرر ومراجع مخطوطات وكتب أكاديمية",
    titleEn: "Academic Book Editor & Proofreader",
    companyAr: "دار عبيد للنشر والتوزيع والطباعة",
    companyEn: "Dar Obeid Publishing & Printing LLC",
    locationAr: "الرياض — المقر الرئيسي (أو عن بُعد)",
    locationEn: "Riyadh, KSA (HQ or Remote)",
    type: "full-time",
    category: "translation",
    salaryAr: "9,000 - 15,000 ر.س",
    salaryEn: "9,000 - 15,000 SAR",
    date: "2026-04-07",
    experienceAr: "سنتان فأكثر في التحرير والنشر",
    experienceEn: "2+ Years in Editing & Publishing",
    featured: true,
    urgent: false,
    descriptionAr: "مراجعة وتحقيق المخطوطات والكتب الأكاديمية المقدمة عبر منصة ناشر ومتجر الكتب، وتدقيق الصياغة اللغوية والتنسيق الطباعي.",
    descriptionEn: "Reviewing, proofreading, and structuring academic manuscripts and literary publications submitted via Nasher.",
    requirementsAr: [
      "مؤهل عالي في اللغة العربية أو اللغويات التطبيقية أو الترجمة",
      "إتقان قواعد الصرف والنحو والتدقيق اللغوي الاحترافي",
      "خبرة في الترقيم الدولي ISBN ومعايير النشر المعتمدة"
    ],
    requirementsEn: [
      "Degree in Arabic, Applied Linguistics, or Translation",
      "Mastery of editorial proofreading and grammar",
      "Familiarity with ISBN and global publishing standards"
    ],
    tags: ["دار عبيد", "تحرير كتب", "نشر", "لغة عربية"]
  },
  {
    id: "job-4",
    titleAr: "مصمم تجربة مستخدم وواجهات (UI/UX Designer)",
    titleEn: "Senior UI/UX Product Designer",
    companyAr: "منظومة UNIGATES للحلول التعليمية",
    companyEn: "UNIGATES Educational Tech",
    locationAr: "عن بُعد بالكامل (Remote)",
    locationEn: "100% Remote",
    type: "remote",
    category: "design",
    salaryAr: "11,000 - 18,000 ر.س",
    salaryEn: "11,000 - 18,000 SAR",
    date: "2026-04-05",
    experienceAr: "3+ سنوات",
    experienceEn: "3+ Years",
    featured: false,
    urgent: true,
    descriptionAr: "تصميم واجهات سهلة الاستخدام وبديهية لمنصات الطلاب والمعلمين والكليات بأسلوب Design System موحد ومتجاوب.",
    descriptionEn: "Crafting modern intuitive UI/UX for students, teachers, and university faculties with a unified Design System.",
    requirementsAr: [
      "إتقان Figma وتصميم الـ Design Systems المتكاملة",
      "فهم عميق للتجاوب اللغوي RTL / LTR وسهولة الوصول (A11y)",
      "معرض أعمال (Portfolio) قوي يعكس مشاريع حقيقية"
    ],
    requirementsEn: [
      "Expertise in Figma and scalable design systems",
      "Deep understanding of RTL/LTR and accessibility",
      "Strong portfolio showcasing real web/mobile apps"
    ],
    tags: ["Figma", "UI/UX", "Design System", "Remote"]
  },
  {
    id: "job-5",
    titleAr: "معلم لغة إنجليزية / مدرب دورات TOEFL & IELTS",
    titleEn: "English Instructor & IELTS / TOEFL Coach",
    companyAr: "أكاديمية المعرفة الدولية للغات",
    companyEn: "Knowledge International Language Academy",
    locationAr: "الدمام — المملكة العربية السعودية (أو مسائي)",
    locationEn: "Dammam, KSA",
    type: "part-time",
    category: "academic",
    salaryAr: "7,000 - 12,000 ر.س",
    salaryEn: "7,000 - 12,000 SAR",
    date: "2026-04-04",
    experienceAr: "سنتان في التدريب المعتمد",
    experienceEn: "2+ Years",
    featured: false,
    urgent: false,
    descriptionAr: "تقديم دورات وبث مباشر للطلاب وتدريبهم على اجتياز اختبارات الآيلتس والتوفل مع تقديم واجبات ومتابعة أسبوعية.",
    descriptionEn: "Delivering live streams, courses, and mock test workshops for IELTS and TOEFL students.",
    requirementsAr: [
      "شهادة CELTA أو DELTA أو درجة جامعية في اللغة الإنجليزية",
      "خبرة سابقة في البث المباشر والتعليم الإلكتروني",
      "مهارات تواصل وتحفيز ممتازة"
    ],
    requirementsEn: [
      "CELTA / DELTA or BA in English Literature",
      "Experience in interactive online live tutoring",
      "Excellent presentation and engagement skills"
    ],
    tags: ["English", "IELTS", "TOEFL", "Part-Time"]
  },
  {
    id: "job-6",
    titleAr: "تدريب تعاوني: مساعد أبحاث وتحليل بيانات (Data Science Intern)",
    titleEn: "Data Science & Research Intern (Co-op)",
    companyAr: "مركز أبحاث دار عبيد للذكاء الاصطناعي",
    companyEn: "Dar Obeid AI Research Lab",
    locationAr: "الرياض — متاح لطلاب السنة الأخيرة وحديثي التخرج",
    locationEn: "Riyadh, KSA (Graduates / Seniors)",
    type: "internship",
    category: "tech",
    salaryAr: "4,000 - 6,000 ر.س (مكافأة تدريب)",
    salaryEn: "4,000 - 6,000 SAR (Stipend)",
    date: "2026-04-02",
    experienceAr: "حديث تخرج / طالب متوقع تخرجه",
    experienceEn: "Fresh Graduate / Final Year Student",
    featured: true,
    urgent: false,
    descriptionAr: "فرصة تدريب عملي مدفوعة لاكتساب مهارات تحليل البيانات الأكاديمية والتعامل مع نماذج الذكاء الاصطناعي مع إمكانية التوظيف المباشر.",
    descriptionEn: "Paid internship opportunity to gain hands-on experience in academic analytics and AI models with hiring potential.",
    requirementsAr: [
      "خلفية في علوم الحاسب، نظم المعلومات، أو الإحصاء",
      "معرفة أساسية بـ Python و SQL ومكتبات Pandas",
      "شغف بالتعلم والبحث العلمي والتقني"
    ],
    requirementsEn: [
      "Background in Computer Science, IS, or Statistics",
      "Basic knowledge of Python, SQL, and Pandas",
      "Eagerness to learn and contribute to applied AI"
    ],
    tags: ["تدريب تعاوني", "Internship", "Python", "Data"]
  }
];

export default function CareerPlatform() {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem("unigates_career_jobs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_JOBS;
      }
    }
    return INITIAL_JOBS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantExperience, setApplicantExperience] = useState("");
  const [applicantCvUrl, setApplicantCvUrl] = useState("");
  const [applicantCoverNote, setApplicantCoverNote] = useState("");

  // Post Job Modal state (Employers / Institutions)
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] = useState<JobPosting["category"]>("tech");
  const [newType, setNewType] = useState<JobPosting["type"]>("full-time");
  const [newSalary, setNewSalary] = useState("");
  const [newExp, setNewExp] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReqs, setNewReqs] = useState("");
  const [newTags, setNewTags] = useState("");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail || !applicantPhone) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Details",
        description: isRtl ? "يرجى تعبئة الاسم والبريد ورقم الهاتف للتقديم." : "Please fill in your name, email and phone number.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isRtl ? "🎉 تم إرسال طلب التوظيف بنجاح!" : "Application Submitted Successfully!",
      description: isRtl
        ? `تم تسليم ملفك وترشيحك لوظيفة (${selectedJob?.titleAr}) وسيتم التواصل معك مباشرة.`
        : `Your application for (${selectedJob?.titleEn}) has been forwarded to the employer.`
    });

    setApplyModalOpen(false);
    setApplicantName("");
    setApplicantEmail("");
    setApplicantPhone("");
    setApplicantExperience("");
    setApplicantCvUrl("");
    setApplicantCoverNote("");
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى إدخال المسمى الوظيفي واسم المؤسسة." : "Please provide job title and company name.",
        variant: "destructive"
      });
      return;
    }

    const createdJob: JobPosting = {
      id: "job-" + Date.now(),
      titleAr: newTitle,
      titleEn: newTitle,
      companyAr: newCompany,
      companyEn: newCompany,
      locationAr: newLocation || (isRtl ? "الرياض — المملكة العربية السعودية" : "Riyadh, KSA"),
      locationEn: newLocation || "Riyadh, KSA",
      type: newType,
      category: newCategory,
      salaryAr: newSalary || (isRtl ? "يحدد بعد المقابلة" : "Competitive"),
      salaryEn: newSalary || "Competitive",
      date: new Date().toISOString().split("T")[0],
      experienceAr: newExp || (isRtl ? "حسب المتطلبات" : "Relevant experience"),
      experienceEn: newExp || "Relevant experience",
      featured: true,
      urgent: false,
      descriptionAr: newDesc || (isRtl ? "فرصة وظيفية مميزة لدى المؤسسة." : "Great career opportunity."),
      descriptionEn: newDesc || "Great career opportunity.",
      requirementsAr: newReqs ? newReqs.split("\n").filter(Boolean) : [isRtl ? "مؤهل مناسب والتزام بالمهام" : "Relevant degree and commitment"],
      requirementsEn: newReqs ? newReqs.split("\n").filter(Boolean) : ["Relevant degree and commitment"],
      tags: newTags ? newTags.split(",").map(t => t.trim()).filter(Boolean) : ["فرصة وظيفية", "توظيف"]
    };

    const updated = [createdJob, ...jobs];
    setJobs(updated);
    localStorage.setItem("unigates_career_jobs", JSON.stringify(updated));
    setPostJobModalOpen(false);

    toast({
      title: isRtl ? "🎉 تم نشر الوظيفة بنجاح!" : "Job Posted Successfully!",
      description: isRtl ? "أصبحت الوظيفة متاحة الآن لكافة الكفاءات والباحثين في منصة Career." : "Job is now live on UNIGATES Career platform."
    });

    // Reset Form
    setNewTitle("");
    setNewCompany("");
    setNewLocation("");
    setNewSalary("");
    setNewExp("");
    setNewDesc("");
    setNewReqs("");
    setNewTags("");
  };

  const filteredJobs = jobs.filter((j) => {
    const matchCat = selectedCategory === "all" || j.category === selectedCategory;
    const matchType = selectedType === "all" || j.type === selectedType;
    const matchSearch =
      j.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companyAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companyEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchCat && matchType && matchSearch;
  });

  return (
    <PlatformUnderDevelopmentOverlay platform="career">
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-cyan-500 selection:text-white" dir={dir}>
        <SEO
          title={isRtl ? "منصة Career للتوظيف والفرص الأكاديمية والمهنية | UNIGATES" : "UNIGATES Career — Jobs, Academic & Professional Opportunities"}
          description={isRtl
            ? "بوابة التوظيف والفرص المهنية الشاملة لمنظومة UNIGATES — وظائف أكاديمية، تقنية، تدريب تعاوني، وتوظيف مباشر للكفاءات والجامعات والمدارس ودار عبيد."
            : "Explore academic, tech, and professional careers, internships, and hiring solutions across the UNIGATES network."}
        />

        <SimpleHeader subtitle={isRtl ? "بوابة التوظيف والفرص المهنية" : "Career & Talent Portal"} />

      <main className="flex-1 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-cyan-500/10 py-16 px-4 sm:px-6 md:px-12 border-b border-primary/15">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-xs sm:text-sm font-bold shadow-xs">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>{isRtl ? "منصة التوظيف وسوق الكفاءات الأكاديمية والمهنية" : "Career, Recruitment & Talent Matchmaking Platform"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight leading-tight">
              {isRtl ? (
                <>
                  منصة <span className="bg-gradient-to-r from-primary via-cyan-600 to-teal-500 bg-clip-text text-transparent">Career</span> : انطلق نحو مستقبلك المهني والأكاديمي
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-primary via-cyan-600 to-teal-500 bg-clip-text text-transparent">Career</span> Platform : Gateway to Academic & Global Tech Opportunities
                </>
              )}
            </h1>

            <p className="text-sm sm:text-lg text-foreground/75 max-w-3xl mx-auto leading-relaxed">
              {isRtl
                ? "جسر التوظيف المباشر بين خريجي الجامعات والكوادر الأكاديمية والمهنية وبين شركات التوظيف داخل مصر وخارجها."
                : "Direct career matchmaking connecting university graduates, academic faculty, and professionals with recruitment agencies inside Egypt and internationally."}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setPostJobModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-6 rounded-xl shadow-lg shadow-primary/20 text-sm gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>{isRtl ? "أصحاب العمل: نشر فرصة وظيفية جديدة" : "Post a New Job Opportunity"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const el = document.getElementById("jobs-feed");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="border-primary/20 hover:bg-primary/10 font-bold h-12 px-6 rounded-xl text-sm gap-2"
              >
                <Search className="w-4 h-4 text-primary" />
                <span>{isRtl ? "تصفح أحدث الوظائف والتدريب" : "Explore Active Jobs"}</span>
              </Button>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-card border border-primary/15 shadow-sm">
                <div className="text-2xl font-black text-primary">{jobs.length}+</div>
                <div className="text-xs text-foreground/65 font-bold mt-0.5">{isRtl ? "فرصة وظيفية وتدريب" : "Active Openings"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-primary/15 shadow-sm">
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">100%</div>
                <div className="text-xs text-foreground/65 font-bold mt-0.5">{isRtl ? "شركات ومؤسسات معتمدة" : "Verified Employers"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-primary/15 shadow-sm">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">فوري</div>
                <div className="text-xs text-foreground/65 font-bold mt-0.5">{isRtl ? "تقديم رقمي مباشر" : "Instant Digital Apply"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-primary/15 shadow-sm">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">دار عبيد</div>
                <div className="text-xs text-foreground/65 font-bold mt-0.5">{isRtl ? "توثيق ورعاية رسمية" : "Official Support"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section id="jobs-feed" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isRtl ? "ابحث بالمسمى الوظيفي، اسم الكلية أو الشركة، أو الكلمات المفتاحية (مثل: AI, تدريس, تصميم)..." : "Search by job title, company, or keywords..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-11 h-12 bg-background border-primary/20 text-sm font-semibold rounded-2xl"
                />
              </div>

              {/* Type Filter */}
              <div className="w-full md:w-52">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-12 bg-background border-primary/20 text-xs font-bold rounded-2xl">
                    <SelectValue placeholder={isRtl ? "نوع العمل" : "Job Type"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 text-xs">
                    <SelectItem value="all">{isRtl ? "جميع أنواع العقود" : "All Job Types"}</SelectItem>
                    <SelectItem value="full-time">{isRtl ? "دوام كامل (Full-Time)" : "Full-Time"}</SelectItem>
                    <SelectItem value="part-time">{isRtl ? "دوام جزئي (Part-Time)" : "Part-Time"}</SelectItem>
                    <SelectItem value="remote">{isRtl ? "عمل عن بُعد (Remote)" : "Remote"}</SelectItem>
                    <SelectItem value="internship">{isRtl ? "تدريب تعاوني (Internship)" : "Internship"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
              {[
                { id: "all", labelAr: "🌟 كافة التخصصات", labelEn: "All Fields" },
                { id: "tech", labelAr: "💻 تكنولوجيا وذكاء اصطناعي", labelEn: "Tech & AI" },
                { id: "academic", labelAr: "🎓 تدريس وأكاديمي", labelEn: "Academic & Teaching" },
                { id: "design", labelAr: "🎨 تصميم وUI/UX", labelEn: "Design & UX" },
                { id: "translation", labelAr: "📖 نشر وتحرير وترجمة", labelEn: "Publishing & Editing" },
                { id: "management", labelAr: "📊 إدارة وأعمال", labelEn: "Business & Management" },
              ].map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs font-bold h-9 rounded-xl transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-primary/20 bg-card text-foreground/75 hover:bg-primary/10"
                  }`}
                >
                  {isRtl ? cat.labelAr : cat.labelEn}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Feed Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>{isRtl ? "أحدث الفرص الوظيفية المتاحة" : "Available Job Opportunities"}</span>
                <Badge variant="secondary" className="text-xs font-mono font-bold ms-2">
                  {filteredJobs.length}
                </Badge>
              </h2>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="text-center py-16 p-6 rounded-3xl border-2 border-dashed border-primary/20 text-muted-foreground space-y-3 bg-card/60">
                <Briefcase className="w-12 h-12 mx-auto text-primary/40" />
                <h3 className="text-base font-bold text-foreground">{isRtl ? "لم يتم العثور على وظائف مطابقة" : "No matching jobs found"}</h3>
                <p className="text-xs max-w-sm mx-auto">{isRtl ? "جرب البحث بكلمات أخرى أو تغيير تصنيف الوظيفة ونوع العمل." : "Try adjusting your filters or search keywords."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="border-2 border-primary/15 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between group"
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold">
                            {job.type === "full-time" ? (isRtl ? "دوام كامل" : "Full-Time") :
                             job.type === "part-time" ? (isRtl ? "دوام جزئي" : "Part-Time") :
                             job.type === "remote" ? (isRtl ? "عن بُعد" : "Remote") : (isRtl ? "تدريب تعاوني" : "Internship")}
                          </Badge>
                          {job.urgent && (
                            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-current" />
                              {isRtl ? "توظيف عاجل" : "Urgent Hiring"}
                            </Badge>
                          )}
                          {job.featured && (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
                              {isRtl ? "مميزة" : "Featured"}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-foreground/50 font-medium">
                          {job.date}
                        </span>
                      </div>

                      {/* Title & Company */}
                      <div>
                        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                          {isRtl ? job.titleAr : job.titleEn}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mt-1.5">
                          <Building2 className="w-4 h-4 shrink-0" />
                          <span>{isRtl ? job.companyAr : job.companyEn}</span>
                        </div>
                      </div>

                      {/* Location & Salary */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-foreground/75 pt-1 border-t border-primary/10">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{isRtl ? job.locationAr : job.locationEn}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate font-bold text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isRtl ? job.salaryAr : job.salaryEn}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                        {isRtl ? job.descriptionAr : job.descriptionEn}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground/70">
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-primary/10 flex items-center justify-between gap-3">
                        <Button
                          onClick={() => {
                            setSelectedJob(job);
                            setApplyModalOpen(true);
                          }}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 rounded-xl text-xs shadow-md shadow-primary/20 gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isRtl ? "تقديم الآن على الوظيفة" : "Apply Now"}</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedJob(job);
                          }}
                          className="border-primary/20 hover:bg-primary/10 text-xs font-bold h-10 px-3 rounded-xl"
                        >
                          {isRtl ? "التفاصيل" : "Details"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Employer & Talent Ecosystem Cards */}
        <section className="py-12 bg-gradient-to-b from-primary/5 via-muted/20 to-background border-y border-primary/15">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <Badge variant="outline" className="border-primary/30 text-primary font-bold text-xs">
                {isRtl ? "منظومة توظيف ذكية ومتكاملة" : "Complete Hiring Ecosystem"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-foreground">
                {isRtl ? "حلول متقدمة للباحثين عن عمل وللمؤسسات" : "Empowering Talents & Institutions"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-primary/20 bg-card rounded-3xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground">{isRtl ? "لخريجي الجامعات والطلاب" : "For Students & Graduates"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "فرص تدريب تعاوني حصرية (Co-op)، وظائف للمبتدئين، وشهادات معتمدة تعزز سيرتك الذاتية وتربطك مباشرة بسوق العمل."
                    : "Exclusive internships, entry-level opportunities, and accredited certificates directly mapped to industry needs."}
                </p>
              </Card>

              <Card className="border-2 border-primary/20 bg-card rounded-3xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground">{isRtl ? "للكليات والمدارس والشركات" : "For Colleges & Employers"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "استقطاب مباشر لأعضاء هيئة التدريس، المعلمين، الكفاءات التقنية، والمطورين مع نظام فلترة ذكي وسريع للطلبات."
                    : "Direct recruitment of professors, K-12 teachers, and tech developers with automated applicant tracking."}
                </p>
              </Card>

              <Card className="border-2 border-primary/20 bg-card rounded-3xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-foreground">{isRtl ? "ضمان وموثوقية دار عبيد" : "Verified by Dar Obeid"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "جميع الوظائف والجهات المعلنة تخضع للتحقق والتوثيق الرسمي لضمان أمان التعاقد والجدية التامة في التوظيف."
                    : "All posted jobs and corporate entities are strictly vetted to ensure legitimacy and employment security."}
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================= */}
      {/* JOB APPLICATION MODAL                                   */}
      {/* ======================================================= */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="bg-card border-primary/20 text-foreground max-w-lg">
          <DialogHeader className="border-b border-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isRtl ? `التقديم على: ${selectedJob?.titleAr || "الوظيفة"}` : `Apply for: ${selectedJob?.titleEn || "Job"}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isRtl ? `لدى: ${selectedJob?.companyAr}` : `At: ${selectedJob?.companyEn}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleApply} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "الاسم الكامل *" : "Full Name *"}</Label>
              <Input
                placeholder={isRtl ? "مثال: عبد الرحمن خالد" : "e.g. John Doe"}
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "البريد الإلكتروني *" : "Email Address *"}</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  required
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp *"}</Label>
                <Input
                  placeholder="05xxxxxxxx"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  required
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "رابط السيرة الذاتية (Google Drive / LinkedIn / Portfolio)" : "CV / Portfolio URL"}</Label>
              <Input
                placeholder="https://drive.google.com/... or LinkedIn"
                value={applicantCvUrl}
                onChange={(e) => setApplicantCvUrl(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "سنوات الخبرة والمؤهل العلمي" : "Experience & Degree"}</Label>
              <Input
                placeholder={isRtl ? "مثال: بكالوريوس علوم حاسب + 3 سنوات خبرة" : "BSc + 3 years experience"}
                value={applicantExperience}
                onChange={(e) => setApplicantExperience(e.target.value)}
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "رسالة تعريفية موجزة (Cover Note)" : "Cover Note"}</Label>
              <Textarea
                rows={3}
                placeholder={isRtl ? "اكتب نبذة سريعة عن أبرز مهاراتك ولماذا أنت الأنسب لهذا المنصب..." : "Briefly highlight your key skills..."}
                value={applicantCoverNote}
                onChange={(e) => setApplicantCoverNote(e.target.value)}
                className="bg-background border-primary/20 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-primary/10">
              <Button type="button" variant="ghost" onClick={() => setApplyModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs h-9">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-5 gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {isRtl ? "إرسال طلب الترشح" : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* POST NEW JOB MODAL (EMPLOYERS)                           */}
      {/* ======================================================= */}
      <Dialog open={postJobModalOpen} onOpenChange={setPostJobModalOpen}>
        <DialogContent className="bg-card border-primary/20 text-foreground max-w-lg">
          <DialogHeader className="border-b border-primary/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isRtl ? "نشر وظيفة جديدة في منصة Career" : "Post a New Job Opportunity"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isRtl ? "استقطاب الكوادر الأكاديمية والتقنية والمهنية المعتمدة" : "Reach qualified candidates across UNIGATES"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handlePostJob} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "المسمى الوظيفي *" : "Job Title *"}</Label>
              <Input
                placeholder={isRtl ? "مثال: أستاذ ذكاء اصطناعي / مصمم واجهات" : "e.g. Senior Frontend Developer"}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="bg-background border-primary/20 text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "اسم الكلية أو الشركة المعلنة *" : "Company / College *"}</Label>
                <Input
                  placeholder={isRtl ? "مثال: كلية العلوم والتكنولوجيا" : "e.g. Acme Academy"}
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  required
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "الموقع الجغرافي" : "Location"}</Label>
                <Input
                  placeholder={isRtl ? "مثال: الرياض (أو عن بُعد)" : "Riyadh / Remote"}
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "التخصص والقطاع" : "Category"}</Label>
                <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                  <SelectTrigger className="bg-background border-primary/20 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 text-xs">
                    <SelectItem value="tech">{isRtl ? "تكنولوجيا وبرمجيات" : "Tech"}</SelectItem>
                    <SelectItem value="academic">{isRtl ? "تدريس وأكاديمي" : "Academic"}</SelectItem>
                    <SelectItem value="design">{isRtl ? "تصميم وفنون" : "Design"}</SelectItem>
                    <SelectItem value="translation">{isRtl ? "تحرير ونشر وترجمة" : "Publishing"}</SelectItem>
                    <SelectItem value="management">{isRtl ? "إدارة وأعمال" : "Management"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "نوع عقد العمل" : "Job Type"}</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="bg-background border-primary/20 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20 text-xs">
                    <SelectItem value="full-time">{isRtl ? "دوام كامل" : "Full-Time"}</SelectItem>
                    <SelectItem value="part-time">{isRtl ? "دوام جزئي" : "Part-Time"}</SelectItem>
                    <SelectItem value="remote">{isRtl ? "عن بُعد بالكامل" : "Remote"}</SelectItem>
                    <SelectItem value="internship">{isRtl ? "تدريب تعاوني" : "Internship"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "الراتب التقديري / المكافأة" : "Salary / Range"}</Label>
                <Input
                  placeholder={isRtl ? "مثال: 12,000 - 18,000 ر.س" : "e.g. 10,000 SAR"}
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "الخبرة المطلوبة" : "Experience"}</Label>
                <Input
                  placeholder={isRtl ? "مثال: 2 - 4 سنوات" : "2+ Years"}
                  value={newExp}
                  onChange={(e) => setNewExp(e.target.value)}
                  className="bg-background border-primary/20 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "وصف الوظيفة والمهام" : "Job Description"}</Label>
              <Textarea
                rows={2}
                placeholder={isRtl ? "اكتب نبذة عن المسؤوليات والأهداف الرئيسية..." : "Key duties and responsibilities..."}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-background border-primary/20 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">{isRtl ? "الشروط والمتطلبات (كل شرط بسطر)" : "Requirements (one per line)"}</Label>
              <Textarea
                rows={2}
                placeholder={isRtl ? "بكالوريوس في التخصص\nإتقان المهارات التقنية\nالقدرة على العمل بروح الفريق" : "Degree in field\nTechnical skills"}
                value={newReqs}
                onChange={(e) => setNewReqs(e.target.value)}
                className="bg-background border-primary/20 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-primary/10">
              <Button type="button" variant="ghost" onClick={() => setPostJobModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs h-9">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-5 gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isRtl ? "تأكيد ونشر الوظيفة" : "Publish Job Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selected Job Details Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob && !applyModalOpen} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="bg-card border-primary/20 text-foreground max-w-lg">
            <DialogHeader className="border-b border-primary/10 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-bold">
                    {selectedJob.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedJob.date}</span>
                </div>
                <DialogTitle className="text-lg font-black text-foreground pt-1">
                  {isRtl ? selectedJob.titleAr : selectedJob.titleEn}
                </DialogTitle>
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? selectedJob.companyAr : selectedJob.companyEn}</span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-primary/10">
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "الموقع:" : "Location:"}</span>
                  <span className="font-bold text-foreground">{isRtl ? selectedJob.locationAr : selectedJob.locationEn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "الراتب / المكافأة:" : "Salary:"}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{isRtl ? selectedJob.salaryAr : selectedJob.salaryEn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "الخبرة المطلوبة:" : "Experience:"}</span>
                  <span className="font-bold text-foreground">{isRtl ? selectedJob.experienceAr : selectedJob.experienceEn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isRtl ? "القطاع:" : "Category:"}</span>
                  <span className="font-bold text-foreground">{selectedJob.category}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground text-xs mb-1">{isRtl ? "عن الوظيفة والمسؤوليات:" : "Description:"}</h4>
                <p className="text-foreground/75 leading-relaxed">{isRtl ? selectedJob.descriptionAr : selectedJob.descriptionEn}</p>
              </div>

              {selectedJob.requirementsAr && selectedJob.requirementsAr.length > 0 && (
                <div>
                  <h4 className="font-bold text-foreground text-xs mb-1">{isRtl ? "المؤهلات والشروط المطلوبة:" : "Requirements:"}</h4>
                  <ul className="space-y-1 text-foreground/75 list-disc list-inside">
                    {(isRtl ? selectedJob.requirementsAr : selectedJob.requirementsEn).map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 border-t border-primary/10">
              <Button variant="ghost" onClick={() => setSelectedJob(null)} className="text-xs h-9">
                {isRtl ? "إغلاق" : "Close"}
              </Button>
              <Button
                onClick={() => {
                  setApplyModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-5 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isRtl ? "التقديم الآن" : "Apply Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

        <SiteFooter />
      </div>
    </PlatformUnderDevelopmentOverlay>
  );
}
