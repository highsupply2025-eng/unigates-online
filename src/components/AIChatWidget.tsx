import { useState, useRef, useEffect, ReactNode, useMemo } from "react";
import { MessageCircle, X, Send, ExternalLink, Sparkles, RefreshCw, Landmark, School, GraduationCap, BookOpen, ChevronLeft, ChevronRight, Check, BookCopy, Briefcase } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useAllCourses } from "@/hooks/useCourses";
import { useBooks } from "@/hooks/useBooks";

const WHATSAPP_NUMBER = "00966563057356";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

type Message = { role: "user" | "assistant"; content: string };

// Helper to render markdown links [text](url) as clickable React Router links
const renderMessageContent = (text: string, navigate: (to: string) => void): ReactNode[] => {
  const parts: ReactNode[] = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    
    if (url.startsWith("/")) {
      parts.push(
        <button
          key={`${match.index}-${url}`}
          onClick={() => navigate(url)}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs underline-offset-2"
        >
          <span>{label}</span>
          <span className="text-[10px]">↗</span>
        </button>
      );
    } else {
      parts.push(
        <a
          key={`${match.index}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs"
        >
          <span>{label}</span>
          <span className="text-[10px]">↗</span>
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

const getLocalizedChatContent = (lang: string) => {
  switch (lang) {
    case "fr":
      return {
        welcomeMsg: "Bienvenue sur UNIGATES ! 👋 Je suis votre conseiller IA en direct. Comment puis-je vous orienter aujourd'hui ? Posez-moi des questions sur les 6 plateformes (Universités, Écoles, Formations, Librairie, Plateforme Éditeur, ou Carrière & Emploi).",
        onlineBadge: "En Direct",
        advisorSubtitle: "Votre Conseiller Académique & Professionnel",
        newChatTitle: "Nouvelle discussion",
        quickOptionsTitle: "⚡ Options et orientations rapides :",
        whatsappBtn: "Support officiel via WhatsApp",
        inputPlaceholder: "Posez votre question ou indiquez l'établissement...",
        quickPrompts: [
          { label: "🏛️ Inscription Faculté / Institut", prompt: "Comment inscrire une faculté ou un institut sur UNIGATES ?" },
          { label: "🏫 Inscription École K-12", prompt: "Comment inscrire une école K-12 sur la plateforme ?" },
          { label: "✍️ Plateforme Éditeur (Nasher)", prompt: "Comment fonctionne la plateforme éditeur pour les auteurs et contrats d'édition ?" },
          { label: "💼 Plateforme Carrière (Career)", prompt: "Comment postuler aux offres d'emploi ou publier des opportunités de recrutement ?" },
          { label: "🎓 Inscription Étudiant / Apprenant", prompt: "Comment créer un compte étudiant pour accéder aux cours et examens ?" },
          { label: "🔒 Validation des Examens", prompt: "Comment fonctionnent les circuits de validation numérique des examens ?" },
        ],
      };
    case "es":
      return {
        welcomeMsg: "¡Bienvenido a UNIGATES! 👋 Soy tu asesor inteligente en tiempo real. ¿Cómo puedo ayudarte hoy? Pregúntame sobre los 6 portales (Universidades, Colegios, Cursos, Librería, Editorial Nasher, o Empleo Career).",
        onlineBadge: "En Vivo",
        advisorSubtitle: "Tu Asesor Académico y Profesional",
        newChatTitle: "Nueva conversación",
        quickOptionsTitle: "⚡ Consultas rápidas y frecuentes:",
        whatsappBtn: "Atención directa por WhatsApp",
        inputPlaceholder: "Escribe tu consulta o institución a registrar...",
        quickPrompts: [
          { label: "🏛️ Registrar Facultad / Instituto", prompt: "¿Cómo registro una facultad o instituto en UNIGATES?" },
          { label: "🏫 Registrar Escuela K-12", prompt: "¿Cómo inscribir una escuela K-12 en la plataforma?" },
          { label: "✍️ Plataforma Editorial (Nasher)", prompt: "¿Cómo funciona la plataforma de publicación para autores y editoriales?" },
          { label: "💼 Plataforma de Empleo (Career)", prompt: "¿Cómo buscar u ofertar empleos y oportunidades profesionales?" },
          { label: "🎓 Registro de Estudiante", prompt: "¿Cómo crear una cuenta de estudiante para acceder a clases?" },
          { label: "🔒 Aprobación de Exámenes", prompt: "¿Cómo funcionan las cadenas de aprobación digital de exámenes?" },
        ],
      };
    case "de":
      return {
        welcomeMsg: "Willkommen bei UNIGATES! 👋 Ich bin Ihr KI-Berater in Echtzeit. Wie kann ich Ihnen heute helfen? Fragen Sie mich nach unseren 6 Plattformen (Universitäten, Schulen, Kurse, Buchhandlung, Verlag Nasher oder Karriere).",
        onlineBadge: "Live Online",
        advisorSubtitle: "Ihr Intelligenter Bildungs- & Karriereberater",
        newChatTitle: "Neuer Chat",
        quickOptionsTitle: "⚡ Häufige Schnellfragen:",
        whatsappBtn: "Direkter WhatsApp-Support",
        inputPlaceholder: "Geben Sie Ihre Frage oder Einrichtung ein...",
        quickPrompts: [
          { label: "🏛️ Fakultät / Institut registrieren", prompt: "Wie registriere ich eine Fakultät oder ein Institut auf UNIGATES?" },
          { label: "🏫 Schule registrieren", prompt: "Wie melde ich eine K-12 Schule auf der Plattform an?" },
          { label: "✍️ Verlagsplattform (Nasher)", prompt: "Wie funktioniert die Verlagsplattform für Autoren und Verträge?" },
          { label: "💼 Karriereportal (Career)", prompt: "Wie bewerbe ich mich auf Stellenangebote oder veröffentliche Jobangebote?" },
          { label: "🎓 Als Student registrieren", prompt: "Wie erstelle ich ein Studentenkonto für Vorlesungen?" },
          { label: "🔒 Prüfungsfreigabe-Ketten", prompt: "Wie funktioniert die digitale Prüfungsfreigabe?" },
        ],
      };
    case "zh":
      return {
        welcomeMsg: "欢迎来到 UNIGATES！👋 我是您的全天候智能导师。今天有什么可以帮助您？您可以咨询六大生态门户（大学学院、中小学、专业培训、数字图书、出版商平台、求职招聘）。",
        onlineBadge: "实时在线",
        advisorSubtitle: "您的全方位智慧数字教育与职业顾问",
        newChatTitle: "开启新会话",
        quickOptionsTitle: "⚡ 常见快捷咨询：",
        whatsappBtn: "官方 WhatsApp 在线支持",
        inputPlaceholder: "输入您的疑问或需入驻的机构名称...",
        quickPrompts: [
          { label: "🏛️ 申请入驻大学学院 / 研究所", prompt: "如何以机构管理员身份入驻并注册大学学院或研究所？" },
          { label: "🏫 申请入驻中小学", prompt: "如何在中小学智能平台注册入驻学校？" },
          { label: "✍️ 出版商生态 (Nasher)", prompt: "作者与出版机构如何通过 ناشر 平台签署数字版权与出版合同？" },
          { label: "💼 人才求职与招聘 (Career)", prompt: "如何在 UNIGATES Career 平台应聘或发布高薪职位？" },
          { label: "🎓 注册学员 / 学生账号", prompt: "如何注册学生账号以获取课程与作业？" },
          { label: "🔒 数字试卷审批流程说明", prompt: "请介绍试卷从教研主任到院长的多级数字审批机制。" },
        ],
      };
    case "ru":
      return {
        welcomeMsg: "Добро пожаловать в UNIGATES! 👋 Я ваш интеллектуальный помощник в реальном времени. Чем я могу помочь? Задайте вопрос о 6 порталах (университеты, школы, курсы, книги, издательство Nasher или карьера).",
        onlineBadge: "В Сети",
        advisorSubtitle: "Ваш Академический и Карьерный ИИ-Консультант",
        newChatTitle: "Новый диалог",
        quickOptionsTitle: "⚡ Быстрые вопросы и темы:",
        whatsappBtn: "Поддержка в WhatsApp",
        inputPlaceholder: "Введите ваш вопрос или название учреждения...",
        quickPrompts: [
          { label: "🏛️ Регистрация Факультета / Института", prompt: "Как зарегистрировать факультет или институт в UNIGATES?" },
          { label: "🏫 Регистрация Школы", prompt: "Как подключить школу к школьной платформе?" },
          { label: "✍️ Издательская платформа (Nasher)", prompt: "Как авторам и издательствам работать с платформой публикаций и договоров?" },
          { label: "💼 Карьерный портал (Career)", prompt: "Как подать заявку на вакансию или опубликовать вакансии для специалистов?" },
          { label: "🎓 Регистрация Студента", prompt: "Как создать аккаунт студента для доступа к занятиям?" },
          { label: "🔒 Утверждение Экзаменов", prompt: "Как работает цифровая цепочка утверждения экзаменов?" },
        ],
      };
    case "tr":
      return {
        welcomeMsg: "UNIGATES'e Hoş Geldiniz! 👋 Ben gerçek zamanlı yapay zeka danışmanınızım. Bugün size nasıl yardımcı olabilirim? 6 portalımız hakkında sorular sorabilirsiniz (Üniversite, Okul, Kurslar, Kitabevi, Yayıncı Nasher ve Kariyer).",
        onlineBadge: "Çevrimiçi",
        advisorSubtitle: "Akıllı Akademik ve Kariyer Rehberiniz",
        newChatTitle: "Yeni Sohbet",
        quickOptionsTitle: "⚡ Hızlı Yönlendirme Seçenekleri:",
        whatsappBtn: "Resmi WhatsApp Canlı Destek",
        inputPlaceholder: "Sorunuzu veya kurum adını yazın...",
        quickPrompts: [
          { label: "🏛️ Fakülte / Enstitü Kaydı", prompt: "UNIGATES'te fakülte veya enstitü nasıl kaydedilir?" },
          { label: "🏫 Okul Kaydı", prompt: "K-12 okulunu platforma nasıl kaydederim?" },
          { label: "✍️ Yayıncı Platformu (Nasher)", prompt: "Yayıncılık ve telif sözleşmeleri platformu nasıl çalışır?" },
          { label: "💼 Kariyer Portalı (Career)", prompt: "İş ilanlarına nasıl başvurulur ve kurumsal işe alım nasıl yapılır?" },
          { label: "🎓 Öğrenci Hesabı Oluştur", prompt: "Derslere ve ödevlere erişmek için öğrenci hesabı nasıl açılır?" },
          { label: "🔒 Sınav Onay Zincirleri", prompt: "Dijital sınav onay iş akışları nasıl çalışır?" },
        ],
      };
    case "en":
      return {
        welcomeMsg: "Welcome to UNIGATES! 👋 I'm your real-time AI advisor. How can I guide you today? Ask me about all 6 portals (University, School, Courses, Bookstore, Nasher Publishing, and Career opportunities).",
        onlineBadge: "Live Online",
        advisorSubtitle: "Your Smart Academic & Career Advisor",
        newChatTitle: "New Chat",
        quickOptionsTitle: "⚡ Quick guidance options:",
        whatsappBtn: "Chat on Official WhatsApp",
        inputPlaceholder: "Type your inquiry or institution name...",
        quickPrompts: [
          { label: "🏛️ Register College / Institute", prompt: "How do I register a college or institute on UNIGATES?" },
          { label: "🏫 Register School", prompt: "How do I onboard a new K-12 school?" },
          { label: "✍️ Publisher Platform (Nasher)", prompt: "How does the publishing platform work for authors, publishing houses, and contracts?" },
          { label: "💼 Career Platform (Jobs)", prompt: "How do I apply for jobs or post talent recruitment vacancies?" },
          { label: "🎓 Student Sign Up", prompt: "How do I create a student account?" },
          { label: "🔒 Exam Approval Chains", prompt: "How do digital exam approval workflows work?" },
        ],
      };
    default: // "ar"
      return {
        welcomeMsg: "مرحباً بك في منظومة UNIGATES! 👋 أنا مستشارك الذكي اللحظي. تم تحديثي بأحدث بيانات المنصات الست (الجامعات، المدارس، الدورات، المكتبة، منصة ناشر، ومنصة Career للوظائف). كيف يمكنني توجيهك اليوم؟",
        onlineBadge: "متصل لحظياً ومحدث",
        advisorSubtitle: "مستشارك التعليمي والمهني الذكي",
        newChatTitle: "محادثة جديدة",
        quickOptionsTitle: "⚡ استفسارات سريعة وتوجيه مباشر:",
        whatsappBtn: "محادثة الدعم المباشر عبر الواتساب",
        inputPlaceholder: "اكتب استفسارك أو الجهة التي ترغب بتسجيلها...",
        quickPrompts: [
          { label: "🏛️ كيف أسجل كليتي أو معهدي؟", prompt: "كيف يمكنني تسجيل كليتي أو معهدي كمسؤول مؤسسي؟ وما هي الخطوات؟" },
          { label: "🏫 كيف أسجل مدرسة جديدة؟", prompt: "أريد تسجيل مدرسة في المنصة المدرسية، ما هي طريقة إنشاء الحساب والبيانات المطلوبة؟" },
          { label: "✍️ كيف تعمل منصة ناشر للمؤلفين والعقود؟", prompt: "اشرح لي مميزات منصة ناشر (Publisher) لتوثيق العقود ونشر المخطوطات والكتب للمؤلفين ودور النشر." },
          { label: "💼 كيف أستفيد من منصة Career والوظائف؟", prompt: "كيف أقدم على الوظائف الشاغرة أو أعلن عن وظائف جديدة للشركات والجامعات عبر منصة Career؟" },
          { label: "🎓 كيف أنشئ حساب كطالب؟", prompt: "كيف أنشئ حساب طالب جديد للوصول إلى المحاضرات والواجبات؟" },
          { label: "🔒 كيف تعمل سلاسل اعتماد الاختبارات؟", prompt: "اشرح لي آلية سلاسل الاعتماد الرقمي للاختبارات من رئيس القسم حتى العميد." },
        ],
      };
  }
};

const AIChatWidget = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic Realtime Platform Data Injection — only query when chat drawer is opened by user
  const { data: stats } = usePlatformStats("all", { enabled: isOpen });
  const { data: uniStats } = usePlatformStats("university", { enabled: isOpen });
  const { data: coursesData } = useAllCourses({ enabled: isOpen });
  const { data: booksData } = useBooks({ enabled: isOpen });

  const dynamicContext = useMemo(() => {
    if (!isOpen) return null;
    let jobsCount = 12;
    try {
      const saved = localStorage.getItem("unigates_career_jobs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) jobsCount = parsed.length;
      }
    } catch {
      // ignore
    }

    return {
      collegesCount: uniStats?.colleges ?? stats?.colleges ?? 0,
      institutesCount: uniStats?.institutes ?? stats?.institutes ?? 0,
      schoolsCount: stats?.schools ?? 0,
      coursesCount: coursesData?.length ?? 0,
      booksCount: booksData?.length ?? 0,
      publishersCount: stats?.publishers ?? 0,
      lecturersCount: stats?.lecturers ?? uniStats?.lecturers ?? 0,
      teachersCount: stats?.teachers ?? 0,
      studentsCount: stats?.students ?? uniStats?.students ?? 0,
      jobsCount,
      activePortals: [
        { name: "المنصة الجامعية (University Platform)", path: "/university-platform", badge: "كليات ومعاهد" },
        { name: "المنصة المدرسية (School Platform)", path: "/school-platform", badge: "مدارس K-12" },
        { name: "أكاديمية الدورات (Courses Academy)", path: "/courses", badge: "تدريب مهني" },
        { name: "متجر الكتب والمكتبة (Book Store)", path: "/book-store", badge: "دار عبيد" },
        { name: "منصة ناشر (Publisher Platform)", path: "/nasher", badge: "عقود ونشر" },
        { name: "منصة Career (Career Portal)", path: "/career", badge: "توظيف وكفاءات" },
      ]
    };
  }, [stats, uniStats, coursesData, booksData]);

  const localized = getLocalizedChatContent(language);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (allMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages,
        pageContext: {
          pathname: location.pathname,
          language,
          realtimeData: dynamicContext,
        },
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updated);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isRtl
            ? "عذراً، حدث خطأ في الاتصال. يمكنك التواصل المباشر مع فريق الدعم عبر الواتساب: [تواصل عبر الواتساب](https://wa.me/00966563057356)."
            : "Sorry, a connection error occurred. You can reach out directly via WhatsApp: [Contact on WhatsApp](https://wa.me/00966563057356).",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      isRtl
        ? "مرحباً، أود الاستفسار والتواصل بخصوص منصة UNIGATES"
        : "Hello, I would like to inquire about the UNIGATES platform"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Trigger Button on the Right - Vertical Orientation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 group flex flex-col items-center gap-2.5 py-3.5 px-2 sm:px-2.5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 hover:-translate-x-1 transition-all duration-300 ring-2 ring-white/40 dark:ring-white/20 cursor-pointer"
          aria-label="Open AI Assistant"
        >
          {/* Top Live Icon - Friendly Female AI Assistant Avatar */}
          <div className="relative w-10 h-10 rounded-2xl bg-white/20 p-0.5 flex items-center justify-center backdrop-blur-md shadow-md group-hover:scale-110 transition-transform overflow-visible">
            {/* Custom Modern Vector Illustrated Female AI Advisor Face */}
            <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="url(#femaleAiGrad)" />
              {/* Hair Back */}
              <path d="M16 28C16 17 23 10 32 10C41 10 48 17 48 28V38C48 44 43 49 37 49H27C21 49 16 44 16 38V28Z" fill="#2D1B4E" />
              {/* Head / Neck */}
              <rect x="28" y="38" width="8" height="8" rx="2" fill="#FDDCB8" />
              <ellipse cx="32" cy="28" rx="12" ry="13" fill="#FFE2C7" />
              {/* Hair Front / Bangs */}
              <path d="M18 24C20 16 26 12 32 12C38 12 44 16 46 24C43 20 38 18 32 18C26 18 21 20 18 24Z" fill="#3B2366" />
              <path d="M17 24C19 28 20 33 20 36C18 34 17 30 17 24Z" fill="#3B2366" />
              <path d="M47 24C45 28 44 33 44 36C46 34 47 30 47 24Z" fill="#3B2366" />
              {/* Friendly Eyes */}
              <ellipse cx="27" cy="27" rx="1.6" ry="2" fill="#1E1B4B" />
              <ellipse cx="37" cy="27" rx="1.6" ry="2" fill="#1E1B4B" />
              <circle cx="27.6" cy="26.3" r="0.6" fill="#FFFFFF" />
              <circle cx="37.6" cy="26.3" r="0.6" fill="#FFFFFF" />
              {/* Cheerful Smile & Rosy Cheeks */}
              <path d="M29 33C30.5 35 33.5 35 35 33" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="24" cy="30.5" r="1.8" fill="#FDA4AF" opacity="0.8" />
              <circle cx="40" cy="30.5" r="1.8" fill="#FDA4AF" opacity="0.8" />
              {/* Eyebrows */}
              <path d="M25 23.5C26.5 22.8 28.5 23 29 23.8" stroke="#3B2366" strokeWidth="1" strokeLinecap="round" />
              <path d="M39 23.5C37.5 22.8 35.5 23 35 23.8" stroke="#3B2366" strokeWidth="1" strokeLinecap="round" />
              {/* Smart AI Headset / Earpiece */}
              <path d="M18 25C17 25 16 26.5 16 28.5C16 30.5 17 32 18 32" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 30C17 34 22 36.5 25 36" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="25.5" cy="36" r="1.3" fill="#38BDF8" />
              {/* Professional Shirt/Collar */}
              <path d="M22 46C24 43 28 42 32 42C36 42 40 43 42 46V54H22V46Z" fill="#F8FAFC" />
              <path d="M28 42L32 46L36 42" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Gradients */}
              <defs>
                <linearGradient id="femaleAiGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366F1" />
                  <stop offset="1" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            {/* Live active green status dot */}
            <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>

          {/* Vertical Text */}
          <span
            className="font-black text-[11px] sm:text-xs tracking-wider text-slate-100 group-hover:text-amber-300 transition-colors select-none py-1"
            style={{
              writingMode: "vertical-rl",
              transform: isRtl ? "rotate(180deg)" : "rotate(180deg)",
              letterSpacing: "1px",
            }}
          >
            {isRtl ? "مساعدة UNIGATES الذكية" : "UNIGATES AI ADVISOR"}
          </span>

          {/* Bottom Mini Sparkle */}
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window Anchored on the Right */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] h-[580px] max-h-[calc(100vh-3rem)] bg-card border-2 border-primary/30 rounded-3xl shadow-2xl shadow-indigo-500/30 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 p-0.5 flex items-center justify-center backdrop-blur-md shadow-xs shrink-0 overflow-hidden">
                <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="30" fill="url(#femaleAiGradHeader)" />
                  <path d="M16 28C16 17 23 10 32 10C41 10 48 17 48 28V38C48 44 43 49 37 49H27C21 49 16 44 16 38V28Z" fill="#2D1B4E" />
                  <rect x="28" y="38" width="8" height="8" rx="2" fill="#FDDCB8" />
                  <ellipse cx="32" cy="28" rx="12" ry="13" fill="#FFE2C7" />
                  <path d="M18 24C20 16 26 12 32 12C38 12 44 16 46 24C43 20 38 18 32 18C26 18 21 20 18 24Z" fill="#3B2366" />
                  <path d="M17 24C19 28 20 33 20 36C18 34 17 30 17 24Z" fill="#3B2366" />
                  <path d="M47 24C45 28 44 33 44 36C46 34 47 30 47 24Z" fill="#3B2366" />
                  <ellipse cx="27" cy="27" rx="1.6" ry="2" fill="#1E1B4B" />
                  <ellipse cx="37" cy="27" rx="1.6" ry="2" fill="#1E1B4B" />
                  <circle cx="27.6" cy="26.3" r="0.6" fill="#FFFFFF" />
                  <circle cx="37.6" cy="26.3" r="0.6" fill="#FFFFFF" />
                  <path d="M29 33C30.5 35 33.5 35 35 33" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="24" cy="30.5" r="1.8" fill="#FDA4AF" opacity="0.8" />
                  <circle cx="40" cy="30.5" r="1.8" fill="#FDA4AF" opacity="0.8" />
                  <path d="M18 25C17 25 16 26.5 16 28.5C16 30.5 17 32 18 32" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17 30C17 34 22 36.5 25 36" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="25.5" cy="36" r="1.3" fill="#38BDF8" />
                  <path d="M22 46C24 43 28 42 32 42C36 42 40 43 42 46V54H22V46Z" fill="#F8FAFC" />
                  <defs>
                    <linearGradient id="femaleAiGradHeader" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#9333EA" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <p className="font-black text-sm leading-tight flex items-center gap-1.5">
                  <span>UNIGATES AI</span>
                  <Badge className="bg-emerald-400/20 text-emerald-300 border-emerald-400/30 text-[9px] px-1.5 py-0">
                    {localized.onlineBadge}
                  </Badge>
                </p>
                <p className="text-[10px] text-slate-200 font-medium">
                  {localized.advisorSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title={localized.newChatTitle}
                  className="hover:bg-white/20 rounded-xl p-1.5 transition-colors text-white/80 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-xl p-1.5 transition-colors text-white"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-muted/20">
            {/* Welcome message */}
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-card border border-border/80 text-foreground rounded-2xl rounded-tl-xs p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs space-y-2">
                <p>{localized.welcomeMsg}</p>
              </div>
            </div>

            {/* Quick Action Suggestion Chips (Shown on initial or empty chat) */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-black text-muted-foreground px-1">
                  {localized.quickOptionsTitle}
                </p>
                <div className="flex flex-col gap-1.5">
                  {localized.quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendText(qp.prompt)}
                      className="text-start px-3 py-2 rounded-xl bg-card hover:bg-primary/10 border border-border/80 hover:border-primary/40 text-xs font-bold text-foreground transition-all duration-200 shadow-xs flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{qp.label}</span>
                      <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs font-medium"
                      : "bg-card border border-border/80 text-foreground rounded-tl-xs font-normal whitespace-pre-wrap"
                  }`}
                >
                  {msg.role === "user"
                    ? msg.content
                    : renderMessageContent(msg.content, (to) => {
                        navigate(to);
                        setIsOpen(false);
                      })}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Direct Support Button */}
          <div className="px-3 pt-2 bg-card border-t border-border/40">
            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl py-2 px-3 transition-all duration-200 font-bold shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{localized.whatsappBtn}</span>
            </button>
          </div>

          {/* Text Input Footer */}
          <div className="p-3 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={localized.inputPlaceholder}
                className="flex-1 bg-muted/60 border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-xl w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
