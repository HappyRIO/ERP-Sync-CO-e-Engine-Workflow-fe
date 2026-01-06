import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantThemeProvider } from "@/contexts/TenantThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/app/Index";
import Jobs from "./pages/app/Jobs";
import JobDetail from "./pages/app/JobDetail";
import DriverJobView from "./pages/app/DriverJobView";
import Booking from "./pages/app/Booking";
import BookingsHistory from "./pages/app/BookingsHistory";
import CO2eDashboard from "./pages/app/CO2eDashboard";
import Documents from "./pages/app/Documents";
import Settings from "./pages/app/Settings";
import Users from "./pages/app/Users";
import Clients from "./pages/app/Clients";
import Drivers from "./pages/app/admin/Drivers";
import Invoices from "./pages/app/Invoices";
import Commission from "./pages/app/Commission";
import BookingQueue from "./pages/app/admin/BookingQueue";
import Assignment from "./pages/app/admin/Assignment";
import Sanitisation from "./pages/app/admin/Sanitisation";
import Grading from "./pages/app/admin/Grading";
import BookingDetail from "./pages/app/BookingDetail";
import BookingTimeline from "./pages/app/BookingTimeline";
import BookingCertificates from "./pages/app/BookingCertificates";
import BookingGradingReport from "./pages/app/BookingGradingReport";
import Sites from "./pages/app/Sites";
import JobHistory from "./pages/app/JobHistory";
import Approval from "./pages/app/admin/Approval";
import BookingApproval from "./pages/app/admin/BookingApproval";
import BookingSummary from "./pages/app/BookingSummary";
import DriverSchedule from "./pages/app/DriverSchedule";
import Notifications from "./pages/app/Notifications";
import Login from "./pages/app/Login";
import Signup from "./pages/app/Signup";
import AcceptInvite from "./pages/app/AcceptInvite";
import NotFound from "./pages/app/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantThemeProvider>
            <NotificationProvider>
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/invite" element={<AcceptInvite />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Index />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route
                  path="/jobs/history"
                  element={
                    <ProtectedRoute allowedRoles={['driver', 'admin']}>
                      <JobHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver/jobs/:id"
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverJobView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver/schedule"
                  element={
                    <ProtectedRoute allowedRoles={['driver', 'admin']}>
                      <DriverSchedule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking"
                  element={
                    <ProtectedRoute allowedRoles={['client', 'admin']}>
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/co2e"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <CO2eDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <Documents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingsHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'reseller']}>
                      <Clients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drivers"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Drivers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/commission"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'reseller']}>
                      <Commission />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sites"
                  element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <Sites />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <BookingQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/assign"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Assignment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sanitisation/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Sanitisation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/grading/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Grading />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/booking-approval/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <BookingApproval />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/approval/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Approval />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id/timeline"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingTimeline />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id/certificates"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingCertificates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id/grading"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingGradingReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id/summary"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'client', 'reseller']}>
                      <BookingSummary />
                    </ProtectedRoute>
                  }
                />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </NotificationProvider>
          </TenantThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
