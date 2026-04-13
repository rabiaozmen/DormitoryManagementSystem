import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Login } from "./pages/auth/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import PaymentManagement from "./pages/admin/PaymentManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import ExpenseManagement from "./pages/admin/ExpenseManagement";
import DiningManagement from "./pages/admin/DiningManagement";
import RoomMap from "./pages/admin/RoomMap";
import Allocations from "./pages/staff/Allocations";
import { StudentPortal } from "./pages/student/StudentPortal";
import PaymentHistory from "./pages/student/PaymentHistory";
import StudentOperations from "./pages/student/StudentOperations";
import Profile from "./pages/shared/Profile";
import DiningBoard from "./pages/shared/DiningBoard";
import StaffOperations from "./pages/staff/StaffOperations";
import MaintenanceTicketing from "./pages/staff/MaintenanceTicketing";
import { ToastViewport } from "./components/ui/ToastViewport";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastViewport />
        <Routes>
          {/* Public / Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<DashboardLayout allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/rooms" element={<RoomMap />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/departments" element={<DepartmentManagement />} />
            <Route path="/admin/payments" element={<PaymentManagement />} />
            <Route path="/admin/expenses" element={<ExpenseManagement />} />
            <Route path="/admin/dining" element={<DiningManagement />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/*" element={<div>Under Construction</div>} />
          </Route>

          {/* Staff Routes */}
          <Route element={<DashboardLayout allowedRoles={["Staff"]} />}>
            <Route path="/staff" element={<Navigate to="/staff/maintenance" replace />} />
            <Route path="/staff/maintenance" element={<MaintenanceTicketing />} />
            <Route path="/staff/allocations" element={<Allocations />} />
            <Route path="/staff/operations" element={<StaffOperations />} />
            <Route path="/staff/dining" element={<DiningBoard />} />
            <Route path="/staff/profile" element={<Profile />} />
            <Route path="/staff/*" element={<div>Under Construction</div>} />
          </Route>

          {/* Student Routes */}
          <Route element={<DashboardLayout allowedRoles={["Student"]} />}>
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/student/operations" element={<StudentOperations />} />
            <Route path="/student/payments" element={<PaymentHistory />} />
            <Route path="/student/dining" element={<DiningBoard />} />
            <Route path="/student/profile" element={<Profile />} />
            <Route path="/student/*" element={<div>Under Construction</div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
