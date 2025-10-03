import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Protected from "./components/Protected";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";

// Forward stray OAuth codes that land on the Site URL to the backend callback
const OAuthCodeForwarder = () => {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (!code) return;

      // Ensure a redirect param exists (default to dashboard)
      if (!url.searchParams.get("redirect")) {
        url.searchParams.set("redirect", "/dashboard");
      }

      // Use the same resolution strategy as API calls: VITE_API_BASE_URL or relative
      const backendBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "";
      const callbackUrl = `${backendBase}/api/auth/oauth/callback?${url.searchParams.toString()}`;

      // Replace so back/forward works cleanly
      window.location.replace(callbackUrl);
    } catch {
      // no-op
    }
  }, []);
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OAuthCodeForwarder />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Protected allowIncomplete>{<Onboarding />}</Protected>} />
          <Route path="/dashboard" element={<Protected>{<Dashboard />}</Protected>} />
          <Route path="/profile" element={<Protected>{<Profile />}</Protected>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
