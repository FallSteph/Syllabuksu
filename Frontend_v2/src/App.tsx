import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "@/components/Layout/NotFound";

// Auth Pages
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";

// Shared Pages
import ProfileSettingsPage from "@/components/Layout/Profile&SettingsPage";
import SyllabusViewPage from "./pages/Syllabus/SyllabusView";

// Admin Pages
import AdminDashboard from "./pages/Admin/Dashboard";
import ManageUsersPage from "./pages/Admin/ManageUsers";
import AllSyllabiPage from "./pages/Admin/AllSyllabi";
import SemesterConfigPage from "./pages/Admin/SemesterConfigPage";

// Faculty Pages
import FacultyDashboard from "./pages/Faculty/Dashboard";
import UploadSyllabusPage from "./pages/Faculty/UploadSyllabus";
import TrackSyllabusPage from "./pages/Faculty/TrackSyllabus";
import FacultyStatusPage from "./pages/Faculty/Status";
import FacultyHistoryPage from "./pages/Faculty/History";
import TrackingIDPage from "./pages/Faculty/TrackingDetails";

// Reviewer Pages
import ReviewerDashboard from "./pages/Reviewer/Dashboard";
import ReviewSyllabiPage from "./pages/Reviewer/ReviewSyllabi";
import SyllabusReviewPage from "./pages/Reviewer/SyllabusReview";
import ReviewerHistoryPage from "./pages/Reviewer/History";

// Dashboard Router
import DashboardRouter from "./pages/Dashboard/DashboardRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Protected Dashboard Routes */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/faculty" element={<FacultyDashboard />} />
                  <Route path="/reviewer" element={<ReviewerDashboard />} />
                  <Route path="/profile" element={<ProfileSettingsPage />} />
                  <Route path="/syllabus/:id" element={<SyllabusViewPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/users" element={<ManageUsersPage />} />
                  <Route path="/admin/syllabi" element={<AllSyllabiPage />} />
                  <Route path="/admin/semesters" element={<SemesterConfigPage />} />
                  
                  {/* Faculty Routes */}
                  <Route path="/faculty/upload" element={<UploadSyllabusPage />} />
                  <Route path="/faculty/track" element={<TrackSyllabusPage />} />
                  <Route path="/faculty/status" element={<FacultyStatusPage />} />
                  <Route path="/faculty/history" element={<FacultyHistoryPage />} />
                  <Route path="/faculty/tracking/:id" element={<TrackingIDPage />} />
                  
                  {/* Reviewer Routes */}
                  <Route path="/reviewer/syllabi" element={<ReviewSyllabiPage />} />
                  <Route path="/reviewer/syllabi/:id/review" element={<SyllabusReviewPage />} />
                  <Route path="/reviewer/history" element={<ReviewerHistoryPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
