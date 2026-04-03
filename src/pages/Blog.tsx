import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Calendar, User, Clock } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";

const blogPosts = {
  ar: [
    { title: "كيف تختار التخصص الجامعي المناسب لك؟", excerpt: "دليل شامل يساعدك في اتخاذ القرار الصحيح عند اختيار تخصصك الجامعي بناءً على مهاراتك واهتماماتك وسوق العمل.", author: "فريق UNIGATE", date: "2026-03-28", readTime: "5 دقائق", category: "نصائح أكاديمية" },
    { title: "أفضل 10 مهارات يبحث عنها سوق العمل في 2026", excerpt: "تعرف على المهارات الأكثر طلباً في سوق العمل وكيف يمكنك تطويرها من خلال الدورات التعليمية المتاحة على المنصة.", author: "فريق UNIGATE", date: "2026-03-20", readTime: "7 دقائق", category: "سوق العمل" },
    { title: "التعلم عن بُعد: مزايا وتحديات وكيف تتغلب عليها", excerpt: "استكشف فوائد التعلم الإلكتروني والتحديات الشائعة مع نصائح عملية لتحقيق أقصى استفادة من تجربتك التعليمية.", author: "فريق UNIGATE", date: "2026-03-15", readTime: "6 دقائق", category: "التعليم الإلكتروني" },
    { title: "دور الذكاء الاصطناعي في تطوير التعليم الجامعي", excerpt: "كيف يُحدث الذكاء الاصطناعي ثورة في طرق التدريس والتعلم في الجامعات والمعاهد حول العالم.", author: "فريق UNIGATE", date: "2026-03-10", readTime: "8 دقائق", category: "تقنية" },
    { title: "نصائح ذهبية للنجاح في الامتحانات الجامعية", excerpt: "مجموعة من الاستراتيجيات المجربة التي تساعدك على التحضير الفعّال للامتحانات وتحقيق أعلى الدرجات.", author: "فريق UNIGATE", date: "2026-03-05", readTime: "4 دقائق", category: "نصائح أكاديمية" },
    { title: "كيف تبني سيرة ذاتية احترافية كطالب جامعي", excerpt: "خطوات عملية لإنشاء سيرة ذاتية مميزة تبرز مهاراتك وخبراتك حتى لو كنت في بداية مسيرتك المهنية.", author: "فريق UNIGATE", date: "2026-02-28", readTime: "5 دقائق", category: "سوق العمل" },
  ],
  en: [
    { title: "How to Choose the Right University Major for You?", excerpt: "A comprehensive guide to help you make the right decision when choosing your university major based on your skills, interests, and job market.", author: "UNIGATE Team", date: "2026-03-28", readTime: "5 min read", category: "Academic Tips" },
    { title: "Top 10 Skills the Job Market Demands in 2026", excerpt: "Discover the most in-demand skills in the job market and how you can develop them through courses available on the platform.", author: "UNIGATE Team", date: "2026-03-20", readTime: "7 min read", category: "Job Market" },
    { title: "Remote Learning: Benefits, Challenges & How to Overcome Them", excerpt: "Explore the benefits of e-learning and common challenges with practical tips to maximize your educational experience.", author: "UNIGATE Team", date: "2026-03-15", readTime: "6 min read", category: "E-Learning" },
    { title: "The Role of AI in Developing University Education", excerpt: "How artificial intelligence is revolutionizing teaching and learning methods in universities and institutes worldwide.", author: "UNIGATE Team", date: "2026-03-10", readTime: "8 min read", category: "Technology" },
    { title: "Golden Tips for Acing University Exams", excerpt: "A collection of proven strategies to help you prepare effectively for exams and achieve top grades.", author: "UNIGATE Team", date: "2026-03-05", readTime: "4 min read", category: "Academic Tips" },
    { title: "How to Build a Professional Resume as a University Student", excerpt: "Practical steps to create a standout resume that highlights your skills and experience even at the start of your career.", author: "UNIGATE Team", date: "2026-02-28", readTime: "5 min read", category: "Job Market" },
  ],
};

const Blog = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const posts = blogPosts[language];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/20 via-accent/40 to-background py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/40 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              {isRtl ? "المدونة" : "Blog"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {isRtl
                ? "مقالات ونصائح تعليمية لمساعدتك في رحلتك الأكاديمية والمهنية"
                : "Educational articles and tips to help you in your academic and career journey"}
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-14 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {posts.map((post, i) => (
              <article
                key={i}
                className="group rounded-2xl border-2 border-primary/20 bg-card hover:border-primary/60 hover:shadow-2xl shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="h-2.5 bg-gradient-to-r from-primary via-[hsl(190,80%,45%)] to-[hsl(200,75%,30%)]" />
                <div className="p-6 space-y-4">
                  <span className="inline-block text-xs font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-full shadow-sm">
                    {post.category}
                  </span>
                  <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-primary/10">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Blog;
