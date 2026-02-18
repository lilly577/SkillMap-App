import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Chat from "./pages/Chat";
import Video from "./pages/Video";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import { useAuth } from "@/hooks/user";
import BrowseSpecialists from "./pages/BrowseSpecialists";
import BrowseJobs from "./pages/BrowseJobs";
import MyApplications from "./pages/MyApplications";
import CompanyInterviews from "./pages/CompanyInterviews";
import SpecialistInterviews from "./pages/SpecialistInterviews";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Footer from "@/components/ui/footer";

const queryClient = new QueryClient();

function AppContent() {
  const { verifyAuth } = useAuth();

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navigation />

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/index" element={<Index />} />

            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/company/interviews"
              element={
                <ProtectedRoute requiredUserType="company">
                  <CompanyInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specialist/interviews"
              element={
                <ProtectedRoute requiredUserType="specialist">
                  <SpecialistInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specialist/applications"
              element={
                <ProtectedRoute requiredUserType="specialist">
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specialist/dashboard"
              element={
                <ProtectedRoute requiredUserType="specialist">
                  <SpecialistDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/dashboard"
              element={
                <ProtectedRoute requiredUserType="company">
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Chat and Video routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:meetingId?"
              element={
                <ProtectedRoute>
                  <Video />
                </ProtectedRoute>
              }
            />

            {/* Public browsing routes */}
            <Route path="/specialists" element={<BrowseSpecialists />} />
            <Route path="/jobs" element={<BrowseJobs />} />
            <Route
              path="/specialists"
              element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">
                    Browse Specialists
                  </h1>
                  <p className="text-gray-600">
                    Public page to browse all specialists (to be implemented)
                  </p>
                </div>
              }
            />
            <Route
              path="/jobs"
              element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">Browse Jobs</h1>
                  <p className="text-gray-600">
                    Public page to browse all jobs (to be implemented)
                  </p>
                </div>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
