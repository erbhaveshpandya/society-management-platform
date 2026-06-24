import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Admin Portal Pages
import { DashboardPage as AdminDashboard } from './pages/admin/DashboardPage';
import { FlatsPage } from './pages/admin/FlatsPage';
import { MaintenancePage } from './pages/admin/MaintenancePage';
import { ExpensesPage } from './pages/admin/ExpensesPage';
import { ComplaintsPage as AdminComplaints } from './pages/admin/ComplaintsPage';
import { NoticesPage as AdminNotices } from './pages/admin/NoticesPage';
import { PollsPage as AdminPolls } from './pages/admin/PollsPage';
import { AmenitiesPage as AdminAmenities } from './pages/admin/AmenitiesPage';
import { StaffPage as AdminStaff } from './pages/admin/StaffPage';
import { VisitorsPage as AdminVisitors } from './pages/admin/VisitorsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { SuperAdminSocietiesPage } from './pages/admin/SuperAdminSocietiesPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

// Resident Portal Pages
import { DashboardPage as ResidentDashboard } from './pages/resident/DashboardPage';
import { MyDuesPage } from './pages/resident/MyDuesPage';
import { ComplaintsPage as ResidentComplaints } from './pages/resident/ComplaintsPage';
import { NoticesPage as ResidentNotices } from './pages/resident/NoticesPage';
import { PollsPage as ResidentPolls } from './pages/resident/PollsPage';
import { AmenityBookingPage } from './pages/resident/AmenityBookingPage';
import { VehiclesPage } from './pages/resident/VehiclesPage';
import { DomesticStaffPage as ResidentStaff } from './pages/resident/DomesticStaffPage';
import { VisitorsPage as ResidentVisitors } from './pages/resident/VisitorsPage';

// Security Portal Pages
import { DashboardPage as SecurityDashboard } from './pages/security/DashboardPage';
import { VisitorEntryPage } from './pages/security/VisitorEntryPage';
import { LiveVisitorsPage } from './pages/security/LiveVisitorsPage';
import { StaffAttendancePage } from './pages/security/StaffAttendancePage';
import { WrongParkingPage } from './pages/security/WrongParkingPage';
import { EmergencyAlertsPage } from './pages/security/EmergencyAlertsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Portal Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'SocietyAdmin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="flats" element={<FlatsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="polls" element={<AdminPolls />} />
            <Route path="amenities" element={<AdminAmenities />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="visitors" element={<AdminVisitors />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="societies"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <SuperAdminSocietiesPage />
                </ProtectedRoute>
              }
            />
            <Route path="users" element={<UserManagementPage />} />
          </Route>

          {/* Resident Portal Layout */}
          <Route
            path="/resident"
            element={
              <ProtectedRoute allowedRoles={['Resident']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ResidentDashboard />} />
            <Route path="dues" element={<MyDuesPage />} />
            <Route path="complaints" element={<ResidentComplaints />} />
            <Route path="notices" element={<ResidentNotices />} />
            <Route path="polls" element={<ResidentPolls />} />
            <Route path="amenities" element={<AmenityBookingPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="staff" element={<ResidentStaff />} />
            <Route path="visitors" element={<ResidentVisitors />} />
          </Route>

          {/* Security Guard Portal Layout */}
          <Route
            path="/security"
            element={
              <ProtectedRoute allowedRoles={['SecurityGuard']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SecurityDashboard />} />
            <Route path="visitor-entry" element={<VisitorEntryPage />} />
            <Route path="live-visitors" element={<LiveVisitorsPage />} />
            <Route path="staff-attendance" element={<StaffAttendancePage />} />
            <Route path="wrong-parking" element={<WrongParkingPage />} />
            <Route path="emergency-alerts" element={<EmergencyAlertsPage />} />
          </Route>

          {/* Redirect unknown route to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
