import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User, LayoutDashboard, Settings, Wrench, CreditCard, Users, BookOpen, Receipt, Utensils, ClipboardList, DoorOpen } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardLayout = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  const getMenuItems = () => {
    switch (role) {
      case "Admin":
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
          { icon: Wrench, label: "Room Map", path: "/admin/rooms" },
          { icon: Users, label: "Students", path: "/admin/students" },
          { icon: BookOpen, label: "Departments", path: "/admin/departments" },
          { icon: CreditCard, label: "Payments", path: "/admin/payments" },
          { icon: Receipt, label: "Expenses", path: "/admin/expenses" },
          { icon: Utensils, label: "Dining", path: "/admin/dining" },
          { icon: User, label: "Profile", path: "/admin/profile" },
        ];
      case "Staff":
        return [
          { icon: LayoutDashboard, label: "Maintenance", path: "/staff" },
          { icon: User, label: "Allocations", path: "/staff/allocations" },
          { icon: ClipboardList, label: "Operations", path: "/staff/operations" },
          { icon: Utensils, label: "Dining", path: "/staff/dining" },
          { icon: Settings, label: "Profile", path: "/staff/profile" },
        ];
      case "Student":
        return [
          { icon: LayoutDashboard, label: "Portal", path: "/student" },
          { icon: DoorOpen, label: "Leave & Logs", path: "/student/operations" },
          { icon: CreditCard, label: "My Payments", path: "/student/payments" },
          { icon: Utensils, label: "Dining Menu", path: "/student/dining" },
          { icon: User, label: "Profile", path: "/student/profile" },
        ];
      default:
        return [];
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-brandNavy text-white flex flex-col hidden md:flex shadow-xl z-20"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">DormSync</h2>
          <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest">{role} Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-white/10 text-white font-medium" : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-300" : ""} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-brandNavy text-white">
          <h2 className="text-xl font-bold">DormSync</h2>
          <button onClick={handleLogout}><LogOut size={20} /></button>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
            {/* Top gradient for depth */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />
            
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 max-w-7xl mx-auto"
            >
              <Outlet />
            </motion.div>
        </div>
      </main>
    </div>
  );
};
