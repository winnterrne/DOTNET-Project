import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { Toasts } from './components/ui';
import { Layout, SharedLayout, homeOf } from './components/Layout';

// Auth & Kiosk
import { Login, Register } from './pages/Auth';
import { Kiosk } from './pages/staff/StaffPages';
import { NotificationsPage } from './pages/NotificationsPage';
import { AccountPage } from './pages/AccountPage';

// Member
import { MemberHome } from './pages/member/MemberHome';
import { MemberMemberships } from './pages/member/MemberMemberships';
import { MemberClasses, MemberPT, MemberBookings } from './pages/member/MemberBooking';
import { MemberProfile, MemberProgress, MemberCard, MemberPayments, MemberEquipment } from './pages/member/MemberMisc';

// Trainer
import {
  TrainerHome,
  TrainerRequests,
  TrainerAvailability,
  TrainerClasses,
  TrainerReviews,
  TrainerProfile,
} from './pages/trainer/TrainerPages';

// Receptionist
import {
  StaffHome,
  StaffCheckin,
  CheckinHistory,
  StaffFreeze,
  EquipmentManage,
  StaffMembers,
} from './pages/staff/StaffPages';

// Admin
import { AdminHome, AdminReports } from './pages/admin/AdminReports';
import {
  AdminUsers,
  AdminBranches,
  AdminPlans,
  AdminClasses,
  AdminSettings,
} from './pages/admin/AdminPages';

function RootRedirect() {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeOf(user.role)} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/kiosk" element={<Kiosk />} />

          {/* Member Routes */}
          <Route path="/member" element={<Layout role="member" />}>
            <Route index element={<MemberHome />} />
            <Route path="card" element={<MemberCard />} />
            <Route path="classes" element={<MemberClasses />} />
            <Route path="pt" element={<MemberPT />} />
            <Route path="bookings" element={<MemberBookings />} />
            <Route path="progress" element={<MemberProgress />} />
            <Route path="memberships" element={<MemberMemberships />} />
            <Route path="payments" element={<MemberPayments />} />
            <Route path="equipment" element={<MemberEquipment />} />
            <Route path="profile" element={<MemberProfile />} />
          </Route>

          {/* Trainer Routes */}
          <Route path="/trainer" element={<Layout role="trainer" />}>
            <Route index element={<TrainerHome />} />
            <Route path="requests" element={<TrainerRequests />} />
            <Route path="availability" element={<TrainerAvailability />} />
            <Route path="classes" element={<TrainerClasses />} />
            <Route path="reviews" element={<TrainerReviews />} />
            <Route path="profile" element={<TrainerProfile />} />
          </Route>

          {/* Receptionist Routes */}
          <Route path="/staff" element={<Layout role="receptionist" />}>
            <Route index element={<StaffHome />} />
            <Route path="checkin" element={<StaffCheckin />} />
            <Route path="history" element={<CheckinHistory />} />
            <Route path="freeze" element={<StaffFreeze />} />
            <Route path="equipment" element={<EquipmentManage />} />
            <Route path="members" element={<StaffMembers />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<Layout role="admin" />}>
            <Route index element={<AdminHome />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="branches" element={<AdminBranches />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="equipment" element={<EquipmentManage />} />
            <Route path="checkins" element={<CheckinHistory />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Shared Authenticated Routes */}
          <Route element={<SharedLayout />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        <Toasts />
      </BrowserRouter>
    </AppProvider>
  );
}
