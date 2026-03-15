import React, { lazy, Suspense } from "react";
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
const BookStore = lazy(() => import("./pages/BookStore"));
const BookStoreLogin = lazy(() => import("./pages/BookStoreLogin"));
const BookStoreSignup = lazy(() => import("./pages/BookStoreSignup"));
const SchoolPlatform = lazy(() => import("./pages/SchoolPlatform"));
const SchoolRegistration = lazy(() => import("./pages/SchoolRegistration"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

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
              <Route path="/book-store" element={<BookStore />} />
              <Route path="/book-store/login" element={<BookStoreLogin />} />
              <Route path="/book-store/signup" element={<BookStoreSignup />} />
              {/* School Platform */}
              <Route path="/school-platform" element={<SchoolPlatform />} />
              <Route path="/school-platform/register" element={<SchoolRegistration />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
