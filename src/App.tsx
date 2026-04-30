import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import AIChatWidget from "./components/AIChatWidget";
import { useSingleSession } from "@/hooks/use-single-session";

const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Courses = lazy(() => import("./pages/Courses"));
const ChoosePlan = lazy(() => import("./pages/ChoosePlan"));
const Payment = lazy(() => import("./pages/Payment"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const LecturerDashboard = lazy(() => import("./pages/LecturerDashboard"));
const LecturerCourseContent = lazy(() => import("./pages/LecturerCourseContent"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WatchStream = lazy(() => import("./pages/WatchStream"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentLectures = lazy(() => import("./pages/StudentLectures"));
const StudentLectureDetail = lazy(() => import("./pages/StudentLectureDetail"));
const StudentLive = lazy(() => import("./pages/StudentLive"));
const StudentQuizzes = lazy(() => import("./pages/StudentQuizzes"));
const StudentAnalytics = lazy(() => import("./pages/StudentAnalytics"));
const UniversityPlatform = lazy(() => import("./pages/UniversityPlatform"));
const CollegeRegistration = lazy(() => import("./pages/CollegeRegistration"));
const CollegeRoleSignup = lazy(() => import("./pages/CollegeRoleSignup"));
const CollegeAdminSignup = lazy(() => import("./pages/CollegeAdminSignup"));
const InstituteRegistration = lazy(() => import("./pages/InstituteRegistration"));
const InstituteRoleSignup = lazy(() => import("./pages/InstituteRoleSignup"));
const InstituteAdminSignup = lazy(() => import("./pages/InstituteAdminSignup"));
const InstitutionDashboard = lazy(() => import("./pages/InstitutionDashboard"));
const DepartmentPage = lazy(() => import("./pages/DepartmentPage"));
const LecturerProfile = lazy(() => import("./pages/LecturerProfile"));
const LeadershipDashboard = lazy(() => import("./pages/LeadershipDashboard"));
const About = lazy(() => import("./pages/About"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const FAQ = lazy(() => import("./pages/FAQ"));
const SchoolStudentDashboard = lazy(() => import("./pages/SchoolStudentDashboard"));
const SchoolTeacherDashboard = lazy(() => import("./pages/SchoolTeacherDashboard"));
const SchoolDashboard = lazy(() => import("./pages/SchoolDashboard"));
const SchoolPlatform = lazy(() => import("./pages/SchoolPlatform"));
const SchoolLogin = lazy(() => import("./pages/SchoolLogin"));
const SchoolSignup = lazy(() => import("./pages/SchoolSignup"));
const SchoolRegistration = lazy(() => import("./pages/SchoolRegistration"));
const QuizCreate = lazy(() => import("./pages/QuizCreate"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const ScheduleDetail = lazy(() => import("./pages/ScheduleDetail"));
const CourseAssignments = lazy(() => import("./pages/CourseAssignments"));
const CourseAttendance = lazy(() => import("./pages/CourseAttendance"));
const QuizResults = lazy(() => import("./pages/QuizResults"));
const QuizResultsAll = lazy(() => import("./pages/QuizResultsAll"));

const StudentResults = lazy(() => import("./pages/StudentResults"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const StudentSchedules = lazy(() => import("./pages/StudentSchedules"));
const StudentScheduleDetail = lazy(() => import("./pages/StudentScheduleDetail"));
const StudentAttendance = lazy(() => import("./pages/StudentAttendance"));
const StudentRatings = lazy(() => import("./pages/StudentRatings"));
const LeadershipQuizApprovals = lazy(() => import("./pages/LeadershipQuizApprovals"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const SessionGuard = () => {
  useSingleSession();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionGuard />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Courses auth */}
              <Route path="/courses" element={<ComingSoon />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route path="/signup/:role" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/choose-plan" element={<ChoosePlan />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
              <Route path="/lecturer/course/:courseId" element={<LecturerCourseContent />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/stream/:streamId" element={<WatchStream />} />
              <Route path="/live" element={<LiveStreams />} />
              {/* Book Store + separate auth */}
              <Route path="/book-store" element={<ComingSoon />} />
              <Route path="/book-store/login" element={<ComingSoon />} />
              <Route path="/book-store/signup" element={<ComingSoon />} />
              {/* School Platform */}
              <Route path="/school-platform" element={<ComingSoon />} />
              <Route path="/school-platform/register" element={<ComingSoon />} />
              <Route path="/school-platform/login" element={<ComingSoon />} />
              <Route path="/school-platform/signup" element={<ComingSoon />} />
              <Route path="/school/student/dashboard" element={<SchoolStudentDashboard />} />
              <Route path="/school/teacher/dashboard" element={<SchoolTeacherDashboard />} />
              <Route path="/school/dashboard" element={<SchoolDashboard />} />
              {/* University Platform */}
              <Route path="/university-platform" element={<UniversityPlatform />} />
              <Route path="/signup/college" element={<CollegeRegistration />} />
              <Route path="/signup/college/admin" element={<CollegeAdminSignup />} />
              <Route path="/signup/college/:role" element={<CollegeRoleSignup />} />
              <Route path="/signup/institute" element={<InstituteRegistration />} />
              <Route path="/signup/institute/admin" element={<InstituteAdminSignup />} />
              <Route path="/signup/institute/:role" element={<InstituteRoleSignup />} />
              <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
              <Route path="/institution/department/:deptId" element={<DepartmentPage />} />
              <Route path="/institution/member/:memberId" element={<LecturerProfile />} />
              <Route path="/leadership/dashboard" element={<LeadershipDashboard />} />
              <Route path="/quiz/create/:courseId" element={<QuizCreate />} />
              <Route path="/assignment/:assignmentSlug" element={<AssignmentDetail />} />
              {/* Backwards compatibility: old plain UUID links */}
              <Route path="/assignment/id/:assignmentSlug" element={<AssignmentDetail />} />
              <Route path="/schedule/:scheduleSlug" element={<ScheduleDetail />} />
              <Route path="/course/:courseId/assignments" element={<CourseAssignments />} />
              <Route path="/attendance/course/:courseId" element={<CourseAttendance />} />
              <Route path="/quiz/:quizId/results" element={<QuizResults />} />
              <Route path="/quiz-results" element={<QuizResultsAll />} />
              
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/book-store/profile" element={<UserProfile />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/lectures" element={<StudentLectures />} />
              <Route path="/student/lectures/:lectureId" element={<StudentLectureDetail />} />
              <Route path="/student/live" element={<StudentLive />} />
              <Route path="/student/quizzes" element={<StudentQuizzes />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/schedules" element={<StudentSchedules />} />
              <Route path="/student/schedules/:scheduleId" element={<StudentScheduleDetail />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/ratings" element={<StudentRatings />} />
              <Route path="/student/analytics" element={<StudentAnalytics />} />
              <Route path="/leadership/quiz-approvals" element={<LeadershipQuizApprovals />} />
              <Route path="/about" element={<About />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<ComingSoon />} />
              <Route path="/partnerships" element={<ComingSoon />} />
              <Route path="/certificates" element={<ComingSoon />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <AIChatWidget />
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
