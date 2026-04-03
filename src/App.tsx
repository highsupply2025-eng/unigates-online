import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";

const SignupChoice = lazy(() => import("./pages/SignupChoice"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Courses = lazy(() => import("./pages/Courses"));
const ChoosePlan = lazy(() => import("./pages/ChoosePlan"));
const Payment = lazy(() => import("./pages/Payment"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const LecturerDashboard = lazy(() => import("./pages/LecturerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const WatchStream = lazy(() => import("./pages/WatchStream"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const UniversityPlatform = lazy(() => import("./pages/UniversityPlatform"));
const CollegeRegistration = lazy(() => import("./pages/CollegeRegistration"));
const InstituteRegistration = lazy(() => import("./pages/InstituteRegistration"));
const InstitutionDashboard = lazy(() => import("./pages/InstitutionDashboard"));
const About = lazy(() => import("./pages/About"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Partnerships = lazy(() => import("./pages/Partnerships"));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Courses auth */}
              <Route path="/courses" element={<Courses />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup-choice" element={<SignupChoice />} />
              <Route path="/signup/:role" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/choose-plan" element={<ChoosePlan />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
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
              {/* University Platform */}
              <Route path="/university-platform" element={<UniversityPlatform />} />
              <Route path="/signup/college" element={<CollegeRegistration />} />
              <Route path="/signup/institute" element={<InstituteRegistration />} />
              <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/book-store/profile" element={<UserProfile />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<ComingSoon />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/certificates" element={<ComingSoon />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
