export const cloudSpaces = [
  { id: "college", ar: "الكليات", en: "Colleges", route: "/signup/college/admin", arDetail: "أقسام أكاديمية، أعضاء هيئة تدريس، وطلاب في مساحة واحدة.", enDetail: "Academic departments, faculty and students in one workspace." },
  { id: "institute", ar: "المعاهد", en: "Institutes", route: "/signup/institute/admin", arDetail: "نظّم برامجك التعليمية وإدارة المعهد من مكان واحد.", enDetail: "Bring your educational programs and institute administration together." },
  { id: "school", ar: "المدارس", en: "Schools", route: "/school-registration", arDetail: "مساحة للمعلمين والطلاب تجمع المواد والدروس والواجبات.", enDetail: "A space for teachers, students, subjects, lessons and homework." },
  { id: "language", ar: "مراكز اللغة", en: "Language centers", route: "/signup/language-center/admin", arDetail: "اجمع مستويات اللغة ومدرّسيك ومتعلميك تحت هويتك.", enDetail: "Bring language levels, instructors and learners under your identity." },
  { id: "training", ar: "مراكز التدريب", en: "Training centers", route: "/signup/training-center/admin", arDetail: "بيئة لبرامجك التدريبية ومحتواك وفريقك التعليمي.", enDetail: "A home for your training programs, content and teaching team." },
] as const;

export const retiredPlatformEntries = ["/courses", "/courses/browse", "/courses/catalog", "/book-store", "/book-store/catalog", "/book-store/browse", "/school-platform"] as const;