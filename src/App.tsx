import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FirewallProvider } from "@/contexts/FirewallContext";
import { SecurityBlockedScreen } from "@/components/security/SecurityBlockedScreen";
import Index from "./pages/Index";
import { useSingleSession } from "@/hooks/use-single-session";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import RouteFallback from "./components/RouteFallback";
import PrefetchRoutes from "./PrefetchRoutes";
import BottomNav from "./components/BottomNav";
import StudentAccessGuard from "./components/StudentAccessGuard";
import NavigationProgress from "./components/NavigationProgress";

const AIChatWidget = lazy(() => import("./components/AIChatWidget"));
const ForcePasswordChangeDialog = lazy(() => import("./components/ForcePasswordChangeDialog"));

const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const CoursesPlatform = lazy(() => import("./pages/CoursesPlatform"));
const CoursesSignup = lazy(() => import("./pages/CoursesSignup"));
const CoursesLogin = lazy(() => import("./pages/CoursesLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Courses = lazy(() => import("./pages/Courses"));
const ChoosePlan = lazy(() => import("./pages/ChoosePlan"));
const Payment = lazy(() => import("./pages/Payment"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const LecturerDashboard = lazy(() => import("./pages/LecturerDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const CourseProviderDashboard = lazy(() => import("./pages/CourseProviderDashboard"));
const LecturerCourseContent = lazy(() => import("./pages/LecturerCourseContent"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const BookStoreAdminStudio = lazy(() => import("./pages/BookStoreAdminStudio"));
const CoursesAdminStudio = lazy(() => import("./pages/CoursesAdminStudio"));
const AdminSecurityCenter = lazy(() => import("./pages/AdminSecurityCenter"));
const AdminPaymentSettings = lazy(() => import("./pages/AdminPaymentSettings"));
const WatchStream = lazy(() => import("./pages/WatchStream"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const InstitutionProfile = lazy(() => import("./pages/InstitutionProfile"));

const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentLectures = lazy(() => import("./pages/StudentLectures"));
const StudentLectureDetail = lazy(() => import("./pages/StudentLectureDetail"));
const StudentLive = lazy(() => import("./pages/StudentLive"));
const StudentLiveDetail = lazy(() => import("./pages/StudentLiveDetail"));
const StudentQuizzes = lazy(() => import("./pages/StudentQuizzes"));
const StudentQuizDetail = lazy(() => import("./pages/StudentQuizDetail"));
const StudentAssignmentResults = lazy(() => import("./pages/StudentAssignmentResults"));
const UniversityPlatform = lazy(() => import("./pages/UniversityPlatform"));
const SchoolPlatform = lazy(() => import("./pages/SchoolPlatform"));
const BookStorePlatform = lazy(() => import("./pages/BookStorePlatform"));
const BookStore = lazy(() => import("./pages/BookStore"));
const BookStoreLogin = lazy(() => import("./pages/BookStoreLogin"));
const BookStoreSignup = lazy(() => import("./pages/BookStoreSignup"));
const ReaderDashboard = lazy(() => import("./pages/ReaderDashboard"));
const PublisherDashboard = lazy(() => import("./pages/PublisherDashboard"));
const BookStoreCartCheckout = lazy(() => import("./pages/BookStoreCartCheckout"));
const BookStoreAICompanionPage = lazy(() => import("./pages/BookStoreAICompanionPage"));
const BookStoreReadingClubsPage = lazy(() => import("./pages/BookStoreReadingClubsPage"));
const BookStoreAudiobooksPage = lazy(() => import("./pages/BookStoreAudiobooksPage"));
const BookStoreBundlesPage = lazy(() => import("./pages/BookStoreBundlesPage"));
const BookStoreGiftPage = lazy(() => import("./pages/BookStoreGiftPage"));
const PublisherPromotionsPage = lazy(() => import("./pages/PublisherPromotionsPage"));
const PublisherAnalyticsPage = lazy(() => import("./pages/PublisherAnalyticsPage"));
const PublisherAntiCounterfeitPage = lazy(() => import("./pages/PublisherAntiCounterfeitPage"));
const PublisherContractsPage = lazy(() => import("./pages/PublisherContractsPage"));
const BookStoreBookPassPage = lazy(() => import("./pages/BookStoreBookPassPage"));
const BookStoreLiveTrackingPage = lazy(() => import("./pages/BookStoreLiveTrackingPage"));
const BookStoreRewardsPage = lazy(() => import("./pages/BookStoreRewardsPage"));
const NasherPlatform = lazy(() => import("./pages/NasherPlatform"));
const NasherDashboard = lazy(() => import("./pages/NasherDashboard"));
const NasherLogin = lazy(() => import("./pages/NasherLogin"));
const NasherSignup = lazy(() => import("./pages/NasherSignup"));
const NasherNewNotesPage = lazy(() => import("./pages/NasherNewNotesPage"));
const NasherProfilePage = lazy(() => import("./pages/NasherProfilePage"));
const CollegeRegistration = lazy(() => import("./pages/CollegeRegistration"));
const CollegeRoleSignup = lazy(() => import("./pages/CollegeRoleSignup"));
const CollegeAdminSignup = lazy(() => import("./pages/CollegeAdminSignup"));
const InstituteRegistration = lazy(() => import("./pages/InstituteRegistration"));
const InstituteRoleSignup = lazy(() => import("./pages/InstituteRoleSignup"));
const InstituteAdminSignup = lazy(() => import("./pages/InstituteAdminSignup"));
const TrainingCenterRegistration = lazy(() => import("./pages/TrainingCenterRegistration"));
const TrainingCenterRoleSignup = lazy(() => import("./pages/TrainingCenterRoleSignup"));
const TrainingCenterAdminSignup = lazy(() => import("./pages/TrainingCenterAdminSignup"));
const LanguageCenterRegistration = lazy(() => import("./pages/LanguageCenterRegistration"));
const LanguageCenterRoleSignup = lazy(() => import("./pages/LanguageCenterRoleSignup"));
const LanguageCenterAdminSignup = lazy(() => import("./pages/LanguageCenterAdminSignup"));
const InstitutionDashboard = lazy(() => import("./pages/InstitutionDashboard"));
const InstitutionFacultyAdd = lazy(() => import("./pages/InstitutionFacultyAdd"));
const FacultyInvitationRegistration = lazy(() => import("./pages/FacultyInvitationRegistration"));
const StudentInvitationRegistration = lazy(() => import("./pages/StudentInvitationRegistration"));
const InstitutionFacultyImport = lazy(() => import("./pages/InstitutionFacultyImport"));
const InstitutionFacultyEdit = lazy(() => import("./pages/InstitutionFacultyEdit"));
const DepartmentPage = lazy(() => import("./pages/DepartmentPage"));
const SecretaryDashboard = lazy(() => import("./pages/SecretaryDashboard"));
const LibraryDashboard = lazy(() => import("./pages/LibraryDashboard"));
const InstitutionMessages = lazy(() => import("./pages/InstitutionMessages"));
const LecturerProfile = lazy(() => import("./pages/LecturerProfile"));
const LeadershipDashboard = lazy(() => import("./pages/LeadershipDashboard"));
const LeadershipStreamsByStatus = lazy(() => import("./pages/LeadershipStreamsByStatus"));
const LeadershipApprovals = lazy(() => import("./pages/LeadershipApprovals"));
const LeadershipProfile = lazy(() => import("./pages/LeadershipProfile"));
const LeadershipPresence = lazy(() => import("./pages/LeadershipPresence"));
const LecturerAccount = lazy(() => import("./pages/LecturerAccount"));
const StudentAccount = lazy(() => import("./pages/StudentAccount"));
const SchoolAdminAccount = lazy(() => import("./pages/SchoolAdminAccount"));
const SchoolTeacherAccount = lazy(() => import("./pages/SchoolTeacherAccount"));
const SchoolStudentAccount = lazy(() => import("./pages/SchoolStudentAccount"));
const DemoItemPage = lazy(() => import("./pages/DemoItemPage"));
const InstitutionQuizResultsByDate = lazy(() => import("./pages/InstitutionQuizResultsByDate"));
const StudentSubscriptions = lazy(() => import("./pages/StudentSubscriptions"));
const InstitutionPayment = lazy(() => import("./pages/InstitutionPayment"));
const InstitutionPaymentDetails = lazy(() => import("./pages/InstitutionPaymentDetails"));
const InstitutionPaymentCash = lazy(() => import("./pages/InstitutionPaymentCash"));
const InstitutionPaymentBankTransfer = lazy(() => import("./pages/InstitutionPaymentBankTransfer"));
const InstitutionPaymentOnline = lazy(() => import("./pages/InstitutionPaymentOnline"));
const About = lazy(() => import("./pages/About"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));

const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const FAQ = lazy(() => import("./pages/FAQ"));
const PromoVideoPage = lazy(() => import("./pages/PromoVideoPage"));
const CareerPlatform = lazy(() => import("./pages/CareerPlatform"));
const CareerTrainingInfo = lazy(() => import("./pages/CareerTrainingInfo"));
const ManuscriptAuctionsInfo = lazy(() => import("./pages/ManuscriptAuctionsInfo"));
const LiveClassroomsInfo = lazy(() => import("./pages/LiveClassroomsInfo"));
const DigitalApprovalChains = lazy(() => import("./pages/DigitalApprovalChains"));
const GradingStudioInfo = lazy(() => import("./pages/GradingStudioInfo"));
const CertificateVerification = lazy(() => import("./pages/CertificateVerification"));
const SchoolStudentDashboard = lazy(() => import("./pages/SchoolStudentDashboard"));
const SchoolTeacherDashboard = lazy(() => import("./pages/SchoolTeacherDashboard"));
const SchoolDashboard = lazy(() => import("./pages/SchoolDashboard"));
const SchoolLogin = lazy(() => import("./pages/SchoolLogin"));
const SchoolSignup = lazy(() => import("./pages/SchoolSignup"));
const SchoolRegistration = lazy(() => import("./pages/SchoolRegistration"));
const QuizCreate = lazy(() => import("./pages/QuizCreate"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const ScheduleDetail = lazy(() => import("./pages/ScheduleDetail"));
const CourseAssignments = lazy(() => import("./pages/CourseAssignments"));
const CourseAttendance = lazy(() => import("./pages/CourseAttendance"));
const QuizResults = lazy(() => import("./pages/QuizResults"));


const StudentResults = lazy(() => import("./pages/StudentResults"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const StudentAssignmentDetail = lazy(() => import("./pages/StudentAssignmentDetail"));
const StudentSchedules = lazy(() => import("./pages/StudentSchedules"));
const StudentScheduleDetail = lazy(() => import("./pages/StudentScheduleDetail"));

const StudentRatings = lazy(() => import("./pages/StudentRatings"));
const StudentPresenceCheckin = lazy(() => import("./pages/StudentPresenceCheckin"));

const StudentMyAcademic = lazy(() => import("./pages/StudentMyAcademic"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

// Affiliate Program (20% RevShare)
const AffiliateProgram = lazy(() => import("./pages/AffiliateProgram"));
const AffiliateSignup = lazy(() => import("./pages/AffiliateSignup"));
const AffiliateLogin = lazy(() => import("./pages/AffiliateLogin"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const SessionGuard = () => {
  useSingleSession();
  return null;
};

const AutoLogoutGuard = () => {
  useAutoLogout();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <FirewallProvider>
            <SecurityBlockedScreen />
            <SessionGuard />
            <AutoLogoutGuard />
            <ScrollToTop />
            <PrefetchRoutes />
            <NavigationProgress />
          <Suspense fallback={<RouteFallback />}>
            <PageTransition>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Courses platform */}
              <Route path="/courses" element={<CoursesPlatform />} />
              <Route path="/courses/browse" element={<Courses />} />
              <Route path="/courses/catalog" element={<Courses />} />
              <Route path="/courses/login" element={<CoursesLogin />} />
              <Route path="/courses/signup" element={<CoursesSignup />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route path="/signup/:role" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/choose-plan" element={<ChoosePlan />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/lecturer/dashboard" element={<CourseProviderDashboard fixedRole="lecturer" />} />
              <Route path="/teacher/dashboard" element={<CourseProviderDashboard fixedRole="teacher" />} />
              <Route path="/training-center/dashboard" element={<CourseProviderDashboard fixedRole="training_center" />} />
              <Route path="/language-center/dashboard" element={<CourseProviderDashboard fixedRole="language_center" />} />
              <Route path="/courses/dashboard/:role" element={<CourseProviderDashboard />} />
              <Route path="/lecturer/course/:courseId" element={<LecturerCourseContent />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/nashr" element={<AdminDashboard />} />
              <Route path="/admin/bookstore" element={<BookStoreAdminStudio />} />
              <Route path="/book-store/admin" element={<BookStoreAdminStudio />} />
              <Route path="/admin/courses" element={<CoursesAdminStudio />} />
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/overview" element={<AdminOverview />} />
              <Route path="/admin/security-center" element={<AdminSecurityCenter />} />
              <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
              <Route path="/stream/:streamId" element={<WatchStream />} />
              <Route path="/live" element={<LiveStreams />} />
              {/* Book Store + dedicated auth + reader & publisher portals */}
              <Route path="/book-store" element={<BookStorePlatform />} />
              <Route path="/book-store/catalog" element={<BookStore />} />
              <Route path="/book-store/browse" element={<BookStore />} />
              <Route path="/book-store/login" element={<BookStoreLogin />} />
              <Route path="/book-store/signup" element={<BookStoreSignup />} />
              <Route path="/book-store/reader-dashboard" element={<ReaderDashboard />} />
              <Route path="/reader" element={<ReaderDashboard />} />
              <Route path="/reader-dashboard" element={<ReaderDashboard />} />
              <Route path="/book-store/publisher-dashboard" element={<PublisherDashboard />} />
              <Route path="/publisher" element={<PublisherDashboard />} />
              <Route path="/publisher-dashboard" element={<PublisherDashboard />} />
              <Route path="/publisher/contracts" element={<PublisherContractsPage />} />
              <Route path="/publisher/promotions" element={<PublisherPromotionsPage />} />
              <Route path="/publisher/analytics" element={<PublisherAnalyticsPage />} />
              <Route path="/publisher/anti-counterfeit" element={<PublisherAntiCounterfeitPage />} />
              <Route path="/book-store/cart" element={<BookStoreCartCheckout />} />
              <Route path="/book-store/checkout" element={<BookStoreCartCheckout />} />
              <Route path="/book-store/payment" element={<BookStoreCartCheckout />} />
              <Route path="/book-store/reader/dashboard" element={<ReaderDashboard />} />
              <Route path="/book-store/ai-companion" element={<BookStoreAICompanionPage />} />
              <Route path="/book-store/reading-clubs" element={<BookStoreReadingClubsPage />} />
              <Route path="/book-store/audiobooks" element={<BookStoreAudiobooksPage />} />
              <Route path="/book-store/bundles" element={<BookStoreBundlesPage />} />
              <Route path="/book-store/gift" element={<BookStoreGiftPage />} />
              <Route path="/book-store/publisher/promotions" element={<PublisherPromotionsPage />} />
              <Route path="/book-store/publisher/analytics" element={<PublisherAnalyticsPage />} />
              <Route path="/book-store/publisher/anti-counterfeit" element={<PublisherAntiCounterfeitPage />} />
              <Route path="/book-store/publisher/contracts" element={<PublisherContractsPage />} />
              <Route path="/book-store/book-pass" element={<BookStoreBookPassPage />} />
              <Route path="/book-store/tracking" element={<BookStoreLiveTrackingPage />} />
              <Route path="/book-store/rewards" element={<BookStoreRewardsPage />} />
              {/* Nashr Platform (منصة نشر) */}
              <Route path="/nashr" element={<NasherPlatform />} />
              <Route path="/nashr/dashboard" element={<NasherDashboard />} />
              <Route path="/nashr/notes" element={<NasherNewNotesPage />} />
              <Route path="/nashr/profile" element={<NasherProfilePage />} />
              <Route path="/nashr/login" element={<NasherLogin />} />
              <Route path="/nashr/signup" element={<NasherSignup />} />
              {/* Backwards-compatible redirects from /nasher to /nashr */}
              <Route path="/nasher" element={<Navigate to="/nashr" replace />} />
              <Route path="/nasher/dashboard" element={<Navigate to="/nashr/dashboard" replace />} />
              <Route path="/nasher/notes" element={<Navigate to="/nashr/notes" replace />} />
              <Route path="/nasher/profile" element={<Navigate to="/nashr/profile" replace />} />
              <Route path="/nasher/login" element={<Navigate to="/nashr/login" replace />} />
              <Route path="/nasher/signup" element={<Navigate to="/nashr/signup" replace />} />
              {/* School Platform */}
              <Route path="/school-platform" element={<SchoolPlatform />} />
              <Route path="/school-platform/register" element={<SchoolRegistration />} />
              <Route path="/school-platform/login" element={<SchoolLogin />} />
              <Route path="/school-platform/signup" element={<SchoolSignup />} />
              <Route path="/school-registration" element={<SchoolRegistration />} />
              <Route path="/school/login" element={<SchoolLogin />} />
              <Route path="/school/signup" element={<SchoolSignup />} />

              <Route path="/school/student/dashboard" element={<SchoolStudentDashboard />} />
              <Route path="/school/teacher/dashboard" element={<SchoolTeacherDashboard />} />
              <Route path="/school/dashboard" element={<SchoolDashboard />} />
              {/* University Platform */}
              <Route path="/university-platform" element={<UniversityPlatform />} />
              <Route path="/signup/college" element={<Navigate to={`/signup/college/admin${typeof window !== 'undefined' ? window.location.search : ''}`} replace />} />
              <Route path="/signup/college/admin" element={<CollegeAdminSignup />} />
              <Route path="/signup/college/:role" element={<CollegeRoleSignup />} />
              <Route path="/signup/institute" element={<Navigate to={`/signup/institute/admin${typeof window !== 'undefined' ? window.location.search : ''}`} replace />} />
              <Route path="/signup/institute/admin" element={<InstituteAdminSignup />} />
              <Route path="/signup/institute/:role" element={<InstituteRoleSignup />} />
              <Route path="/signup/training-center" element={<Navigate to={`/signup/training-center/admin${typeof window !== 'undefined' ? window.location.search : ''}`} replace />} />
              <Route path="/signup/training-center/admin" element={<TrainingCenterAdminSignup />} />
              <Route path="/signup/training-center/:role" element={<TrainingCenterRoleSignup />} />
              <Route path="/training-center-registration" element={<TrainingCenterRegistration />} />
              <Route path="/signup/language-center" element={<Navigate to={`/signup/language-center/admin${typeof window !== 'undefined' ? window.location.search : ''}`} replace />} />
              <Route path="/signup/language-center/admin" element={<LanguageCenterAdminSignup />} />
              <Route path="/signup/language-center/:role" element={<LanguageCenterRoleSignup />} />
              <Route path="/language-center-registration" element={<LanguageCenterRegistration />} />
              <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
              <Route path="/institution/faculty/invite/:token" element={<FacultyInvitationRegistration />} />
              <Route path="/institution/student/invite/:token" element={<StudentInvitationRegistration />} />
              <Route path="/institution/faculty/add" element={<InstitutionFacultyAdd />} />
              <Route path="/institution/faculty/import" element={<InstitutionFacultyImport />} />
              <Route path="/institution/faculty/:memberId/edit" element={<InstitutionFacultyEdit />} />
              <Route path="/institution/department/:deptId" element={<DepartmentPage />} />
              <Route path="/institution/member/:memberId" element={<LecturerProfile />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/secretary/dashboard" element={<SecretaryDashboard />} />
              <Route path="/library/dashboard" element={<LibraryDashboard />} />
              <Route path="/institution/messages" element={<InstitutionMessages />} />
              <Route path="/leadership/dashboard" element={<LeadershipDashboard />} />
              <Route path="/leadership/streams/:status" element={<LeadershipStreamsByStatus />} />
              <Route path="/leadership/approvals/:type/:status" element={<LeadershipApprovals />} />
              <Route path="/leadership/profile" element={<LeadershipProfile />} />
              <Route path="/leadership/presence" element={<LeadershipPresence />} />
              <Route path="/lecturer/profile" element={<LecturerAccount />} />
              <Route path="/student/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/school/profile" element={<SchoolAdminAccount />} />
              <Route path="/school/teacher/profile" element={<SchoolTeacherAccount />} />
              <Route path="/school/student/profile" element={<SchoolStudentAccount />} />
              <Route path="/leadership/demo/:section" element={<DemoItemPage />} />
              <Route path="/institution/demo/:section" element={<DemoItemPage />} />
              <Route path="/institution/quiz-results/:date" element={<InstitutionQuizResultsByDate />} />
              <Route path="/quiz/create/:courseId" element={<QuizCreate />} />
              <Route path="/assignment/:assignmentSlug" element={<AssignmentDetail />} />
              {/* Backwards compatibility: old plain UUID links */}
              <Route path="/assignment/id/:assignmentSlug" element={<AssignmentDetail />} />
              <Route path="/schedule/:scheduleSlug" element={<ScheduleDetail />} />
              <Route path="/course/:courseId/assignments" element={<CourseAssignments />} />
              <Route path="/attendance/course/:courseId" element={<CourseAttendance />} />
              <Route path="/quiz/:quizId/results" element={<QuizResults />} />
              <Route path="/quiz-results" element={<Navigate to="/lecturer/dashboard?tab=quiz-results" replace />} />
              
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/book-store/profile" element={<UserProfile />} />
              <Route path="/institution/profile" element={<InstitutionProfile />} />
              <Route path="/institution/student-subscriptions" element={<StudentSubscriptions />} />
              <Route path="/institution/payment" element={<InstitutionPayment />} />
              <Route path="/institution/payment/cash" element={<InstitutionPaymentCash />} />
              <Route path="/institution/payment/bank-transfer" element={<InstitutionPaymentBankTransfer />} />
              <Route path="/institution/payment/online" element={<InstitutionPaymentOnline />} />
              
              <Route element={<StudentAccessGuard />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/lectures" element={<StudentLectures />} />
                <Route path="/student/lectures/:lectureId" element={<StudentLectureDetail />} />
                <Route path="/student/live" element={<StudentLive />} />
                <Route path="/student/live/:streamId" element={<StudentLiveDetail />} />
                <Route path="/student/quizzes" element={<StudentQuizzes />} />
                <Route path="/student/quizzes/:quizId" element={<StudentQuizDetail />} />
                <Route path="/student/results" element={<StudentResults />} />
                <Route path="/student/assignments" element={<StudentAssignments />} />
                <Route path="/student/assignments/:assignmentId" element={<StudentAssignmentDetail />} />
                <Route path="/student/schedules" element={<StudentSchedules />} />
                <Route path="/student/schedules/:scheduleId" element={<StudentScheduleDetail />} />
                <Route path="/student/ratings" element={<StudentRatings />} />
                <Route path="/student/assignment-results" element={<StudentAssignmentResults />} />
                <Route path="/student/my-academic" element={<StudentMyAcademic />} />
                <Route path="/student/presence-checkin" element={<StudentPresenceCheckin />} />
              </Route>
              
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/about" element={<About />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/terms-of-service" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/privacy-policy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/refund-policy" element={<Refund />} />

              <Route path="/contact" element={<Contact />} />
              <Route path="/career" element={<CareerPlatform />} />
              <Route path="/careers" element={<CareerPlatform />} />
              <Route path="/career-opportunities" element={<CareerTrainingInfo />} />
              <Route path="/manuscript-auctions" element={<ManuscriptAuctionsInfo />} />
              <Route path="/live-classrooms" element={<LiveClassroomsInfo />} />
              <Route path="/digital-approval-chains" element={<DigitalApprovalChains />} />
              <Route path="/approval-chains" element={<Navigate to="/digital-approval-chains" replace />} />
              <Route path="/grading-studio" element={<GradingStudioInfo />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/certificates" element={<CertificateVerification />} />
              <Route path="/certificate-verification" element={<Navigate to="/certificates" replace />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/promo-video" element={<PromoVideoPage />} />
              <Route path="/promo" element={<Navigate to="/promo-video" replace />} />
              
              {/* Affiliate Program (20% RevShare) */}
              <Route path="/affiliate" element={<AffiliateProgram />} />
              <Route path="/affiliate/signup" element={<AffiliateSignup />} />
              <Route path="/affiliate/login" element={<AffiliateLogin />} />
              <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
              
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PageTransition>
          </Suspense>
          <Suspense fallback={null}>
            <AIChatWidget />
          </Suspense>
          <BottomNav />
          <Suspense fallback={null}>
            <ForcePasswordChangeDialog />
          </Suspense>
          </FirewallProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
