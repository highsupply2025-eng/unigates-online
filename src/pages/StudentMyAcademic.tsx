import { GraduationCap, Building2, Crown, Mail, Phone, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StudentPageHeader from "@/components/StudentPageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

const StudentMyAcademic = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";

  const collegeInfo = {
    nameAr: "كلية الهندسة - جامعة تجريبية",
    nameEn: "Faculty of Engineering - Demo University",
    departmentAr: "قسم هندسة الحاسوب",
    departmentEn: "Computer Engineering Department",
    levelAr: "المستوى الثالث",
    levelEn: "Level 3",
  };

  const lecturers = [
    { id: "demo-1", nameAr: "د. أحمد محمود", nameEn: "Dr. Ahmed Mahmoud", subjectAr: "هياكل البيانات", subjectEn: "Data Structures", email: "ahmed@demo.edu", phone: "01000000001" },
    { id: "demo-2", nameAr: "د. سارة علي", nameEn: "Dr. Sarah Ali", subjectAr: "قواعد البيانات", subjectEn: "Databases", email: "sara@demo.edu", phone: "01000000002" },
    { id: "demo-3", nameAr: "د. محمد إبراهيم", nameEn: "Dr. Mohamed Ibrahim", subjectAr: "نظم التشغيل", subjectEn: "Operating Systems", email: "mohamed@demo.edu", phone: "01000000003" },
  ];

  const leadership = [
    { roleAr: "عميد الكلية", roleEn: "Dean", nameAr: "أ.د. عمر سليم", nameEn: "Prof. Omar Salim", email: "dean@demo.edu" },
    { roleAr: "وكيل الكلية لشؤون التعليم والطلاب", roleEn: "Vice Dean for Education & Student Affairs", nameAr: "أ.د. هدى ناصر", nameEn: "Prof. Hoda Nasser", email: "vd.edu@demo.edu" },
    { roleAr: "وكيل الكلية للدراسات العليا والبحوث", roleEn: "Vice Dean for Postgraduate Studies & Research", nameAr: "أ.د. طارق فؤاد", nameEn: "Prof. Tarek Fouad", email: "vd.research@demo.edu" },
    { roleAr: "وكيل الكلية لشؤون خدمة المجتمع وتنمية البيئة", roleEn: "Vice Dean for Community Service & Environmental Development", nameAr: "أ.د. منى عبد الرحمن", nameEn: "Prof. Mona Abdelrahman", email: "vd.community@demo.edu" },
  ];

  const departmentHead = { roleAr: "رئيس القسم", roleEn: "Department Head", nameAr: "د. خالد عبدالله", nameEn: "Dr. Khaled Abdullah", email: "head@demo.edu" };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader
        titleAr="حسابي الأكاديمي"
        titleEn="My Academic Profile"
        icon={<GraduationCap className="w-3.5 h-3.5" />}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        {/* Affiliation card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{isRtl ? collegeInfo.nameAr : collegeInfo.nameEn}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{isRtl ? collegeInfo.departmentAr : collegeInfo.departmentEn}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="font-bold">{isRtl ? collegeInfo.levelAr : collegeInfo.levelEn}</Badge>
            <Badge variant="outline" className="ms-2 border-primary/30">{isRtl ? "حساب تجريبي" : "Demo Account"}</Badge>
          </CardContent>
        </Card>

        {/* Leadership */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black">{isRtl ? "قيادة الكلية" : "College Leadership"}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leadership.map((p, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow border-amber-200/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="mb-1 text-[10px] border-amber-300 text-amber-700">{isRtl ? p.roleAr : p.roleEn}</Badge>
                    <h3 className="font-bold truncate">{isRtl ? p.nameAr : p.nameEn}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Department Head */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-black">{isRtl ? "رئيس القسم" : "Department Head"}</h2>
          </div>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-1 text-[10px]">{isRtl ? departmentHead.roleAr : departmentHead.roleEn}</Badge>
                <h3 className="font-bold truncate">{isRtl ? departmentHead.nameAr : departmentHead.nameEn}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{departmentHead.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Lecturers */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black">{isRtl ? "محاضروني" : "My Lecturers"}</h2>
            <Badge variant="secondary">{lecturers.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lecturers.map((l) => (
              <Card key={l.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                      {(isRtl ? l.nameAr : l.nameEn).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground truncate">{isRtl ? l.nameAr : l.nameEn}</h3>
                      <p className="text-xs text-muted-foreground truncate">{isRtl ? l.subjectAr : l.subjectEn}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{l.email}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{l.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default StudentMyAcademic;
