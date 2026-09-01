import type { Language } from "@/contexts/LanguageContext";

/**
 * Universal Multilingual Glossary for UNIGATES.
 * Covers all platform tabs, dashboard items, roles, actions, subscriptions,
 * tables, headers, and UI states across all 8 supported languages:
 * AR (Arabic), EN (English), FR (French), ES (Spanish), DE (German), ZH (Chinese), RU (Russian), TR (Turkish).
 */

export const MULTILINGUAL_DICTIONARY: Record<string, Record<Language, string>> = {
  // --- Dashboard Menu Items & Tabs ---
  "الرئيسية": {
    ar: "الرئيسية",
    en: "Home",
    fr: "Accueil",
    es: "Inicio",
    de: "Startseite",
    zh: "首页",
    ru: "Главная",
    tr: "Ana Sayfa",
  },
  "نظرة عامة": {
    ar: "نظرة عامة",
    en: "Overview",
    fr: "Aperçu général",
    es: "Resumen general",
    de: "Übersicht",
    zh: "总览",
    ru: "Обзор",
    tr: "Genel Bakış",
  },
  "أعضاء هيئة التدريس": {
    ar: "أعضاء هيئة التدريس",
    en: "Faculty Members",
    fr: "Corps Enseignant",
    es: "Cuerpo Docente",
    de: "Lehrkörper",
    zh: "教职员工",
    ru: "Преподавательский состав",
    tr: "Öğretim Üyeleri",
  },
  "الأقسام": {
    ar: "الأقسام",
    en: "Departments",
    fr: "Départements",
    es: "Departamentos",
    de: "Abteilungen",
    zh: "院系部门",
    ru: "Кафедры и отделения",
    tr: "Bölümler",
  },
  "تسجيل الطلاب": {
    ar: "تسجيل الطلاب",
    en: "Student Registration",
    fr: "Inscription des Étudiants",
    es: "Registro de Estudiantes",
    de: "Studentenanmeldung",
    zh: "学生注册",
    ru: "Регистрация студентов",
    tr: "Öğrenci Kaydı",
  },
  "اشتراك الطلاب": {
    ar: "اشتراك الطلاب",
    en: "Student Subscriptions",
    fr: "Abonnements Étudiants",
    es: "Suscripciones de Estudiantes",
    de: "Studenten-Abonnements",
    zh: "学生订阅",
    ru: "Подписки студентов",
    tr: "Öğrenci Abonelikleri",
  },
  "التواصل": {
    ar: "التواصل",
    en: "Messages & Hub",
    fr: "Messagerie & Hub",
    es: "Mensajes & Hub",
    de: "Nachrichten & Hub",
    zh: "消息中心",
    ru: "Сообщения и связь",
    tr: "Mesajlar ve İletişim",
  },
  "الجداول": {
    ar: "الجداول",
    en: "Schedules",
    fr: "Emplois du Temps",
    es: "Horarios",
    de: "Stundenpläne",
    zh: "课程表与日程",
    ru: "Расписания",
    tr: "Ders Programları",
  },
  "النتائج": {
    ar: "النتائج",
    en: "Exam Results",
    fr: "Résultats d'Examens",
    es: "Resultados de Exámenes",
    de: "Prüfungsergebnisse",
    zh: "考试成绩",
    ru: "Результаты экзаменов",
    tr: "Sınav Sonuçları",
  },
  "بيانات الحساب": {
    ar: "بيانات الحساب",
    en: "Account Information",
    fr: "Informations du Compte",
    es: "Información de la Cuenta",
    de: "Kontoinformationen",
    zh: "账户信息",
    ru: "Данные учетной записи",
    tr: "Hesap Bilgileri",
  },
  "لوحة المعهد": {
    ar: "لوحة المعهد",
    en: "Institute Panel",
    fr: "Panneau de l'Institut",
    es: "Panel del Instituto",
    de: "Institutspanel",
    zh: "学院面板",
    ru: "Панель института",
    tr: "Enstitü Paneli",
  },
  "لوحة الكلية": {
    ar: "لوحة الكلية",
    en: "College Panel",
    fr: "Panneau de la Faculté",
    es: "Panel de la Facultad",
    de: "Fakultätspanel",
    zh: "大学院系面板",
    ru: "Панель факультета",
    tr: "Fakülte Paneli",
  },
  "لوحة إدارة المعهد": {
    ar: "لوحة إدارة المعهد",
    en: "Institute Administration",
    fr: "Administration de l'Institut",
    es: "Administración del Instituto",
    de: "Institutsverwaltung",
    zh: "学院管理面板",
    ru: "Управление институтом",
    tr: "Enstitü Yönetimi",
  },
  "لوحة إدارة الكلية": {
    ar: "لوحة إدارة الكلية",
    en: "College Administration",
    fr: "Administration de la Faculté",
    es: "Administración de la Facultad",
    de: "Fakultätsverwaltung",
    zh: "学院管理面板",
    ru: "Управление факультетом",
    tr: "Fakülte Yönetimi",
  },

  // --- Statistics & Overview ---
  "نظرة شاملة على الإحصائيات": {
    ar: "نظرة شاملة على الإحصائيات",
    en: "Comprehensive Statistics Overview",
    fr: "Aperçu Global des Statistiques",
    es: "Resumen Global de Estadísticas",
    de: "Umfassende Statistikübersicht",
    zh: "统计数据总览",
    ru: "Полный статистический обзор",
    tr: "Kapsamlı İstatistik Genel Bakışı",
  },
  "آخر 7 أيام": {
    ar: "آخر 7 أيام",
    en: "Last 7 Days",
    fr: "7 derniers jours",
    es: "Últimos 7 días",
    de: "Letzte 7 Tage",
    zh: "最近7天",
    ru: "Последние 7 дней",
    tr: "Son 7 Gün",
  },
  "آخر 30 يوم": {
    ar: "آخر 30 يوم",
    en: "Last 30 Days",
    fr: "30 derniers jours",
    es: "Últimos 30 días",
    de: "Letzte 30 Tage",
    zh: "最近30天",
    ru: "Последние 30 дней",
    tr: "Son 30 Gün",
  },
  "الخطة المجانية": {
    ar: "الخطة المجانية",
    en: "Free Plan",
    fr: "Forfait Gratuit",
    es: "Plan Gratuito",
    de: "Kostenloser Plan",
    zh: "免费方案",
    ru: "Бесплатный тариф",
    tr: "Ücretsiz Plan",
  },
  "الباقة الشهرية": {
    ar: "الباقة الشهرية",
    en: "Monthly Plan",
    fr: "Forfait Mensuel",
    es: "Plan Mensual",
    de: "Monatsplan",
    zh: "按月订阅",
    ru: "Месячный план",
    tr: "Aylık Plan",
  },
  "الباقة السنوية": {
    ar: "الباقة السنوية",
    en: "Annual Plan",
    fr: "Forfait Annuel",
    es: "Plan Anual",
    de: "Jahresplan",
    zh: "按年订阅",
    ru: "Годовой план",
    tr: "Yıllık Plan",
  },

  // --- Subscriptions & Pricing ---
  "سعة الباقة المجانية": {
    ar: "سعة الباقة المجانية",
    en: "Free Tier Capacity",
    fr: "Capacité du Forfait Gratuit",
    es: "Capacidad del Plan Gratuito",
    de: "Kapazität des Gratis-Plans",
    zh: "免费层级容量",
    ru: "Лимит бесплатного тарифа",
    tr: "Ücretsiz Plan Kapasitesi",
  },
  "الطلاب المفعلون": {
    ar: "الطلاب المفعلون",
    en: "Active Students",
    fr: "Étudiants Actifs",
    es: "Estudiantes Activos",
    de: "Aktive Studenten",
    zh: "已激活学生",
    ru: "Активные студенты",
    tr: "Aktif Öğrenciler",
  },
  "بانتظار سداد الاشتراك": {
    ar: "بانتظار سداد الاشتراك",
    en: "Pending Payment",
    fr: "En Attente de Paiement",
    es: "Pago Pendiente",
    de: "Zahlung ausstehend",
    zh: "待付款学生",
    ru: "Ожидают оплаты",
    tr: "Ödeme Bekleyenler",
  },
  "مستحقات التفعيل": {
    ar: "مستحقات التفعيل",
    en: "Total Due",
    fr: "Montant Dû",
    es: "Total Adeudado",
    de: "Fälliger Gesamtbetrag",
    zh: "应付总额",
    ru: "Сумма к оплате",
    tr: "Toplam Ödenecek",
  },
  "سداد وتفعيل الكل الآن": {
    ar: "سداد وتفعيل الكل الآن",
    en: "Pay & Activate All",
    fr: "Tout Payer & Activer",
    es: "Pagar y Activar Todos",
    de: "Alle Bezahlen & Aktivieren",
    zh: "立即全额支付并激活",
    ru: "Оплатить и активировать всех",
    tr: "Tümünü Öde ve Etkinleştir",
  },
  "سداد وتفعيل": {
    ar: "سداد وتفعيل",
    en: "Pay & Activate",
    fr: "Payer & Activer",
    es: "Pagar y Activar",
    de: "Bezahlen & Aktivieren",
    zh: "支付并激活",
    ru: "Оплатить и активировать",
    tr: "Öde ve Etkinleştir",
  },
  "مفعّل": {
    ar: "مفعّل",
    en: "Active",
    fr: "Actif",
    es: "Activo",
    de: "Aktiv",
    zh: "已启用",
    ru: "Активен",
    tr: "Aktif",
  },
  "معلق": {
    ar: "معلق",
    en: "Suspended",
    fr: "Suspendu",
    es: "Suspendido",
    de: "Gesperrt",
    zh: "暂停",
    ru: "Приостановлен",
    tr: "Askıya Alındı",
  },
  "تجديد": {
    ar: "تجديد",
    en: "Renew",
    fr: "Renouveler",
    es: "Renovar",
    de: "Verlängern",
    zh: "续订",
    ru: "Продлить",
    tr: "Yenile",
  },
  "اشتراك مدفوع نشط": {
    ar: "اشتراك مدفوع نشط",
    en: "Active Paid Subscription",
    fr: "Abonnement Payant Actif",
    es: "Suscripción Pagada Activa",
    de: "Aktives Bezahltes Abo",
    zh: "有效付费订阅",
    ru: "Активная платная подписка",
    tr: "Aktif Ücretli Abonelik",
  },

  // --- Common Actions & Buttons ---
  "بحث": {
    ar: "بحث",
    en: "Search",
    fr: "Rechercher",
    es: "Buscar",
    de: "Suchen",
    zh: "搜索",
    ru: "Поиск",
    tr: "Ara",
  },
  "إضافة": {
    ar: "إضافة",
    en: "Add",
    fr: "Ajouter",
    es: "Agregar",
    de: "Hinzufügen",
    zh: "添加",
    ru: "Добавить",
    tr: "Ekle",
  },
  "إضافة عضو": {
    ar: "إضافة عضو",
    en: "Add Member",
    fr: "Ajouter un Membre",
    es: "Agregar Miembro",
    de: "Mitglied Hinzufügen",
    zh: "添加成员",
    ru: "Добавить участника",
    tr: "Üye Ekle",
  },
  "حفظ التغييرات": {
    ar: "حفظ التغييرات",
    en: "Save Changes",
    fr: "Enregistrer les Modifications",
    es: "Guardar Cambios",
    de: "Änderungen Speichern",
    zh: "保存更改",
    ru: "Сохранить изменения",
    tr: "Değişiklikleri Kaydet",
  },
  "إلغاء": {
    ar: "إلغاء",
    en: "Cancel",
    fr: "Annuler",
    es: "Cancelar",
    de: "Abbrechen",
    zh: "取消",
    ru: "Отмена",
    tr: "İptal",
  },
  "رجوع": {
    ar: "رجوع",
    en: "Back",
    fr: "Retour",
    es: "Atrás",
    de: "Zurück",
    zh: "返回",
    ru: "Назад",
    tr: "Geri",
  },
  "تسجيل الخروج": {
    ar: "تسجيل الخروج",
    en: "Logout",
    fr: "Déconnexion",
    es: "Cerrar Sesión",
    de: "Abmelden",
    zh: "退出登录",
    ru: "Выйти",
    tr: "Çıkış Yap",
  },
  "تسجيل الدخول": {
    ar: "تسجيل الدخول",
    en: "Sign In",
    fr: "Connexion",
    es: "Iniciar Sesión",
    de: "Anmelden",
    zh: "登录",
    ru: "Войти",
    tr: "Giriş Yap",
  },
  "إنشاء حساب": {
    ar: "إنشاء حساب",
    en: "Create Account",
    fr: "Créer un Compte",
    es: "Crear Cuenta",
    de: "Konto Erstellen",
    zh: "创建账户",
    ru: "Создать аккаунт",
    tr: "Hesap Oluştur",
  },

  // --- Theme & Brightness ---
  "السطوع والمظهر": {
    ar: "السطوع والمظهر",
    en: "Theme & Brightness",
    fr: "Thème & Luminosité",
    es: "Tema y Brillo",
    de: "Design & Helligkeit",
    zh: "主题与亮度",
    ru: "Тема и яркость",
    tr: "Tema ve Parlaklık",
  },
  "السطوع الطبيعي": {
    ar: "السطوع الطبيعي",
    en: "Natural Light",
    fr: "Luminosité Naturelle",
    es: "Brillo Natural",
    de: "Natürliches Licht",
    zh: "自然明亮",
    ru: "Естественный свет",
    tr: "Doğal Parlaklık",
  },
  "الوضع الداكن": {
    ar: "الوضع الداكن",
    en: "Dark Mode",
    fr: "Mode Sombre",
    es: "Modo Oscuro",
    de: "Dunkelmodus",
    zh: "深色模式",
    ru: "Темный режим",
    tr: "Karanlık Mod",
  },
  "تلقائي": {
    ar: "تلقائي",
    en: "System Auto",
    fr: "Automatique Système",
    es: "Automático del Sistema",
    de: "System-Standard",
    zh: "跟随系统",
    ru: "Системный",
    tr: "Sistem Otomatik",
  },

  // --- Platform Names ---
  "المنصة الجامعية": {
    ar: "المنصة الجامعية",
    en: "University Platform",
    fr: "Plateforme Universitaire",
    es: "Plataforma Universitaria",
    de: "Universitätsplattform",
    zh: "高等大学平台",
    ru: "Университетская платформа",
    tr: "Üniversite Platformu",
  },
  "المنصة المدرسية": {
    ar: "المنصة المدرسية",
    en: "School Platform",
    fr: "Plateforme Scolaire",
    es: "Plataforma Escolar",
    de: "Schulplattform",
    zh: "K-12智慧中小学平台",
    ru: "Школьная платформа",
    tr: "Okul Platformu",
  },
  "منصة الدورات": {
    ar: "منصة الدورات",
    en: "Courses Academy",
    fr: "Académie des Cours",
    es: "Academia de Cursos",
    de: "Kursakademie",
    zh: "职业培训与课程平台",
    ru: "Академия курсов",
    tr: "Kurslar ve Eğitim Platformu",
  },
  "متجر الكتب": {
    ar: "متجر الكتب",
    en: "Book Store",
    fr: "Librairie & Édition",
    es: "Librería y Editorial",
    de: "Buchhandlung & Verlag",
    zh: "学术书店与出版社",
    ru: "Книжный магазин и издательство",
    tr: "Kitap Mağazası ve Yayıncılık",
  },
};

/**
 * Normalizes text to lookup inside the multilingual dictionary.
 */
function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

// Build fast inverted indexes for instant lookups from English or Arabic
const AR_INDEX = new Map<string, Record<Language, string>>();
const EN_INDEX = new Map<string, Record<Language, string>>();

for (const [key, translations] of Object.entries(MULTILINGUAL_DICTIONARY)) {
  const normAr = normalizeKey(key);
  AR_INDEX.set(normAr, translations);
  if (translations.ar) AR_INDEX.set(normalizeKey(translations.ar), translations);
  if (translations.en) EN_INDEX.set(normalizeKey(translations.en), translations);
}

/**
 * Universal translation function that returns the target translation in the active language.
 */
export function translateTerm(
  arabicOrEnglishText: string,
  lang: Language,
  fallbackEnglish?: string
): string {
  if (!arabicOrEnglishText && !fallbackEnglish) return "";
  if (lang === "ar" && arabicOrEnglishText) return arabicOrEnglishText;

  const normInput = normalizeKey(arabicOrEnglishText || "");
  const normFallback = normalizeKey(fallbackEnglish || "");

  // 1. Direct dictionary match
  if (MULTILINGUAL_DICTIONARY[arabicOrEnglishText]?.[lang]) {
    return MULTILINGUAL_DICTIONARY[arabicOrEnglishText][lang];
  }

  // 2. Arabic Index match
  const fromAr = AR_INDEX.get(normInput);
  if (fromAr?.[lang]) {
    return fromAr[lang];
  }

  // 3. English Index match
  const fromEn = EN_INDEX.get(normInput) || (normFallback ? EN_INDEX.get(normFallback) : undefined);
  if (fromEn?.[lang]) {
    return fromEn[lang];
  }

  // 4. Default fallbacks
  if (lang === "en") return fallbackEnglish || arabicOrEnglishText;
  return fromAr?.en || fromEn?.en || fallbackEnglish || arabicOrEnglishText;
}
