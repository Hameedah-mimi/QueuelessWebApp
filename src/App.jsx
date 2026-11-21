import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public & Auth Pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Customer Pages
import CustomerHome from "./pages/customer/Home";
import Explore from "./pages/customer/Explore";
import OrgProfile from "./pages/customer/OrgProfile";
import ServiceDetail from "./pages/customer/ServiceDetail";
import BookFlow from "./pages/customer/BookFlow";
import Appointments from "./pages/customer/Appointments";
import AppointmentDetail from "./pages/customer/AppointmentDetail";
import Queue from "./pages/customer/Queue";
import Profile from "./pages/customer/Profile";
import Notifications from "./pages/customer/Notifications";
import Reviews from "./pages/customer/Reviews";

// Worker Pages
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerSchedule from "./pages/worker/Schedule";
import WorkerEarnings from "./pages/worker/Earnings";
import WorkerProfile from "./pages/worker/Profile";

// Organization Pages
import OrgDashboard from "./pages/organization/Dashboard";
import OrgQueueManager from "./pages/organization/QueueManager";
import OrgServices from "./pages/organization/Services";
import OrgStaff from "./pages/organization/Staff";
import OrgSettings from "./pages/organization/Settings";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminOrganizations from "./pages/admin/Organizations";
import AdminBookings from "./pages/admin/Bookings";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminReports from "./pages/admin/Reports";
import Contact from "./pages/shared/Contact";
import Messages from "./pages/shared/Messages";
import Report from "./pages/shared/Report";
import CreateOrganization from "./pages/shared/CreateOrganization";

function dashboardForRole(activeRole) {
  return (
    {
      customer: "/customer",
      worker: "/worker",
      organization: "/organization",
      org_manager: "/organization",
      admin: "/admin",
    }[activeRole] || "/customer"
  );
}

function SessionLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
      <img
        src="/queless.png"
        alt="QueueLess"
        className="h-12 w-auto animate-pulse"
      />
      <p className="text-xs font-medium text-slate-400">
        Verifying your session...
      </p>
    </div>
  );
}

function HomeRedirect() {
  const { isAuthenticated, activeRole, loading } = useAuth();
  if (loading) return <SessionLoader />;
  if (!isAuthenticated) return <Landing />;
  return <Navigate to={dashboardForRole(activeRole)} replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, activeRole, loading } = useAuth();
  if (loading) return <SessionLoader />;
  if (isAuthenticated) {
    return <Navigate to={dashboardForRole(activeRole)} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />

          {/* Customer Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute roles={["customer"]}>
                <CustomerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/explore"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/org/:orgId"
            element={
              <ProtectedRoute roles={["customer"]}>
                <OrgProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/org/:orgId/service/:serviceId"
            element={
              <ProtectedRoute roles={["customer"]}>
                <ServiceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/org/:orgId/book"
            element={
              <ProtectedRoute roles={["customer"]}>
                <BookFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/org/:orgId/reviews"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Reviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/appointments"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/appointments/:id"
            element={
              <ProtectedRoute roles={["customer"]}>
                <AppointmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/queue"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Queue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/settings"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reviews"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Reviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/favourites"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/help"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute roles={["customer"]}>
                <Explore />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/create"
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />

          {/* Worker Routes */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute roles={["worker"]}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/schedule"
            element={
              <ProtectedRoute roles={["worker"]}>
                <WorkerSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/earnings"
            element={
              <ProtectedRoute roles={["worker"]}>
                <WorkerEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/profile"
            element={
              <ProtectedRoute roles={["worker"]}>
                <WorkerProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/worker/*" element={<Navigate to="/worker" replace />} />

          {/* Organization Routes */}
          <Route
            path="/organization"
            element={
              <ProtectedRoute roles={["organization", "org_manager"]}>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/queue"
            element={
              <ProtectedRoute roles={["organization", "org_manager"]}>
                <OrgQueueManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/services"
            element={
              <ProtectedRoute roles={["organization", "org_manager"]}>
                <OrgServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/staff"
            element={
              <ProtectedRoute roles={["organization", "org_manager"]}>
                <OrgStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/settings"
            element={
              <ProtectedRoute roles={["organization", "org_manager"]}>
                <OrgSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organization/*"
            element={<Navigate to="/organization" replace />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminOrganizations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
