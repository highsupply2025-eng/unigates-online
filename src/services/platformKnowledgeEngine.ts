import { BookStoreDataStore } from "./bookStoreDataStore";
import { NashrDataStore } from "./nashrDataStore";

export interface LivePlatformKnowledge {
  timestamp: string;
  bookStore: {
    totalBooks: number;
    categories: string[];
    bestsellers: { title: string; author: string; priceDigital: number; pricePrint: number; code: string }[];
    recentBooks: { title: string; author: string; priceDigital: number; pricePrint: number; code: string }[];
    activeOffers: { title: string; discountText: string }[];
  };
  nashr: {
    publisherName: string;
    royalties: { digital: string; print: string };
    payoutMethods: string[];
    approvalProcess: string;
  };
  career: {
    totalJobs: number;
    recentJobs: { title: string; company: string; type: string; location: string }[];
  };
  universitiesAndSchools: {
    accreditedInstitutions: string[];
    examApprovalChain: string;
  };
}

/**
 * محرك استخراج المعرفة اللحظية للمنصة (Live Knowledge Extractor)
 * يستخرج أحدث البيانات المضافة في متجر الكتب، منصة نشر، الوظائف، والجامعات فور حدوثها
 */
export class PlatformKnowledgeEngine {
  public static getLiveKnowledge(): LivePlatformKnowledge {
    // 1. استخراج أحدث كتب متجر دار عبيد
    const catalog = BookStoreDataStore.getCatalog();
    const categoriesSet = new Set<string>();
    catalog.forEach((b) => {
      if (b.category_ar) categoriesSet.add(b.category_ar);
      else if (b.category) categoriesSet.add(b.category);
    });

    const bestsellers = catalog
      .filter((b) => b.is_bestseller)
      .map((b) => ({
        title: b.title_ar,
        author: b.author_ar,
        priceDigital: b.price_digital,
        pricePrint: b.price_print,
        code: b.code
      }));

    const recentBooks = catalog.slice(-4).map((b) => ({
      title: b.title_ar,
      author: b.author_ar,
      priceDigital: b.price_digital,
      pricePrint: b.price_print,
      code: b.code
    }));

    const activeOffers = catalog
      .filter((b) => b.price_print > 200 || b.is_bestseller)
      .slice(0, 3)
      .map((b) => ({
        title: b.title_ar,
        discountText: "خصم 20% على النسخة المزدوجة + شحن سريع"
      }));

    // 2. استخراج بيانات منصة نشر والمؤلفين
    const nashrData = {
      publisherName: "دار عبيد للنشر والتوزيع والطباعة الأكاديمية",
      royalties: {
        digital: "70% للمؤلف من مبيعات النسخ الرقمية (DRM)",
        print: "30% للمؤلف من مبيعات النسخ الورقية المطبوعة"
      },
      payoutMethods: [
        "شبكة التحويل اللحظي إنستاباي (InstaPay)",
        "التحويل البنكي الرسمي إلى الحساب أو الآيبان (IBAN)",
        "المحافظ الإلكترونية (فودافون كاش، اتصالات كاش، أورنج)"
      ],
      approvalProcess: "تدقيق لغوي وأكاديمي من لجان دار عبيد -> تسعير واستديو إدارة المتجر -> نشر فوري بالمتجر"
    };

    // 3. استخراج بيانات منصة Career والوظائف
    let jobsList: any[] = [];
    try {
      const savedJobs = localStorage.getItem("unigates_career_jobs");
      if (savedJobs) {
        jobsList = JSON.parse(savedJobs);
      }
    } catch {
      // fallback
    }

    const recentJobs = (jobsList.length > 0 ? jobsList : [
      { title: "أستاذ مشارك علوم حاسب وذكاء اصطناعي", company: "جامعة القاهرة", type: "دوام كامل", location: "الجيزة، مصر" },
      { title: "معلم رياضيات للمرحلة الثانوية K-12", company: "مدارس النيل الدولية", type: "دوام كامل", location: "القاهرة، مصر" },
      { title: "مهندس نظم برمجية سحابية ومطور أول", company: "حلول التقنية المتقدمة", type: "عن بُعد", location: "الرياض / القاهرة" }
    ]).slice(0, 5);

    return {
      timestamp: new Date().toISOString(),
      bookStore: {
        totalBooks: catalog.length,
        categories: Array.from(categoriesSet),
        bestsellers,
        recentBooks,
        activeOffers
      },
      nashr: nashrData,
      career: {
        totalJobs: jobsList.length || 12,
        recentJobs
      },
      universitiesAndSchools: {
        accreditedInstitutions: [
          "جامعة القاهرة", "جامعة عين شمس", "جامعة المنوفية", "جامعة الملك سعود", "مدارس الرواد الدولية"
        ],
        examApprovalChain: "أستاذ المادة -> رئيس القسم العلمي -> وكيل الكلية لشؤون الطلاب -> عميد الكلية"
      }
    };
  }

  /**
   * الإجابة الذكية التلقائية الفائقة على أسئلة واستفسارات الجمهور
   * تفحص أحدث البيانات المضافة في الكتالوج والوظائف وتولد إجابة دقيقة وروابط موجهة
   */
  public static answerQueryWithLiveKnowledge(query: string, language: string = "ar"): string {
    const q = query.toLowerCase().trim();
    const knowledge = this.getLiveKnowledge();

    // 1. استفسارات متجر الكتب أو أسماء كتب معينة
    if (q.includes("كتاب") || q.includes("متجر") || q.includes("شراء") || q.includes("رواية") || q.includes("كتب") || q.includes("دار عبيد") || q.includes("سعر") || q.includes("book")) {
      // البحث عن كتاب بعينه في الكتالوج
      const catalog = BookStoreDataStore.getCatalog();
      const matchedBook = catalog.find(b => 
        q.includes(b.title_ar.toLowerCase()) || 
        q.includes(b.title_en?.toLowerCase() || "") ||
        q.includes(b.code.toLowerCase()) ||
        q.includes(b.author_ar.toLowerCase())
      );

      if (matchedBook) {
        return `📚 **تفاصيل كتاب «${matchedBook.title_ar}» المعتمد بمتجر دار عبيد:**\n\n` +
          `• **المؤلف:** ${matchedBook.author_ar} (كود المؤلف: ${matchedBook.author_code || "AUT-7890"})\n` +
          `• **كود الكتاب:** \`${matchedBook.code}\`\n` +
          `• **سعر النسخة الرقمية (DRM):** ${matchedBook.price_digital} ج.م (قراءة سحابية فورية)\n` +
          `• **سعر النسخة الورقية الفاخرة:** ${matchedBook.price_print} ج.م (توصيل لباب المنزل)\n` +
          `• **النبذة:** ${matchedBook.description_ar?.slice(0, 180)}...\n\n` +
          `🛒 يمكنك شراؤه أو إضافته لسلتك الآن عبر: [تصفح الكتاب في متجر الكتب](/book-store).`;
      }

      // إذا كان السؤال عام عن المتجر أو الكتب الأكثر طلباً أو جديدنا
      if (q.includes("أكثر") || q.includes("طلب") || q.includes("مبيع") || q.includes("bestseller")) {
        const topList = knowledge.bookStore.bestsellers.slice(0, 3).map(b => 
          `• **«${b.title}»** - للمؤلف ${b.author} (رقمي: ${b.priceDigital} ج.م | ورقي: ${b.pricePrint} ج.م)`
        ).join("\n");

        return `🔥 **قائمة الكتب الأكثر طلباً ومبيعاً حالياً في متجر الكتب (دار عبيد):**\n\n` +
          `${topList}\n\n` +
          `✨ جميع الكتب متاحة بنظام القراءة الرقمية المشفرة فوراً وشحن النسخ المطبوعة.\n` +
          `🔗 يمكنك استعراض الكتالوج الكامل والطلب مباشرة من: [متجر كتب UNIGATES](/book-store).`;
      }

      if (q.includes("جديد") || q.includes("أحدث") || q.includes("new")) {
        const recentList = knowledge.bookStore.recentBooks.slice(0, 3).map(b => 
          `• **«${b.title}»** - تأليف: ${b.author} (\`${b.code}\`)`
        ).join("\n");

        return `✨ **أحدث الكتب والمؤلفات المضافة حديثاً بمتجر الكتب:**\n\n` +
          `${recentList}\n\n` +
          `📖 يمكنك الاطلاع عليها والشراء الفوري عبر: [قسم جديدنا بمتجر الكتب](/book-store).`;
      }

      return `📖 **متجر الكتب الإلكتروني الرسمي (دار عبيد للنشر والتوزيع):**\n\n` +
        `يحتوي المتجر حالياً على **${knowledge.bookStore.totalBooks} كتاباً ومؤلفاً أكاديمياً معتمداً** تشمل:\n` +
        `• مراجع الهندسة، البرمجة والذكاء الاصطناعي، إدارة الأعمال وPMP، العلوم الإنسانية، والأدب العالمي.\n` +
        `• خيارات شراء مرنة: **نسخ رقمية DRM** قراءة فورية + **نسخ ورقية فاخرة** مع شحن سريع لجميع المحافظات والدول.\n\n` +
        `🔗 تصفح كافة الأقسام الآن: [الدخول إلى متجر الكتب](/book-store).`;
    }

    // 2. استفسارات منصة نشر (المؤلفين، الأرباح، شروط النشر)
    if (q.includes("نشر") || q.includes("مؤلف") || q.includes("مخطوط") || q.includes("أرباح") || q.includes("نسبة") || q.includes("nashr") || q.includes("author")) {
      return `✍️ **منصة نشر (Nashr) - بوابتك الرسمية لنشر وتوزيع مؤلفاتك الأكاديمية:**\n\n` +
        `1. **نسب أرباح المؤلف المعتمدة:**\n` +
        `   • **70%** من سعر النسخة الرقمية (DRM) تودع في حسابك فور كل عملية شراء.\n` +
        `   • **30%** من سعر النسخة الورقية المطبوعة.\n` +
        `2. **آلية النشر:**\n` +
        `   • ترفع مخطوطتك وملخص الكتاب وغلافه عبر حساب المؤلف.\n` +
        `   • تخضع للمراجعة والتدقيق اللغوي والأكاديمي من لجان دار عبيد.\n` +
        `   • بعد الاعتماد، ينتقل الكتاب إلى **استديو إدارة متجر الكتب** للتسعير والعرض بالمتجر.\n` +
        `3. **طرق سحب الأرباح المتاحة:**\n` +
        `   • إنستاباي (InstaPay)، التحويل البنكي الرسمي (IBAN)، أو المحافظ الإلكترونية.\n\n` +
        `🔗 ابدأ الآن وقدم مخطوطتك: [الانتقال إلى منصة نشر](/nashr) أو [تسجيل حساب مؤلف جديد](/nashr/signup).`;
    }

    // 3. استفسارات منصة Career والوظائف والتوظيف
    if (q.includes("وظي") || q.includes("عمل") || q.includes("career") || q.includes("job") || q.includes("توظيف") || q.includes("سيرة")) {
      const jobsPreview = knowledge.career.recentJobs.slice(0, 3).map(j => 
        `• **${j.title}** - ${j.company} (${j.location} • ${j.type})`
      ).join("\n");

      return `💼 **منصة Career للوظائف والكفاءات الأكاديمية والمهنية:**\n\n` +
        `تضم المنصة حالياً أكثر من **${knowledge.career.totalJobs} فرصة وظيفية نشطة** لدى كبرى الجامعات، المدارس، والمراكز المعتمدة:\n\n` +
        `${jobsPreview}\n\n` +
        `🎯 **كيف تستفيد من المنصة؟**\n` +
        `• يمكنك البحث والتصفية حسب التخصص، وتقديم سيرتك الذاتية مباشرة بضغطة زر.\n` +
        `• تتيح للمؤسسات والشركات الإعلان عن شواغرها واستقطاب الكوادر الأكاديمية.\n\n` +
        `🔗 استعرض كافة الفرص وقدم الآن: [بوابة الوظائف Career](/career).`;
    }

    // 4. استفسارات تسجيل الكليات والمعاهد
    if (q.includes("كلية") || q.includes("معهد") || q.includes("جامع") || q.includes("college") || q.includes("university")) {
      return `🏛️ **تسجيل وإدارة الكليات والمعاهد في المنصة الجامعية:**\n\n` +
        `تتيح UNIGATES للعمداء ومديري المعاهد اعتماد منصة رقمية متكاملة تشمل:\n` +
        `• إدارة الأقسام والبرامج الأكاديمية وأعضاء هيئة التدريس.\n` +
        `• نظام المحاضرات المباشرة وتسجيل الحضور والجداول.\n` +
        `• **سلاسل الاعتماد الرقمي للاختبارات:** تبدأ من أستاذ المادة وتمر برئيس القسم ووكيل الكلية حتى اعتماد العميد النهائي المشفر.\n\n` +
        `🔗 للبدء: [تسجيل كلية جديدة](/signup/college/admin) أو [تسجيل معهد أكاديمي](/signup/institute/admin).`;
    }

    // 5. استفسارات المدارس
    if (q.includes("مدرس") || q.includes("school") || q.includes("طالب") || q.includes("معلم")) {
      return `🏫 **المنصة المدرسية الذكية (K-12):**\n\n` +
        `مصممة خصيصاً للمدارس والمجمعات التعليمية لإدارة المراحل الابتدائية والإعدادية والثانوية:\n` +
        `• تواصل تفاعلي بين الإدارة، المعلمين، أولياء الأمور، والطلاب.\n` +
        `• بنوك أسئلة واختبارات إلكترونية ومتابعة فورية للدرجات والغياب.\n\n` +
        `🔗 يمكنك تسجيل مدرستك فوراً عبر: [تسجيل مدرسة جديدة](/school-registration).`;
    }

    // 6. استفسارات الدورات والتدريب
    if (q.includes("دورة") || q.includes("كورس") || q.includes("تدريب") || q.includes("courses")) {
      return `🎓 **أكاديمية الدورات والتدريب الاحترافي:**\n\n` +
        `توفر مسارات تدريبية معتمدة في البرمجة، إدارة المشاريع (PMP)، الذكاء الاصطناعي، واللغات.\n` +
        `• شهادات إتمام رقمية معتمدة بكود تحقق فريد.\n` +
        `• إمكانية تسجيل مراكز التدريب والمدربين المستقلين لطرح دوراتهم.\n\n` +
        `🔗 تصفح جميع الدورات: [أكاديمية الدورات التدريبية](/courses).`;
    }

    // إجابة توجيهية شاملة للمنظومة
    return `مرحباً بك! 👋 أنا مستشارك الذكي لمنظومة **UNIGATES**، ومحدث لحظياً بأحدث بيانات منصاتنا الست:\n\n` +
      `1. 📚 **[متجر الكتب الأكاديمي](/book-store):** مراجع ورقية ورقمية (${knowledge.bookStore.totalBooks} كتاباً معتمداً لدار عبيد).\n` +
      `2. ✍️ **[منصة نشر المؤلفات](/nashr):** أرباح 70% رقمي و30% ورقي للمؤلفين وتدقيق أكاديمي رسمي.\n` +
      `3. 💼 **[منصة الوظائف Career](/career):** أحدث الشواغر الأكاديمية والمهنية بالجامعات والشركات.\n` +
      `4. 🏛️ **[المنصة الجامعية](/university-platform):** إدارة الكليات والمعاهد وسلاسل اعتماد الامتحانات.\n` +
      `5. 🏫 **[المنصة المدرسية](/school-platform):** حلول رقمية شاملة لمدارس التعليم العام.\n` +
      `6. 🎓 **[أكاديمية الدورات](/courses):** برامج تدريبية وتأهيل مهني بشهادات معتمدة.\n\n` +
      `يمكنك سؤالي عن أي كتاب، مؤلف، فرصة وظيفية، أو خطوات التسجيل وسأجيبك فوراً!`;
  }
}
