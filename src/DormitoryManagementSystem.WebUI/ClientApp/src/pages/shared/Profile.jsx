import { useState } from "react";
import { User, Mail, Phone, Shield, ShieldCheck, Key, LogOut } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export default function Profile() {
  const { role, user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Mock profile data based on auth context
  const [profileData, setProfileData] = useState({
    firstName: "User",
    lastName: "Name",
    email: "user@dms.local",
    phone: "555 123 4567",
    role: role
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-8 flex flex-col items-center text-center bg-white border-slate-200">
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 ring-4 ring-indigo-50">
              <User size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{profileData.firstName} {profileData.lastName}</h2>
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">{role}</p>
            
            <div className="mt-8 w-full pt-8 border-t border-slate-100 flex flex-col gap-3">
               <div className="flex items-center gap-3 text-slate-600 text-sm">
                 <ShieldCheck size={18} className="text-emerald-500" />
                 Verified Account
               </div>
               <div className="flex items-center gap-3 text-slate-600 text-sm">
                 <Shield size={18} className="text-slate-400" />
                 2FA Enabled
               </div>
            </div>
          </Card>
          
          <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={logout}>
            <LogOut size={18} className="mr-2" /> Sign Out from All Devices
          </Button>
        </div>

        {/* Right Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 bg-white border-slate-200">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
               <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
               <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                 {isEditing ? "Save Changes" : "Edit Details"}
               </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Email Address</label>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                   <Mail size={18} className="text-slate-400" />
                   {profileData.email}
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Phone Number</label>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                   <Phone size={18} className="text-slate-400" />
                   {profileData.phone}
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">First Name</label>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                   {profileData.firstName}
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Last Name</label>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                   {profileData.lastName}
                 </div>
               </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <Key className="text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-900">Security & Password</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-medium">It's a good idea to use a strong password that you don't use elsewhere.</p>
            <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              Update Password
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
