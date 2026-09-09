import { Link } from "react-router-dom";
import {
  Landmark, School, BookOpen, Store, ArrowLeft, ArrowRight,
  ShieldCheck, Video, Calendar, Award, FileQuestion, Users, CheckCircle2,
  Sparkles, Layers, BookMarked, TrendingUp, MonitorCheck, Briefcase, BookCopy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { isPlatformUnderDevelopment, PlatformKey } from "@/lib/platformAvailability";

const EcosystemPortals = () => {
  const { dir, language, translate, t } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  const isSchoolDev = isPlatformUnderDevelopment("school");
  const isCoursesDev = isPlatformUnderDevelopment("courses");
  const isBooksDev = isPlatformUnderDevelopment("bookstore");
  const isNasherDev = isPlatformUnderDevelopment("nasher");
  const isCareerDev = isPlatformUnderDevelopment("career");

  const getPortalContent = (id: string) => {
    switch (id) {
      case "university":
        switch (language) {
          case "en": return {
            title: "University Platform",
            subtitle: "An integrated academic platform for colleges, institutes, and faculties; tailored for Deans, Dept Heads, Professors, and Students.",
            roles: "Dean • Vice Dean • Dept Head • Faculty • Students",
            f1: "Digital exam & schedule approvals",
            f2: "Live interactive lecture streaming",
            f3: "Assignment grading & exam results",
            f4: "Faculty evaluation & feedback",
          };
          case "fr": return {
            title: "Plateforme Universitaire",
            subtitle: "Environnement académique complet pour facultés et instituts, conçu pour les doyens, directeurs, enseignants et étudiants.",
            roles: "Doyen • Vice-Doyen • Chef de Dép. • Professeurs • Étudiants",
            f1: "Approbations numériques des examens",
            f2: "Diffusion en direct des cours",
            f3: "Notation des devoirs et résultats",
            f4: "Évaluations pédagogiques certifiées",
          };
          case "es": return {
            title: "Plataforma Universitaria",
            subtitle: "Entorno académico integral para facultades e institutos, diseñado para decanos, jefes de departamento, profesores y estudiantes.",
            roles: "Decano • Vicedecano • Jefe Dpto. • Profesores • Estudiantes",
            f1: "Aprobación digital de exámenes",
            f2: "Clases universitarias en directo",
            f3: "Calificación de tareas y notas",
            f4: "Evaluación docente verificada",
          };
          case "de": return {
            title: "Universitätsplattform",
            subtitle: "Integrierte akademische Plattform für Fakultäten und Institute; maßgeschneidert für Dekane, Professoren und Studenten.",
            roles: "Dekan • Vizedekan • Fachbereichsleiter • Dozenten • Studenten",
            f1: "Digitale Prüfungsfreigaben",
            f2: "Interaktives Live-Streaming",
            f3: "Aufgabenbewertung & Ergebnisse",
            f4: "Verifizierte Dozenten-Evaluation",
          };
          case "zh": return {
            title: "高等大学与学院平台",
            subtitle: "面向大学院系与专科学院的一体化智慧教学管理系统，专为院长、系主任、教授及学生打造。",
            roles: "院长 • 副院长 • 系主任 • 教授 • 讲师 • 学生",
            f1: "考试与排课多级数字审批流",
            f2: "互动式高清大学课堂直播",
            f3: "智能作业批改与成绩发布",
            f4: "权威教学质量评估与反馈",
          };
          case "ru": return {
            title: "Университетская Платформа",
            subtitle: "Интегрированная академическая система для факультетов и институтов; для деканов, заведующих кафедрами, преподавателей и студентов.",
            roles: "Декан • Замдекана • Завкафедрой • Преподаватели • Студенты",
            f1: "Цифровые согласования экзаменов",
            f2: "Интерактивные онлайн-лекции",
            f3: "Проверка заданий и результаты",
            f4: "Оценка качества преподавания",
          };
          case "tr": return {
            title: "Üniversite Platformu",
            subtitle: "Fakülteler ve enstitüler için dekanlar, bölüm başkanları, akademisyenler ve öğrenciler için entegre akademik yönetim ortamı.",
            roles: "Dekan • Dekan Yrd. • Bölüm Bşk. • Akademisyenler • Öğrenciler",
            f1: "Dijital sınav ve program onayları",
            f2: "Etkileşimli canlı ders yayını",
            f3: "Ödev değerlendirme ve sonuçlar",
            f4: "Akademik performans değerlendirmesi",
          };
          default: return {
            title: "المنصة الجامعية",
            subtitle: "بيئة أكاديمية متكاملة لإدارة الكليات والمعاهد وأقسامها، مصممة للعمداء، الوكلاء، رؤساء الأقسام، أعضاء هيئة التدريس، والطلاب.",
            roles: "عميد • وكيل • رئيس قسم • أستاذ دكتور • دكتور • محاضر • معيد • طالب",
            f1: "سلاسل اعتماد رقمية للاختبارات والجداول",
            f2: "بث مباشر تفاعلي للمحاضرات الجامعية",
            f3: "استوديو تصحيح التكليفات ونتائج الامتحانات",
            f4: "تقييمات أداء الهيئة التدريسية الموثقة",
          };
        }

      case "school":
        switch (language) {
          case "en": return {
            title: "School Platform",
            subtitle: "Smart school management connecting school leadership, teachers, students, and parents with virtual classrooms and homework.",
            roles: "School Admins • Teachers • Students • Parents",
            f1: "Classroom & grade level management",
            f2: "Live classes with interactive chat",
            f3: "Homework studio & assignments bank",
            f4: "Dedicated parent supervision portal",
          };
          case "fr": return {
            title: "Plateforme Scolaire",
            subtitle: "Système scolaire intelligent reliant direction, enseignants, élèves et parents avec classes virtuelles et suivi continu.",
            roles: "Direction • Enseignants • Élèves • Parents",
            f1: "Gestion des classes et matières",
            f2: "Cours interactifs en direct",
            f3: "Banque de devoirs et devoirs en ligne",
            f4: "Portail dédié aux parents d'élèves",
          };
          case "es": return {
            title: "Plataforma Escolar",
            subtitle: "Sistema escolar inteligente que conecta dirección, docentes, alumnos y padres con aulas virtuales y seguimiento continuo.",
            roles: "Dirección • Docentes • Alumnos • Padres",
            f1: "Gestión de aulas y asignaturas",
            f2: "Clases interactivas en directo",
            f3: "Banco de tareas escolares",
            f4: "Portal de seguimiento para padres",
          };
          case "de": return {
            title: "Schulplattform",
            subtitle: "Intelligentes Schulmanagementsystem für Schulleitung, Lehrer, Schüler und Eltern mit virtuellen Klassenräumen.",
            roles: "Schulleitung • Lehrer • Schüler • Eltern",
            f1: "Klassen- & Fächerverwaltung",
            f2: "Interaktiver Live-Unterricht",
            f3: "Hausaufgaben- & Aufgabenbank",
            f4: "Elternportal für Lernfortschritte",
          };
          case "zh": return {
            title: "K-12 智慧中小学平台",
            subtitle: "连接校方管理层、教师、学生与家长的全场景智慧校园系统，配备云端课堂与作业协同。",
            roles: "校方管理 • 教师 • 中小学生 • 家长",
            f1: "多学段班级与课程一体化管理",
            f2: "互动直播课堂与实时互动答疑",
            f3: "海量题库与课后作业批改中心",
            f4: "家长专属学情监督与家校互通",
          };
          case "ru": return {
            title: "Школьная Платформа",
            subtitle: "Умная школьная система, объединяющая администрацию, учителей, учеников и родителей с виртуальными классами.",
            roles: "Администрация • Учителя • Ученики • Родители",
            f1: "Управление классами и предметами",
            f2: "Интерактивные онлайн-уроки",
            f3: "Банк домашних заданий и тестов",
            f4: "Портал для родителей",
          };
          case "tr": return {
            title: "Okul Platformu",
            subtitle: "Okul yönetimi, öğretmenler, öğrenciler ve velileri sanal sınıflar ve ödevlerle birleştiren akıllı okul ekosistemi.",
            roles: "Okul Yönetimi • Öğretmenler • Öğrenciler • Veliler",
            f1: "Sınıf ve ders yönetimi",
            f2: "Canlı ve etkileşimli dersler",
            f3: "Ödev bankası ve değerlendirme",
            f4: "Özel veli takip portalı",
          };
          default: return {
            title: "المنصة المدرسية",
            subtitle: "منظومة مدرسية ذكية تربط إدارة المدرسة بالمعلمين والطلاب وأولياء الأمور مع الفصول الافتراضية والواجبات والمتابعة المستمرة.",
            roles: "إدارة المدرسة • المعلمين • الطلاب • أولياء الأمور",
            f1: "إدارة الفصول والمواد الدراسية المتعددة",
            f2: "حصص مدرسية تفاعلية وبث مباشر حي",
            f3: "بنك الواجبات والأنشطة المدرسية",
            f4: "بوابة مخصصة لمتابعة أولياء الأمور",
          };
        }

      case "courses":
        switch (language) {
          case "en": return {
            title: "Courses Academy",
            subtitle: "Professional course hub with episodic lessons in programming, design, business, and sciences with verified certificates.",
            roles: "Learners • Instructors • Skill Seekers",
            f1: "Episodic HD video learning tracks",
            f2: "Verifiable digital completion certificates",
            f3: "Curated tracks from beginner to pro",
            f4: "Instructor studio to publish & monetize",
          };
          case "fr": return {
            title: "Académie des Formations",
            subtitle: "Plateforme de cours professionnels par épisodes en programmation, design, gestion et langues avec certificats accrédités.",
            roles: "Apprenants • Formateurs • Professionnels",
            f1: "Vidéos HD en épisodes progressifs",
            f2: "Certificats numériques vérifiables",
            f3: "Parcours du débutant à l'expert",
            f4: "Espace formateur pour publier et gagner",
          };
          case "es": return {
            title: "Academia de Cursos",
            subtitle: "Plataforma educativa con cursos profesionales en episodios breves de programación, diseño, negocios y certificaciones oficiales.",
            roles: "Estudiantes • Instructores • Profesionales",
            f1: "Lecciones en vídeo HD por episodios",
            f2: "Certificados digitales verificables",
            f3: "Rutas desde principiante a experto",
            f4: "Estudio para instructores y monetización",
          };
          case "de": return {
            title: "Kursakademie",
            subtitle: "Professionelle Kursplattform mit modularen HD-Lektionen in IT, Design, Wirtschaft und Sprachen mit Zertifikaten.",
            roles: "Lernende • Dozenten • Fachkräfte",
            f1: "Modulare HD-Videolektionen",
            f2: "Verifizierbare Abschlusszertifikate",
            f3: "Lernpfade vom Start zum Profi",
            f4: "Dozentenstudio zum Veröffentlichen",
          };
          case "zh": return {
            title: "职业培训与课程研修院",
            subtitle: "提供编程开发、UI设计、商业管理与语言等精品微课，配备权威防伪认证结业证书。",
            roles: "求学者 • 讲师 • 职场进阶人士",
            f1: "高清模块化短视频课程体系",
            f2: "可实时扫码查验的数字结业证书",
            f3: "从零基础到专家的系统化技能树",
            f4: "讲师专属入驻发布与收益工作室",
          };
          case "ru": return {
            title: "Академия Курсов",
            subtitle: "Профессиональные онлайн-курсы по программированию, дизайну, бизнесу и языкам с официальными сертификатами.",
            roles: "Студенты • Преподаватели • Специалисты",
            f1: "Короткие HD видеоуроки",
            f2: "Официальные QR-сертификаты",
            f3: "Курсы от новичка до эксперта",
            f4: "Студия авторов для публикации курсов",
          };
          case "tr": return {
            title: "Kurs Akademisi",
            subtitle: "Yazılım, tasarım, işletme ve diller alanında kısa bölümlü profesyonel video eğitimler ve onaylı sertifikalar.",
            roles: "Öğrenciler • Eğitmenler • Kariyer Arayanlar",
            f1: "Bölümlere ayrılmış HD eğitim videoları",
            f2: "Doğrulanabilir QR kodlu sertifikalar",
            f3: "Sıfırdan uzmanlığa eğitim yolları",
            f4: "Eğitmenler için kurs yayın stüdyosu",
          };
          default: return {
            title: "أكاديمية الدورات",
            subtitle: "منصة تعليمية تقدم دورات احترافية مقسمة لحلقات قصيرة ومركزة في البرمجة، التصميم، الأعمال، واللغات مع شهادات معتمدة.",
            roles: "المتعلمين • المدربين • الباحثين عن تطوير المهارات",
            f1: "دروس مقسمة لحلقات فيديو عالية الدقة",
            f2: "شهادات إتمام رقمية معتمدة وقابلة للتحقق",
            f3: "مسارات تعليمية متدرجة من الصفر للاحتراف",
            f4: "بوابة خاصة للمدربين لنشر دوراتهم والربح",
          };
        }

      case "books":
        switch (language) {
          case "en": return {
            title: "Digital Book Store & Library",
            subtitle: "A comprehensive digital bookstore powered by Dar Obeid offering academic references, textbooks, and rapid delivery.",
            roles: "Readers • Researchers • Authors • Publishers",
            f1: "Thousands of academic & literary titles",
            f2: "Instant digital reading or print delivery",
            f3: "Platform for authors & publishers",
            f4: "Verified reader reviews and ratings",
          };
          case "fr": return {
            title: "Librairie & Bibliothèque Numérique",
            subtitle: "Librairie complète par Dar Obeid offrant ouvrages universitaires, références scientifiques et livraison rapide.",
            roles: "Lecteurs • Chercheurs • Auteurs • Éditeurs",
            f1: "Milliers d'ouvrages académiques",
            f2: "Lecture numérique ou livraison papier",
            f3: "Espace auteurs et maisons d'édition",
            f4: "Avis et évaluations de lecteurs certifiés",
          };
          case "es": return {
            title: "Librería y Biblioteca Digital",
            subtitle: "Librería digital impulsada por Dar Obeid con referencias académicas, textos científicos y entrega rápida.",
            roles: "Lectores • Investigadores • Autores • Editoriales",
            f1: "Miles de títulos académicos y científicos",
            f2: "Lectura digital inmediata o envío físico",
            f3: "Plataforma para autores y editoriales",
            f4: "Reseñas y valoraciones verificadas",
          };
          case "de": return {
            title: "Digitale Buchhandlung & Bibliothek",
            subtitle: "Umfassende Buchhandlung von Dar Obeid mit akademischen Fachbüchern, Literatur und schnellem Versand.",
            roles: "Leser • Forscher • Autoren • Verlage",
            f1: "Tausende akademische Titel",
            f2: "Sofortiges E-Reading oder Buchversand",
            f3: "Plattform für Autoren & Verlage",
            f4: "Verifizierte Leserbewertungen",
          };
          case "zh": return {
            title: "数字书店与学术图书馆",
            subtitle: "由 Dar Obeid 出版社强力驱动的综合数字书库，涵盖大学教材、学术著作与文学典籍，支持电子速读与实体快运。",
            roles: "读者 • 学术研究者 • 作家 • 出版机构",
            f1: "数万册学术典籍与权威专业教材",
            f2: "即时在线电子阅读与实体极速配送",
            f3: "作者与出版机构入驻合作通道",
            f4: "真实读者评分与学术书评体系",
          };
          case "ru": return {
            title: "Цифровой Книжный Магазин",
            subtitle: "Библиотека от издательства Дар Обейд с учебниками, академическими изданиями и быстрой доставкой.",
            roles: "Читатели • Исследователи • Авторы • Издатели",
            f1: "Тысячи академических и научных книг",
            f2: "Чтение онлайн или доставка книг",
            f3: "Площадка для авторов и издательств",
            f4: "Проверенные отзывы читателей",
          };
          case "tr": return {
            title: "Dijital Kitap Mağazası ve Kütüphane",
            subtitle: "Dar Obeid güvencesiyle akademik kaynaklar, bilimsel kitaplar, anında dijital okuma veya hızlı kargo imkânı.",
            roles: "Okurlar • Araştırmacılar • Yazarlar • Yayınevleri",
            f1: "Binlerce akademik ve bilimsel eser",
            f2: "Anında e-kitap veya basılı teslimat",
            f3: "Yazarlar ve yayınevleri platformu",
            f4: "Doğrulanmış okur yorum ve puanları",
          };
          default: return {
            title: "متجر الكتب والمكتبة الرقمية",
            subtitle: "مكتبة عربية شاملة تابعة لدار عبيد توفر الكتب الأكاديمية والمراجع العلمية والروايات مع خيارات القراءة الفورية أو الشحن السريع.",
            roles: "القراء • الباحثين • المؤلفين • دور النشر",
            f1: "آلاف العناوين والمراجع الأكاديمية والتربوية",
            f2: "قراءة رقمية فورية أو شحن ورقي سريع",
            f3: "منصة للناشرين والمؤلفين لعرض كتبهم",
            f4: "تقييمات ومراجعات موثقة من القراء",
          };
        }

      case "nasher":
        switch (language) {
          case "en": return {
            title: "Publisher Platform (Nasher)",
            subtitle: "A smart marketplace for authors to auction manuscripts, receive bids from top publishing houses, and sign digital contracts.",
            roles: "Authors • Writers • Publishing Houses • Reviewers",
            f1: "Public manuscript auctions & bidding",
            f2: "Legally binding digital contracts",
            f3: "IP protection & escrow payments",
            f4: "Exclusive UNIGATES bookstore distribution",
          };
          case "fr": return {
            title: "Plateforme Nasher (Édition)",
            subtitle: "Marché intelligent pour proposer des manuscrits aux enchères auprès des éditeurs et signer des contrats électroniques certifiés.",
            roles: "Auteurs • Écrivains • Maisons d'Édition • Évaluateurs",
            f1: "Enchères publiques sur manuscrits",
            f2: "Contrats numériques juridiquement certifiés",
            f3: "Protection de la propriété intellectuelle",
            f4: "Distribution exclusive sur UNIGATES",
          };
          case "es": return {
            title: "Plataforma Nasher (Editorial)",
            subtitle: "Mercado inteligente para subastar manuscritos entre editoriales certificadas y firmar contratos digitales con validez legal.",
            roles: "Autores • Escritores • Editoriales • Evaluadores",
            f1: "Subasta pública de manuscritos y obras",
            f2: "Contratos digitales legalmente vinculantes",
            f3: "Protección de propiedad intelectual",
            f4: "Distribución exclusiva en UNIGATES",
          };
          case "de": return {
            title: "Nasher Verlagsplattform",
            subtitle: "Smarter Marktplatz für Manuskriptauktionen zwischen Autoren und Verlagen mit digitaler Vertragsunterzeichnung.",
            roles: "Autoren • Schriftsteller • Verlage • Gutachter",
            f1: "Öffentliche Manuskript-Auktionen",
            f2: "Rechtsgültige digitale Verträge",
            f3: "Urheberrechtsschutz & Treuhandservice",
            f4: "Exklusiver UNIGATES-Vertrieb",
          };
          case "zh": return {
            title: "Nasher 出版与书稿竞价平台",
            subtitle: "专为著作者打造的智能书稿拍卖市场，对接权威出版社公开竞标，在线签署具有法律效力的电子出版合同。",
            roles: "作者 • 作家 • 认证出版机构 • 审稿专家",
            f1: "书稿公开透明竞价与版权拍卖",
            f2: "受法律保障的区块链式电子合约",
            f3: "严格知识产权保护与资金托管担保",
            f4: "UNIGATES 数字书店独家发行直通车",
          };
          case "ru": return {
            title: "Издательская Платформа Nasher",
            subtitle: "Интеллектуальный рынок для аукционов рукописей среди издательств и подписания официальных электронных контрактов.",
            roles: "Авторы • Писатели • Издательства • Рецензенты",
            f1: "Публичные аукционы рукописей",
            f2: "Официальные цифровые контракты",
            f3: "Защита авторских прав и безопасность",
            f4: "Эксклюзивная дистрибуция в UNIGATES",
          };
          case "tr": return {
            title: "Nasher Yayıncılık Platformu",
            subtitle: "Yazarların eserlerini yayınevlerine ihaleye sunabildiği ve resmi dijital sözleşmeler imzaladığı akıllı yayın pazarı.",
            roles: "Yazarlar • Eser Sahipleri • Yayınevleri • Hakemler",
            f1: "El yazması ve kitap ihaleleri",
            f2: "Hukuken bağlayıcı dijital sözleşmeler",
            f3: "Fikri mülkiyet koruması ve güvenli ödeme",
            f4: "UNIGATES mağazasında özel dağıtım",
          };
          default: return {
            title: "منصة ناشر",
            subtitle: "سوق ذكي لطرح المخطوطات والكتب للمزايدة بين دور النشر المعتمدة، وتوقيع عقود إلكترونية رسمية بإشراف دار عبيد للنشر والتوزيع.",
            roles: "المؤلفين • الكُتّاب • دور النشر المعتمدة • المحكّمين",
            f1: "طرح المخطوطات والكتب للمزايدة العلنية",
            f2: "عقود رقمية ملزمة وموثقة قانونياً",
            f3: "حماية الملكية الفكرية والدفع المشروط",
            f4: "حصرية التوزيع بمتجر UNIGATES الرقمي",
          };
        }

      case "career":
        switch (language) {
          case "en": return {
            title: "Career & Talent Platform",
            subtitle: "Direct career matchmaking connecting graduates, academic faculty, and professionals with top universities, schools, and companies.",
            roles: "Graduates • Job Seekers • Academic Institutions • Employers",
            f1: "Smart job search & filtering engine",
            f2: "Direct 1-click digital applications",
            f3: "Exclusive co-op & graduate hiring",
            f4: "Employer job posting & talent studio",
          };
          case "fr": return {
            title: "Plateforme Carrière & Emploi",
            subtitle: "Passerelle directe d'emploi reliant diplômés, enseignants et professionnels aux facultés, écoles et entreprises partenaires.",
            roles: "Diplômés • Chercheurs d'emploi • Institutions • Entreprises",
            f1: "Moteur de recherche et filtres d'offres",
            f2: "Candidature en 1 clic avec CV unifié",
            f3: "Stages et opportunités pour diplômés",
            f4: "Studio de recrutement pour employeurs",
          };
          case "es": return {
            title: "Plataforma de Empleo y Talento",
            subtitle: "Puente directo de empleo que conecta graduados, académicos y profesionales con universidades, colegios y empresas.",
            roles: "Graduados • Demandantes de empleo • Instituciones • Empresas",
            f1: "Búsqueda y filtrado inteligente de empleo",
            f2: "Postulación digital directa en 1 clic",
            f3: "Prácticas y empleo para recién graduados",
            f4: "Panel de publicación de ofertas",
          };
          case "de": return {
            title: "Karriere- & Talentplattform",
            subtitle: "Direkte Jobvermittlung zwischen Absolventen, Dozenten und Fachkräften sowie Universitäten, Schulen und Unternehmen.",
            roles: "Absolventen • Arbeitssuchende • Institutionen • Arbeitgeber",
            f1: "Intelligente Filtersuche für Jobs",
            f2: "Direktbewerbung mit 1 Klick",
            f3: "Exklusive Praktika & Absolventenjobs",
            f4: "Arbeitgeberstudio für Stellenangebote",
          };
          case "zh": return {
            title: "Career 智慧招聘与人才平台",
            subtitle: "打通高校毕业生、优秀学术师资与名企名校的直聘通道，提供实习实训、校招与高端教职对接。",
            roles: "毕业生 • 求职精英 • 高等学府与名校 • 知名企业",
            f1: "智能岗位匹配与精准多维筛选",
            f2: "一键投递标准化学术与职业简历",
            f3: "专属校企产学研实习与校招通道",
            f4: "用人单位职位发布与人才猎聘中心",
          };
          case "ru": return {
            title: "Карьерная Платформа Career",
            subtitle: "Прямой мост между выпускниками, преподавателями, специалистами и университетами, школами и компаниями.",
            roles: "Выпускники • Соискатели • Учебные заведения • Работодатели",
            f1: "Умный поиск и фильтрация вакансий",
            f2: "Быстрый отклик на вакансии в 1 клик",
            f3: "Эксклюзивные стажировки и вакансии",
            f4: "Кабинет работодателя для найма",
          };
          case "tr": return {
            title: "Career Kariyer ve İstihdam Platformu",
            subtitle: "Mezunları, akademisyenleri ve profesyonelleri üniversiteler, okullar ve teknoloji şirketleriyle buluşturan istihdam köprüsü.",
            roles: "Mezunlar • İş Arayanlar • Eğitim Kurumları • Şirketler",
            f1: "Akıllı iş arama ve filtreleme motoru",
            f2: "Tek tıkla dijital CV ile başvuru",
            f3: "Özel staj ve yeni mezun iş fırsatları",
            f4: "Kurumlar için iş ilanı stüdyosu",
          };
          default: return {
            title: "منصة Career للتوظيف",
            subtitle: "جسر التوظيف المباشر بين خريجي الجامعات والكوادر الأكاديمية والمهنية وبين كبرى الكليات والمدارس وشركات التقنية ودار عبيد.",
            roles: "الخريجين • الباحثين عن عمل • المؤسسات التعليمية • الشركات",
            f1: "محرك بحث وفلترة ذكية للوظائف",
            f2: "تقديم رقمي مباشر بملف سيرة ذاتية موحد",
            f3: "فرص تدريب تعاوني وتوظيف خريجين حصرية",
            f4: "استوديو نشر وإدارة الوظائف للمؤسسات",
          };
        }

      default:
        return {
          title: "",
          subtitle: "",
          roles: "",
          f1: "",
          f2: "",
          f3: "",
          f4: "",
        };
    }
  };

  const uniContent = getPortalContent("university");
  const schoolContent = getPortalContent("school");
  const coursesContent = getPortalContent("courses");
  const booksContent = getPortalContent("books");
  const nasherContent = getPortalContent("nasher");
  const careerContent = getPortalContent("career");

  const portals = [
    {
      id: "university",
      to: "/university-platform",
      badge: translate("التعليم العالي والجامعي", "Higher Education"),
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      title: uniContent.title,
      subtitle: uniContent.subtitle,
      icon: Landmark,
      gradient: "from-blue-600 via-indigo-600 to-violet-700",
      accentBorder: "border-blue-500/30 hover:border-blue-500/80",
      glowColor: "group-hover:shadow-blue-500/20",
      features: [
        { icon: ShieldCheck, text: uniContent.f1 },
        { icon: Video, text: uniContent.f2 },
        { icon: Award, text: uniContent.f3 },
        { icon: Users, text: uniContent.f4 },
      ],
      ctaText: translate("دخول المنصة الجامعية", "Explore University Portal"),
      roles: uniContent.roles,
    },
    {
      id: "school",
      to: "/school-platform",
      badge: isSchoolDev
        ? translate("قريباً • قيد التطوير", "Coming Soon • In Dev")
        : translate("التعليم المدرسي K-12", "K-12 Education"),
      badgeColor: isSchoolDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      title: schoolContent.title,
      subtitle: schoolContent.subtitle,
      icon: School,
      gradient: "from-emerald-600 via-teal-600 to-green-700",
      accentBorder: "border-emerald-500/30 hover:border-emerald-500/80",
      glowColor: "group-hover:shadow-emerald-500/20",
      features: [
        { icon: Layers, text: schoolContent.f1 },
        { icon: Video, text: schoolContent.f2 },
        { icon: CheckCircle2, text: schoolContent.f3 },
        { icon: Users, text: schoolContent.f4 },
      ],
      ctaText: isSchoolDev
        ? translate("قريباً — استكشف المنصة المدرسية", "Coming Soon — Explore School")
        : translate("دخول المنصة المدرسية", "Explore School Portal"),
      roles: schoolContent.roles,
    },
    {
      id: "courses",
      to: "/courses",
      badge: isCoursesDev
        ? translate("قريباً • قيد التطوير", "Coming Soon • In Dev")
        : translate("التطوير المهني والمهارات", "Professional Skills"),
      badgeColor: isCoursesDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      title: coursesContent.title,
      subtitle: coursesContent.subtitle,
      icon: BookOpen,
      gradient: "from-purple-600 via-fuchsia-600 to-pink-700",
      accentBorder: "border-purple-500/30 hover:border-purple-500/80",
      glowColor: "group-hover:shadow-purple-500/20",
      features: [
        { icon: MonitorCheck, text: coursesContent.f1 },
        { icon: Award, text: coursesContent.f2 },
        { icon: TrendingUp, text: coursesContent.f3 },
        { icon: Sparkles, text: coursesContent.f4 },
      ],
      ctaText: isCoursesDev
        ? translate("قريباً — تصفح الدورات", "Coming Soon — View Courses")
        : translate("تصفح الدورات والمسارات", "Browse All Courses"),
      roles: coursesContent.roles,
    },
    {
      id: "books",
      to: "/book-store",
      badge: isBooksDev
        ? translate("قريباً • قيد التطوير", "Coming Soon • In Dev")
        : translate("المكتبة والنشر الرقمي", "Digital Bookstore"),
      badgeColor: isBooksDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      title: booksContent.title,
      subtitle: booksContent.subtitle,
      icon: Store,
      gradient: "from-amber-500 via-orange-600 to-rose-600",
      accentBorder: "border-amber-500/30 hover:border-amber-500/80",
      glowColor: "group-hover:shadow-amber-500/20",
      features: [
        { icon: BookMarked, text: booksContent.f1 },
        { icon: CheckCircle2, text: booksContent.f2 },
        { icon: Sparkles, text: booksContent.f3 },
        { icon: Users, text: booksContent.f4 },
      ],
      ctaText: isBooksDev
        ? translate("قريباً — استكشف متجر الكتب", "Coming Soon — View Bookstore")
        : translate("تصفح متجر الكتب", "Explore Bookstore"),
      roles: booksContent.roles,
    },
    {
      id: "nasher",
      to: "/nasher",
      badge: isNasherDev
        ? translate("قريباً • قيد التطوير", "Coming Soon • In Dev")
        : translate("سوق النشر والمزايدات", "Publishing & Bidding"),
      badgeColor: isNasherDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      title: nasherContent.title,
      subtitle: nasherContent.subtitle,
      icon: BookCopy,
      gradient: "from-rose-600 via-pink-600 to-amber-600",
      accentBorder: "border-rose-500/30 hover:border-rose-500/80",
      glowColor: "group-hover:shadow-rose-500/20",
      features: [
        { icon: TrendingUp, text: nasherContent.f1 },
        { icon: ShieldCheck, text: nasherContent.f2 },
        { icon: Sparkles, text: nasherContent.f3 },
        { icon: Users, text: nasherContent.f4 },
      ],
      ctaText: isNasherDev
        ? translate("قريباً — استكشف منصة ناشر", "Coming Soon — Explore Nasher")
        : translate("دخول منصة ناشر", "Explore Nasher Portal"),
      roles: nasherContent.roles,
    },
    {
      id: "career",
      to: "/career",
      badge: isCareerDev
        ? translate("قريباً • قيد التطوير", "Coming Soon • In Dev")
        : translate("سوق العمل والكفاءات", "Career & Recruitment"),
      badgeColor: isCareerDev
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      title: careerContent.title,
      subtitle: careerContent.subtitle,
      icon: Briefcase,
      gradient: "from-cyan-600 via-teal-600 to-blue-700",
      accentBorder: "border-cyan-500/30 hover:border-cyan-500/80",
      glowColor: "group-hover:shadow-cyan-500/20",
      features: [
        { icon: MonitorCheck, text: careerContent.f1 },
        { icon: Award, text: careerContent.f2 },
        { icon: TrendingUp, text: careerContent.f3 },
        { icon: Users, text: careerContent.f4 },
      ],
      ctaText: isCareerDev
        ? translate("قريباً — استكشف منصة التوظيف", "Coming Soon — Explore Career")
        : translate("دخول منصة التوظيف", "Explore Career Portal"),
      roles: careerContent.roles,
    },
  ];

  const getSectionTitle = () => {
    switch (language) {
      case "en": return "Specialized Educational Platforms for Every Sector";
      case "fr": return "Plateformes Éducatives Spécialisées pour Chaque Secteur";
      case "es": return "Plataformas Educativas Especializadas para Cada Sector";
      case "de": return "Spezialisierte Bildungsplattformen für Jeden Bereich";
      case "zh": return "专为各领域量身打造的细分教育平台矩阵";
      case "ru": return "Специализированные Образовательные Платформы для Каждого Сектора";
      case "tr": return "Her Sektöre Özel Uzmanlaşmış Eğitim Platformları";
      default: return "منصات تعليمية متخصصة لكل قطاع";
    }
  };

  const getSectionSubtitle = () => {
    switch (language) {
      case "en": return "Each platform within UNIGATES is designed to deliver a specialized experience meeting the highest standards of higher education, schooling, training courses, digital & print books, book publishing, and career opportunities.";
      case "fr": return "Chaque plateforme au sein d'UNIGATES est conçue pour offrir une expérience spécialisée répondant aux plus hautes exigences de l'enseignement supérieur, scolaire, des formations, de l'édition et des opportunités d'emploi.";
      case "es": return "Cada plataforma dentro de UNIGATES está diseñada para ofrecer una experiencia especializada que satisface las más altas demandas de educación universitaria, escolar, cursos, libros digitales e impresos, publicación de libros y empleo.";
      case "de": return "Jede Plattform innerhalb von UNIGATES bietet eine maßgeschneiderte Erfahrung für Hochschulbildung, Schulen, Kurse, digitale & gedruckte Bücher, Buchveröffentlichung und Arbeitsplätze.";
      case "zh": return "UNIGATES 旗下的每一大平台均专为提供专业化体验而设计，全面满足高等教育、中小学教学、专业课程、电子与纸质图书、图书出版及求职招聘的最高标准。";
      case "ru": return "Каждая платформа UNIGATES создана для предоставления специализированного опыта, отвечающего самым высоким требованиям высшего и школьного образования, курсов, книг, книгоиздания и трудоустройства.";
      case "tr": return "UNIGATES bünyesindeki her platform; üniversite ve okul eğitimi, eğitim kursları, dijital ve basılı kitaplar, kitap yayıncılığı ve iş olanaklarının en yüksek standartlarını karşılamak üzere tasarlanmıştır.";
      default: return "صُممت كل منصة داخل unigates لتقديم تجربة متخصصة تلبي أعلى متطلبات التعليم الجامعي والمدرسي والدورات التعليمية وتوفير الكتب الرقمية والورقية ونشر الكتب وتوفير الوظائف";
    }
  };

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-background via-muted/20 to-background transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Title Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-black border-primary/30 bg-primary/5 text-primary">
            {translate("منظومة UNIGATES المتكاملة", "The UNIGATES Ecosystem")}
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            {getSectionTitle()}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {getSectionSubtitle()}
          </p>
        </div>

        {/* 6 Portals Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {portals.map((portal) => {
            const IconComp = portal.icon;
            return (
              <Card
                key={portal.id}
                className={`group rounded-3xl border-2 ${portal.accentBorder} bg-card hover:bg-card/90 shadow-md hover:shadow-2xl ${portal.glowColor} transition-all duration-300 overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  {/* Card Top Banner Strip */}
                  <div className={`h-3 bg-gradient-to-r ${portal.gradient}`} />

                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${portal.gradient} text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform shrink-0`}
                        >
                          <IconComp className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                          <Badge variant="outline" className={`font-bold text-[11px] mb-1.5 ${portal.badgeColor}`}>
                            {portal.badge}
                          </Badge>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                            {portal.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                      {portal.subtitle}
                    </p>

                    {/* Features checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {portal.features.map((feat, idx) => {
                        const FeatIcon = feat.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 text-xs font-bold text-foreground"
                          >
                            <FeatIcon className="w-4 h-4 text-primary shrink-0" />
                            <span className="line-clamp-1">{feat.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Target Roles */}
                    <div className="pt-2 border-t border-border/50 text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{portal.roles}</span>
                    </div>
                  </CardContent>
                </div>

                {/* Bottom CTA Button */}
                <div className="p-6 sm:p-8 pt-0">
                  <Link to={portal.to} className="block w-full">
                    <Button
                      className={`w-full h-12 rounded-2xl font-black text-sm text-white bg-gradient-to-r ${portal.gradient} shadow-lg hover:shadow-xl transition-all duration-300 gap-2`}
                    >
                      <span>{portal.ctaText}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EcosystemPortals;
